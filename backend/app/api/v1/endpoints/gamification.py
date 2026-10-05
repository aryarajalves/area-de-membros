from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.logger import logger
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.models.gamification import GamificationPoint
from app.schemas.gamification import (
    GamificationStudentItem,
    GamificationRankingResponse,
    GamificationHistoryItem,
    GamificationRuleItem,
)
from app.services.gamification_service import POINTS_MAP

router = APIRouter()

MONTH_NAMES_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]


@router.get("/ranking", response_model=GamificationRankingResponse)
def get_ranking(
    period: str = Query("monthly", description="'monthly' para o mês corrente ou 'all_time' para histórico geral"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a tabela de classificação do Ranking dos Alunos.
    Apenas usuários com perfil 'aluno' disputam e constam no ranking.
    """
    now = datetime.now(timezone.utc)
    month_name = f"{MONTH_NAMES_PT[now.month]}/{now.year}" if period == "monthly" else "Histórico Completo"

    # Define filtro temporal
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Buscar apenas alunos ativos
    alunos = db.query(User).filter(User.role == "aluno", User.is_active == True).all()
    aluno_ids = [a.id for a in alunos]
    aluno_map = {a.id: a for a in alunos}

    if not aluno_ids:
        return GamificationRankingResponse(
            period=period,
            month_name=month_name,
            ranking=[],
            my_position=None,
            total_participants=0,
        )

    # Consulta agregada de pontos por aluno
    query_points = db.query(
        GamificationPoint.user_id,
        func.sum(GamificationPoint.points).label("total_pts")
    ).filter(GamificationPoint.user_id.in_(aluno_ids))

    if period == "monthly":
        query_points = query_points.filter(GamificationPoint.created_at >= start_of_month)

    user_points_agg = query_points.group_by(GamificationPoint.user_id).all()
    points_dict = {user_id: total for user_id, total in user_points_agg}

    # Contagem de Melhores Soluções
    query_solutions = db.query(
        GamificationPoint.user_id,
        func.count(GamificationPoint.id).label("count")
    ).filter(
        GamificationPoint.user_id.in_(aluno_ids),
        GamificationPoint.action == "support_solution"
    )
    if period == "monthly":
        query_solutions = query_solutions.filter(GamificationPoint.created_at >= start_of_month)
    solutions_dict = {u_id: count for u_id, count in query_solutions.group_by(GamificationPoint.user_id).all()}

    # Contagem de Aulas Concluídas
    query_lessons = db.query(
        GamificationPoint.user_id,
        func.count(GamificationPoint.id).label("count")
    ).filter(
        GamificationPoint.user_id.in_(aluno_ids),
        GamificationPoint.action == "lesson_completed"
    )
    if period == "monthly":
        query_lessons = query_lessons.filter(GamificationPoint.created_at >= start_of_month)
    lessons_dict = {u_id: count for u_id, count in query_lessons.group_by(GamificationPoint.user_id).all()}

    # Monta a lista completa de alunos ordenados por pontuação
    student_entries = []
    for a_id, user in aluno_map.items():
        pts = points_dict.get(a_id, 0)
        student_entries.append({
            "user_id": a_id,
            "name": user.name,
            "email": user.email,
            "avatar_url": getattr(user, "avatar_url", None),
            "points": pts,
            "solutions_count": solutions_dict.get(a_id, 0),
            "lessons_completed_count": lessons_dict.get(a_id, 0),
        })

    # Ordenar por pontos DESC, soluções DESC, id ASC
    student_entries.sort(key=lambda x: (x["points"], x["solutions_count"], -x["user_id"]), reverse=True)

    ranking_list = []
    my_position_item = None

    for idx, entry in enumerate(student_entries, start=1):
        # Definição de insígnias e títulos
        if idx == 1:
            badge = "🥇 Mestre da Comunidade"
        elif idx == 2:
            badge = "🥈 Mentor Destaque"
        elif idx == 3:
            badge = "🥉 Aluno Notável"
        elif idx <= 10:
            badge = "⭐ Top Estudante"
        else:
            badge = "✨ Aluno Ativo"

        is_me = (entry["user_id"] == current_user.id)
        item = GamificationStudentItem(
            rank=idx,
            user_id=entry["user_id"],
            name=entry["name"],
            email=entry["email"],
            avatar_url=entry["avatar_url"],
            points=entry["points"],
            solutions_count=entry["solutions_count"],
            lessons_completed_count=entry["lessons_completed_count"],
            badge=badge,
            is_current_user=is_me,
        )
        ranking_list.append(item)
        if is_me:
            my_position_item = item

    return GamificationRankingResponse(
        period=period,
        month_name=month_name,
        ranking=ranking_list,
        my_position=my_position_item,
        total_participants=len(student_entries),
    )


@router.get("/history", response_model=List[GamificationHistoryItem])
def get_user_point_history(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna o histórico individual de pontos recebidos pelo usuário autenticado.
    """
    records = (
        db.query(GamificationPoint)
        .filter(GamificationPoint.user_id == current_user.id)
        .order_by(desc(GamificationPoint.created_at))
        .limit(limit)
        .all()
    )

    return [
        GamificationHistoryItem(
            id=r.id,
            action=r.action,
            points=r.points,
            description=r.description or r.action,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/rules", response_model=List[GamificationRuleItem])
def get_gamification_rules(
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a tabela de regras de pontuação da gamificação.
    """
    return [
        GamificationRuleItem(
            action="support_solution",
            name="Melhor Solução no Suporte",
            points=50,
            description="Quando uma resposta sua a uma dúvida de colega for marcada como Solução Oficial.",
            daily_limit="Sem limite diário",
        ),
        GamificationRuleItem(
            action="lesson_completed",
            name="Aula Concluída",
            points=15,
            description="Ao assistir e concluir uma aula de qualquer curso que possuir acesso.",
            daily_limit="Pontuação única por aula",
        ),
        GamificationRuleItem(
            action="support_reply",
            name="Resposta a Dúvida no Suporte",
            points=10,
            description="Ao responder e ajudar outros alunos com dúvidas na comunidade.",
            daily_limit="Sem limite diário",
        ),
        GamificationRuleItem(
            action="support_like",
            name="Curtida Recebida no Suporte",
            points=5,
            description="Ao ter sua dúvida ou tópico curtido por outros membros da plataforma.",
            daily_limit="Sem limite diário",
        ),
        GamificationRuleItem(
            action="chat_message",
            name="Mensagem no Chat da Comunidade",
            points=2,
            description="Ao participar ativamente nas conversas e networking no Chat.",
            daily_limit="Limite diário: até 10 mensagens pontuadas por dia (20 pts/dia)",
        ),
    ]

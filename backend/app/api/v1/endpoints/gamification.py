import calendar
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
    CompletedPeriodOption,
    CompletedPeriodsResponse,
    ClosedPeriodRankingResponse,
    RpgLevelItem,
)
from app.services.gamification_service import POINTS_MAP, sync_student_historical_points
from app.services.gamification_level_service import calculate_student_level, get_all_rpg_levels

router = APIRouter()

MONTH_NAMES_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]


@router.get("/ranking", response_model=GamificationRankingResponse)
def get_ranking(
    period: str = Query("monthly", description="'monthly' para o mês corrente ou 'all_time' para histórico geral"),
    limit: int = Query(50, ge=1, le=100, description="Limite de alunos retornados no ranking principal (padrão 50)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a tabela de classificação do Ranking dos Alunos de forma otimizada para escala.
    Apenas usuários com perfil 'aluno' disputam e constam no ranking.
    """
    # Sincroniza retroativamente pontos de aulas concluídas para garantir integridade apenas do aluno atual
    if current_user.role == "aluno":
        sync_student_historical_points(db, user_id=current_user.id)

    now = datetime.now(timezone.utc)
    month_name = f"{MONTH_NAMES_PT[now.month]}/{now.year}" if period == "monthly" else "Histórico Completo"

    # Define filtro temporal
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 1. Total de alunos ativos disputando
    total_participants = db.query(func.count(User.id)).filter(User.role == "aluno", User.is_active == True).scalar() or 0
    if total_participants == 0:
        return GamificationRankingResponse(
            period=period,
            month_name=month_name,
            ranking=[],
            my_position=None,
            total_participants=0,
        )

    # 2. Subquery agregada de pontos por aluno ativo
    points_subq = (
        db.query(
            GamificationPoint.user_id.label("uid"),
            func.coalesce(func.sum(GamificationPoint.points), 0).label("total_pts")
        )
    )
    if period == "monthly":
        points_subq = points_subq.filter(GamificationPoint.created_at >= start_of_month)
    points_subq = points_subq.group_by(GamificationPoint.user_id).subquery()

    # 3. Busca apenas os TOP N alunos diretamente no banco de dados com ordenação SQL
    top_query = (
        db.query(
            User,
            func.coalesce(points_subq.c.total_pts, 0).label("pts")
        )
        .outerjoin(points_subq, User.id == points_subq.c.uid)
        .filter(User.role == "aluno", User.is_active == True)
        .order_by(desc("pts"), User.id.asc())
        .limit(limit)
    )
    top_results = top_query.all()
    top_user_ids = [u.id for u, _ in top_results]

    # 4. Soluções e Aulas concluídas apenas para os TOP N alunos selecionados
    solutions_dict = {}
    lessons_dict = {}
    if top_user_ids:
        query_solutions = db.query(
            GamificationPoint.user_id,
            func.count(GamificationPoint.id).label("count")
        ).filter(
            GamificationPoint.user_id.in_(top_user_ids),
            GamificationPoint.action == "support_solution"
        )
        if period == "monthly":
            query_solutions = query_solutions.filter(GamificationPoint.created_at >= start_of_month)
        solutions_dict = {u_id: count for u_id, count in query_solutions.group_by(GamificationPoint.user_id).all()}

        query_lessons = db.query(
            GamificationPoint.user_id,
            func.count(GamificationPoint.id).label("count")
        ).filter(
            GamificationPoint.user_id.in_(top_user_ids),
            GamificationPoint.action == "lesson_completed"
        )
        if period == "monthly":
            query_lessons = query_lessons.filter(GamificationPoint.created_at >= start_of_month)
        lessons_dict = {u_id: count for u_id, count in query_lessons.group_by(GamificationPoint.user_id).all()}

    ranking_list = []
    my_position_item = None

    for idx, (user, pts) in enumerate(top_results, start=1):
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

        is_me = (user.id == current_user.id)
        lvl = calculate_student_level(int(pts))
        item = GamificationStudentItem(
            rank=idx,
            user_id=user.id,
            name=user.name,
            email=user.email,
            avatar_url=getattr(user, "avatar_url", None),
            points=int(pts),
            solutions_count=solutions_dict.get(user.id, 0),
            lessons_completed_count=lessons_dict.get(user.id, 0),
            badge=badge,
            level=lvl["level"],
            level_title=lvl["level_title"],
            level_badge=lvl["level_badge"],
            level_tier=lvl["level_tier"],
            level_color=lvl["level_color"],
            level_progress_percent=lvl["level_progress_percent"],
            points_to_next_level=lvl["points_to_next_level"],
            is_max_level=lvl["is_max_level"],
            is_current_user=is_me,
        )
        ranking_list.append(item)
        if is_me:
            my_position_item = item

    # Se o usuário atual for aluno e não estiver entre os TOP N exibidos, calcula sua posição individual
    if current_user.role == "aluno" and not my_position_item:
        my_pts_query = db.query(func.coalesce(func.sum(GamificationPoint.points), 0)).filter(
            GamificationPoint.user_id == current_user.id
        )
        if period == "monthly":
            my_pts_query = my_pts_query.filter(GamificationPoint.created_at >= start_of_month)
        my_pts = int(my_pts_query.scalar() or 0)

        higher_students_count = (
            db.query(func.count(points_subq.c.uid))
            .join(User, User.id == points_subq.c.uid)
            .filter(User.role == "aluno", User.is_active == True, points_subq.c.total_pts > my_pts)
            .scalar() or 0
        )
        my_rank = higher_students_count + 1

        my_sol = (
            db.query(func.count(GamificationPoint.id))
            .filter(GamificationPoint.user_id == current_user.id, GamificationPoint.action == "support_solution")
        )
        if period == "monthly":
            my_sol = my_sol.filter(GamificationPoint.created_at >= start_of_month)
        my_solutions_count = my_sol.scalar() or 0

        my_les = (
            db.query(func.count(GamificationPoint.id))
            .filter(GamificationPoint.user_id == current_user.id, GamificationPoint.action == "lesson_completed")
        )
        if period == "monthly":
            my_les = my_les.filter(GamificationPoint.created_at >= start_of_month)
        my_lessons_count = my_les.scalar() or 0

        lvl = calculate_student_level(my_pts)
        badge = "✨ Aluno Ativo"
        if my_rank == 1:
            badge = "🥇 Mestre da Comunidade"
        elif my_rank == 2:
            badge = "🥈 Mentor Destaque"
        elif my_rank == 3:
            badge = "🥉 Aluno Notável"
        elif my_rank <= 10:
            badge = "⭐ Top Estudante"

        my_position_item = GamificationStudentItem(
            rank=my_rank,
            user_id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            avatar_url=getattr(current_user, "avatar_url", None),
            points=my_pts,
            solutions_count=my_solutions_count,
            lessons_completed_count=my_lessons_count,
            badge=badge,
            level=lvl["level"],
            level_title=lvl["level_title"],
            level_badge=lvl["level_badge"],
            level_tier=lvl["level_tier"],
            level_color=lvl["level_color"],
            level_progress_percent=lvl["level_progress_percent"],
            points_to_next_level=lvl["points_to_next_level"],
            is_max_level=lvl["is_max_level"],
            is_current_user=True,
        )

    return GamificationRankingResponse(
        period=period,
        month_name=month_name,
        ranking=ranking_list,
        my_position=my_position_item,
        total_participants=total_participants,
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
    if current_user.role == "aluno":
        sync_student_historical_points(db, user_id=current_user.id)

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
            action="course_completed",
            name="Curso Concluído (100%)",
            points=250,
            description="Bônus especial ao concluir todas as aulas de um treinamento completo.",
            daily_limit="Pontuação única por curso",
        ),
        GamificationRuleItem(
            action="module_completed",
            name="Módulo Concluído",
            points=60,
            description="Bônus ao concluir todas as aulas de um módulo do curso.",
            daily_limit="Pontuação única por módulo",
        ),
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


@router.get("/completed-periods", response_model=CompletedPeriodsResponse)
def get_completed_periods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a lista de meses e anos estritamente finalizados (passados)
    para consulta do histórico congelado de Top 10.
    O mês corrente e o ano corrente nunca constam nesta lista até que terminem.
    """
    now = datetime.now(timezone.utc)
    current_year = now.year
    current_month = now.month

    # 1. Gerar lista de meses finalizados (últimos 12 meses anteriores ao mês corrente)
    completed_months = []
    y = current_year
    m = current_month - 1
    if m == 0:
        y -= 1
        m = 12

    for _ in range(12):
        if y < 2024:
            break
        _, last_day = calendar.monthrange(y, m)
        start_dt = datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(y, m, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)
        completed_months.append(
            CompletedPeriodOption(
                key=f"{y}-{m:02d}",
                label=f"{MONTH_NAMES_PT[m]}/{y}",
                period_type="month",
                year=y,
                month=m,
                start_date=start_dt,
                end_date=end_dt,
            )
        )
        m -= 1
        if m == 0:
            y -= 1
            m = 12

    # 2. Gerar lista de anos finalizados (anos estritamente anteriores ao ano corrente)
    completed_years = []
    for y_prev in range(current_year - 1, max(current_year - 6, 2023), -1):
        start_dt = datetime(y_prev, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(y_prev, 12, 31, 23, 59, 59, 999999, tzinfo=timezone.utc)
        completed_years.append(
            CompletedPeriodOption(
                key=str(y_prev),
                label=f"Ano de {y_prev}",
                period_type="year",
                year=y_prev,
                month=None,
                start_date=start_dt,
                end_date=end_dt,
            )
        )

    return CompletedPeriodsResponse(
        completed_months=completed_months,
        completed_years=completed_years,
    )


@router.get("/closed-ranking", response_model=ClosedPeriodRankingResponse)
def get_closed_ranking(
    period_type: str = Query("month", pattern="^(month|year)$", description="'month' para mês finalizado ou 'year' para ano finalizado"),
    period_key: str = Query(..., description="ex: '2026-09' ou '2025'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os Top 10 alunos de um mês ou ano estritamente FINALIZADO.
    Períodos em andamento são bloqueados (HTTP 400).
    """
    now = datetime.now(timezone.utc)

    if period_type == "month":
        try:
            parts = period_key.split("-")
            req_y = int(parts[0])
            req_m = int(parts[1])
            if not (1 <= req_m <= 12):
                raise ValueError()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de chave de mês inválido. Use AAAA-MM (ex: 2026-09)."
            )

        # Regra de negócio: o mês DEVE já ter terminado!
        if (req_y, req_m) >= (now.year, now.month):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este mês ainda está em andamento. O Top 10 do mês só fica disponível no histórico quando o mês estiver encerrado."
            )

        _, last_day = calendar.monthrange(req_y, req_m)
        start_dt = datetime(req_y, req_m, 1, 0, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(req_y, req_m, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)
        label = f"{MONTH_NAMES_PT[req_m]}/{req_y}"

    else:
        try:
            req_y = int(period_key)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de ano inválido. Use AAAA (ex: 2025)."
            )

        # Regra de negócio: o ano DEVE já ter terminado!
        if req_y >= now.year:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este ano ainda está em andamento. O Top 10 anual só fica disponível no histórico após o término do ano."
            )

        start_dt = datetime(req_y, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        end_dt = datetime(req_y, 12, 31, 23, 59, 59, 999999, tzinfo=timezone.utc)
        label = f"Ano de {req_y}"

    # Buscar apenas alunos ativos
    alunos = db.query(User).filter(User.role == "aluno", User.is_active == True).all()
    aluno_ids = [a.id for a in alunos]
    aluno_map = {a.id: a for a in alunos}

    if not aluno_ids:
        return ClosedPeriodRankingResponse(
            period_type=period_type,
            period_key=period_key,
            period_label=label,
            is_closed=True,
            top_students=[],
            my_position=None,
            total_participants=0,
        )

    # Consulta agregada de pontos do período fechado
    user_points_agg = (
        db.query(
            GamificationPoint.user_id,
            func.sum(GamificationPoint.points).label("total_pts")
        )
        .filter(
            GamificationPoint.user_id.in_(aluno_ids),
            GamificationPoint.created_at >= start_dt,
            GamificationPoint.created_at <= end_dt,
        )
        .group_by(GamificationPoint.user_id)
        .all()
    )
    points_dict = {user_id: total for user_id, total in user_points_agg}

    # Contagem de soluções no período
    query_solutions = (
        db.query(
            GamificationPoint.user_id,
            func.count(GamificationPoint.id).label("count")
        )
        .filter(
            GamificationPoint.user_id.in_(aluno_ids),
            GamificationPoint.action == "support_solution",
            GamificationPoint.created_at >= start_dt,
            GamificationPoint.created_at <= end_dt,
        )
        .group_by(GamificationPoint.user_id)
        .all()
    )
    solutions_dict = {u_id: count for u_id, count in query_solutions}

    # Contagem de aulas no período
    query_lessons = (
        db.query(
            GamificationPoint.user_id,
            func.count(GamificationPoint.id).label("count")
        )
        .filter(
            GamificationPoint.user_id.in_(aluno_ids),
            GamificationPoint.action == "lesson_completed",
            GamificationPoint.created_at >= start_dt,
            GamificationPoint.created_at <= end_dt,
        )
        .group_by(GamificationPoint.user_id)
        .all()
    )
    lessons_dict = {u_id: count for u_id, count in query_lessons}

    # Monta lista de pontuações de alunos
    student_entries = []
    for a_id, user in aluno_map.items():
        pts = points_dict.get(a_id, 0)
        # Só inclui alunos que pontuaram no período fechado
        if pts > 0:
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

    # Filtrar rigorosamente os TOP 10 do período finalizado
    top_10_entries = student_entries[:10]

    ranking_list = []
    my_position_item = None

    period_suffix = "do Mês" if period_type == "month" else "do Ano"

    for idx, entry in enumerate(top_10_entries, start=1):
        if idx == 1:
            badge = f"🥇 Campeão {period_suffix}"
        elif idx == 2:
            badge = f"🥈 Vice-Campeão {period_suffix}"
        elif idx == 3:
            badge = f"🥉 3º Lugar {period_suffix}"
        else:
            badge = f"⭐ Top {idx} {period_suffix}"

        is_me = (entry["user_id"] == current_user.id)
        lvl = calculate_student_level(entry["points"])
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
            level=lvl["level"],
            level_title=lvl["level_title"],
            level_badge=lvl["level_badge"],
            level_tier=lvl["level_tier"],
            level_color=lvl["level_color"],
            level_progress_percent=lvl["level_progress_percent"],
            points_to_next_level=lvl["points_to_next_level"],
            is_max_level=lvl["is_max_level"],
            is_current_user=is_me,
        )
        ranking_list.append(item)
        if is_me:
            my_position_item = item

    return ClosedPeriodRankingResponse(
        period_type=period_type,
        period_key=period_key,
        period_label=label,
        is_closed=True,
        top_students=ranking_list,
        my_position=my_position_item,
        total_participants=len(student_entries),
    )


@router.get("/levels", response_model=List[RpgLevelItem])
def get_rpg_levels(
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os 20 níveis progressivos do sistema de RPG com faixas de pontuação e elos.
    """
    return get_all_rpg_levels()



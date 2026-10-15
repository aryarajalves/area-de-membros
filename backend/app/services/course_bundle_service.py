"""
Serviço de Gerenciamento de Pacotes/Combos de Cursos e Ferramentas (Course Bundles).
Permite vincular múltiplos cursos/ferramentas a um curso principal e propagar
automaticamente o acesso para alunos ao adquirirem ou receberem o pacote.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from app.models.course import Course, CourseBundle, UserCourse
from app.core.logger import logger


def get_bundled_course_ids(db: Session, parent_course_id: int) -> List[int]:
    """Retorna os IDs de todos os cursos/ferramentas vinculados a um curso pai."""
    bundles = db.query(CourseBundle.bundled_course_id).filter(
        CourseBundle.parent_course_id == parent_course_id
    ).all()
    return [b[0] for b in bundles]


def get_bundled_courses_data(db: Session, parent_course_id: int) -> List[Dict[str, Any]]:
    """Retorna dados resumidos dos cursos/ferramentas vinculados ao curso pai."""
    bundles = (
        db.query(Course)
        .join(CourseBundle, CourseBundle.bundled_course_id == Course.id)
        .filter(CourseBundle.parent_course_id == parent_course_id)
        .order_by(Course.order_index.asc(), Course.id.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title,
            "item_type": c.item_type or "course",
            "thumbnail_url": c.thumbnail_url,
            "tool_url": c.tool_url,
        }
        for c in bundles
    ]


def get_all_bundles_map(db: Session, course_ids: List[int]) -> Dict[int, List[Dict[str, Any]]]:
    """Retorna um mapeamento de parent_course_id -> lista de cursos/ferramentas vinculados (otimizado sem N+1)."""
    if not course_ids:
        return {}

    results = (
        db.query(CourseBundle.parent_course_id, Course)
        .join(Course, Course.id == CourseBundle.bundled_course_id)
        .filter(CourseBundle.parent_course_id.in_(course_ids))
        .order_by(Course.order_index.asc(), Course.id.desc())
        .all()
    )

    bundles_map: Dict[int, List[Dict[str, Any]]] = {cid: [] for cid in course_ids}
    for parent_id, course in results:
        bundles_map[parent_id].append({
            "id": course.id,
            "title": course.title,
            "item_type": course.item_type or "course",
            "thumbnail_url": course.thumbnail_url,
            "tool_url": course.tool_url,
        })

    return bundles_map


def is_user_course_active(uc: UserCourse) -> bool:
    """Verifica se o acesso do aluno ao curso está ativo (vitalício ou dentro do prazo de validade)."""
    if not uc.expires_at:
        return True
    from datetime import timezone
    now = datetime.now(timezone.utc)
    exp = uc.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return exp > now


def get_effective_user_course_ids(db: Session, user_id: int) -> set:
    """
    Retorna o conjunto de IDs de todos os cursos aos quais o aluno possui acesso ativo,
    incluindo cursos concedidos diretamente e cursos/ferramentas inclusos nos combos adquiridos.
    """
    user_courses = db.query(UserCourse).filter(UserCourse.user_id == user_id).all()
    active_direct_ids = {uc.course_id for uc in user_courses if is_user_course_active(uc)}
    if not active_direct_ids:
        return set()

    # Cursos/ferramentas inclusos nos combos que o aluno possui
    bundled_items = (
        db.query(CourseBundle.bundled_course_id)
        .filter(CourseBundle.parent_course_id.in_(active_direct_ids))
        .all()
    )
    # Também inclui se o item adquirido for associado bidirecionalmente
    parent_items = (
        db.query(CourseBundle.parent_course_id)
        .filter(CourseBundle.bundled_course_id.in_(active_direct_ids))
        .all()
    )
    extra_ids = {b[0] for b in bundled_items}.union({p[0] for p in parent_items})
    return active_direct_ids.union(extra_ids)


def sync_course_bundles(db: Session, parent_course_id: int, bundled_course_ids: Optional[List[int]]) -> None:
    """
    Sincroniza os cursos/ferramentas inclusos no pacote.
    Remove associações antigas e insere as novas, prevenindo auto-associação.
    Propaga imediatamente o acesso para todos os usuários com acesso ativo ao pacote.
    """
    if bundled_course_ids is None:
        return

    # Filtra para evitar auto-referência e IDs nulos/negativos
    valid_ids = list({bid for bid in bundled_course_ids if bid and bid != parent_course_id})

    # Remove todos os vínculos atuais deste pacote
    db.query(CourseBundle).filter(CourseBundle.parent_course_id == parent_course_id).delete(synchronize_session=False)

    # Insere as novas associações
    for bid in valid_ids:
        # Verifica se o curso existe
        exists = db.query(Course.id).filter(Course.id == bid).first()
        if exists:
            bundle = CourseBundle(parent_course_id=parent_course_id, bundled_course_id=bid)
            db.add(bundle)

    db.commit()
    logger.info(f"[CourseBundle] Cursos vinculados ao pacote #{parent_course_id} sincronizados com sucesso: {valid_ids}")

    # Propaga automaticamente para todos os alunos matriculados no curso pai
    if valid_ids:
        enrolled_users = (
            db.query(UserCourse.user_id, UserCourse.access_duration, UserCourse.expires_at)
            .filter(UserCourse.course_id == parent_course_id)
            .all()
        )
        for u_id, duration, exp in enrolled_users:
            grant_bundle_access_for_user(
                db, u_id, [parent_course_id], access_duration=duration or "lifetime", expires_at=exp
            )



def grant_bundle_access_for_user(
    db: Session,
    user_id: int,
    course_ids: List[int],
    access_duration: str = "lifetime",
    expires_at: Optional[datetime] = None
) -> List[int]:
    """
    Propaga o acesso de um ou mais cursos para todas as ferramentas e cursos inclusos nos pacotes.
    Cria ou atualiza os registros em UserCourse para que o aluno receba acesso automático aos produtos do combo.
    Retorna os IDs adicionais concedidos via pacotes.
    """
    if not course_ids:
        return []

    # 1. Encontrar todos os cursos/ferramentas inclusos nos pacotes informados
    bundled_ids = (
        db.query(CourseBundle.bundled_course_id)
        .filter(CourseBundle.parent_course_id.in_(course_ids))
        .all()
    )
    all_extra_ids = list({b[0] for b in bundled_ids if b[0] not in course_ids})

    if not all_extra_ids:
        return []

    logger.info(f"[CourseBundle] Propagando acesso de combo para user #{user_id}: {all_extra_ids}")

    # 2. Verificar quais o usuário já possui
    existing_user_courses = (
        db.query(UserCourse)
        .filter(UserCourse.user_id == user_id, UserCourse.course_id.in_(all_extra_ids))
        .all()
    )
    existing_ids = {uc.course_id: uc for uc in existing_user_courses}

    granted_via_bundle = []
    for cid in all_extra_ids:
        if cid in existing_ids:
            # Se já tem e a concessão é lifetime, atualiza para lifetime
            if access_duration == "lifetime":
                existing_ids[cid].access_duration = "lifetime"
                existing_ids[cid].expires_at = None
        else:
            # Novo acesso concedido pelo pacote
            new_uc = UserCourse(
                user_id=user_id,
                course_id=cid,
                access_duration=access_duration,
                expires_at=expires_at
            )
            db.add(new_uc)
            granted_via_bundle.append(cid)

    db.commit()
    logger.info(f"[CourseBundle] Concedido acesso a {len(granted_via_bundle)} produtos do combo para user #{user_id}")
    return granted_via_bundle


def attach_bundles_to_courses(db: Session, courses: List[Any]) -> None:
    """Preenche os campos bundled_courses, bundled_course_ids e bundled_items_count em uma lista de cursos."""
    if not courses:
        return
    course_ids = [c.id for c in courses if hasattr(c, "id")]
    if not course_ids:
        return
    bundles_map = get_all_bundles_map(db, course_ids)
    for c in courses:
        b_list = bundles_map.get(c.id, [])
        setattr(c, "bundled_courses", b_list)
        setattr(c, "bundled_course_ids", [b["id"] for b in b_list])
        setattr(c, "bundled_items_count", len(b_list))


def propagate_all_existing_bundles(db: Session) -> int:
    """Sincroniza e garante que todos os alunos com acesso a pacotes recebam UserCourse para os itens do combo."""
    bundles = db.query(CourseBundle.parent_course_id).distinct().all()
    total_granted = 0
    for (parent_id,) in bundles:
        enrolled = (
            db.query(UserCourse.user_id, UserCourse.access_duration, UserCourse.expires_at)
            .filter(UserCourse.course_id == parent_id)
            .all()
        )
        for u_id, duration, exp in enrolled:
            granted = grant_bundle_access_for_user(
                db, u_id, [parent_id], access_duration=duration or "lifetime", expires_at=exp
            )
            total_granted += len(granted)
    return total_granted



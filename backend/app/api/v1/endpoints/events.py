from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.event import Event, EventAttendee
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin

router = APIRouter()


def _is_student_course_active(uc: UserCourse) -> bool:
    """Verifica se a matrícula do aluno no curso está válida."""
    if not uc.expires_at:
        return True
    now = datetime.now(timezone.utc)
    exp = uc.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return exp > now


def _build_event_response(
    event: Event,
    current_user: User,
    active_course_ids: set,
    confirmed_event_ids: Optional[set] = None,
    attendees_counts: Optional[dict] = None,
) -> EventResponse:
    """
    Constrói a resposta do evento aplicando as regras de privacidade e upsell.
    Se o aluno não tiver acesso, oculta meeting_url e recording_url.
    """
    is_admin = current_user.role in ["superadmin", "admin"]
    has_access = True

    if not is_admin:
        if event.target_type == "course" and event.course_id:
            has_access = event.course_id in active_course_ids

    # Carrega dados do curso vinculado se existir
    course_title = event.course.title if event.course else None
    course_sales_page_url = event.course.sales_page_url if event.course else None

    # Mascara URLs sensíveis se não tiver acesso
    meeting_url = event.meeting_url if has_access else None
    recording_url = event.recording_url if has_access else None

    is_confirmed = False
    if confirmed_event_ids is not None:
        is_confirmed = event.id in confirmed_event_ids

    attendees_count = 0
    if attendees_counts is not None:
        attendees_count = attendees_counts.get(event.id, 0)

    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        meeting_url=meeting_url,
        recording_url=recording_url,
        thumbnail_url=event.thumbnail_url,
        target_type=event.target_type,
        course_id=event.course_id,
        is_active=event.is_active,
        course_title=course_title,
        course_sales_page_url=course_sales_page_url,
        has_access=has_access,
        is_confirmed=is_confirmed,
        attendees_count=attendees_count,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get("", response_model=List[EventResponse])
def list_events(
    status_filter: Optional[str] = Query(None, alias="status", description="Filtro: 'upcoming', 'past' ou None (todos)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista todos os eventos cadastrados na plataforma.
    - Administradores veem todos os eventos (ativos ou inativos).
    - Alunos veem eventos ativos. Se não possuírem acesso ao curso vinculado,
      os links de transmissão/gravação ficam ocultos e o evento é marcado com has_access=False.
    """
    try:
        query = db.query(Event)

        # Alunos visualizam apenas eventos ativos
        if current_user.role not in ["superadmin", "admin"]:
            query = query.filter(Event.is_active == True)

        now = datetime.now(timezone.utc)

        if status_filter == "upcoming":
            # Eventos futuros ou que terminam depois de agora (ou sem end_time mas começaram há menos de 4 horas)
            query = query.filter(
                (Event.start_time >= now) |
                ((Event.end_time != None) & (Event.end_time >= now))
            ).order_by(asc(Event.start_time))
        elif status_filter == "past":
            # Eventos que já terminaram ou começaram antes de agora
            query = query.filter(
                (Event.end_time != None) & (Event.end_time < now) |
                ((Event.end_time == None) & (Event.start_time < now))
            ).order_by(desc(Event.start_time))
        else:
            query = query.order_by(desc(Event.start_time))

        events = query.all()

        # Cache de cursos ativos do aluno
        active_course_ids = set()
        if current_user.role == "aluno":
            user_courses = db.query(UserCourse).filter(UserCourse.user_id == current_user.id).all()
            for uc in user_courses:
                if _is_student_course_active(uc):
                    active_course_ids.add(uc.course_id)

        # Carrega IDs dos eventos onde o usuário confirmou presença
        event_ids = [e.id for e in events]
        confirmed_event_ids = set()
        attendees_counts = {}
        if event_ids:
            user_confs = db.query(EventAttendee.event_id).filter(
                EventAttendee.user_id == current_user.id,
                EventAttendee.event_id.in_(event_ids)
            ).all()
            confirmed_event_ids = {c[0] for c in user_confs}

            from sqlalchemy import func as sql_func
            counts_query = db.query(
                EventAttendee.event_id,
                sql_func.count(EventAttendee.id)
            ).filter(EventAttendee.event_id.in_(event_ids)).group_by(EventAttendee.event_id).all()
            attendees_counts = {row[0]: row[1] for row in counts_query}

        response = [
            _build_event_response(
                event,
                current_user,
                active_course_ids,
                confirmed_event_ids=confirmed_event_ids,
                attendees_counts=attendees_counts,
            )
            for event in events
        ]
        return response
    except Exception as exc:
        logger.error(f"[Events] Erro ao listar eventos: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar lista de eventos."
        )


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna os detalhes de um evento específico."""
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento não encontrado."
            )

        if current_user.role not in ["superadmin", "admin"] and not event.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento indisponível."
            )

        active_course_ids = set()
        if current_user.role == "aluno":
            user_courses = db.query(UserCourse).filter(UserCourse.user_id == current_user.id).all()
            for uc in user_courses:
                if _is_student_course_active(uc):
                    active_course_ids.add(uc.course_id)

        return _build_event_response(event, current_user, active_course_ids)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Events] Erro ao buscar evento {event_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar evento."
        )


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Cria um novo evento (apenas administradores)."""
    try:
        # Se restrito a curso, valida existência do curso
        if payload.target_type == "course":
            if not payload.course_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selecione um curso para o evento restrito."
                )
            course = db.query(Course).filter(Course.id == payload.course_id).first()
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Curso selecionado não encontrado."
                )
        else:
            payload.course_id = None

        new_event = Event(
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            start_time=payload.start_time,
            end_time=payload.end_time,
            meeting_url=payload.meeting_url.strip() if payload.meeting_url else None,
            recording_url=payload.recording_url.strip() if payload.recording_url else None,
            thumbnail_url=payload.thumbnail_url.strip() if payload.thumbnail_url else None,
            target_type=payload.target_type,
            course_id=payload.course_id,
            is_active=payload.is_active,
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)

        logger.info(f"[Events] Evento '{new_event.title}' (ID {new_event.id}) criado por {current_user.email}.")
        return _build_event_response(new_event, current_user, set())
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"[Events] Erro ao criar evento: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar evento."
        )


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Atualiza os dados de um evento existente (apenas administradores)."""
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento não encontrado."
            )

        data = payload.model_dump(exclude_unset=True)

        if "target_type" in data:
            if data["target_type"] == "course":
                course_id = data.get("course_id", event.course_id)
                if not course_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Selecione um curso para o evento restrito."
                    )
                course = db.query(Course).filter(Course.id == course_id).first()
                if not course:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Curso selecionado não encontrado."
                    )
            else:
                data["course_id"] = None

        for field, value in data.items():
            if isinstance(value, str):
                value = value.strip() or None
            setattr(event, field, value)

        db.commit()
        db.refresh(event)

        logger.info(f"[Events] Evento ID {event.id} atualizado por {current_user.email}.")
        return _build_event_response(event, current_user, set())
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"[Events] Erro ao atualizar evento {event_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar evento."
        )


@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Exclui um evento (apenas administradores)."""
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento não encontrado."
            )

        db.delete(event)
        db.commit()

        logger.info(f"[Events] Evento ID {event_id} removido por {current_user.email}.")
        return {"detail": "Evento excluído com sucesso."}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"[Events] Erro ao excluir evento {event_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao excluir evento."
        )


@router.post("/{event_id}/confirm-attendance")
def toggle_confirm_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Confirma ou cancela a participação/inscrição do aluno no evento.
    Ao confirmar a presença, dispara funis ativos configurados com o gatilho 'event_attendance'.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or not event.is_active:
        raise HTTPException(status_code=404, detail="Evento não encontrado.")

    # Se for evento restrito a curso, verifica se o aluno tem acesso ativo
    if current_user.role not in ["superadmin", "admin"] and event.target_type == "course" and event.course_id:
        active_ucs = (
            db.query(UserCourse)
            .filter(UserCourse.user_id == current_user.id, UserCourse.course_id == event.course_id)
            .first()
        )
        if not active_ucs or not _is_student_course_active(active_ucs):
            raise HTTPException(
                status_code=403,
                detail="Você precisa ter acesso ao curso deste evento para confirmar presença."
            )

    existing = (
        db.query(EventAttendee)
        .filter(EventAttendee.event_id == event_id, EventAttendee.user_id == current_user.id)
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        is_confirmed = False
        message = "Confirmação de presença desmarcada."
    else:
        new_att = EventAttendee(event_id=event_id, user_id=current_user.id)
        db.add(new_att)
        db.commit()
        is_confirmed = True
        message = "Presença confirmada no evento!"

        # Dispara funis com gatilho de presença em evento
        try:
            from app.services.funnel_community_triggers_service import dispatch_event_attendance_funnels
            dispatch_event_attendance_funnels(db, current_user.id, event_id)
        except Exception as e_err:
            logger.error(f"[Gatilho Evento] Erro ao disparar funis: {e_err}")

    attendees_count = db.query(EventAttendee).filter(EventAttendee.event_id == event_id).count()

    return {
        "event_id": event_id,
        "is_confirmed": is_confirmed,
        "attendees_count": attendees_count,
        "message": message,
    }

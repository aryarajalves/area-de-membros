import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.course import Course, Lesson, QuizQuestion, QuizOption, QuizSubmission, LessonProgress, UserCourse
from app.schemas.quiz import (
    QuizBulkUpdate,
    QuizQuestionResponse,
    QuizOptionResponse,
    QuizSubmissionCreate,
    QuizSubmissionResponse,
    LessonQuizDetails
)
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.core.logger import logger

router = APIRouter(prefix="/courses", tags=["Quizzes e Avaliações"])


def _is_user_course_active(uc: UserCourse) -> bool:
    if uc.access_duration == "lifetime" or uc.expires_at is None:
        return True
    now = datetime.now(timezone.utc)
    exp = uc.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return exp > now


def _verify_student_course_access(db: Session, user_id: int, course_id: int):
    uc = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.course_id == course_id
    ).first()
    if not uc:
        raise HTTPException(status_code=403, detail="Você não possui acesso liberado a este curso.")
    if not _is_user_course_active(uc):
        raise HTTPException(status_code=403, detail="O seu período de acesso a este curso expirou.")


@router.get(
    "/{course_id}/lessons/{lesson_id}/quiz",
    response_model=LessonQuizDetails,
    summary="Obter Perguntas e Quiz da Aula",
    description="Retorna as perguntas e alternativas de uma aula com quiz. Para alunos, o gabarito ('is_correct') é ocultado para segurança."
)
def get_lesson_quiz(
    course_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna as perguntas e opções do quiz de uma aula.
    Para alunos, a resposta correta ('is_correct') é ocultada para evitar trapaça.
    Também retorna a última submissão do aluno nesta aula, se houver.
    """
    if current_user.role == "aluno":
        _verify_student_course_access(db, current_user.id, course_id)

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    is_admin = current_user.role in ["superadmin", "admin"]

    questions = db.query(QuizQuestion).filter(
        QuizQuestion.lesson_id == lesson_id
    ).order_by(QuizQuestion.order_index.asc(), QuizQuestion.id.asc()).all()

    # Formatar resposta omitindo 'is_correct' caso seja aluno
    questions_response = []
    for q in questions:
        opts_response = []
        for opt in q.options:
            opts_response.append(QuizOptionResponse(
                id=opt.id,
                question_id=opt.question_id,
                option_text=opt.option_text,
                is_correct=opt.is_correct if is_admin else None,
                order_index=opt.order_index
            ))
        questions_response.append(QuizQuestionResponse(
            id=q.id,
            lesson_id=q.lesson_id,
            question=q.question,
            points=q.points or 1,
            order_index=q.order_index,
            explanation=q.explanation if is_admin else None,
            created_at=q.created_at,
            options=opts_response
        ))

    last_sub = db.query(QuizSubmission).filter(
        QuizSubmission.lesson_id == lesson_id,
        QuizSubmission.user_id == current_user.id
    ).order_by(QuizSubmission.created_at.desc()).first()

    return LessonQuizDetails(
        lesson_id=lesson_id,
        passing_score_pct=lesson.passing_score_pct or 70,
        questions=questions_response,
        last_submission=last_sub
    )


@router.post(
    "/{course_id}/lessons/{lesson_id}/quiz",
    response_model=LessonQuizDetails,
    summary="Cadastrar/Atualizar Quiz da Aula",
    description="Cria ou substitui as perguntas, opções de múltipla escolha e gabarito de uma aula. (Exclusivo SuperAdmin/Manager)."
)
def save_lesson_quiz(
    course_id: int,
    lesson_id: int,
    payload: QuizBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Salva ou atualiza a lista de perguntas e alternativas do quiz para uma aula.
    Apenas administradores podem configurar o quiz.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    logger.info(f"Atualizando quiz da aula {lesson_id} pelo usuário {current_user.id}. Total perguntas: {len(payload.questions)}, aprovação: {payload.passing_score_pct}%")

    # Atualiza a nota de corte para aprovação do quiz
    if payload.passing_score_pct is not None and payload.passing_score_pct > 0:
        lesson.passing_score_pct = payload.passing_score_pct
        db.add(lesson)

    # Remove perguntas antigas da aula (o cascade remove as opções filhas)
    db.query(QuizQuestion).filter(QuizQuestion.lesson_id == lesson_id).delete()
    db.commit()

    # Adiciona as novas perguntas com pontuação
    for q_idx, q_in in enumerate(payload.questions):
        points_val = q_in.points if q_in.points is not None and q_in.points > 0 else 1
        new_q = QuizQuestion(
            lesson_id=lesson_id,
            question=q_in.question.strip(),
            points=points_val,
            order_index=q_in.order_index if q_in.order_index is not None else q_idx,
            explanation=q_in.explanation
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)

        for o_idx, opt_in in enumerate(q_in.options):
            new_opt = QuizOption(
                question_id=new_q.id,
                option_text=opt_in.option_text.strip(),
                is_correct=opt_in.is_correct,
                order_index=opt_in.order_index if opt_in.order_index is not None else o_idx
            )
            db.add(new_opt)

    db.commit()

    # Retorna o quiz completo montado
    return get_lesson_quiz(course_id=course_id, lesson_id=lesson_id, db=db, current_user=current_user)


@router.post(
    "/{course_id}/lessons/{lesson_id}/quiz/submit",
    response_model=QuizSubmissionResponse,
    summary="Submeter Respostas do Quiz (Aluno)",
    description="Registra a tentativa do aluno, compara as respostas com o gabarito e conclui a aula automaticamente se a nota for maior ou igual à nota de aprovação."
)
def submit_lesson_quiz(
    course_id: int,
    lesson_id: int,
    submission_in: QuizSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submete as respostas de um aluno para o Quiz.
    Calcula a pontuação ponderada por pontos de cada pergunta, compara acertos e erros,
    registra a tentativa e conclui a aula automaticamente se a nota for >= passing_score_pct.
    """
    if current_user.role == "aluno":
        _verify_student_course_access(db, current_user.id, course_id)

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    questions = db.query(QuizQuestion).filter(QuizQuestion.lesson_id == lesson_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Esta aula ainda não possui perguntas cadastradas no quiz.")

    passing_pct = lesson.passing_score_pct if lesson.passing_score_pct is not None and lesson.passing_score_pct > 0 else 70
    total_questions = len(questions)
    correct_count = 0
    total_points = sum(q.points or 1 for q in questions)
    earned_points = 0

    # Dicionário de respostas corretas por pergunta
    correct_options_map = {}
    for q in questions:
        for opt in q.options:
            if opt.is_correct:
                correct_options_map[q.id] = opt.id

    for q in questions:
        chosen_opt_id = submission_in.answers.get(q.id) or submission_in.answers.get(str(q.id))
        if chosen_opt_id and chosen_opt_id == correct_options_map.get(q.id):
            correct_count += 1
            earned_points += (q.points or 1)

    score_pct = int((earned_points / total_points) * 100) if total_points > 0 else 0
    passed = score_pct >= passing_pct

    submission = QuizSubmission(
        lesson_id=lesson_id,
        user_id=current_user.id,
        score=score_pct,
        total_questions=total_questions,
        correct_answers=correct_count,
        total_points=total_points,
        earned_points=earned_points,
        passed=passed,
        answers_json=json.dumps(submission_in.answers)
    )
    db.add(submission)

    # Se aprovado, conclui automaticamente o progresso da aula
    if passed:
        record = db.query(LessonProgress).filter(
            LessonProgress.lesson_id == lesson_id,
            LessonProgress.user_id == current_user.id
        ).first()

        now = datetime.now(timezone.utc)
        if not record:
            record = LessonProgress(
                lesson_id=lesson_id,
                user_id=current_user.id,
                is_completed=True,
                completed_at=now
            )
            db.add(record)
        else:
            record.is_completed = True
            record.completed_at = now

    db.commit()
    db.refresh(submission)

    logger.info(
        f"Quiz submetido pelo aluno {current_user.id} na aula {lesson_id}. "
        f"Acertos: {correct_count}/{total_questions} | Pontos: {earned_points}/{total_points} ({score_pct}%). "
        f"Mínimo exigido: {passing_pct}%. Aprovado: {passed}"
    )

    return submission

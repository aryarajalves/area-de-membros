import pytest
from app.core.config import settings
from app.models.user import User
from app.models.course import Course, Module, Lesson, UserCourse, LessonProgress, QuizQuestion, QuizOption
from app.core.security import get_password_hash
from tests.conftest import TestingSessionLocal, client

def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_tokens():
    db = TestingSessionLocal()
    # Criar aluno de teste
    aluno = User(
        email="aluno_quiz@teste.com",
        name="Aluno Quiz",
        hashed_password=get_password_hash("senha123"),
        role="aluno",
        is_active=True
    )
    db.add(aluno)
    db.commit()
    db.refresh(aluno)
    aluno_id = aluno.id
    db.close()

    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    aluno_headers = get_headers("aluno_quiz@teste.com", "senha123")

    return {
        "admin_headers": admin_headers,
        "aluno_headers": aluno_headers,
        "aluno_id": aluno_id
    }

@pytest.fixture
def sample_course_and_module(auth_tokens):
    db = TestingSessionLocal()
    course = Course(title="Curso de Teste Quiz", description="Desc", is_published=True)
    db.add(course)
    db.commit()
    db.refresh(course)

    mod = Module(course_id=course.id, title="Módulo 1", order_index=0)
    db.add(mod)
    db.commit()
    db.refresh(mod)

    # Matricular aluno no curso
    uc = UserCourse(user_id=auth_tokens["aluno_id"], course_id=course.id, access_duration="lifetime")
    db.add(uc)
    db.commit()

    course_id = course.id
    module_id = mod.id
    db.close()
    return {"course_id": course_id, "module_id": module_id}

def test_create_text_lesson(auth_tokens, sample_course_and_module):
    """Testa criação e leitura de aula do tipo texto/artigo."""
    c_id = sample_course_and_module["course_id"]
    m_id = sample_course_and_module["module_id"]

    res = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons",
        json={
            "title": "Guia Prático de Antigravity",
            "content_type": "text",
            "text_content": "Este é um artigo completo com passo a passo...",
            "duration": "10 min leitura"
        },
        headers=auth_tokens["admin_headers"]
    )
    assert res.status_code == 201
    data = res.json()
    assert data["content_type"] == "text"
    assert data["text_content"] == "Este é um artigo completo com passo a passo..."
    assert data["duration"] == "10 min leitura"

def test_quiz_lifecycle_and_submission(auth_tokens, sample_course_and_module):
    """Testa o ciclo completo de Quiz: criação de aula quiz, cadastro de perguntas, consulta por aluno e submissão com cálculo de nota."""
    c_id = sample_course_and_module["course_id"]
    m_id = sample_course_and_module["module_id"]

    # 1. Criar aula do tipo quiz
    res_lesson = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons",
        json={
            "title": "Quiz sobre Módulo 1",
            "content_type": "quiz"
        },
        headers=auth_tokens["admin_headers"]
    )
    assert res_lesson.status_code == 201
    lesson_id = res_lesson.json()["id"]

    # 2. Configurar perguntas do quiz (Admin)
    res_save_quiz = client.post(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz",
        json={
            "questions": [
                {
                    "question": "O que significa API?",
                    "options": [
                        {"option_text": "Application Programming Interface", "is_correct": True},
                        {"option_text": "Apple Protocol Internet", "is_correct": False}
                    ]
                },
                {
                    "question": "Qual comando roda testes no backend?",
                    "options": [
                        {"option_text": "pytest", "is_correct": True},
                        {"option_text": "run-tests", "is_correct": False}
                    ]
                }
            ]
        },
        headers=auth_tokens["admin_headers"]
    )
    assert res_save_quiz.status_code == 200
    quiz_data = res_save_quiz.json()
    assert len(quiz_data["questions"]) == 2

    # 3. Aluno consulta o quiz: 'is_correct' deve ser omitido (None) para segurança
    res_aluno_quiz = client.get(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz",
        headers=auth_tokens["aluno_headers"]
    )
    assert res_aluno_quiz.status_code == 200
    aluno_quiz_data = res_aluno_quiz.json()
    for q in aluno_quiz_data["questions"]:
        for opt in q["options"]:
            assert opt["is_correct"] is None

    # Mapear perguntas e opções corretas
    q1 = quiz_data["questions"][0]
    q2 = quiz_data["questions"][1]
    q1_correct = [o["id"] for o in q1["options"] if o["is_correct"]][0]
    q1_wrong = [o["id"] for o in q1["options"] if not o["is_correct"]][0]
    q2_correct = [o["id"] for o in q2["options"] if o["is_correct"]][0]

    # 4. Aluno submete respostas com 100% de acerto
    res_submit = client.post(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz/submit",
        json={
            "answers": {
                str(q1["id"]): q1_correct,
                str(q2["id"]): q2_correct
            }
        },
        headers=auth_tokens["aluno_headers"]
    )
    assert res_submit.status_code == 200
    sub_data = res_submit.json()
    assert sub_data["score"] == 100
    assert sub_data["correct_answers"] == 2
    assert sub_data["passed"] is True

    # 5. Verifica se o progresso da aula foi marcado como concluído automaticamente
    db = TestingSessionLocal()
    progress = db.query(LessonProgress).filter(
        LessonProgress.lesson_id == lesson_id,
        LessonProgress.user_id == auth_tokens["aluno_id"]
    ).first()
    assert progress is not None
    assert progress.is_completed is True
    db.close()

    # 6. Aluno submete tentativa com nota baixa (50%) -> passed deve ser False
    res_fail = client.post(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz/submit",
        json={
            "answers": {
                str(q1["id"]): q1_wrong,
                str(q2["id"]): q2_correct
            }
        },
        headers=auth_tokens["aluno_headers"]
    )
    assert res_fail.status_code == 200
    fail_data = res_fail.json()
    assert fail_data["score"] == 50
    assert fail_data["passed"] is False

def test_quiz_custom_points_and_passing_score_pct(auth_tokens, sample_course_and_module):
    """Testa pesos/pontos customizados por questão e nota mínima de aprovação personalizada."""
    c_id = sample_course_and_module["course_id"]
    m_id = sample_course_and_module["module_id"]

    # 1. Criar aula quiz configurando passing_score_pct = 80
    res_lesson = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons",
        json={
            "title": "Quiz com Pesos e Meta de 80%",
            "content_type": "quiz",
            "passing_score_pct": 80
        },
        headers=auth_tokens["admin_headers"]
    )
    assert res_lesson.status_code == 201
    lesson_id = res_lesson.json()["id"]
    assert res_lesson.json()["passing_score_pct"] == 80

    # 2. Configurar perguntas com pontos diferentes: Q1 (1 ponto), Q2 (3 pontos)
    res_save_quiz = client.post(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz",
        json={
            "passing_score_pct": 80,
            "questions": [
                {
                    "question": "Pergunta Fácil (1 ponto)",
                    "points": 1,
                    "options": [
                        {"option_text": "Certa", "is_correct": True},
                        {"option_text": "Errada", "is_correct": False}
                    ]
                },
                {
                    "question": "Pergunta Difícil (3 pontos)",
                    "points": 3,
                    "options": [
                        {"option_text": "Certa", "is_correct": True},
                        {"option_text": "Errada", "is_correct": False}
                    ]
                }
            ]
        },
        headers=auth_tokens["admin_headers"]
    )
    assert res_save_quiz.status_code == 200
    quiz_data = res_save_quiz.json()
    assert quiz_data["passing_score_pct"] == 80
    assert quiz_data["questions"][0]["points"] == 1
    assert quiz_data["questions"][1]["points"] == 3

    # 3. Consulta do Aluno: deve trazer passing_score_pct e points
    res_aluno_quiz = client.get(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz",
        headers=auth_tokens["aluno_headers"]
    )
    assert res_aluno_quiz.status_code == 200
    aluno_data = res_aluno_quiz.json()
    assert aluno_data["passing_score_pct"] == 80
    assert aluno_data["questions"][0]["points"] == 1
    assert aluno_data["questions"][1]["points"] == 3

    q1 = quiz_data["questions"][0]
    q2 = quiz_data["questions"][1]
    q1_wrong = [o["id"] for o in q1["options"] if not o["is_correct"]][0]
    q1_correct = [o["id"] for o in q1["options"] if o["is_correct"]][0]
    q2_correct = [o["id"] for o in q2["options"] if o["is_correct"]][0]

    # 4. Aluno erra Q1 (1 ponto) e acerta Q2 (3 pontos):
    # Total de pontos = 4, obteve 3 pontos -> 3/4 = 75%.
    # Como a aprovação exige 80%, passed deve ser False!
    res_sub_75 = client.post(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz/submit",
        json={
            "answers": {
                str(q1["id"]): q1_wrong,
                str(q2["id"]): q2_correct
            }
        },
        headers=auth_tokens["aluno_headers"]
    )
    assert res_sub_75.status_code == 200
    data_75 = res_sub_75.json()
    assert data_75["total_points"] == 4
    assert data_75["earned_points"] == 3
    assert data_75["score"] == 75
    assert data_75["passed"] is False

    # 5. Aluno acerta ambas (Q1 e Q2):
    # Total de pontos = 4, obteve 4 pontos -> 4/4 = 100%.
    # 100% >= 80%, passed deve ser True!
    res_sub_100 = client.post(
        f"/api/v1/courses/{c_id}/lessons/{lesson_id}/quiz/submit",
        json={
            "answers": {
                str(q1["id"]): q1_correct,
                str(q2["id"]): q2_correct
            }
        },
        headers=auth_tokens["aluno_headers"]
    )
    assert res_sub_100.status_code == 200
    data_100 = res_sub_100.json()
    assert data_100["total_points"] == 4
    assert data_100["earned_points"] == 4
    assert data_100["score"] == 100
    assert data_100["passed"] is True


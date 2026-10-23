import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import TestingSessionLocal
from app.models.user import User
from app.models.course import Course, UserCourse, CourseSalesClick
from app.models.course_upsell import CourseUpsellOffer, CourseUpsellView
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def admin_token(db_session):
    admin = db_session.query(User).filter(User.email == "admin_upsell_test@example.com").first()
    if not admin:
        admin = User(
            email="admin_upsell_test@example.com",
            name="Admin Upsell Test",
            role="admin",
            hashed_password=get_password_hash("SecretPass123!"),
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return create_access_token(data={"sub": str(admin.id), "role": admin.role})

@pytest.fixture
def student_token(db_session):
    student = db_session.query(User).filter(User.email == "student_upsell_test@example.com").first()
    if not student:
        student = User(
            email="student_upsell_test@example.com",
            name="Student Upsell Test",
            role="aluno",
            hashed_password=get_password_hash("SecretPass123!"),
            is_active=True
        )
        db_session.add(student)
        db_session.commit()
        db_session.refresh(student)
    return create_access_token(data={"sub": str(student.id), "role": student.role})

@pytest.fixture
def sample_courses(db_session):
    c1 = db_session.query(Course).filter(Course.title == "Curso Origem Upsell").first()
    if not c1:
        c1 = Course(title="Curso Origem Upsell", description="Origem", sales_page_url="https://origem.com")
        db_session.add(c1)

    c2 = db_session.query(Course).filter(Course.title == "Curso Alvo Upsell").first()
    if not c2:
        c2 = Course(title="Curso Alvo Upsell", description="Alvo", sales_page_url="https://alvo.com/checkout")
        db_session.add(c2)

    db_session.commit()
    db_session.refresh(c1)
    db_session.refresh(c2)
    return c1, c2


def test_create_upsell_offer(admin_token, sample_courses):
    c1, c2 = sample_courses
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "target_course_id": c2.id,
        "progress_pct": 35,
        "media_type": "image",
        "media_url": "https://images.unsplash.com/promo.jpg",
        "title": "Conheça o Treinamento Avançado!",
        "description": "Você já dominou 35% do curso. Pronto para o próximo nível?",
        "button_text": "Garantir Vaga",
        "button_url": "https://alvo.com/checkout?cupom=ALUNO35",
        "is_active": True
    }

    response = client.post(f"/api/v1/courses/{c1.id}/upsell-offers", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["progress_pct"] == 35
    assert data["target_course_id"] == c2.id
    assert data["title"] == "Conheça o Treinamento Avançado!"
    assert data["target_course_title"] == "Curso Alvo Upsell"


def test_cannot_promote_self(admin_token, sample_courses):
    c1, _ = sample_courses
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "target_course_id": c1.id,
        "progress_pct": 50,
        "media_type": "video",
        "media_url": "https://videos.com/promo.mp4",
        "title": "Mesmo Curso",
        "is_active": True
    }

    response = client.post(f"/api/v1/courses/{c1.id}/upsell-offers", json=payload, headers=headers)
    assert response.status_code == 400
    assert "não pode promover a si mesmo" in response.json()["detail"]


def test_list_and_update_upsell_offer(db_session, admin_token, sample_courses):
    c1, c2 = sample_courses
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Garante que existe uma oferta criada
    offer = CourseUpsellOffer(
        course_id=c1.id,
        target_course_id=c2.id,
        progress_pct=35,
        media_type="image",
        media_url="https://images.com/35.png",
        title="Oferta 35%",
        button_text="Comprar",
        is_active=True
    )
    db_session.add(offer)
    db_session.commit()
    db_session.refresh(offer)

    # List
    list_res = client.get(f"/api/v1/courses/{c1.id}/upsell-offers", headers=headers)
    assert list_res.status_code == 200
    offers = list_res.json()
    assert len(offers) >= 1
    target_item = next(o for o in offers if o["id"] == offer.id)
    assert target_item["progress_pct"] == 35

    # Update
    update_res = client.put(f"/api/v1/courses/upsell-offers/{offer.id}", json={
        "progress_pct": 50,
        "button_text": "Avançar Agora"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["progress_pct"] == 50
    assert update_res.json()["button_text"] == "Avançar Agora"


def test_student_eligible_upsell_flow(db_session, student_token, sample_courses):
    c1, c2 = sample_courses
    student = db_session.query(User).filter(User.email == "student_upsell_test@example.com").first()

    # Cria uma oferta de 50%
    offer = CourseUpsellOffer(
        course_id=c1.id,
        target_course_id=c2.id,
        progress_pct=50,
        media_type="image",
        media_url="https://images.com/50.png",
        title="Oferta 50%",
        is_active=True
    )
    db_session.add(offer)
    db_session.commit()
    db_session.refresh(offer)

    # Garante que não há views anteriores e nem matrícula no curso alvo
    db_session.query(CourseUpsellView).filter(CourseUpsellView.user_id == student.id).delete()
    db_session.query(UserCourse).filter(UserCourse.user_id == student.id, UserCourse.course_id == c2.id).delete()
    db_session.commit()

    headers = {"Authorization": f"Bearer {student_token}"}

    # 1. Progresso insuficiente (ex: 20% quando o trigger é 50%)
    res_low = client.get(f"/api/v1/courses/{c1.id}/upsell-check?progress=20", headers=headers)
    assert res_low.status_code == 200
    assert res_low.json()["has_offer"] is False

    # 2. Progresso suficiente (ex: 55%) -> deve retornar oferta
    res_hit = client.get(f"/api/v1/courses/{c1.id}/upsell-check?progress=55", headers=headers)
    assert res_hit.status_code == 200
    data_hit = res_hit.json()
    assert data_hit["has_offer"] is True
    assert data_hit["offer"]["id"] == offer.id

    # 3. Dismiss (fechar popup) -> nunca mais deve retornar para este aluno
    res_dismiss = client.post(f"/api/v1/courses/upsell-offers/{offer.id}/dismiss", headers=headers)
    assert res_dismiss.status_code == 200

    # 4. Checa de novo com progresso 55% -> agora deve retornar false pois já foi dispensado
    res_after_dismiss = client.get(f"/api/v1/courses/{c1.id}/upsell-check?progress=55", headers=headers)
    assert res_after_dismiss.status_code == 200
    assert res_after_dismiss.json()["has_offer"] is False


def test_student_already_owns_target_course_skips_upsell(db_session, student_token, sample_courses):
    c1, c2 = sample_courses
    student = db_session.query(User).filter(User.email == "student_upsell_test@example.com").first()

    # Cria nova oferta de 75%
    offer_75 = CourseUpsellOffer(
        course_id=c1.id,
        target_course_id=c2.id,
        progress_pct=75,
        media_type="image",
        media_url="https://images.com/banner75.png",
        title="Oferta 75%",
        is_active=True
    )
    db_session.add(offer_75)
    
    # Matricula o aluno no curso c2 (alvo)
    uc = UserCourse(user_id=student.id, course_id=c2.id, access_duration="lifetime")
    db_session.add(uc)
    db_session.commit()

    headers = {"Authorization": f"Bearer {student_token}"}
    # Checa com 80% de progresso -> como o aluno já comprou o curso c2, a oferta NÃO deve ser exibida
    res = client.get(f"/api/v1/courses/{c1.id}/upsell-check?progress=80", headers=headers)
    assert res.status_code == 200
    assert res.json()["has_offer"] is False


def test_click_upsell_offer_records_sales_click(db_session, student_token, sample_courses):
    c1, c2 = sample_courses
    student = db_session.query(User).filter(User.email == "student_upsell_test@example.com").first()

    offer = CourseUpsellOffer(
        course_id=c1.id,
        target_course_id=c2.id,
        progress_pct=30,
        media_type="image",
        media_url="https://images.com/click.png",
        title="Oferta Click",
        is_active=True
    )
    db_session.add(offer)
    db_session.commit()
    db_session.refresh(offer)

    headers = {"Authorization": f"Bearer {student_token}"}

    res_click = client.post(f"/api/v1/courses/upsell-offers/{offer.id}/click", headers=headers)
    assert res_click.status_code == 200

    # Verifica se gerou o clique de vendas no curso alvo
    sales_click = db_session.query(CourseSalesClick).filter(
        CourseSalesClick.course_id == offer.target_course_id,
        CourseSalesClick.user_id == student.id
    ).first()
    assert sales_click is not None


def test_sidebar_upsell_offer_flow(db_session, student_token, sample_courses):
    c1, c2 = sample_courses
    student = db_session.query(User).filter(User.email == "student_upsell_test@example.com").first()

    # Limpa ofertas anteriores para isolamento do teste
    db_session.query(CourseUpsellOffer).filter(CourseUpsellOffer.course_id == c1.id).delete()
    # Remove qualquer matrícula de c2 para o aluno
    db_session.query(UserCourse).filter(UserCourse.user_id == student.id, UserCourse.course_id == c2.id).delete()
    db_session.commit()

    sidebar_offer = CourseUpsellOffer(
        course_id=c1.id,
        target_course_id=c2.id,
        progress_pct=10,
        media_type="image",
        media_url="https://images.com/sidebar.png",
        title="Formação VIP no Sidebar",
        description="Acesse o próximo nível da sua carreira.",
        button_text="Conhecer Agora",
        button_url="https://alvo.com/checkout",
        is_active=True,
        show_in_sidebar=True
    )
    db_session.add(sidebar_offer)
    db_session.commit()
    db_session.refresh(sidebar_offer)

    headers = {"Authorization": f"Bearer {student_token}"}
    res = client.get(f"/api/v1/courses/{c1.id}/upsell-sidebar", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_offer"] is True
    assert data["offer"]["title"] == "Formação VIP no Sidebar"
    assert data["offer"]["show_in_sidebar"] is True
    assert data["target_action_url"] == "https://alvo.com/checkout"

    # Agora o aluno adquire o curso c2
    uc = UserCourse(user_id=student.id, course_id=c2.id, access_duration="lifetime")
    db_session.add(uc)
    db_session.commit()

    # O endpoint não deve mais retornar a oferta porque o aluno já tem o produto
    res_after_buy = client.get(f"/api/v1/courses/{c1.id}/upsell-sidebar", headers=headers)
    assert res_after_buy.status_code == 200
    assert res_after_buy.json()["has_offer"] is False


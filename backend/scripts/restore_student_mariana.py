import sys
from datetime import datetime, timezone
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import UserCourse, Course
from app.core.security import get_password_hash

def main():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.id == 5).first()
        if not existing:
            # Verifica se já existe por email
            by_email = db.query(User).filter(User.email == 'aryarajunity@gmail.com').first()
            if by_email:
                by_email.id = 5
                by_email.name = 'Mariana'
                by_email.role = 'aluno'
                by_email.is_active = True
                u = by_email
            else:
                u = User(
                    id=5,
                    email='aryarajunity@gmail.com',
                    name='Mariana',
                    hashed_password=get_password_hash('pass123'),
                    role='aluno',
                    is_active=True,
                    phone='+55 (11) 98765-4321',
                    created_at=datetime.now(timezone.utc)
                )
                db.add(u)
            db.commit()
            print(f"Aluno Mariana restaurado com sucesso! ID={u.id}, Email={u.email}, Role={u.role}")
        else:
            print(f"Aluno Mariana já existe no banco: ID={existing.id}, Name={existing.name}")

        # Vincula aos cursos cadastrados
        courses = db.query(Course).all()
        for c in courses:
            uc_exists = db.query(UserCourse).filter(UserCourse.user_id == 5, UserCourse.course_id == c.id).first()
            if not uc_exists:
                uc = UserCourse(user_id=5, course_id=c.id, access_duration='lifetime')
                db.add(uc)
        db.commit()
        print("Matrículas de cursos vinculadas com sucesso!")

        # Ajusta a sequence do ID de users
        db.execute(text("SELECT setval('users_id_seq', (SELECT GREATEST(MAX(id), 10) FROM users));"))
        db.commit()
        print("Sequence de users sincronizada.")
    finally:
        db.close()

if __name__ == '__main__':
    main()

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user") # 'superadmin', 'admin', 'user'
    is_active = Column(Boolean, default=True)
    phone = Column(String, nullable=True) # WhatsApp / Telefone do usuário
    avatar_url = Column(String, nullable=True) # Foto/logo de perfil do usuário
    token_version = Column(Integer, default=1, nullable=False) # Invalidação imediata de JWT ao alterar senha/deslogar
    failed_login_attempts = Column(Integer, default=0, nullable=False) # Contador de tentativas falhas de login
    locked_until = Column(DateTime, nullable=True) # Timestamp de bloqueio temporário por força bruta
    playback_rate = Column(Float, default=1.0, nullable=True) # Velocidade preferida de reprodução do player
    created_at = Column(DateTime, default=utc_now)


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False) # 'admin', 'user'
    expires_at = Column(DateTime, nullable=True) # None = indefinido (não expira)
    is_used = Column(Boolean, default=False)
    used_by_email = Column(String, nullable=True)
    allowed_course_ids = Column(String, nullable=True) # JSON array com IDs dos cursos vinculados
    created_at = Column(DateTime, default=utc_now)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)


class RegistrationVerification(Base):
    __tablename__ = "registration_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utc_now)

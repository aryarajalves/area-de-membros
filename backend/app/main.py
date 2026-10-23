from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logger import logger
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash, perform_startup_security_check
from app.models.user import User
from app.models.backup import BackupSchedule, BackupHistory
from app.models.course import Course, UserCourse
from app.models.webhook import Webhook, WebhookLog
from app.api.v1.api import api_router
from app.services.scheduler import setup_scheduler, scheduler

def init_superadmin():
    db: Session = SessionLocal()
    try:
        superadmin = db.query(User).filter(User.role == "superadmin").first()
        if not superadmin:
            # Check if email is used or create initial superadmin
            existing_email = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
            if not existing_email:
                superadmin = User(
                    email=settings.SUPERADMIN_EMAIL,
                    name=settings.SUPERADMIN_NAME,
                    hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
                    role="superadmin",
                    is_active=True
                )
                db.add(superadmin)
                db.commit()
            else:
                existing_email.role = "superadmin"
                existing_email.hashed_password = get_password_hash(settings.SUPERADMIN_PASSWORD)
                existing_email.name = settings.SUPERADMIN_NAME
                db.commit()
        else:
            # Superadmin exists: sync email, name and password from env if user updated .env
            superadmin.email = settings.SUPERADMIN_EMAIL
            superadmin.name = settings.SUPERADMIN_NAME
            superadmin.hashed_password = get_password_hash(settings.SUPERADMIN_PASSWORD)
            superadmin.is_active = True
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[MAIN] >>> Iniciando ciclo de vida da API (lifespan)...")
    try:
        perform_startup_security_check()
    except Exception as sec_e:
        logger.warning(f"[MAIN] Aviso na auditoria preventiva de chaves: {sec_e}")

    # 1. Criação/Verificação das tabelas
    try:
        logger.info("[MAIN] Verificando e criando tabelas do banco de dados...")
        Base.metadata.create_all(bind=engine)
        logger.info("[MAIN] Tabelas verificadas com sucesso.")
    except Exception as e:
        logger.error(f"[MAIN] Aviso ao criar tabelas no startup: {e}")

    # 1.1. Auto-migrações preventivas de colunas e tabelas (garante compatibilidade após deploys)
    try:
        logger.info("[MAIN] Executando auto-migrações preventivas de colunas e tabelas...")
        from sqlalchemy import text
        with engine.connect() as conn:
            with conn.begin():
                is_postgres = "postgresql" in engine.dialect.name
                if is_postgres:
                    conn.execute(text("""
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITHOUT TIME ZONE;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS item_type VARCHAR DEFAULT 'course';
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS tool_url VARCHAR;
                        CREATE TABLE IF NOT EXISTS course_bundles (
                            id SERIAL PRIMARY KEY,
                            parent_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            bundled_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE (parent_course_id, bundled_course_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_course_bundles_parent_course_id ON course_bundles(parent_course_id);
                        CREATE INDEX IF NOT EXISTS ix_course_bundles_bundled_course_id ON course_bundles(bundled_course_id);
                        CREATE TABLE IF NOT EXISTS course_sales_clicks (
                            id SERIAL PRIMARY KEY,
                            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        CREATE INDEX IF NOT EXISTS ix_course_sales_clicks_course_id ON course_sales_clicks(course_id);
                        CREATE INDEX IF NOT EXISTS ix_course_sales_clicks_user_id ON course_sales_clicks(user_id);
                        CREATE INDEX IF NOT EXISTS ix_course_sales_clicks_created_at ON course_sales_clicks(created_at);
                        CREATE TABLE IF NOT EXISTS system_alert_configs (
                            id SERIAL PRIMARY KEY,
                            pool_alert_enabled BOOLEAN DEFAULT TRUE NOT NULL,
                            pool_alert_threshold INTEGER DEFAULT 75 NOT NULL,
                            ram_alert_enabled BOOLEAN DEFAULT TRUE NOT NULL,
                            ram_alert_threshold INTEGER DEFAULT 80 NOT NULL,
                            cpu_alert_enabled BOOLEAN DEFAULT TRUE NOT NULL,
                            cpu_alert_threshold INTEGER DEFAULT 85 NOT NULL,
                            cooldown_minutes INTEGER DEFAULT 15 NOT NULL,
                            webhook_url VARCHAR DEFAULT '' NOT NULL,
                            notify_normalized BOOLEAN DEFAULT TRUE NOT NULL,
                            last_alert_sent_at TIMESTAMP WITHOUT TIME ZONE,
                            last_normalized_sent_at TIMESTAMP WITHOUT TIME ZONE,
                            is_currently_critical BOOLEAN DEFAULT FALSE NOT NULL,
                            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE TABLE IF NOT EXISTS system_peak_metrics (
                            id SERIAL PRIMARY KEY,
                            metric_type VARCHAR(50) NOT NULL,
                            peak_value DOUBLE PRECISION NOT NULL,
                            peak_details VARCHAR(255),
                            recorded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE TABLE IF NOT EXISTS system_connection_histories (
                            id SERIAL PRIMARY KEY,
                            hour_period VARCHAR(50) NOT NULL,
                            peak_connections INTEGER DEFAULT 1 NOT NULL,
                            pool_capacity INTEGER DEFAULT 50 NOT NULL,
                            occupancy_pct DOUBLE PRECISION DEFAULT 2.0 NOT NULL,
                            status VARCHAR(50) DEFAULT 'Normal' NOT NULL,
                            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );

                        CREATE TABLE IF NOT EXISTS course_upsell_offers (
                            id SERIAL PRIMARY KEY,
                            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            target_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            progress_pct INTEGER NOT NULL DEFAULT 35,
                            media_type VARCHAR(20) NOT NULL DEFAULT 'image',
                            media_url TEXT NOT NULL,
                            title VARCHAR(255) NOT NULL,
                            description TEXT,
                            button_text VARCHAR(100) NOT NULL DEFAULT 'Quero Conhecer',
                            button_url TEXT,
                            is_active BOOLEAN NOT NULL DEFAULT TRUE,
                            show_in_sidebar BOOLEAN NOT NULL DEFAULT FALSE,
                            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        ALTER TABLE course_upsell_offers ADD COLUMN IF NOT EXISTS show_in_sidebar BOOLEAN NOT NULL DEFAULT FALSE;
                        CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_course_id ON course_upsell_offers(course_id);
                        CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_target_course_id ON course_upsell_offers(target_course_id);
                        CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_progress_pct ON course_upsell_offers(progress_pct);

                        CREATE TABLE IF NOT EXISTS course_upsell_views (
                            id SERIAL PRIMARY KEY,
                            offer_id INTEGER NOT NULL REFERENCES course_upsell_offers(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            dismissed BOOLEAN NOT NULL DEFAULT TRUE,
                            clicked_at TIMESTAMP WITHOUT TIME ZONE,
                            CONSTRAINT uq_course_upsell_view_user UNIQUE (offer_id, user_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_course_upsell_views_offer_id ON course_upsell_views(offer_id);
                        CREATE INDEX IF NOT EXISTS ix_course_upsell_views_user_id ON course_upsell_views(user_id);
                    """))
                else:
                    for col_sql in [
                        "ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1",
                        "ALTER TABLE course_upsell_offers ADD COLUMN show_in_sidebar BOOLEAN DEFAULT 0",
                        "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0",
                        "ALTER TABLE users ADD COLUMN locked_until TIMESTAMP",
                    ]:
                        try:
                            conn.execute(text(col_sql))
                        except Exception:
                            pass
                    try:
                        conn.execute(text("ALTER TABLE courses ADD COLUMN item_type VARCHAR DEFAULT 'course'"))
                    except Exception:
                        pass
                    try:
                        conn.execute(text("ALTER TABLE courses ADD COLUMN tool_url VARCHAR"))
                    except Exception:
                        pass
        logger.info("[MAIN] Auto-migrações preventivas concluídas com sucesso.")
    except Exception as e:
        logger.warning(f"[MAIN] Aviso nas auto-migrações preventivas: {e}")

    # 2. Limpeza preventiva de conexões e transações órfãs no PostgreSQL (deploys anteriores)
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                # Encerra conexões órfãs deixadas em 'idle in transaction' ou com DDLs pendentes
                conn.execute(text("""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = current_database()
                      AND pid <> pg_backend_pid()
                      AND (
                          state IN ('idle in transaction', 'idle in transaction (aborted)')
                          OR (state = 'active' AND query ILIKE 'ALTER TABLE%')
                      );
                """))
                conn.commit()
                logger.info("[MAIN] Conexões órfãs e transações pendentes no PostgreSQL limpas com sucesso.")
    except Exception as e:
        logger.warning(f"[MAIN] Aviso na verificação de conexões do banco: {e}")

    # 3. Sincronização de credenciais do superadministrador
    try:
        logger.info("[MAIN] Sincronizando credenciais do superadministrador...")
        init_superadmin()
        logger.info("[MAIN] Superadministrador verificado com sucesso.")
    except Exception as e:
        logger.error(f"[MAIN] Erro ao sincronizar superadmin no startup: {e}")

    # 4. Redefinição de transcrições de áudio interrompidas
    try:
        logger.info("[MAIN] Verificando transcrições de áudio pendentes...")
        from app.models.course import LessonTranscription
        with SessionLocal() as db:
            orphaned = db.query(LessonTranscription).filter(LessonTranscription.status == "processing").all()
            for t in orphaned:
                t.status = "failed"
                t.error_message = "O processamento foi interrompido por um reinício do servidor. Por favor, clique em Tentar Novamente."
            if orphaned:
                db.commit()
                logger.info(f"[MAIN] {len(orphaned)} transcrições órfãs redefinidas para status failed.")
    except Exception as e:
        logger.error(f"[MAIN] Erro ao recuperar transcrições órfãs no startup: {e}")

    # 5. Agendador em background
    if settings.ENABLE_INTERNAL_SCHEDULER:
        setup_scheduler()
    else:
        logger.info("[MAIN] Scheduler interno desativado no processo web. As rotinas periódicas são executadas pelo serviço Worker dedicado.")

    logger.info("[MAIN] <<< Inicialização concluída com sucesso! Servidor pronto para responder requisições.")
    yield

    # Finaliza scheduler se estiver rodando
    if scheduler.running:
        scheduler.shutdown()
    logger.info("[MAIN] Servidor finalizado.")

tags_metadata = [
    {"name": "Autenticação e Usuários", "description": "Endpoints para login, cadastro, convites, gestão de usuários e redefinição de senhas."},
    {"name": "Cursos e Módulos", "description": "Gestão de cursos, criação e ordenação de módulos e customização de tema da plataforma."},
    {"name": "Aulas e Conteúdos", "description": "Aulas multimídia (vídeos com legendas/áudios multilíngues, textos/artigos e materiais anexos)."},
    {"name": "Quizzes e Avaliações", "description": "Avaliações interativas de múltipla escolha com cálculo automático de notas e feedback."},
    {"name": "Interações e Progresso", "description": "Comentários da comunidade, progresso das aulas assistidas, notas pessoais e avaliações por estrelas."},
    {"name": "Alunos e Matrículas", "description": "Gestão de alunos, importação em lote via CSV, prazos de expiração e histórico de aulas assistidas."},
    {"name": "Suporte e Dúvidas", "description": "Fórum de suporte da comunidade com tópicos categorizados por curso, anexos de imagem e respostas."},
    {"name": "Webhooks e Integrações", "description": "Disparo automático de webhooks para plataformas externas (Kiwify, Hotmart, n8n, Typebot)."},
    {"name": "Sistema", "description": "Monitoramento e verificação de saúde da API."},
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    ## 🚀 API Oficial da Área de Membros
    Plataforma premium para hospedagem de cursos, gestão de alunos, quizzes interativos, suporte em comunidade e integrações automatizadas.
    
    ### 🛡️ Autenticação:
    Para acessar as rotas protegidas, utilize o cabeçalho:
    `Authorization: Bearer <seu_token_jwt>`
    """,
    version="2.0.0",
    openapi_tags=tags_metadata,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

cors_origins_raw = (settings.CORS_ORIGINS or "*").strip()
if cors_origins_raw == "*" or not cors_origins_raw:
    cors_origins = ["*"]
else:
    cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(self), microphone=(self)"
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Sistema"], summary="Status e Saúde da API", description="Verifica se o backend e a conexão geral estão operacionais.")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

@app.get("/", include_in_schema=False)
def root():
    return {"message": f"Bem-vindo ao {settings.PROJECT_NAME}"}

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    client_ip = request.client.host if request.client else "unknown"
    logger.warning(f"[RateLimit] Limite de requisições excedido em {request.method} {request.url.path} (IP: {client_ip})")
    return JSONResponse(
        status_code=429,
        content={"detail": "Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente."}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro inesperado em {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."}
    )


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
from app.core.sentry_setup import init_sentry, capture_sentry_exception; init_sentry("backend")

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
        from app.core.system_limits import ensure_min_nofile_limit
        ensure_min_nofile_limit()
    except Exception as lim_e:
        logger.warning(f"[MAIN] Aviso ao ajustar limite de descritores (nofile): {lim_e}")
    try:
        perform_startup_security_check()
    except Exception as sec_e:
        logger.warning(f"[MAIN] Aviso na auditoria preventiva de chaves: {sec_e}")

    from contextlib import ExitStack
    from app.services.auto_migration_service import (
        cleanup_stale_postgres_connections,
        postgres_startup_migration_lock,
        sync_missing_columns,
    )

    _startup_lock_stack = ExitStack()
    _startup_lock_stack.enter_context(postgres_startup_migration_lock(engine))

    # 0. Limpeza preventiva de conexões e transações órfãs antigas no PostgreSQL (deploys anteriores)
    cleanup_stale_postgres_connections(engine, min_age_seconds=30)

    # 1. Criação/Verificação das tabelas
    try:
        logger.info("[MAIN] Verificando e criando tabelas do banco de dados...")
        Base.metadata.create_all(bind=engine)
        logger.info("[MAIN] Tabelas verificadas com sucesso.")
    except Exception as e:
        logger.error(f"[MAIN] Aviso ao criar tabelas no startup: {e}")

    # 1.1. Auto-migrações preventivas de colunas e tabelas (modularizado em startup_migrations.py)
    from app.services.startup_migrations import run_startup_auto_migrations
    run_startup_auto_migrations(engine)

    # 1.2. Varredura automática de qualquer coluna faltante comparando Base.metadata vs Banco
    try:
        sync_missing_columns(engine, Base)
    except Exception as e:
        logger.warning(f"[MAIN] Aviso na sincronização automática de colunas: {e}")
    finally:
        _startup_lock_stack.close()
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

    # 6. Sincronização multi-worker e réplicas via Redis Pub/Sub (se configurado)
    try:
        from app.services.chat_ws_manager import chat_manager
        await chat_manager.start_redis_listener()
    except Exception as redis_e:
        logger.warning(f"[MAIN] Aviso ao iniciar Redis listener: {redis_e}")

    logger.info("[MAIN] <<< Inicialização concluída com sucesso! Servidor pronto para responder requisições.")
    yield

    # Encerra listener Redis Pub/Sub
    try:
        from app.services.chat_ws_manager import chat_manager
        await chat_manager.stop_redis_listener()
    except Exception:
        pass

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
cors_origins = ["*"] if (cors_origins_raw == "*" or not cors_origins_raw) else [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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
    capture_sentry_exception(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."}
    )


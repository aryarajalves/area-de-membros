from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logger import logger
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
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

    # 1. Criação/Verificação das tabelas
    try:
        logger.info("[MAIN] Verificando e criando tabelas do banco de dados...")
        Base.metadata.create_all(bind=engine)
        logger.info("[MAIN] Tabelas verificadas com sucesso.")
    except Exception as e:
        logger.error(f"[MAIN] Aviso ao criar tabelas no startup: {e}")

    # 2. Migrações DDL de compatibilidade com timeout restrito para evitar deadlocks
    try:
        logger.info("[MAIN] Executando verificações DDL de compatibilidade...")
        with engine.connect() as conn:
            from sqlalchemy import text
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                try:
                    conn.execute(text("SET lock_timeout = '2000ms';"))
                except Exception:
                    pass

            # Inclusão segura de colunas
            columns_to_add = [
                ("invites", "used_by_email", "VARCHAR"),
                ("invites", "allowed_course_ids", "VARCHAR"),
            ]
            for table, col, col_type in columns_to_add:
                try:
                    if is_postgres:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                    else:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};"))
                    conn.commit()
                except Exception:
                    conn.rollback()

            # Sincronização de sequences no PostgreSQL (isolada e protegida com timeout)
            if is_postgres:
                seq_tables = ["users", "webhooks", "webhook_logs"]
                for tbl in seq_tables:
                    try:
                        conn.execute(text(f"ALTER TABLE {tbl} ALTER COLUMN id SET DEFAULT nextval('{tbl}_id_seq');"))
                        conn.commit()
                    except Exception as seq_err:
                        conn.rollback()
                        logger.warning(f"[MAIN] Aviso não impeditivo ao verificar sequence de {tbl}: {seq_err}")
        logger.info("[MAIN] Verificações DDL concluídas com sucesso.")
    except Exception as e:
        logger.warning(f"[MAIN] Aviso nas migrações DDL de startup: {e}")

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Sistema"], summary="Status e Saúde da API", description="Verifica se o backend e a conexão geral estão operacionais.")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

@app.get("/", include_in_schema=False)
def root():
    return {"message": f"Bem-vindo ao {settings.PROJECT_NAME}"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro inesperado em {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."}
    )


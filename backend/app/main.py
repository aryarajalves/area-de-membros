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

    # 0. Limpeza preventiva de conexões e transações órfãs no PostgreSQL (deploys anteriores)
    try:
        with engine.connect() as conn:
            from sqlalchemy import text as sa_text
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                # Encerra conexões órfãs deixadas em 'idle in transaction' ou com DDLs pendentes
                # Executado ANTES de qualquer DDL para evitar deadlocks de ACCESS EXCLUSIVE LOCK
                conn.execute(sa_text("""
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
        logger.warning(f"[MAIN] Aviso na verificação inicial de conexões do banco: {e}")

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
                    conn.execute(text("SET lock_timeout = '4s';"))
                    conn.execute(text("SET statement_timeout = '15s';"))
                    conn.execute(text("""
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITHOUT TIME ZONE;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS item_type VARCHAR DEFAULT 'course';
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS tool_url VARCHAR;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS bundle_title VARCHAR;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN NOT NULL DEFAULT TRUE;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image_position INTEGER NOT NULL DEFAULT 50;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS bg_color VARCHAR DEFAULT '#090d16';
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS sales_page_url VARCHAR;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS agentflow_kb_id INTEGER;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS agentflow_kb_name VARCHAR;
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
                        CREATE TABLE IF NOT EXISTS events (
                            id SERIAL PRIMARY KEY,
                            title VARCHAR(255) NOT NULL,
                            description TEXT,
                            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                            end_time TIMESTAMP WITH TIME ZONE,
                            meeting_url VARCHAR(1024),
                            recording_url VARCHAR(1024),
                            thumbnail_url VARCHAR(1024),
                            target_type VARCHAR(20) NOT NULL DEFAULT 'all',
                            course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
                            is_active BOOLEAN NOT NULL DEFAULT TRUE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        CREATE INDEX IF NOT EXISTS ix_events_start_time ON events(start_time);
                        CREATE INDEX IF NOT EXISTS ix_events_course_id ON events(course_id);
                        ALTER TABLE events ADD COLUMN IF NOT EXISTS course_ids_json TEXT NULL;

                        CREATE TABLE IF NOT EXISTS funnel_folders (
                            id SERIAL PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            color VARCHAR(30) DEFAULT '#6366f1',
                            order_index INTEGER DEFAULT 0 NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_funnel_folders_name ON funnel_folders(name);
                        ALTER TABLE funnels ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES funnel_folders(id) ON DELETE SET NULL;
                        CREATE INDEX IF NOT EXISTS ix_funnels_folder_id ON funnels(folder_id);

                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT TRUE;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS workload_hours INTEGER DEFAULT 10;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name VARCHAR;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS release_type VARCHAR(50) DEFAULT 'immediate';
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS channel_release_type VARCHAR(50) DEFAULT 'immediate';
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS channel_release_date TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE courses ADD COLUMN IF NOT EXISTS locked_channels_json TEXT NULL;
                        CREATE TABLE IF NOT EXISTS certificates (
                            id SERIAL PRIMARY KEY,
                            certificate_code VARCHAR(100) UNIQUE NOT NULL,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            student_name VARCHAR(255) NOT NULL,
                            course_title VARCHAR(255) NOT NULL,
                            workload_hours INTEGER NOT NULL DEFAULT 10,
                            instructor_name VARCHAR(255),
                            issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT uq_certificate_user_course UNIQUE (user_id, course_id)
                        );
                        CREATE UNIQUE INDEX IF NOT EXISTS ix_certificates_certificate_code ON certificates(certificate_code);
                        CREATE INDEX IF NOT EXISTS ix_certificates_user_id ON certificates(user_id);
                        CREATE INDEX IF NOT EXISTS ix_certificates_course_id ON certificates(course_id);

                        ALTER TABLE modules ADD COLUMN IF NOT EXISTS release_type VARCHAR(50) DEFAULT 'immediate';
                        ALTER TABLE modules ADD COLUMN IF NOT EXISTS release_days INTEGER DEFAULT 0;
                        ALTER TABLE modules ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE modules ADD COLUMN IF NOT EXISTS required_tier VARCHAR(50) NULL;
                        ALTER TABLE modules ADD COLUMN IF NOT EXISTS image_url VARCHAR;
                        ALTER TABLE modules ADD COLUMN IF NOT EXISTS agentflow_synced_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS release_type VARCHAR(50) DEFAULT 'immediate';
                        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS release_days INTEGER DEFAULT 0;
                        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_type VARCHAR DEFAULT 'url';
                        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS availability_status VARCHAR DEFAULT 'available';
                        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS passing_score_pct INTEGER DEFAULT 70;
                        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS import_identifier VARCHAR;
                        ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
                        ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS duration VARCHAR;
                        ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS transcript_text TEXT;
                        ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS transcribed_video_url VARCHAR;
                        ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS translations_json TEXT;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS playback_rate FLOAT DEFAULT 1.0;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS autoplay_enabled BOOLEAN DEFAULT TRUE NOT NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
                        ALTER TABLE invites ADD COLUMN IF NOT EXISTS allowed_course_ids VARCHAR;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_tutor_active BOOLEAN DEFAULT FALSE NOT NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_tutor_expires_at TIMESTAMP NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_tutor_custom_monthly_limit INTEGER NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0 NOT NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(150);
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS bio_link VARCHAR(255);

                        CREATE TABLE IF NOT EXISTS registration_verifications (
                            id SERIAL PRIMARY KEY,
                            email VARCHAR NOT NULL,
                            name VARCHAR NOT NULL,
                            hashed_password VARCHAR NOT NULL,
                            role VARCHAR NOT NULL,
                            invite_token VARCHAR NOT NULL,
                            code VARCHAR NOT NULL,
                            phone VARCHAR,
                            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                            is_used BOOLEAN DEFAULT FALSE,
                            attempts INTEGER DEFAULT 0 NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        CREATE INDEX IF NOT EXISTS ix_registration_verifications_email ON registration_verifications(email);
                        ALTER TABLE registration_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
                        ALTER TABLE registration_verifications ADD COLUMN IF NOT EXISTS phone VARCHAR;

                        -- Mídias, Redes Sociais, Matchmaking e Pin em introduction_posts
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) DEFAULT 'none';
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS media_url TEXT;
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS video_embed_url TEXT;
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS website VARCHAR(255);
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS niche VARCHAR(100);
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS location VARCHAR(100);
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS seeking TEXT;
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS offering TEXT;
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
                        ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS is_example BOOLEAN DEFAULT FALSE;
                        ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_example BOOLEAN DEFAULT FALSE;
                        ALTER TABLE introduction_likes ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20) DEFAULT 'like';

                        -- Tutoriais em Texto vs Vídeo
                        ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'video';
                        ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS text_content TEXT NULL;

                        -- DMs da Equipe monitoradas pelo Super Admin
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS dm_thread_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
                        CREATE INDEX IF NOT EXISTS ix_chat_messages_dm_thread_admin_id ON chat_messages (dm_thread_admin_id);
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS channel_type VARCHAR(30) DEFAULT 'general';
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS recipient_id INTEGER;
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_by_user_id INTEGER;
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS button_action_type VARCHAR(30) NULL;
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
                        CREATE INDEX IF NOT EXISTS ix_chat_messages_is_deleted ON chat_messages (is_deleted);
                        CREATE INDEX IF NOT EXISTS ix_chat_messages_deleted_by_user_id ON chat_messages (deleted_by_user_id);
                        ALTER TABLE funnels ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(50) DEFAULT 'chat_button';
                        ALTER TABLE funnels ADD COLUMN IF NOT EXISTS trigger_keywords VARCHAR(500);
                        ALTER TABLE funnels ADD COLUMN IF NOT EXISTS flow_data TEXT DEFAULT '{}';
                        ALTER TABLE funnels ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER;
                        ALTER TABLE tutorials ALTER COLUMN video_url DROP NOT NULL;
                        ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS video_key VARCHAR(512);

                        CREATE TABLE IF NOT EXISTS ai_tutor_settings (
                            id SERIAL PRIMARY KEY,
                            tutor_name VARCHAR(100) DEFAULT 'Tutor IA 24h' NOT NULL,
                            default_monthly_free_questions INTEGER NOT NULL DEFAULT 3,
                            system_prompt TEXT,
                            temperature FLOAT NOT NULL DEFAULT 0.3,
                            model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
                            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                            sales_checkout_url VARCHAR(500),
                            monthly_price_brl FLOAT NOT NULL DEFAULT 10.0,
                            rag_top_k INTEGER NOT NULL DEFAULT 4,
                            rag_min_similarity FLOAT NOT NULL DEFAULT 0.35,
                            access_mode VARCHAR(30) NOT NULL DEFAULT 'public',
                            maintenance_message TEXT NULL,
                            allowed_topics TEXT NULL,
                            prohibited_topics TEXT NULL,
                            redirect_app_url VARCHAR(500) NULL,
                            redirect_app_name VARCHAR(150) NULL,
                            prohibited_response_guideline TEXT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS tutor_name VARCHAR(100) DEFAULT 'Tutor IA 24h' NOT NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS rag_top_k INTEGER DEFAULT 4 NOT NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS rag_min_similarity FLOAT DEFAULT 0.35 NOT NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS access_mode VARCHAR(30) DEFAULT 'public' NOT NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS maintenance_message TEXT NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS allowed_topics TEXT NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS prohibited_topics TEXT NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS redirect_app_url VARCHAR(500) NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS redirect_app_name VARCHAR(150) NULL;
                        ALTER TABLE ai_tutor_settings ADD COLUMN IF NOT EXISTS prohibited_response_guideline TEXT NULL;

                        CREATE TABLE IF NOT EXISTS ai_tutor_messages (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL,
                            role VARCHAR(20) NOT NULL,
                            content TEXT NOT NULL,
                            prompt_tokens INTEGER DEFAULT 0,
                            completion_tokens INTEGER DEFAULT 0,
                            cost_brl FLOAT NOT NULL DEFAULT 0.0,
                            related_lessons_json TEXT NULL,
                            feedback_rating VARCHAR(10) NULL,
                            feedback_text TEXT NULL,
                            feedback_at TIMESTAMP NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                        ALTER TABLE ai_tutor_messages ADD COLUMN IF NOT EXISTS feedback_rating VARCHAR(10) NULL;
                        ALTER TABLE ai_tutor_messages ADD COLUMN IF NOT EXISTS feedback_text TEXT NULL;
                        ALTER TABLE ai_tutor_messages ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMP NULL;
                        CREATE INDEX IF NOT EXISTS ix_ai_tutor_messages_user_id ON ai_tutor_messages(user_id);
                        CREATE INDEX IF NOT EXISTS ix_ai_tutor_messages_course_id ON ai_tutor_messages(course_id);
                        CREATE INDEX IF NOT EXISTS ix_ai_tutor_messages_lesson_id ON ai_tutor_messages(lesson_id);

                        CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
                            id SERIAL PRIMARY KEY,
                            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                            module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                            lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                            chunk_index INTEGER NOT NULL DEFAULT 0,
                            chunk_type VARCHAR(30) NOT NULL DEFAULT 'transcript',
                            question_text TEXT NULL,
                            answer_text TEXT NULL,
                            content TEXT NOT NULL,
                            start_time_seconds INTEGER NULL,
                            end_time_seconds INTEGER NULL,
                            embedding_json TEXT NOT NULL,
                            token_count INTEGER NOT NULL DEFAULT 0,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        ALTER TABLE ai_knowledge_chunks ADD COLUMN IF NOT EXISTS chunk_type VARCHAR(30) DEFAULT 'transcript' NOT NULL;
                        ALTER TABLE ai_knowledge_chunks ADD COLUMN IF NOT EXISTS question_text TEXT NULL;
                        ALTER TABLE ai_knowledge_chunks ADD COLUMN IF NOT EXISTS answer_text TEXT NULL;
                        DO $$
                        BEGIN
                            BEGIN
                                CREATE EXTENSION IF NOT EXISTS vector;
                            EXCEPTION WHEN OTHERS THEN
                                NULL;
                            END;
                            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
                                ALTER TABLE ai_knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);
                                BEGIN
                                    CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_embedding_hnsw 
                                    ON ai_knowledge_chunks USING hnsw (embedding vector_cosine_ops);
                                EXCEPTION WHEN OTHERS THEN
                                    NULL;
                                END;
                            END IF;
                        END $$;
                        CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_course_id ON ai_knowledge_chunks(course_id);
                        CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_module_id ON ai_knowledge_chunks(module_id);
                        CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_lesson_id ON ai_knowledge_chunks(lesson_id);

                        CREATE TABLE IF NOT EXISTS ai_tutor_suggestions (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            course_id INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL,
                            lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL,
                            suggestion_text TEXT NOT NULL,
                            category VARCHAR(50) DEFAULT 'platform_improvement',
                            status VARCHAR(30) DEFAULT 'new',
                            admin_notes TEXT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );

                        CREATE TABLE IF NOT EXISTS community_posts (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            course_id INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL,
                            content TEXT NOT NULL,
                            media_urls JSONB NULL,
                            media_type VARCHAR(50) DEFAULT 'none' NOT NULL,
                            media_thumbnail_url TEXT NULL,
                            likes_count INTEGER DEFAULT 0 NOT NULL,
                            comments_count INTEGER DEFAULT 0 NOT NULL,
                            is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
                            is_example BOOLEAN DEFAULT FALSE NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS media_thumbnail_url TEXT;
                        CREATE INDEX IF NOT EXISTS ix_community_posts_user_id ON community_posts(user_id);
                        CREATE INDEX IF NOT EXISTS ix_community_posts_course_id ON community_posts(course_id);
                        CREATE INDEX IF NOT EXISTS ix_community_posts_created_at ON community_posts(created_at);

                        CREATE TABLE IF NOT EXISTS community_post_likes (
                            id SERIAL PRIMARY KEY,
                            post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_community_post_like UNIQUE (post_id, user_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_post_likes_post_id ON community_post_likes(post_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_likes_user_id ON community_post_likes(user_id);

                        CREATE TABLE IF NOT EXISTS community_post_comments (
                            id SERIAL PRIMARY KEY,
                            post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            parent_id INTEGER NULL REFERENCES community_post_comments(id) ON DELETE CASCADE,
                            content TEXT NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_post_comments_post_id ON community_post_comments(post_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_comments_user_id ON community_post_comments(user_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_comments_parent_id ON community_post_comments(parent_id);

                        CREATE TABLE IF NOT EXISTS community_post_bookmarks (
                            id SERIAL PRIMARY KEY,
                            post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_community_post_bookmark UNIQUE (post_id, user_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_post_bookmarks_post_id ON community_post_bookmarks(post_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_bookmarks_user_id ON community_post_bookmarks(user_id);

                        CREATE TABLE IF NOT EXISTS community_notifications (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                            notification_type VARCHAR(50) NOT NULL,
                            post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
                            comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE CASCADE,
                            title VARCHAR(255) NOT NULL,
                            message TEXT,
                            is_read BOOLEAN DEFAULT FALSE NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_notifications_user_id ON community_notifications(user_id);
                        CREATE INDEX IF NOT EXISTS ix_community_notifications_actor_id ON community_notifications(actor_id);
                        CREATE INDEX IF NOT EXISTS ix_community_notifications_post_id ON community_notifications(post_id);
                        CREATE INDEX IF NOT EXISTS ix_community_notifications_is_read ON community_notifications(is_read);
                        CREATE INDEX IF NOT EXISTS ix_community_notifications_type ON community_notifications(notification_type);

                        CREATE TABLE IF NOT EXISTS community_follows (
                            id SERIAL PRIMARY KEY,
                            follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_community_follow UNIQUE (follower_id, following_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_follows_follower_id ON community_follows(follower_id);
                        CREATE INDEX IF NOT EXISTS ix_community_follows_following_id ON community_follows(following_id);

                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 NOT NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER DEFAULT 0 NOT NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0 NOT NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'geral' NOT NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS location VARCHAR(100) NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE NOT NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS poll_question VARCHAR(255) NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS poll_options JSONB NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS achievement_type VARCHAR(50) NULL;
                        ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS achievement_data JSONB NULL;
                        CREATE INDEX IF NOT EXISTS ix_community_posts_category ON community_posts(category);
                        CREATE INDEX IF NOT EXISTS ix_community_posts_scheduled_at ON community_posts(scheduled_at);
                        CREATE INDEX IF NOT EXISTS ix_community_posts_is_scheduled ON community_posts(is_scheduled);

                        ALTER TABLE community_post_comments ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) DEFAULT 'text' NOT NULL;
                        ALTER TABLE community_post_comments ADD COLUMN IF NOT EXISTS media_url TEXT NULL;

                        CREATE TABLE IF NOT EXISTS community_post_poll_votes (
                            id SERIAL PRIMARY KEY,
                            post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            option_id INTEGER NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_community_post_poll_vote UNIQUE (post_id, user_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_post_poll_votes_post_id ON community_post_poll_votes(post_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_poll_votes_user_id ON community_post_poll_votes(user_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_poll_votes_option_id ON community_post_poll_votes(option_id);

                        CREATE TABLE IF NOT EXISTS community_post_reports (
                            id SERIAL PRIMARY KEY,
                            post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                            reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            reason VARCHAR(255) NOT NULL,
                            description TEXT NULL,
                            status VARCHAR(50) DEFAULT 'pending' NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_community_post_report UNIQUE (post_id, reporter_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_post_reports_post_id ON community_post_reports(post_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_reports_reporter_id ON community_post_reports(reporter_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_reports_status ON community_post_reports(status);

                        CREATE TABLE IF NOT EXISTS community_post_views (
                            id SERIAL PRIMARY KEY,
                            post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_community_post_view UNIQUE (post_id, user_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_post_views_post_id ON community_post_views(post_id);
                        CREATE INDEX IF NOT EXISTS ix_community_post_views_user_id ON community_post_views(user_id);

                        ALTER TABLE users ADD COLUMN IF NOT EXISTS community_strikes_count INTEGER DEFAULT 0 NOT NULL;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_community_banned BOOLEAN DEFAULT FALSE NOT NULL;

                        CREATE TABLE IF NOT EXISTS community_strikes (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                            post_id INTEGER REFERENCES community_posts(id) ON DELETE SET NULL,
                            comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE SET NULL,
                            reason VARCHAR(255) NOT NULL,
                            description TEXT NULL,
                            strike_number INTEGER DEFAULT 1 NOT NULL,
                            appeal_status VARCHAR(50) DEFAULT 'none' NOT NULL,
                            appeal_reason TEXT NULL,
                            appeal_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                            appeal_reviewed_at TIMESTAMP WITH TIME ZONE NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_strikes_user_id ON community_strikes(user_id);
                        CREATE INDEX IF NOT EXISTS ix_community_strikes_moderator_id ON community_strikes(moderator_id);
                        CREATE INDEX IF NOT EXISTS ix_community_strikes_appeal_status ON community_strikes(appeal_status);
                        CREATE INDEX IF NOT EXISTS ix_community_strikes_appeal_reviewed_by ON community_strikes(appeal_reviewed_by);

                        CREATE TABLE IF NOT EXISTS community_stories (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            media_url VARCHAR(500) NOT NULL,
                            media_type VARCHAR(20) DEFAULT 'image' NOT NULL,
                            media_thumbnail_url VARCHAR(500) NULL,
                            caption VARCHAR(500) NULL,
                            duration_seconds INTEGER DEFAULT 5 NOT NULL,
                            is_highlight BOOLEAN DEFAULT FALSE NOT NULL,
                            highlight_title VARCHAR(100) NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            expires_at TIMESTAMP WITH TIME ZONE NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_stories_user_id ON community_stories(user_id);
                        CREATE INDEX IF NOT EXISTS ix_community_stories_expires_at ON community_stories(expires_at);

                        CREATE TABLE IF NOT EXISTS community_story_views (
                            id SERIAL PRIMARY KEY,
                            story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_story_user_view UNIQUE (story_id, user_id)
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_story_views_story_id ON community_story_views(story_id);
                        CREATE INDEX IF NOT EXISTS ix_community_story_views_user_id ON community_story_views(user_id);

                        CREATE TABLE IF NOT EXISTS community_story_reactions (
                            id SERIAL PRIMARY KEY,
                            story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            reaction_type VARCHAR(30) NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_community_story_reactions_story_id ON community_story_reactions(story_id);
                        CREATE INDEX IF NOT EXISTS ix_community_story_reactions_user_id ON community_story_reactions(user_id);

                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_constraint c
                                JOIN pg_class t ON c.conrelid = t.oid
                                WHERE t.relname = 'chat_messages' AND c.contype = 'p'
                            ) THEN
                                ALTER TABLE chat_messages ADD PRIMARY KEY (id);
                            END IF;
                        END $$;

                        CREATE TABLE IF NOT EXISTS chat_message_reactions (
                            id SERIAL PRIMARY KEY,
                            message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
                            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            emoji VARCHAR(50) NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            CONSTRAINT uq_chat_message_reaction_user_emoji UNIQUE (message_id, user_id, emoji)
                        );
                        CREATE INDEX IF NOT EXISTS ix_chat_message_reactions_message_id ON chat_message_reactions(message_id);
                        CREATE INDEX IF NOT EXISTS ix_chat_message_reactions_user_id ON chat_message_reactions(user_id);

                        CREATE INDEX IF NOT EXISTS ix_api_tokens_user_id ON api_tokens(user_id);
                        CREATE INDEX IF NOT EXISTS ix_events_course_id ON events(course_id);
                        CREATE INDEX IF NOT EXISTS ix_chat_messages_pinned_by_user_id ON chat_messages(pinned_by_user_id);
                        CREATE INDEX IF NOT EXISTS ix_chat_broadcast_campaigns_filter_course_id ON chat_broadcast_campaigns(filter_course_id);
                        CREATE INDEX IF NOT EXISTS ix_chat_broadcast_campaigns_filter_tag_id ON chat_broadcast_campaigns(filter_tag_id);
                        CREATE INDEX IF NOT EXISTS ix_community_notifications_comment_id ON community_notifications(comment_id);
                        CREATE INDEX IF NOT EXISTS ix_lesson_transcriptions_generated_by_user_id ON lesson_transcriptions(generated_by_user_id);
                        CREATE INDEX IF NOT EXISTS ix_funnels_created_by_user_id ON funnels(created_by_user_id);

                    """))
                else:
                    for col_sql in [
                        "ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1",
                        "ALTER TABLE course_upsell_offers ADD COLUMN show_in_sidebar BOOLEAN DEFAULT 0",
                        "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0",
                        "ALTER TABLE users ADD COLUMN locked_until TIMESTAMP",
                        "ALTER TABLE users ADD COLUMN playback_rate FLOAT DEFAULT 1.0",
                        "ALTER TABLE users ADD COLUMN autoplay_enabled BOOLEAN DEFAULT 1",
                        "ALTER TABLE users ADD COLUMN ai_tutor_active BOOLEAN DEFAULT 0",
                        "ALTER TABLE users ADD COLUMN ai_tutor_expires_at TIMESTAMP NULL",
                        "ALTER TABLE users ADD COLUMN ai_tutor_custom_monthly_limit INTEGER NULL",
                        "ALTER TABLE users ADD COLUMN first_login_at TIMESTAMP NULL",
                        "ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL",
                        "ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP NULL",
                        "ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0",
                        "ALTER TABLE courses ADD COLUMN watermark_enabled BOOLEAN DEFAULT 1",
                        "ALTER TABLE courses ADD COLUMN release_type VARCHAR(50) DEFAULT 'immediate'",
                        "ALTER TABLE courses ADD COLUMN release_date TIMESTAMP NULL",
                        "ALTER TABLE courses ADD COLUMN channel_release_type VARCHAR(50) DEFAULT 'immediate'",
                        "ALTER TABLE courses ADD COLUMN channel_release_date TIMESTAMP NULL",
                        "ALTER TABLE courses ADD COLUMN locked_channels_json TEXT NULL",
                        "ALTER TABLE users ADD COLUMN phone VARCHAR",
                        "ALTER TABLE users ADD COLUMN birth_date DATE",
                        "ALTER TABLE users ADD COLUMN avatar_url VARCHAR",
                        "ALTER TABLE users ADD COLUMN bio VARCHAR(150)",
                        "ALTER TABLE users ADD COLUMN bio_link VARCHAR(255)",
                        "ALTER TABLE invites ADD COLUMN allowed_course_ids VARCHAR",
                        "ALTER TABLE registration_verifications ADD COLUMN attempts INTEGER DEFAULT 0",
                        "ALTER TABLE registration_verifications ADD COLUMN phone VARCHAR",
                        "ALTER TABLE lesson_videos ADD COLUMN order_index INTEGER DEFAULT 0",
                        "ALTER TABLE lesson_videos ADD COLUMN duration VARCHAR",
                        "ALTER TABLE lesson_videos ADD COLUMN transcript_text TEXT",
                        "ALTER TABLE lesson_videos ADD COLUMN transcribed_video_url VARCHAR",
                        "ALTER TABLE lesson_transcriptions ADD COLUMN translations_json TEXT",
                        "ALTER TABLE events ADD COLUMN course_ids_json TEXT NULL",
                        "ALTER TABLE introduction_posts ADD COLUMN media_type VARCHAR(50) DEFAULT 'none'",
                        "ALTER TABLE introduction_posts ADD COLUMN media_url TEXT",
                        "ALTER TABLE introduction_posts ADD COLUMN video_embed_url TEXT",
                        "ALTER TABLE introduction_posts ADD COLUMN instagram VARCHAR(100)",
                        "ALTER TABLE introduction_posts ADD COLUMN linkedin VARCHAR(255)",
                        "ALTER TABLE introduction_posts ADD COLUMN whatsapp VARCHAR(50)",
                        "ALTER TABLE introduction_posts ADD COLUMN website VARCHAR(255)",
                        "ALTER TABLE introduction_posts ADD COLUMN niche VARCHAR(100)",
                        "ALTER TABLE introduction_posts ADD COLUMN location VARCHAR(100)",
                        "ALTER TABLE introduction_posts ADD COLUMN seeking TEXT",
                        "ALTER TABLE introduction_posts ADD COLUMN offering TEXT",
                        "ALTER TABLE introduction_posts ADD COLUMN is_pinned BOOLEAN DEFAULT 0",
                        "ALTER TABLE introduction_posts ADD COLUMN is_example BOOLEAN DEFAULT 0",
                        "ALTER TABLE testimonials ADD COLUMN is_example BOOLEAN DEFAULT 0",
                        "ALTER TABLE introduction_likes ADD COLUMN reaction_type VARCHAR(20) DEFAULT 'like'",
                        "ALTER TABLE tutorials ADD COLUMN content_type VARCHAR(50) DEFAULT 'video'",
                        "ALTER TABLE tutorials ADD COLUMN text_content TEXT",
                        "ALTER TABLE tutorials ADD COLUMN video_key VARCHAR(512)",
                        "ALTER TABLE chat_messages ADD COLUMN dm_thread_admin_id INTEGER",
                        "ALTER TABLE chat_messages ADD COLUMN channel_type VARCHAR(30) DEFAULT 'general'",
                        "ALTER TABLE chat_messages ADD COLUMN recipient_id INTEGER",
                        "ALTER TABLE chat_messages ADD COLUMN pinned_at TIMESTAMP NULL",
                        "ALTER TABLE chat_messages ADD COLUMN pinned_by_user_id INTEGER",
                        "ALTER TABLE chat_messages ADD COLUMN read_at TIMESTAMP NULL",
                        "ALTER TABLE chat_messages ADD COLUMN button_action_type VARCHAR(30)",
                        "ALTER TABLE chat_messages ADD COLUMN is_deleted BOOLEAN DEFAULT 0",
                        "ALTER TABLE chat_messages ADD COLUMN deleted_at TIMESTAMP NULL",
                        "ALTER TABLE chat_messages ADD COLUMN deleted_by_user_id INTEGER",
                        "ALTER TABLE courses ADD COLUMN cover_image_url VARCHAR",
                        "ALTER TABLE courses ADD COLUMN bg_color VARCHAR DEFAULT '#090d16'",
                        "ALTER TABLE courses ADD COLUMN is_published BOOLEAN DEFAULT 1",
                        "ALTER TABLE courses ADD COLUMN sales_page_url VARCHAR",
                        "ALTER TABLE courses ADD COLUMN agentflow_kb_id INTEGER",
                        "ALTER TABLE courses ADD COLUMN agentflow_kb_name VARCHAR",
                        "ALTER TABLE modules ADD COLUMN image_url VARCHAR",
                        "ALTER TABLE modules ADD COLUMN agentflow_synced_at TIMESTAMP NULL",
                        "ALTER TABLE lessons ADD COLUMN video_type VARCHAR DEFAULT 'url'",
                        "ALTER TABLE lessons ADD COLUMN availability_status VARCHAR DEFAULT 'available'",
                        "ALTER TABLE lessons ADD COLUMN passing_score_pct INTEGER DEFAULT 70",
                        "ALTER TABLE lessons ADD COLUMN import_identifier VARCHAR",
                        "ALTER TABLE funnels ADD COLUMN trigger_type VARCHAR(50) DEFAULT 'chat_button'",
                        "ALTER TABLE funnels ADD COLUMN trigger_keywords VARCHAR(500)",
                        "ALTER TABLE funnels ADD COLUMN flow_data TEXT DEFAULT '{}'",
                        "ALTER TABLE funnels ADD COLUMN created_by_user_id INTEGER",
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
                    try:
                        conn.execute(text("ALTER TABLE courses ADD COLUMN bundle_title VARCHAR"))
                    except Exception:
                        pass
                    try:
                        conn.execute(text("ALTER TABLE courses ADD COLUMN cover_image_position INTEGER DEFAULT 50"))
                    except Exception:
                        pass
                    try:
                        conn.execute(text("CREATE TABLE IF NOT EXISTS funnel_folders (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(100) NOT NULL, color VARCHAR(30) DEFAULT '#6366f1', order_index INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"))
                        conn.execute(text("ALTER TABLE funnels ADD COLUMN folder_id INTEGER REFERENCES funnel_folders(id) ON DELETE SET NULL"))
                    except Exception:
                        pass
                    try:
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL, content TEXT NOT NULL, media_urls JSON NULL, media_type VARCHAR(50) DEFAULT 'none' NOT NULL, likes_count INTEGER DEFAULT 0 NOT NULL, comments_count INTEGER DEFAULT 0 NOT NULL, is_pinned BOOLEAN DEFAULT 0 NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_posts_user_id ON community_posts(user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_posts_course_id ON community_posts(course_id)"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_post_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_community_post_like UNIQUE (post_id, user_id))"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_likes_post_id ON community_post_likes(post_id)"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_post_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, parent_id INTEGER NULL REFERENCES community_post_comments(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_comments_post_id ON community_post_comments(post_id)"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_post_bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_community_post_bookmark UNIQUE (post_id, user_id))"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_bookmarks_post_id ON community_post_bookmarks(post_id)"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE, notification_type VARCHAR(50) NOT NULL, post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE, comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, message TEXT, is_read BOOLEAN DEFAULT 0 NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_notifications_user_id ON community_notifications(user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_notifications_is_read ON community_notifications(is_read)"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN media_thumbnail_url TEXT"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_follows (id INTEGER PRIMARY KEY AUTOINCREMENT, follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_community_follow UNIQUE (follower_id, following_id))"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_follows_follower_id ON community_follows(follower_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_follows_following_id ON community_follows(following_id)"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN views_count INTEGER DEFAULT 0 NOT NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN bookmarks_count INTEGER DEFAULT 0 NOT NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN shares_count INTEGER DEFAULT 0 NOT NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN category VARCHAR(50) DEFAULT 'geral' NOT NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN location VARCHAR(100) NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN scheduled_at TIMESTAMP NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN is_scheduled BOOLEAN DEFAULT 0 NOT NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN poll_question VARCHAR(255) NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN poll_options TEXT NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN achievement_type VARCHAR(50) NULL"))
                        conn.execute(text("ALTER TABLE community_posts ADD COLUMN achievement_data TEXT NULL"))
                        conn.execute(text("ALTER TABLE community_post_comments ADD COLUMN media_type VARCHAR(50) DEFAULT 'text' NOT NULL"))
                        conn.execute(text("ALTER TABLE community_post_comments ADD COLUMN media_url TEXT NULL"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_post_poll_votes (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, option_id INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_community_post_poll_vote UNIQUE (post_id, user_id))"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_post_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, reason VARCHAR(255) NOT NULL, description TEXT NULL, status VARCHAR(50) DEFAULT 'pending' NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_community_post_report UNIQUE (post_id, reporter_id))"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_post_views (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_community_post_view UNIQUE (post_id, user_id))"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_views_post_id ON community_post_views(post_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_views_user_id ON community_post_views(user_id)"))
                        conn.execute(text("ALTER TABLE users ADD COLUMN community_strikes_count INTEGER DEFAULT 0 NOT NULL"))
                        conn.execute(text("ALTER TABLE users ADD COLUMN is_community_banned BOOLEAN DEFAULT 0 NOT NULL"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_strikes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL, post_id INTEGER REFERENCES community_posts(id) ON DELETE SET NULL, comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE SET NULL, reason VARCHAR(255) NOT NULL, description TEXT NULL, strike_number INTEGER DEFAULT 1 NOT NULL, appeal_status VARCHAR(50) DEFAULT 'none' NOT NULL, appeal_reason TEXT NULL, appeal_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, appeal_reviewed_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_strikes_user_id ON community_strikes(user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_strikes_appeal_status ON community_strikes(appeal_status)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_strikes_appeal_reviewed_by ON community_strikes(appeal_reviewed_by)"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_stories (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, media_url TEXT NOT NULL, media_type VARCHAR(20) DEFAULT 'image' NOT NULL, media_thumbnail_url TEXT NULL, caption VARCHAR(500) NULL, duration_seconds INTEGER DEFAULT 5 NOT NULL, is_highlight BOOLEAN DEFAULT 0 NOT NULL, highlight_title VARCHAR(100) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, expires_at TIMESTAMP NOT NULL)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_stories_user_id ON community_stories(user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_stories_expires_at ON community_stories(expires_at)"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_story_views (id INTEGER PRIMARY KEY AUTOINCREMENT, story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_story_user_view UNIQUE (story_id, user_id))"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_views_story_id ON community_story_views(story_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_views_user_id ON community_story_views(user_id)"))
                        conn.execute(text("CREATE TABLE IF NOT EXISTS community_story_reactions (id INTEGER PRIMARY KEY AUTOINCREMENT, story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, reaction_type VARCHAR(30) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_reactions_story_id ON community_story_reactions(story_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_reactions_user_id ON community_story_reactions(user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_api_tokens_user_id ON api_tokens(user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_events_course_id ON events(course_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_messages_pinned_by_user_id ON chat_messages(pinned_by_user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_broadcast_campaigns_filter_course_id ON chat_broadcast_campaigns(filter_course_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_broadcast_campaigns_filter_tag_id ON chat_broadcast_campaigns(filter_tag_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_notifications_comment_id ON community_notifications(comment_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_transcriptions_generated_by_user_id ON lesson_transcriptions(generated_by_user_id)"))
                        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_funnels_created_by_user_id ON funnels(created_by_user_id)"))
                    except Exception:
                        pass
        logger.info("[MAIN] Auto-migrações preventivas concluídas com sucesso.")
    except Exception as e:
        logger.warning(f"[MAIN] Aviso nas auto-migrações preventivas: {e}")

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


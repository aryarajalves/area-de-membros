"""
Script de migração para criação das tabelas de Infraestrutura e Alertas de Webhook.
"""
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("[MIGRATE] Iniciando criação das tabelas de infraestrutura...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("""
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
                    CREATE INDEX IF NOT EXISTS ix_system_peak_metrics_metric_type ON system_peak_metrics(metric_type);

                    CREATE TABLE IF NOT EXISTS system_connection_histories (
                        id SERIAL PRIMARY KEY,
                        hour_period VARCHAR(50) NOT NULL,
                        peak_connections INTEGER DEFAULT 1 NOT NULL,
                        pool_capacity INTEGER DEFAULT 50 NOT NULL,
                        occupancy_pct DOUBLE PRECISION DEFAULT 2.0 NOT NULL,
                        status VARCHAR(50) DEFAULT 'Normal' NOT NULL,
                        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS ix_system_connection_histories_hour_period ON system_connection_histories(hour_period);
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS system_alert_configs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        pool_alert_enabled BOOLEAN DEFAULT 1 NOT NULL,
                        pool_alert_threshold INTEGER DEFAULT 75 NOT NULL,
                        ram_alert_enabled BOOLEAN DEFAULT 1 NOT NULL,
                        ram_alert_threshold INTEGER DEFAULT 80 NOT NULL,
                        cpu_alert_enabled BOOLEAN DEFAULT 1 NOT NULL,
                        cpu_alert_threshold INTEGER DEFAULT 85 NOT NULL,
                        cooldown_minutes INTEGER DEFAULT 15 NOT NULL,
                        webhook_url TEXT DEFAULT '' NOT NULL,
                        notify_normalized BOOLEAN DEFAULT 1 NOT NULL,
                        last_alert_sent_at TIMESTAMP,
                        last_normalized_sent_at TIMESTAMP,
                        is_currently_critical BOOLEAN DEFAULT 0 NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS system_peak_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        metric_type TEXT NOT NULL,
                        peak_value REAL NOT NULL,
                        peak_details TEXT,
                        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS system_connection_histories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        hour_period TEXT NOT NULL,
                        peak_connections INTEGER DEFAULT 1 NOT NULL,
                        pool_capacity INTEGER DEFAULT 50 NOT NULL,
                        occupancy_pct REAL DEFAULT 2.0 NOT NULL,
                        status TEXT DEFAULT 'Normal' NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );
                """))
    logger.info("[MIGRATE] Tabelas de infraestrutura criadas com sucesso.")

if __name__ == "__main__":
    run_migration()

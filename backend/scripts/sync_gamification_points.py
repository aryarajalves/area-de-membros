"""
Script para sincronizar retroativamente os pontos de gamificação
de todos os alunos que já concluíram aulas no sistema.
"""
import sys
import os

# Adiciona o diretório backend ao sys.path se necessário
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.services.gamification_service import sync_student_historical_points
from app.core.logger import logger

def run_sync():
    db = SessionLocal()
    try:
        print("Iniciando sincronização retroativa de pontos de gamificação...")
        total_synced = sync_student_historical_points(db)
        print(f"Sincronização concluída com sucesso! Total de registros adicionados: {total_synced}")
    except Exception as exc:
        print(f"Erro durante a sincronização: {exc}")
    finally:
        db.close()

if __name__ == "__main__":
    run_sync()

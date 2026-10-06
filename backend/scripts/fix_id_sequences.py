"""
Script de migração/correção para sincronizar os defaults de ID com suas respectivas sequences PostgreSQL.
"""
from app.core.database import SessionLocal, engine
from sqlalchemy import text
from app.core.logger import logger

def fix_id_sequences():
    with engine.connect() as conn:
        # Busca todas as tabelas públicas onde a coluna id não tem default
        query = text("""
            SELECT table_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND column_name = 'id'
              AND column_default IS NULL;
        """)
        tables = conn.execute(query).fetchall()
        
        for row in tables:
            table_name = row[0]
            seq_name = f"{table_name}_id_seq"
            
            # Checa se a sequence existe
            check_seq = text("""
                SELECT 1 FROM information_schema.sequences
                WHERE sequence_schema = 'public'
                  AND sequence_name = :seq_name;
            """)
            has_seq = conn.execute(check_seq, {"seq_name": seq_name}).scalar()
            
            if has_seq:
                logger.info(f"Corrigindo coluna id da tabela '{table_name}' com sequence '{seq_name}'...")
                conn.execute(text(f"""
                    ALTER TABLE {table_name} ALTER COLUMN id SET DEFAULT nextval('{seq_name}');
                """))
                conn.execute(text(f"""
                    SELECT setval('{seq_name}', COALESCE((SELECT MAX(id) FROM {table_name}), 1), true);
                """))
                conn.commit()
                print(f"Sucesso: {table_name}.id vinculado a {seq_name}")
            else:
                print(f"Aviso: sequence {seq_name} não encontrada para tabela {table_name}")

if __name__ == "__main__":
    fix_id_sequences()

---
trigger: always_on
---

# Regra de Inclusão Obrigatória no SQL de Auto-Migração Automática (Startup do Backend)

Toda vez que você criar **novas tabelas** ou **novas colunas** em qualquer modelo do banco de dados (`backend/app/models/*.py`), é **TERMINANTEMENTE OBRIGATÓRIO** incluí-las imediatamente no bloco **SQL de auto-migração automática** que roda na inicialização do servidor (`lifespan` dentro de `backend/app/main.py`).

**Protocolo Obrigatório (Sem Exceções):**

1. **Novas Tabelas (`CREATE TABLE IF NOT EXISTS`):**
   - Além de importar e registrar o modelo em `backend/app/models/__init__.py` (para o `Base.metadata.create_all`), você **DEVE** adicionar a instrução `CREATE TABLE IF NOT EXISTS <nome_da_tabela> (...)` e seus respectivos `CREATE INDEX IF NOT EXISTS` diretamente no bloco SQL de auto-migração do PostgreSQL (e SQLite, quando aplicável) dentro do `lifespan` de `backend/app/main.py`.

2. **Novas Colunas (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`):**
   - Toda nova coluna adicionada a uma tabela existente (`users`, `courses`, `modules`, `lessons`, `events`, `ai_tutor_settings`, etc.) **DEVE** ser adicionada imediatamente ao bloco `ALTER TABLE <tabela> ADD COLUMN IF NOT EXISTS <coluna> <tipo> <default>;` dentro do `lifespan` de `backend/app/main.py` (tanto na seção PostgreSQL quanto na lista de fallback SQLite).

3. **Proibição de Depender Apenas de Scripts Manuais:**
   - Criar o script em `backend/scripts/` continua obrigatório para rastreabilidade, mas **NUNCA** substitui a inclusão no SQL de auto-migração automática do `backend/app/main.py`.
   - Quando uma nova versão da imagem Docker (`backend-X.Y.Z`) sobe em produção, o container deve criar todas as tabelas e colunas novas sozinho no startup, sem jamais causar `psycopg2.errors.UndefinedColumn` ou `UndefinedTable`.

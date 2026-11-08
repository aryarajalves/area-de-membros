---
trigger: always_on
---

# Regra de Integridade de Esquema (Banco de Dados)

Toda vez que você realizar uma alteração nos modelos (`backend/app/models/`) que envolva a criação de novas tabelas ou colunas, você deve garantir que a mudança seja 100% automática no startup, rastreável e replicável.

**Protocolo Obrigatório:**
1. **Inclusão no SQL de Auto-Migração Automática (`backend/app/main.py`):** Toda nova tabela (`CREATE TABLE IF NOT EXISTS`) ou nova coluna (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) **DEVE obrigatoriamente** ser incluída no bloco SQL de auto-migração automática dentro da função `lifespan` do `backend/app/main.py` (PostgreSQL e SQLite), além de registrar o modelo em `backend/app/models/__init__.py`.
2. **Criação de Script de Migração:** Além do auto-migrate no `main.py`, crie um script Python na pasta `backend/scripts/` que execute o `CREATE TABLE` / `ALTER TABLE` correspondente.
3. **Atualização do Log:** Registre a alteração no arquivo `Arquivos/DATABASE_SCHEMA_LOG.md`, incluindo a data, a tabela afetada, as novas colunas e o nome do script de migração.
4. **Teste de Sincronia:** Execute a migração e reinicie o backend localmente para garantir que a sintaxe SQL no startup está 100% funcional para PostgreSQL e SQLite.
5. **Relatório Final:** Informe na sua resposta se houve alterações no banco de dados e confirme que foram incluídas no SQL de auto-migração automática do `main.py`.

Isso evita que o sistema apresente erros de `UndefinedColumn` ou `UndefinedTable` ao ser atualizado em produção via imagem Docker.

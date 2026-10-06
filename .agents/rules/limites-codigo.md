---
trigger: always_on
---

# Regra de Limites de Código (Clean Code)

Para garantir que o projeto permaneça manutenível e que o agente consiga processar os arquivos sem perder o contexto, estabelecemos limites rígidos de tamanho de arquivo.

**Limites Obrigatórios:**
1. **Backend (Python):** Nenhum arquivo deve ultrapassar **1.000 linhas**.
2. **Frontend (React/JSX e CSS):** Nenhum arquivo deve ultrapassar **500 linhas**.

**Protocolo Obrigatório de Refatoração:**
1. **Backup Prévio Obrigatório:** Toda vez que for realizar a refatoração de um arquivo, o agente DEVE obrigatoriamente criar uma cópia de segurança integral e intacta do arquivo antes de modificá-lo, armazenando em pasta dedicada de backup (`backups_refactor/`).
2. **Listagem dos Arquivos Restantes a Cada Entrega:** Toda vez que finalizar uma refatoração em um arquivo, o agente DEVE obrigatoriamente apresentar na resposta a lista atualizada de todos os arquivos que ainda faltam ser refatorados com suas respectivas quantidades de linhas.
3. **Ações ao atingir o limite:**
   - Se uma nova funcionalidade for fazer um arquivo ultrapassar esses limites (ou se o arquivo já estiver acima do limite), você **DEVE obrigatoriamente alertar o usuário e perguntar antes** se ele deseja realizar a modularização (quebra do arquivo) antes de prosseguir com a implementação.
   - Ao propor a modularização, priorize a extração de componentes (frontend) e serviços/utilitários (backend) para arquivos separados.
   - Aguarde a confirmação do usuário antes de realizar a quebra estrutural.

Isso evita a criação de "Arquivos Monolíticos", protege o código contra perdas através de backups preventivos e mantém o progresso das refatorações 100% transparente.



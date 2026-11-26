# 🚀 Roadmap de Escalabilidade: Área de Membros para 10.000+ Alunos

Este documento consolida o **diagnóstico técnico real** da arquitetura atual do projeto e organiza, **em ordem estrita de prioridade**, tudo o que precisa ser implementado para escalar a Área de Membros para **10.000+ alunos** sem gargalos, quedas ou travamentos em picos de acesso.

> [!NOTE]
> Este guia atualiza e substitui o diagnóstico antigo de [`Arquivos/PLANO_ESCALABILIDADE_50K_ALUNOS.md`](./PLANO_ESCALABILIDADE_50K_ALUNOS.md), refletindo o estado real do código-fonte e da stack de produção atuais (multi-worker, Redis Pub/Sub, B2/CDN, `pgvector` e Worker isolado).

---

## 🎯 Contexto Realista de Carga (10.000 Alunos)

Ter **10.000 alunos cadastrados** não significa ter 10.000 requisições por segundo. O perfil de tráfego esperado para esse porte é:
- **Uso diário normal:** ~100 a 400 alunos simultâneos navegando entre aulas, chat e comunidade.
- **Picos críticos (lançamentos, lives, disparos ou e-mails em massa):** **1.000 a 2.500 alunos simultâneos** entrando em janela curta (login + catálogo + vídeo + chat ao vivo).

### ✅ O que o projeto já tem de sólido hoje
- **Backend multi-worker e multi-réplica:** `WORKERS=4` no `Dockerfile` e `BACKEND_REPLICAS=3` no `docker/docker-compose-producao.yml` atrás do Traefik.
- **Redis na stack:** container `area_aulas_redis` (`redis:7-alpine`) já ativo para Pub/Sub de WebSockets e presença online (`redis_service.py`).
- **Storage em nuvem e camada de CDN:** upload direto via Presigned URLs para Backblaze B2 (`media_uploads.py`) e resolução de CDN (`cdn_service.py`).
- **Worker separado:** serviço `area_aulas_worker` (`backend/app/worker.py`) isolado para crons de renovação, backups e otimização de mídia.
- **Busca vetorial escalável e observabilidade inicial:** `pgvector` com índice HNSW no PostgreSQL para o Tutor IA e monitoramento de erros com Sentry.

---

## 📊 Tabela Resumo de Prioridades (P0 a P3)

| Prioridade | Item / Gargalo | Onde está no código | Risco em 10.000 alunos | Solução recomendada |
| :---: | :--- | :--- | :--- | :--- |
| **P0** | Connection Pooler (**PgBouncer**) + ajuste de pool | `docker/docker-compose-producao.yml`, `backend/app/core/config.py`, `database.py` | Até 1.040 conexões potenciais derrubando o PostgreSQL | Colocar PgBouncer (`transaction` mode) e reduzir pool por worker + `statement_timeout` |
| **P0** | Calibração **Argon2id** + semáforo no login | `backend/app/core/security.py` | ~35 logins simultâneos na mesma réplica estouram 2 GB de RAM (**OOM Kill**) | Ajustar `memory_cost=19456`, `time_cost=2`, `parallelism=1` + semáforo |
| **P0** | Consultas O(N) / `.all()` e N+1 críticos | `endpoints/chat.py`, `endpoints/students.py`, `services/presence_service.py` | `@todos`/menções carregam 10k users na RAM; listagem de alunos trava com N+1 | Buscar apenas mencionados; `@todos` via canal/job; queries em lote no admin |
| **P0** | Rate Limiting distribuído no Redis | `backend/app/core/limiter.py` | Limite em RAM fica 12× mais frouxo entre 12 workers HTTP | Configurar `storage_uri=settings.REDIS_URL` no `slowapi` |
| **P1** | Cache de aplicação no Redis | `endpoints/users.py`, `courses.py`, `services/presence_service.py` | Toda request bate no Postgres para validar JWT e ler catálogo/tema | Cachear `get_current_user`, cursos/módulos, whitelabel e batch de `last_seen_at` |
| **P1** | Fila de jobs persistente (ARQ / Celery) | `worker.py`, `chat_broadcast_service.py`, `funnel_service.py`, `webhook_service.py` | Broadcasts (2h46), funis e FFmpeg rodam na API e morrem em deploy | Migrar tarefas longas/assíncronas para fila Redis com retry |
| **P1** | Escalabilidade de WebSockets | `backend/app/services/chat_ws_manager.py`, `redis_service.py` | Broadcast sequencial trava com cliente lento; presença órfã dura 24h | Envio concorrente (`gather` + timeout), salas por canal e heartbeat curto |
| **P1** | Índices compostos no PostgreSQL | Modelos e scripts de banco | Full table scans em chat, feed, progresso e matrículas | Auditar e criar índices compostos nos filtros/ordenações principais |
| **P2** | Backend 100% Stateless (sem disco local) | `docker/docker-compose-producao.yml` (`area_de_membros_uploads`) | Impede escalar para múltiplos servidores (worker nodes) no Swarm | 100% uploads diretos para B2/S3 + CDN (e HLS para aulas) |
| **P2** | Deploy Zero-Downtime e Alembic | `docker/docker-compose-producao.yml`, `backend/app/main.py` | Queda breve no deploy e contenção de DDL entre 12 workers no boot | `healthcheck`, `order: start-first` e migrações via Alembic antes do deploy |
| **P2** | Otimização de Borda (Nginx + Cloudflare) | `frontend/nginx.conf`, `docker/docker-compose-producao.yml` | Tráfego sem compressão explícita e frontend com réplica única | Ativar `gzip`/Brotli no Nginx, 2+ réplicas frontend e Cloudflare WAF/CDN |
| **P3** | Observabilidade de banco e métricas | PostgreSQL, API e Worker | Ponto cego para queries lentas e saturação de pool/RAM | `pg_stat_statements`, Prometheus + Grafana e logs JSON estruturados |
| **P3** | Testes de carga antes de lançamentos | — | Descobrir gargalos apenas com aluno reclamando em produção | Scripts **k6** ou **Locust** simulando 1k–2k usuários simultâneos |
| **P3** | Retenção e limpeza de tabelas de log | `webhook_logs`, `community_notifications`, `system_*`, `ai_tutor_messages` | Crescimento indefinido degradando índices e backups | Jobs periódicos de expurgo/arquivamento no worker |

---

## 🔴 P0 — Crítico (Evita Quedas, Travamentos e OOM Kill em Picos)

Estes 4 pontos devem ser resolvidos **primeiro**. Em um pico de lançamento com 1.000+ alunos, qualquer um deles sozinho pode derrubar o sistema.

### P0.1. PgBouncer (Connection Pooler) + Ajuste do Pool SQLAlchemy
- **Diagnóstico atual:** No `docker/docker-compose-producao.yml` e em `backend/app/core/config.py`, a stack sobe `BACKEND_REPLICAS=3` × `WORKERS=4` (12 processos Uvicorn) + `1` processo Worker = **13 processos Python**. Cada processo configura `DB_POOL_SIZE=30` e `DB_MAX_OVERFLOW=50` (até 80 conexões por processo).
- **O problema:** `13 × 80 = 1.040 conexões potenciais` diretas no PostgreSQL, cujo `max_connections` padrão é 100 (e mesmo tunado costuma operar entre 200 e 300). Cada conexão ativa no Postgres consome RAM e troca de contexto de CPU.
- **O que fazer:**
  1. Subir um serviço **PgBouncer** em modo `transaction` (`pool_mode = transaction`) na frente do PostgreSQL.
  2. Reduzir o pool por processo Python para valores enxutos (ex.: `DB_POOL_SIZE=5` e `DB_MAX_OVERFLOW=5`), deixando o PgBouncer multiplexar centenas de requisições em 25–50 conexões reais com o PostgreSQL.
  3. Definir um `statement_timeout` padrão nas sessões de leitura/API (ex.: `10s`–`15s`) para que nenhuma query travada prenda conexões do pool.

### P0.2. Calibração do Argon2id + Semáforo de Concorrência no Login
- **Diagnóstico atual:** Em `backend/app/core/security.py`, o `PasswordHasher` está configurado com `memory_cost=65536` (**64 MB de RAM por verificação de senha**), `time_cost=3` e `parallelism=4`. Cada réplica do backend tem limite de `2048M` de RAM no `docker-compose-producao.yml`.
- **O problema:** Se ~35 alunos clicarem em "Entrar" no mesmo segundo dentro de uma réplica (cenário comum após envio de e-mail ou link em live), só o cálculo de senha consome mais de **2,2 GB de RAM**, provocando **OOM Kill** imediato do container.
- **O que fazer:**
  1. Recalibrar o `PasswordHasher` para o padrão atual recomendado pela OWASP: `memory_cost=19456` (~19 MiB), `time_cost=2` e `parallelism=1` (mantendo a compatibilidade na verificação para hashes legados e re-hash progressivo no login).
  2. Adicionar um semáforo (`asyncio.Semaphore` ou pool limitado) no fluxo de login para limitar quantas verificações Argon2id executam simultaneamente por worker, evitando picos abruptos de memória.

### P0.3. Eliminar Consultas `O(N)` / `.all()` Full-Table e N+1 Críticos
- **Menções e `@todos` no Chat (`backend/app/api/v1/endpoints/chat.py`, ~L380–L401):**
  - *Problema:* Toda mensagem contendo `@` executa `db.query(User).filter(User.is_active == True, User.id != current_user.id).all()` — trazendo **todos os 10.000 usuários para a memória** por mensagem. Quando um admin usa `@todos`, o endpoint tenta inserir 10.000 linhas em `ChatMessageMention` e disparar 10.000 eventos WebSocket na mesma requisição HTTP.
  - *Solução:* Extrair os `@nomes` mencionados via regex e consultar no banco apenas os candidatos correspondentes (com `LIMIT` e índice case-insensitive/prefixo). Para `@todos`, usar evento leve de canal/broadcast ou delegar a criação de notificações em lote para fila em background.
- **Listagem de Alunos no Admin (`backend/app/api/v1/endpoints/students.py`, ~L100–L120):**
  - *Problema:* `_build_students_details` itera `for student in students` e dentro do loop consulta `UserCourse`, depois itera `for uc in user_courses` consultando `Course` e `Lesson` — um padrão **N+1 clássico** que multiplica dezenas de queries por página.
  - *Solução:* Pré-carregar cursos, matrículas (`UserCourse`), contagem total de aulas por curso e aulas concluídas por aluno em queries agregadas com `IN (...)` e `GROUP BY`.
- **Resumo de Usuários Online (`backend/app/services/presence_service.py`, ~L53–L58):**
  - *Problema:* `get_online_summary(db)` faz `User.id.in_(online_ids)` no PostgreSQL passando todos os IDs online (centenas ou milhares na cláusula `IN`).
  - *Solução:* Usar diretamente os mapas e contadores mantidos no Redis (com limpeza automática por TTL/heartbeat), evitando consultar a tabela `users` no banco a cada checagem de presença.

### P0.4. Rate Limiting Distribuído no Redis
- **Diagnóstico atual:** Em `backend/app/core/limiter.py`, o `slowapi.Limiter` é instanciado sem `storage_uri`, armazenando os contadores na memória RAM local de cada processo.
- **O problema:** Com `3 réplicas × 4 workers = 12 processos`, qualquer limite configurado (ex.: login, recuperação de senha, registro) fica **12× mais frouxo** e não protege de forma consistente contra ataques de força bruta ou abuso de API.
- **O que fazer:** Configurar `storage_uri=settings.REDIS_URL` no `Limiter` quando `REDIS_URL` estiver definido, mantendo fallback seguro em memória apenas para ambientes locais sem Redis.

---

## 🟠 P1 — Alta Prioridade (Performance Real e Resiliência Operacional)

Com o P0 resolvido, o sistema para de cair em picos. O bloco P1 reduz drasticamente a carga no PostgreSQL e garante que tarefas longas não se percam nem travem a API.

### P1.1. Cache de Aplicação no Redis (Aproveitar o Redis que já existe)
Hoje o Redis já roda em produção, mas atende apenas WebSocket Pub/Sub e presença. Os maiores ganhos imediatos estão em:
1. **Cache do `get_current_user` (`backend/app/api/v1/endpoints/users.py`):**
   - *Problema:* Toda única requisição autenticada executa `SELECT * FROM users WHERE id = ...` no PostgreSQL para checar `is_active` e `token_version`.
   - *Solução:* Cachear um snapshot leve do usuário (`id`, `role`, `is_active`, `token_version`, `ai_tutor_active`, etc.) no Redis com TTL curto (ex.: 2–5 min) e invalidar imediatamente no logout, bloqueio de conta, edição de perfil/role ou troca de senha.
2. **Cache de leituras quentes e repetitivas:**
   - Catálogo de cursos (`GET /api/v1/courses`), árvore de módulos/aulas, configurações de Whitelabel, ranking de gamificação e primeira página do feed da comunidade.
   - Sempre implementar **invalidação ativa (*cache busting*)** nas rotas administrativas de criação, edição e exclusão.
3. **Corrigir pool síncrono e `last_seen_at` em `backend/app/services/presence_service.py`:**
   - *Problema:* `get_online_user_ids()` e `get_online_summary()` abrem e fecham uma nova conexão TCP com o Redis (`redis.from_url(...)` + `r.close()`) em toda chamada; além disso, `mark_user_activity()` executa `UPDATE users SET last_seen_at = ...` direto no Postgres.
   - *Solução:* Manter um `ConnectionPool` síncrono compartilhado do Redis e registrar `last_seen_at` em buffer no Redis (ex.: `HSET`), persistindo em lote (`bulk update`) no PostgreSQL a cada poucos minutos via worker.

### P1.2. Fila de Jobs Persistente (ARQ ou Celery sobre Redis)
- **Diagnóstico atual:** O serviço `worker.py` hoje executa apenas crons fixos com `APScheduler` (renovações, backup e otimização de mídia). Enquanto isso, fluxos longos e pesados rodam dentro do processo web da API:
  - **Broadcast de Chat (`chat_broadcast.py` e `chat_broadcast_service.py`):** usa `BackgroundTasks` do FastAPI com intervalo de 1s por envio. Para 10.000 alunos, a tarefa fica **2h46min presa na memória de um worker HTTP**, carregando os destinatários via `.all()`. Se houver restart ou deploy, é interrompida no meio.
  - **Funis de Mensagens (`funnel_service.py`):** usam `loop.create_task` + `await asyncio.sleep(...)` em memória — qualquer reinício de container apaga os funis em execução.
  - **Webhooks de Saída (`webhook_service.py`):** usam `httpx.Client` síncrono sem fila com *retry* exponencial e *Dead Letter Queue* (DLQ).
  - **Transcrição / FFmpeg (`ai_transcription_service.py`):** processamentos pesados de áudio/vídeo competem por CPU e RAM com os alunos conectados.
  - **Importação em massa de CSV/XLSX (`students.py`):** planilhas com milhares de alunos correm risco de timeout HTTP.
- **O que fazer:** Adotar **ARQ** (leve, nativo `asyncio`, integrado ao Redis já existente) ou **Celery** para mover todos esses fluxos para workers dedicados, com processamento em lotes/paginado, retentativa automática e persistência em caso de deploy.

### P1.3. Escalabilidade dos WebSockets (`backend/app/services/chat_ws_manager.py`)
- **Diagnóstico atual:**
  - `_local_broadcast` envia mensagens em loop sequencial (`for ws in sockets: await ws.send_text(...)`) para **todos** os usuários conectados naquele worker, sem filtrar por curso ou canal. Um único aluno com conexão travada atrasa a entrega para todos os demais.
  - No `redis_service.py`, o conjunto de conexões do usuário expira apenas em 24h (`expire 86400`). Se uma réplica cair abruptamente sem executar `disconnect()`, aqueles usuários ficam presos como "online" por até um dia.
- **O que fazer:**
  1. Substituir o loop sequencial por envio concorrente em lotes (`asyncio.gather(..., return_exceptions=True)` com `asyncio.wait_for` curto), desconectando sockets mortos/lentos automaticamente.
  2. Segmentar assinaturas por sala/curso/canal para evitar enviar eventos de um curso para alunos que não estão naquela sala.
  3. Trocar o controle de presença por **heartbeat** (ping a cada 20–30s com TTL de 60–90s no Redis).

### P1.4. Índices Compostos no PostgreSQL
Garantir que o banco possua índices compostos alinhados aos filtros e ordenações reais das telas mais acessadas por 10.000 alunos:
- `user_courses (user_id, course_id, expires_at)`
- `lesson_progress (user_id, lesson_id)` e `(course_id, user_id)`
- `chat_messages (channel_type, course_id, is_deleted, created_at DESC)`
- `chat_messages (channel_type, recipient_id, user_id, created_at DESC)` (DMs)
- `community_posts (is_scheduled, is_pinned, created_at DESC)`
- `gamification_points (user_id, created_at)`

---

## 🟡 P2 — Média Prioridade (Infraestrutura Multi-Nó, Zero-Downtime e Borda)

Estes pontos garantem escalabilidade horizontal entre múltiplos servidores e atualizações sem derrubar alunos no meio da aula.

### P2.1. Backend 100% Stateless (Fim da Dependência de Disco Local)
- **Diagnóstico atual:** No `docker/docker-compose-producao.yml`, o backend monta o volume local `area_de_membros_uploads:/app/app/uploads` e todos os serviços estão presos a `placement: constraints: [node.role == manager]`.
- **O problema:** Enquanto qualquer upload (avatar, anexo, áudio do chat, story, vídeo ou imagem) puder cair no disco local da VPS, você **não consegue adicionar um segundo servidor (worker node)** ao cluster Swarm sem que arquivos fiquem inacessíveis entre réplicas.
- **O que fazer:**
  1. Garantir que **100% dos arquivos de mídia e uploads** vão direto para **Backblaze B2 / S3** com entrega via **Cloudflare CDN** (aproveitando a *Bandwidth Alliance* entre B2 e Cloudflare).
  2. Para vídeos de aulas com alto consumo simultâneo, priorizar streaming adaptativo **HLS** (Bunny Stream ou Panda Video) em vez de MP4 direto, economizando banda dos alunos no 4G e reduzindo buffering.
  3. Remover a trava de volume local de uploads do backend para permitir escalar réplicas em múltiplos nós.

### P2.2. Deploy Zero-Downtime, Healthchecks e Migrações Fora do Boot
- **Diagnóstico atual:** O `docker/docker-compose-producao.yml` não define `healthcheck` nem `update_config` para os serviços. Além disso, o `lifespan` de `backend/app/main.py` roda DDL/auto-migrações no startup quando todas as réplicas × workers sobem simultaneamente.
- **O que fazer:**
  1. Configurar `healthcheck` real (validando API + Postgres/PgBouncer + Redis) e `update_config` no Swarm com `order: start-first`, `parallelism: 1`, `delay: 10s` e `failure_action: rollback`.
  2. Evoluir as migrações de esquema para **Alembic** versionado rodando em etapa única pré-deploy (mantendo o `lifespan` apenas para validações rápidas), evitando contenção de locks no boot de 12+ workers.

### P2.3. Otimização de Borda (Nginx + Cloudflare)
- **Compressão:** Ativar `gzip on;` (e idealmente Brotli) explicitamente no `frontend/nginx.conf` para reduzir drasticamente o tamanho de respostas JSON da API e bundles JS/CSS.
- **Alta disponibilidade do Frontend:** Aumentar `area_aulas_frontend` de `replicas: 1` para `2+` réplicas.
- **Cloudflare na frente:** Ativar proxy/CDN com WAF, proteção anti-DDoS e regras de cache para assets imutáveis e mídias públicas.

---

## 🟢 P3 — Governança de Escala (Observabilidade e Validação Real)

### P3.1. Observabilidade Completa de Banco e Aplicação
- **PostgreSQL:** Habilitar `pg_stat_statements` para enxergar exatamente as 10 queries mais lentas e com maior consumo de tempo/IO em produção.
- **Métricas de Infraestrutura e Rotas:** Expor `/metrics` no FastAPI (`prometheus-fastapi-instrumentator`) conectado a **Prometheus + Grafana** (com Node Exporter e cAdvisor) + alertas automáticos (Telegram/WhatsApp) para RAM > 85%, erro 5xx > 1% e fila acumulada, complementando o Sentry.
- **Logs estruturados:** Padronizar logs em JSON com `request_id` e `user_id` para correlação rápida em incidentes.

### P3.2. Testes de Carga Antes de Cada Grande Lançamento
Executar rotinas automatizadas com **k6** ou **Locust** em ambiente de staging/homologação simulando:
1. **Tempestade de login:** 200+ logins por minuto validando Argon2id, PgBouncer e Rate Limiter.
2. **Navegação massiva:** 1.000 a 2.000 usuários simultâneos abrindo catálogo, aulas e marcando progresso.
3. **Interação em tempo real:** Rajadas simultâneas no chat WebSocket e carregamento do feed da comunidade.
4. **Eventos de backend:** Entrada simultânea de webhooks de compra + execução de broadcast.

### P3.3. Política de Retenção e Arquivamento de Dados
Criar rotinas periódicas no worker para limpar ou arquivar registros antigos de tabelas que crescem continuamente com o uso:
- `webhook_logs` (manter últimos 30–90 dias)
- `community_notifications` (expurgar notificações lidas antigas)
- `system_connection_histories` e `system_peak_metrics`
- `ai_tutor_messages` (política de retenção/resumo caso cresça em dezenas de milhões de linhas)

---

## 🚫 O Que NÃO Fazer Agora (Evitar Over-Engineering)

Para **10.000 alunos**, algumas soluções adicionam complexidade enorme sem retorno proporcional nesta fase:
- **Não migrar para Kubernetes:** Docker Swarm bem configurado com PgBouncer, Redis e Cloudflare entrega o mesmo resultado com uma fração do custo operacional.
- **Não quebrar em microsserviços:** Um monólito modular bem estruturado + workers assíncronos dedicados é muito mais rápido para evoluir e depurar.
- **Não montar Sharding ou cluster Multi-Master de PostgreSQL:** Um único PostgreSQL bem dimensionado em SSD NVMe + PgBouncer + bons índices + cache no Redis suporta com folga de 50.000 a 100.000 alunos.

---

## ✅ Checklist Executivo por Ordem de Prioridade

### Fase 1 — Crítico (P0)
- [ ] Adicionar **PgBouncer** (`pool_mode = transaction`) na frente do PostgreSQL e reduzir `DB_POOL_SIZE`/`DB_MAX_OVERFLOW` por processo.
- [ ] Recalibrar **Argon2id** (`memory_cost=19456`, `time_cost=2`, `parallelism=1`) e adicionar semáforo de concorrência no login.
- [ ] Corrigir menções/`@todos` em `chat.py`, eliminar N+1 de `_build_students_details` em `students.py` e remover consulta em lote `User.id.in_` do `presence_service.py`.
- [ ] Apontar o `slowapi.Limiter` (`limiter.py`) para o **Redis** (`storage_uri=settings.REDIS_URL`).

### Fase 2 — Alta Prioridade (P1)
- [ ] Implementar cache no Redis para `get_current_user`, catálogo de cursos/módulos/aulas e Whitelabel (com invalidação ativa).
- [ ] Reutilizar pool síncrono do Redis no `presence_service.py` e gravar `last_seen_at` em lote no PostgreSQL.
- [ ] Adotar fila persistente (**ARQ** ou **Celery** com Redis) para Broadcasts, Funis, Webhooks de saída, importação de alunos e FFmpeg/Transcrições.
- [ ] Otimizar `chat_ws_manager.py` (envio concorrente com timeout, salas por canal e presença por heartbeat).
- [ ] Auditar e aplicar índices compostos nas tabelas de cursos, progresso, chat, feed e gamificação.

### Fase 3 — Média Prioridade (P2)
- [ ] Garantir 100% dos uploads no Backblaze B2/S3 + CDN (removendo dependência de disco local no Swarm) e adotar HLS para aulas de alto tráfego.
- [ ] Configurar `healthcheck` e `update_config` (`order: start-first`) no `docker-compose-producao.yml` e migrar DDL para Alembic pré-deploy.
- [ ] Habilitar `gzip`/Brotli no `frontend/nginx.conf`, aumentar réplicas do frontend e colocar Cloudflare na frente.

### Fase 4 — Governança & Escala Contínua (P3)
- [ ] Habilitar `pg_stat_statements` no PostgreSQL e integrar Prometheus + Grafana com alertas proativos.
- [ ] Criar e rodar suíte de teste de carga (**k6** ou **Locust**) simulando 1.000–2.000 usuários simultâneos.
- [ ] Configurar jobs de retenção/limpeza de logs e notificações antigas no worker.

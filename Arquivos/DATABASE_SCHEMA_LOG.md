# Log de Integridade e Histórico de Esquema do Banco de Dados

Registro de migrações e atualizações estruturais do banco de dados (PostgreSQL/SQLite) do **Projeto Base**.

### [11/11/2026] - Otimização de Banco de Dados: Indexação de 100% das Chaves Estrangeiras (Foreign Keys)
- **Objetivo:** Auditar todas as 111 ForeignKeys de todos os modelos SQLAlchemy e garantir que 100% delas possuam índices explícitos criados no banco, eliminando risco de Full Table Scans durante JOINs e exclusões em cascata.
- **Novos Índices Criados (PostgreSQL e SQLite):**
  - `idx_api_tokens_user_id`: coluna `user_id` na tabela `api_tokens`
  - `idx_events_course_id`: coluna `course_id` na tabela `events`
  - `idx_chat_messages_pinned_by`: coluna `pinned_by_user_id` na tabela `chat_messages`
  - `idx_chat_broadcasts_filter_course`: coluna `filter_course_id` na tabela `chat_broadcasts`
  - `idx_chat_broadcasts_filter_tag`: coluna `filter_tag_id` na tabela `chat_broadcasts`
  - `idx_community_feed_comments_comment_id`: coluna `comment_id` na tabela `community_feed_comments`
  - `idx_courses_generated_by_user_id`: coluna `generated_by_user_id` na tabela `courses`
  - `idx_funnels_created_by_user_id`: coluna `created_by_user_id` na tabela `funnels`
- **Validador Automático Integrado:** `scripts/check_db_optimization.py` (Pool de Conexões, 100% FKs indexadas, detecção de vazamento de sessões e carregamento antecipado N+1 com joinedload/selectinload).
- **Auto-migração no Startup:** Comandos `CREATE INDEX IF NOT EXISTS` adicionados no `lifespan` de `backend/app/main.py`.

---

### [11/11/2026] - Esteira Automatizada: Validação de 100% das Tabelas e Sincronização de Colunas Incrementais
- **Objetivo:** Criar validador automático (`scripts/check_db_schema.py`) que inspeciona todos os modelos SQLAlchemy e garante que 100% das tabelas e colunas incrementais estejam presentes no bloco de auto-migração de `backend/app/main.py`.
- **Tabelas e Colunas Sincronizadas no Startup:**
  - `courses`: `cover_image_url`, `bg_color`, `is_published`, `sales_page_url`, `agentflow_kb_id`, `agentflow_kb_name`
  - `modules`: `image_url`, `agentflow_synced_at`
  - `lessons`: `video_type`, `availability_status`, `passing_score_pct`, `import_identifier`
  - `chat_messages`: `channel_type`, `recipient_id`, `pinned_at`, `pinned_by_user_id`, `read_at`, `button_action_type`
  - `funnels`: `trigger_type`, `trigger_keywords`, `flow_data`, `created_by_user_id`
  - `tutorials`: `video_key`
  - `community_stories`, `community_story_views`, `community_story_reactions`
- **Script de Validação:** `scripts/check_db_schema.py`
- **Auto-migração no Startup:** 100% das colunas e tabelas sincronizadas na rotina `lifespan` de `backend/app/main.py` (PostgreSQL e SQLite).

---

### [10/11/2026] - Feed Social Etapa 3: Insights e Visualizações dos Posts (Tabela community_post_views e coluna views_count)
- **Objetivo:** Rastrear visualizações/alcance de cada publicação e exibir métricas detalhadas de insights (visualizações, curtidas, comentários, salvamentos e taxa de engajamento).
- **Tabela e Colunas Afetadas:**
  - `community_posts`:
    - `views_count`: INTEGER DEFAULT 0 NOT NULL (contador de visualizações)
  - `community_post_views`:
    - `id`: SERIAL PRIMARY KEY
    - `post_id`: INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - Constraint de unicidade: `uq_community_post_view (post_id, user_id)`
    - Índices: `ix_community_post_views_post_id`, `ix_community_post_views_user_id`
- **Script de Migração:** backend/scripts/migrate_community_post_views.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Feed Social Etapa 2: Sistema de Seguir / Deixar de Seguir (Tabela community_follows)
- **Objetivo:** Permitir que alunos e administradores sigam e sejam seguidos por outros membros da comunidade, exibindo contagem de seguidores/seguindo, listas de membros e filtro exclusivo de feed "👥 Seguindo".
- **Tabela Criada:**
  - `community_follows`:
    - `id`: SERIAL PRIMARY KEY
    - `follower_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE (quem segue)
    - `following_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE (quem é seguido)
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - Constraint de unicidade: `uq_community_follow (follower_id, following_id)`
    - Índices: `ix_community_follows_follower_id`, `ix_community_follows_following_id`
- **Script de Migração:** backend/scripts/migrate_community_follows.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Feed Social: Perfil de Membro com Bio e Link (bio e bio_link na tabela users)
- **Objetivo:** Adicionar suporte a biografia personalizada estilo Instagram (máx 150 caracteres) e link externo clicável na bio do usuário para networking no Feed da Comunidade.
- **Tabela Afetada:**
  - `users`:
    - `bio`: VARCHAR(150) NULL (Biografia do usuário, até 150 caracteres)
    - `bio_link`: VARCHAR(255) NULL (Link/URL externo na bio)
- **Script de Migração:** backend/scripts/add_user_bio_and_link.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Feed Social: Imagem de Capa / Thumbnail para Vídeos (media_thumbnail_url na tabela community_posts)
- **Objetivo:** Permitir ao autor de uma publicação com vídeo curto definir uma imagem de capa personalizada (thumbnail/pôster) exibida antes do play.
- **Tabela Afetada:**
  - `community_posts`:
    - `media_thumbnail_url`: TEXT NULL (URL da imagem de capa/thumbnail do vídeo)
- **Script de Migração:** backend/scripts/add_post_media_thumbnail.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Feed Social Etapa 4: Notificações Sociais do Feed (Tabela community_notifications)
- **Objetivo:** Notificar alunos e administradores em tempo real quando suas publicações receberem curtidas, comentários ou menções diretas com `@aluno` no Feed Social.
- **Tabela Criada:**
  - `community_notifications`:
    - `id`: SERIAL PRIMARY KEY
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE (destinatário)
    - `actor_id`: INTEGER NULL REFERENCES users(id) ON DELETE CASCADE (autor da ação)
    - `notification_type`: VARCHAR(50) NOT NULL ('feed_like', 'feed_comment', 'feed_mention')
    - `post_id`: INTEGER NULL REFERENCES community_posts(id) ON DELETE CASCADE
    - `comment_id`: INTEGER NULL REFERENCES community_post_comments(id) ON DELETE CASCADE
    - `title`: VARCHAR(255) NOT NULL
    - `message`: TEXT NULL
    - `is_read`: BOOLEAN DEFAULT FALSE NOT NULL
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - Índices: `ix_community_notifications_user_id`, `ix_community_notifications_actor_id`, `ix_community_notifications_post_id`, `ix_community_notifications_is_read`, `ix_community_notifications_type`
- **Script de Migração:** backend/scripts/migrate_community_notifications.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Feed Social Etapa 3: Salvar Posts nos Favoritos (Tabela community_post_bookmarks)
- **Objetivo:** Permitir que alunos e administradores salvem publicações nos seus posts favoritos (bookmarks) para consulta posterior com filtro dedicado.
- **Tabela Criada:**
  - `community_post_bookmarks`:
    - `id`: SERIAL PRIMARY KEY
    - `post_id`: INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - Constraint: `uq_community_post_bookmark` UNIQUE (post_id, user_id)
    - Índices: `ix_community_post_bookmarks_post_id`, `ix_community_post_bookmarks_user_id`
- **Script de Migração:** backend/scripts/migrate_community_bookmarks.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Escalabilidade Fase 3: Ativação de pgvector e Busca Vetorial Indexada no Tutor IA
- **Objetivo:** Ativação nativa da extensão `vector` no PostgreSQL e adição da coluna `embedding vector(1536)` na tabela `ai_knowledge_chunks` com índice HNSW (`vector_cosine_ops`), substituindo o cálculo de similaridade de cosseno in-memory no Python por queries SQL com ordenação vetorial nativa e instantânea no banco.
- **Tabela Afetada:**
  - `ai_knowledge_chunks`:
    - `embedding`: vector(1536) NULL com índice HNSW `ix_ai_knowledge_chunks_embedding_hnsw`
- **Script de Migração:** backend/scripts/migrate_phase3_pgvector_cdn.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e fallback gracioso SQLite).

---

### [10/11/2026] - Feed Social da Comunidade (Tabelas community_posts, community_post_likes e community_post_comments)
- **Objetivo:** Implementar o Feed Social estilo Instagram/LinkedIn na plataforma, permitindo que alunos e instrutores publiquem fotos/textos, curtam com animação, comentem com respostas em thread, filtrem por curso e fixem posts no topo.
- **Tabelas Criadas:**
  - `community_posts`:
    - `id`: SERIAL PRIMARY KEY
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `course_id`: INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL
    - `content`: TEXT NOT NULL
    - `media_urls`: JSONB / JSON NULL
    - `media_type`: VARCHAR(50) DEFAULT 'none' NOT NULL
    - `likes_count`: INTEGER DEFAULT 0 NOT NULL
    - `comments_count`: INTEGER DEFAULT 0 NOT NULL
    - `is_pinned`: BOOLEAN DEFAULT FALSE NOT NULL
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
  - `community_post_likes`:
    - `id`: SERIAL PRIMARY KEY
    - `post_id`: INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - Constraint: `uq_community_post_like` UNIQUE (post_id, user_id)
  - `community_post_comments`:
    - `id`: SERIAL PRIMARY KEY
    - `post_id`: INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `parent_id`: INTEGER NULL REFERENCES community_post_comments(id) ON DELETE CASCADE
    - `content`: TEXT NOT NULL
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
- **Script de Migração:** backend/scripts/migrate_community_feed.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Supervisão e Respostas do Super Admin em DMs de Administradores (dm_thread_admin_id na tabela chat_messages)
- **Objetivo:** Permitir que o Super Admin visualize e envie respostas na mesma conversa entre Alunos e Administradores (mantendo o contexto de atendimento e o badge de Super Admin), além de rastrear a qual thread de administrador a mensagem pertence.
- **Tabela Afetada:**
  - `chat_messages`:
    - `dm_thread_admin_id`: INTEGER NULL REFERENCES users(id) ON DELETE SET NULL (ID do Administrador responsável pela thread em que o Super Admin interveio)
    - Índice: `ix_chat_messages_dm_thread_admin_id`
- **Script de Migração:** backend/scripts/add_dm_thread_admin_id.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Suporte a Tutoriais em Texto e Artigos (content_type e text_content na tabela tutorials)
- **Objetivo:** Adicionar suporte a tutoriais de onboarding da plataforma no formato 100% texto/artigo com formatação Markdown, permitindo que a aula de tutorial não exija arquivo de vídeo e tenha conteúdo textual rico.
- **Tabela Afetada:**
  - `tutorials`:
    - `content_type`: VARCHAR(50) DEFAULT 'video' NOT NULL (Valores: 'video' ou 'text')
    - `text_content`: TEXT NULL (Conteúdo em Markdown do tutorial em texto)
    - `video_url`: Alterado para NULLABLE (opcional quando content_type == 'text')
- **Script de Migração:** backend/scripts/add_content_type_to_tutorials.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [10/11/2026] - Presença e Rastreamento Online do Usuário (last_seen_at na tabela users)
- **Objetivo:** Adicionar a coluna `last_seen_at` na tabela `users` para persistir o último momento de atividade/presença online do usuário (aluno, admin ou superadmin), possibilitando exibir status "Online agora" e "Visto por último".
- **Tabela Afetada:**
  - `users`:
    - `last_seen_at`: TIMESTAMP WITH TIME ZONE NULL
- **Script de Migração:** backend/scripts/add_user_last_seen_at.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [09/11/2026] - Múltiplas Reações Estilo LinkedIn na Aba Apresente-se (reaction_type em introduction_likes)
- **Objetivo:** Adicionar suporte a múltiplos tipos de reação com emojis ricos estilo LinkedIn (like, love, celebrate, insightful, fire, rocket) na tabela de curtidas/reações de apresentações comunitárias.
- **Tabela Afetada:**
  - `introduction_likes`:
    - `reaction_type`: VARCHAR(20) DEFAULT 'like' NOT NULL (Valores: 'like', 'love', 'celebrate', 'insightful', 'fire', 'rocket')
- **Script de Migração:** backend/scripts/add_reaction_type_to_intro_likes.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [09/11/2026] - Expansão da Aba Apresente-se (Mídias, Vídeos, Redes, Matchmaking e Pin em introduction_posts)
- **Objetivo:** Adicionar suporte completo a upload e incorporação de mídias (foto, vídeo MP4/WebM, embeds do YouTube/Vimeo/Loom), canais de redes sociais e contato de 1 clique (Instagram, LinkedIn, WhatsApp, Website), matchmaking de parcerias ("O que busco" e "O que domino / Posso ajudar"), nicho, localização geográfica e fixação de apresentações no topo (pin) pelo administrador.
- **Tabela Afetada:**
  - `introduction_posts`:
    - `media_type`: VARCHAR(50) DEFAULT 'none' (Tipos: 'none', 'image', 'video', 'youtube', 'vimeo', 'loom')
    - `media_url`: TEXT NULL (URL da mídia enviada para o storage B2 ou local)
    - `video_embed_url`: TEXT NULL (URL de embed do YouTube/Vimeo/Loom)
    - `instagram`: VARCHAR(100) NULL (Perfil/URL do Instagram)
    - `linkedin`: VARCHAR(255) NULL (URL do perfil LinkedIn)
    - `whatsapp`: VARCHAR(50) NULL (Número WhatsApp com DDI/DDD)
    - `website`: VARCHAR(255) NULL (Portfólio / Site / GitHub)
    - `niche`: VARCHAR(100) NULL (Área de atuação / profissão)
    - `location`: VARCHAR(100) NULL (Cidade e/ou Estado)
    - `seeking`: TEXT NULL (O que busca na comunidade / parcerias desejadas)
    - `offering`: TEXT NULL (Como posso ajudar / Habilidades que domina)
    - `is_pinned`: BOOLEAN DEFAULT FALSE NOT NULL (Fixado no topo da comunidade por Admin)
- **Script de Migração:** backend/scripts/update_introduction_posts_features.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [09/11/2026] - Coleta de Data de Nascimento do Usuário (birth_date na tabela users)
- **Objetivo:** Adicionar campo opcional de data de nascimento (`birth_date`) do usuário na tabela `users` e na interface de perfil das configurações, permitindo a personalização e campanhas com base no aniversário.
- **Tabela Afetada:**
  - `users`:
    - `birth_date`: DATE NULL (Data de nascimento no formato YYYY-MM-DD)
- **Script de Migração:** backend/scripts/add_birth_date_to_users.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [09/11/2026] - Correção e Auto-Migração da Tabela registration_verifications e Coluna attempts
- **Objetivo:** Garantir a criação automática da tabela `registration_verifications` e a presença das colunas `attempts` (INTEGER DEFAULT 0) e `phone` (VARCHAR) no startup do servidor, corrigindo erro `500 UndefinedColumn: column "attempts" of relation "registration_verifications" does not exist` ocorrido no cadastro de novos alunos via convite (`/register`).
- **Tabelas e Colunas Afetadas:**
  - `registration_verifications`:
    - `attempts`: INTEGER DEFAULT 0 NOT NULL (Contador de tentativas incorretas de código OTP)
    - `phone`: VARCHAR NULL (Número de telefone/WhatsApp informado no cadastro)
  - `users`:
    - `phone`: VARCHAR NULL
    - `avatar_url`: VARCHAR NULL
  - `invites`:
    - `allowed_course_ids`: VARCHAR NULL
- **Script de Migração:** backend/scripts/add_attempts_to_registration_verifications.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite) e registrada em backend/app/models/__init__.py.

---

### [09/11/2026] - Rastreamento de 1º Login e Acessos para Gatilho de Boas-Vindas nos Funis (first_login_at, last_login_at e login_count na tabela users)
- **Objetivo:** Adicionar rastreamento do momento do primeiro login, último acesso e contador total de logins do usuário, viabilizando o acionamento automático do gatilho `first_login` (Primeiro Login / 1º Acesso) nos Funis de Mensagens.
- **Tabela Afetada:**
  - users:
    - first_login_at: TIMESTAMP WITH TIME ZONE NULL (Timestamp do primeiríssimo login do aluno)
    - last_login_at: TIMESTAMP WITH TIME ZONE NULL (Timestamp do acesso mais recente)
    - login_count: INTEGER DEFAULT 0 NOT NULL (Contador progressivo de acessos)
- **Script de Migração:** backend/scripts/add_first_login_to_users.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [08/11/2026] - Bloqueio Independente e Programado de Canais, Chats e Suporte por Curso (channel_release_type, channel_release_date e locked_channels_json na tabela courses)
- **Objetivo:** Permitir que o administrador bloqueie ou agende a abertura de canais específicos (`course_chat`, `support`, `general_chat`, `dm`) de forma independente do bloqueio das aulas gravadas do curso.
- **Tabela Afetada:**
  - courses:
    - channel_release_type: VARCHAR(50) DEFAULT 'immediate' (Valores: 'immediate', 'closed', 'specific_date')
    - channel_release_date: TIMESTAMP WITH TIME ZONE NULL (Data e hora programada para abertura automática dos canais)
    - locked_channels_json: TEXT NULL (Lista JSON dos canais bloqueados, ex: `["course_chat", "support", "general_chat", "dm"]`)
- **Script de Migração:** backend/scripts/add_course_channel_lock_columns.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py (PostgreSQL e SQLite).

---

### [07/11/2026] - Seleção de Múltiplos Cursos Exclusivos em Eventos (course_ids_json na tabela events)
- **Objetivo:** Permitir que o administrador selecione mais de um curso ao configurar um evento/mentoria com acesso exclusivo (`target_type = 'course'`), liberando o acesso para alunos matriculados em qualquer um dos cursos selecionados.
- **Tabela Afetada:**
  - events:
    - course_ids_json: TEXT NULL (Lista JSON de IDs dos cursos permitidos, ex: `[1, 2, 5]`)
- **Script de Migração:** backend/scripts/add_event_multiple_courses_column.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [07/11/2026] - Controle de Fechamento e Liberação Programada por Data e Hora em Cursos (release_type e release_date na tabela courses)
- **Objetivo:** Permitir ao administrador fechar temporariamente um curso para todos os alunos ou programar sua liberação automática em uma data e hora específicas (`release_type` e `release_date` na tabela `courses`).
- **Tabela Afetada:**
  - courses:
    - release_type: VARCHAR(50) DEFAULT 'immediate' (Valores: 'immediate', 'closed', 'specific_date')
    - release_date: TIMESTAMP WITH TIME ZONE NULL (Data e hora programada para abertura do curso)
- **Script de Migração:** backend/scripts/add_course_release_columns.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [06/11/2026] - Modos de Acesso e Manutenção do Tutor IA (access_mode e maintenance_message)
- **Objetivo:** Adicionar controle de visibilidade e modo manutenção para o Tutor IA nas configurações da plataforma (`ai_tutor_settings`), permitindo escolher entre 'Liberado para Todos', 'Modo Manutenção' (chat visível com aviso explicativo e input bloqueado) e 'Oculto / Privado' (visível apenas para Super Admin e Administradores).
- **Tabelas Afetadas:**
  - ai_tutor_settings:
    - access_mode: VARCHAR(30) NOT NULL DEFAULT 'public' (Modo de acesso: 'public', 'maintenance', 'private_team', 'disabled')
    - maintenance_message: TEXT NULL (Mensagem personalizada de manutenção exibida aos alunos)
- **Script de Migração:** backend/scripts/add_tutor_access_mode_columns.py

---

### [05/11/2026] - RAG Avançado: Q&A Sintético e Parâmetros de Top-K e Similaridade Mínima
- **Objetivo:** Adicionar parâmetros configuráveis de busca vetorial (Top-K e corte de similaridade mínima) e suporte à geração de perguntas & respostas sintéticas (Q&A) por aula.
- **Tabelas Afetadas:**
  - i_tutor_settings:
    - 
ag_top_k: INTEGER NOT NULL DEFAULT 4 (Quantidade máxima de trechos RAG a injetar no contexto da IA)
    - 
ag_min_similarity: FLOAT NOT NULL DEFAULT 0.35 (Corte mínimo de similaridade de cosseno)
  - i_knowledge_chunks:
    - chunk_type: VARCHAR(30) NOT NULL DEFAULT 'transcript' (Tipo do chunk: 'transcript' ou 'qa_pair')
    - question_text: TEXT NULL (Pergunta sintética formulada a partir do conteúdo do vídeo)
    - nswer_text: TEXT NULL (Resposta sintética fundamentada com minutagens)
- **Script de Migração:** ackend/scripts/add_rag_advanced_columns.py

---


### [05/11/2026] - Sistema de Tutor IA Interativo com RAG e Assinatura Recorrente (ai_tutor_settings, ai_tutor_messages e colunas em users)
- **Objetivo:** Adicionar tabelas e campos necessários para o módulo do Tutor IA Interativo com suporte a assinaturas de R$ 10/mês, degustação de 3 perguntas/mês, rastreamento de custos em R$ por aluno e parametrização do prompt no painel.
- **Tabelas Afetadas:**
  - users:
    - i_tutor_active: BOOLEAN DEFAULT FALSE (Indica se o aluno possui assinatura ativa do Tutor IA)
    - i_tutor_expires_at: TIMESTAMP NULL (Data de renovação ou expiração da assinatura do Tutor IA)
    - i_tutor_custom_monthly_limit: INTEGER NULL (Cota customizada para o aluno: NULL = segue padrão global, -1 = VIP ilimitado)
  - i_tutor_settings:
    - id: INTEGER PRIMARY KEY
    - default_monthly_free_questions: INTEGER DEFAULT 3
    - system_prompt: TEXT (Prompt customizável com variáveis dinâmicas)
    - 	emperature: FLOAT DEFAULT 0.3
    - model_name: VARCHAR DEFAULT 'gpt-4o-mini'
    - is_enabled: BOOLEAN DEFAULT TRUE
    - sales_checkout_url: VARCHAR NULL
    - monthly_price_brl: FLOAT DEFAULT 10.0
    - created_at, updated_at: TIMESTAMP
  - i_tutor_messages:
    - id: INTEGER PRIMARY KEY
    - user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
    - course_id: INTEGER REFERENCES courses(id) ON DELETE CASCADE
    - lesson_id: INTEGER REFERENCES lessons(id) ON DELETE SET NULL
    - 
ole: VARCHAR(20) ('user' ou 'assistant')
    - content: TEXT
    - prompt_tokens: INTEGER DEFAULT 0
    - completion_tokens: INTEGER DEFAULT 0
    - cost_brl: FLOAT DEFAULT 0.0
    - 
elated_lessons_json: TEXT NULL (JSON com aulas e minutagens referenciadas)
    - created_at: TIMESTAMP
- **Script de Migração:** ackend/scripts/migrate_ai_tutor.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de ackend/app/main.py.

---

### [31/10/2026] - Controle Individual de Marca d'Água Anti-Pirataria nas Aulas (watermark_enabled na tabela courses)
- **Objetivo:** Permitir ao administrador ativar ou desativar a marca d'água dinâmica anti-pirataria (identificação do aluno sobre os vídeos das aulas) individualmente na criação e edição de cada curso.
- **Tabela Afetada:** courses
  - watermark_enabled: BOOLEAN NOT NULL DEFAULT TRUE (Exibe ou oculta a marca d'água nas aulas do curso)
- **Script de Migração:** backend/scripts/migrate_course_watermark.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [30/10/2026] - Liberação Programada por Aula Individual (Drip Content / 7 Dias da Garantia na tabela lessons)
- **Objetivo:** Permitir configurar a liberação programada (Imediato, Dias após Entrada como os 7 dias da garantia ou Data Fixa) individualmente em cada aula (`lessons`), além da liberação por módulo.
- **Tabela Afetada:** lessons
  - release_type: VARCHAR(50) DEFAULT 'immediate' (Tipos: 'immediate', 'days_after', 'specific_date')
  - release_days: INTEGER DEFAULT 0 (Dias decorridos após matrícula para liberação da aula)
  - release_date: TIMESTAMP WITH TIME ZONE NULL (Data e hora fixa para liberação da aula)
- **Script de Migração:** backend/scripts/migrate_lesson_drip_content.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [30/10/2026] - Usabilidade do Player: Memorização de Velocidade (playback_rate na tabela users)
- **Objetivo:** Memorizar a velocidade de reprodução preferida do aluno (ex: 1.0x, 1.25x, 1.5x, 2.0x) salva na sua conta, aplicando automaticamente em todos os dispositivos e aulas acessadas.
- **Tabela Afetada:** users
  - playback_rate: FLOAT DEFAULT 1.0 (Velocidade de reprodução preferida do usuário)
- **Script de Migração:** backend/scripts/migrate_user_playback_rate.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [30/10/2026] - Recompensas Pedagógicas por Elo (required_tier na tabela modules)
- **Objetivo:** Permitir o bloqueio de módulos bônus e masterclasses exclusivas exigindo que o aluno atinja um determinado Elo de gamificação RPG (ex: Bronze, Prata, Ouro, Diamante, Lenda).
- **Tabela Afetada:** modules
  - required_tier: VARCHAR(50) NULL (Valores: NULL, 'Bronze', 'Prata', 'Ouro', 'Diamante', 'Lenda')
- **Script de Migração:** backend/scripts/migrate_module_elo_requirement.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [30/10/2026] - Sistema de Liberação Programada de Módulos (Drip Content na tabela modules)
- **Objetivo:** Permitir o agendamento da liberação de módulos por dias decorridos após a matrícula do aluno (ex: Módulo 2 liberado após 7 dias) ou por data e hora fixas no calendário, mantendo acesso imediato irrestrito para administradores.
- **Tabela Afetada:** modules
  - release_type: VARCHAR(50) DEFAULT 'immediate' (Tipos: 'immediate', 'days_after', 'specific_date')
  - release_days: INTEGER DEFAULT 0 (Dias decorridos após matrícula para liberação)
  - release_date: TIMESTAMP WITH TIME ZONE NULL (Data e hora fixa para liberação)
- **Script de Migração:** backend/scripts/migrate_module_drip_content.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [30/10/2026] - Criação do Sistema de Certificados de Conclusão (certificates e campos em courses)
- **Objetivo:** Permitir a emissão oficial de certificados de conclusão de curso com código único de autenticidade, geração de PDF profissional e validação pública via QR Code.
- **Tabela Criada:** certificates
  - id: INTEGER PRIMARY KEY SERIAL
  - certificate_code: VARCHAR UNIQUE NOT NULL (Código de autenticidade ex: CERT-XXXXXXXX)
  - user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL (indexado)
  - course_id: INTEGER REFERENCES courses(id) ON DELETE CASCADE NOT NULL (indexado)
  - student_name: VARCHAR NOT NULL (Nome do aluno congelado na emissão)
  - course_title: VARCHAR NOT NULL (Título do curso congelado na emissão)
  - workload_hours: INTEGER DEFAULT 10 NOT NULL (Carga horária registrada)
  - instructor_name: VARCHAR NULL (Nome do instrutor na emissão)
  - issued_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
  - created_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  - updated_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  - **Restrição de Unicidade:** UQ uq_certificate_user_course em (user_id, course_id)
- **Tabela Afetada:** courses
  - certificate_enabled: BOOLEAN DEFAULT TRUE NOT NULL
  - workload_hours: INTEGER DEFAULT 10 NULL
  - instructor_name: VARCHAR NULL
- **Script de Migração:** ackend/scripts/migrate_certificates.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de ackend/app/main.py.

---

### [27/10/2026] - Criação de Pastas de Funis (funnel_folders) e Vinculação em Funis (folder_id)
- **Objetivo:** Permitir ao administrador criar pastas personalizadas (ex: Boas-vindas, Recuperação, Eventos) com cor de destaque e contadores para categorizar funis com o mesmo intuito. Ao excluir uma pasta, os funis contidos são preservados e movidos de forma segura para "Sem Pasta" (ON DELETE SET NULL).
- **Tabela Criada:** funnel_folders
  - id: INTEGER PRIMARY KEY SERIAL
  - name: VARCHAR(100) NOT NULL
  - color: VARCHAR(30) DEFAULT '#6366f1'
  - order_index: INTEGER DEFAULT 0 NOT NULL
  - created_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
  - updated_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
- **Tabela Afetada:** funnels
  - folder_id: INTEGER REFERENCES funnel_folders(id) ON DELETE SET NULL (nullable=True, indexado)
- **Script de Migração:** backend/scripts/add_funnel_folders.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [27/10/2026] - Adição de Nome de Exibição Personalizado para Pacotes / Combos (bundle_title)
- **Objetivo:** Permitir ao administrador personalizar livremente o nome que aparece no topo da caixa do pacote/combo (ex: "Combo AstroWake Master") de forma independente dos títulos dos cursos e ferramentas individuais inclusos no pacote.
- **Tabela Afetada:** courses
- **Nova Coluna:**
  - bundle_title: Nome customizado de exibição do combo (VARCHAR, nullable=True).
- **Script de Migração:** backend/scripts/add_bundle_title_to_courses.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [26/10/2026] - Criação da Tabela de Inscrições / Presença em Eventos (event_attendees)
- **Objetivo:** Armazenar confirmações de participação de alunos em eventos e mentorias ao vivo, permitindo acionar gatilhos de automação e funil quando o usuário clica em confirmar presença.
- **Tabela Criada:** event_attendees
- **Colunas:**
  - id: INTEGER PRIMARY KEY SERIAL.
  - event_id: INTEGER REFERENCES events(id) ON DELETE CASCADE NOT NULL.
  - user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL.
  - confirmed_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP.
- **Restrição de Unicidade:** UQ uq_event_user_attendance em (event_id, user_id).
- **Script de Migração:** backend/scripts/migrate_event_attendees.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de backend/app/main.py.

---

### [25/10/2026] - Criação da Tabela de Eventos e Mentorias (events)
- **Objetivo:** Armazenar os eventos, mentorias e encontros ao vivo promovidos pelo expert para os alunos, com título, descrição, início/término no Horário de Brasília, links de transmissão e gravação, thumbnail e controle de visibilidade (aberto a todos ou exclusivo por curso para upsell).
- **Tabela Criada:** events
- **Colunas:**
  - id: INTEGER PRIMARY KEY SERIAL.
  - 	itle: VARCHAR(255) NOT NULL.
  - description: TEXT.
  - start_time: TIMESTAMP WITH TIME ZONE NOT NULL.
  - end_time: TIMESTAMP WITH TIME ZONE.
  - meeting_url: VARCHAR(1024).
  - 
ecording_url: VARCHAR(1024).
  - 	humbnail_url: VARCHAR(1024).
  - 	arget_type: VARCHAR(20) NOT NULL DEFAULT 'all'.
  - course_id: INTEGER REFERENCES courses(id) ON DELETE SET NULL.
  - is_active: BOOLEAN NOT NULL DEFAULT TRUE.
  - created_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP.
  - updated_at: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP.
- **Script de Migração:** ackend/scripts/migrate_events_table.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de ackend/app/main.py.

---

### [23/10/2026] - Adição de Enquadramento e Posição do Banner Hero (cover_image_position)
- **Objetivo:** Permitir ao administrador ajustar a posição focal/vertical do Banner Hero (0% a 100%), permitindo drag-and-drop e slider para escolher qual parte da imagem panorâmica deve aparecer no topo do curso.
- **Tabela Afetada:** courses
- **Nova Coluna:**
  - cover_image_position: Posição percentual vertical da imagem de capa/banner (INTEGER NOT NULL DEFAULT 50).
- **Script de Migração:** ackend/scripts/add_cover_image_position_to_courses.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de ackend/app/main.py.

---

### [23/10/2026] - Adição de Card Facultativo de Próximo Nível na Barra Lateral (show_in_sidebar)
- **Objetivo:** Permitir que o gestor configure no anúncio de Upsell se ele deve ser exibido também como um card de destaque de próximo passo na barra lateral da sala de aula (acima dos módulos).
- **Tabela Afetada:** course_upsell_offers
- **Nova Coluna:**
  - show_in_sidebar: Booleano indicando se a oferta deve figurar no card fixo da barra lateral da sala de aula (BOOLEAN NOT NULL DEFAULT FALSE).
- **Script de Migração:** ackend/scripts/add_show_in_sidebar_to_upsell.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de ackend/app/main.py.

---

### [23/10/2026] - Criação das Tabelas de Anúncios e Ofertas de Upsell no Curso
- **Objetivo:** Armazenar configurações de anúncios de próximos cursos/ferramentas por porcentagem de progresso de curso (ex: 35%, 50%, 75%) e rastrear visualizações por aluno para garantir exibição única anti-spam e sem exibir cursos já adquiridos.
- **Tabelas Criadas:**
  - `course_upsell_offers`: Configuração da oferta com curso de origem, curso alvo, porcentagem de disparo, tipo de mídia (imagem/vídeo), URL da mídia, título, descrição, texto do botão e URL de destino.
  - `course_upsell_views`: Registro de visualização e dispensa da oferta por aluno com restrição de unicidade `uq_course_upsell_view_user` em `(offer_id, user_id)`.
- **Script de Migração:** `backend/scripts/migrate_course_upsell_tables.py`
- **Auto-migração no Startup:** Incluída na rotina `lifespan` de `backend/app/main.py`.

---

### [22/10/2026] - Criação das Tabelas de Infraestrutura e Alertas de Webhook
- **Objetivo:** Armazenar configurações de limites de alerta (thresholds de RAM, CPU e Pool de conexões), histórico de picos de hardware e histórico horário de conexões do banco.
- **Tabelas Criadas:**
  - system_alert_configs: Configuração de thresholds, cooldown, URL de webhook e status crítico.
  - system_peak_metrics: Registro de picos máximos de RAM, CPU e Pool com timestamp e detalhes.
  - system_connection_histories: Histórico de ocupação do pool por hora com status (Normal, Atenção, Crítico).
- **Script de Migração:** ackend/scripts/migrate_infrastructure_tables.py

---

### [22/10/2026] - Colunas de Segurança Avançada em Users (Account Lockout e Invalidação de Sessão)
- **Objetivo:** Suportar bloqueio temporário após 5 falhas consecutivas de login (Account Lockout), controle de versão de token para invalidação imediata em logout/troca de senha, e anti-pirataria para alunos (Single-Session Enforcement).
- **Tabela Afetada:** users
- **Novas Colunas:**
  - 	oken_version: Versão do token JWT do usuário (INTEGER DEFAULT 1 NOT NULL). Incrementada a cada logout, troca de senha ou novo login de aluno.
  - ailed_login_attempts: Contador de tentativas incorretas consecutivas (INTEGER DEFAULT 0 NOT NULL).
  - locked_until: Data e hora até quando a conta está bloqueada (TIMESTAMP WITHOUT TIME ZONE NULL).
- **Script de Migração:** ackend/scripts/migrate_user_security_columns.py
- **Auto-migração no Startup:** Incluída na rotina lifespan de ackend/app/main.py.

---

### [15/10/2026] - Auto-Migrações Preventivas no Startup da Aplicação (Lifespan FastAPI)
- **Objetivo:** Prevenir erros de coluna ausente (`UndefinedColumn: column courses.item_type does not exist`) em ambientes de produção após deploys sem migração manual.
- **Tabelas e Colunas Asseguradas Automaticamente:**
  - `courses.item_type`: Garantida com `ALTER TABLE courses ADD COLUMN IF NOT EXISTS item_type VARCHAR DEFAULT 'course';`
  - `courses.tool_url`: Garantida com `ALTER TABLE courses ADD COLUMN IF NOT EXISTS tool_url VARCHAR;`
  - `course_bundles`: Criada automaticamente com índices se ainda não existir.
  - `course_sales_clicks`: Criada automaticamente com índices se ainda não existir.
- **Arquivo Afetado:** `backend/app/main.py` (função `lifespan`).

---

### [15/10/2026] - Criptografia em Repouso de Mensagens Diretas (DMs) e Proteção de Dados
- **Tabela Afetada:** `chat_messages`
  - A coluna `message` passa a armazenar o payload criptografado com cifra simétrica padrão Fernet (AES-128-CBC + HMAC-SHA256) precedido pelo identificador de versão de algoritmo `enc:v1:`, garantindo proteção total contra vazamento de dados em repouso no banco de dados.
  - Mensagens públicas e canais de curso mantêm o comportamento padrão sem quebra de indexação/busca.
  - Retrocompatibilidade total: mensagens legadas sem prefixo continuam sendo lidas e entregues sem erro e são encriptadas automaticamente pelo script de migração.
- **Variáveis de Ambiente Adicionadas:**
  - `DM_ENCRYPTION_KEY`: Chave Fernet codificada em URL-safe base64 de 32 bytes (com derivação automática e segura a partir de `SECRET_KEY` + `SECURITY_PASSWORD_PEPPER` caso não informada).
- **Script de Migração:** `backend/scripts/encrypt_existing_dm_messages.py`

---

### [15/10/2026] - Criação da Tabela de Histórico de Cliques na Página de Vendas (Course Sales Clicks)
- **Tabela Criada:** `course_sales_clicks`
  - `id`: Chave primária (`SERIAL PRIMARY KEY`).
  - `course_id`: ID do curso/produto clicado (`INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE`).
  - `user_id`: ID do usuário autenticado que clicou para ir à página de vendas (`INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`).
  - `created_at`: Data e hora em que o clique ocorreu (`TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP`).
- **Índices Criados:**
  - `ix_course_sales_clicks_course_id` em `course_sales_clicks(course_id)`.
  - `ix_course_sales_clicks_user_id` em `course_sales_clicks(user_id)`.
  - `ix_course_sales_clicks_created_at` em `course_sales_clicks(created_at)`.
- **Script de Migração:** `backend/scripts/migrate_course_sales_clicks.py`

---

### [14/10/2026] - Criação de Ferramentas/Aplicativos e Pacotes/Combos de Cursos (Course Bundles)
- **Tabelas Afetadas:**
  - `courses`:
    - `item_type`: Tipo do produto/conteúdo (`VARCHAR DEFAULT 'course'`), suporta `'course'` (Curso padrão) ou `'tool'` (Ferramenta/Aplicativo externo).
    - `tool_url`: URL de acesso direto à ferramenta/aplicativo (`VARCHAR NULL`).
  - `course_bundles` (Nova Tabela):
    - `id`: Chave primária (`SERIAL PRIMARY KEY`).
    - `parent_course_id`: ID do curso principal/pacote (`INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE`).
    - `bundled_course_id`: ID do curso ou ferramenta incluído automaticamente no pacote (`INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE`).
    - `created_at`: Data e hora de vinculação (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).
    - Restrição de unicidade: `uq_course_bundle` em `(parent_course_id, bundled_course_id)`.
- **Índices Criados:**
  - `ix_course_bundles_parent` em `course_bundles(parent_course_id)`.
  - `ix_course_bundles_bundled` em `course_bundles(bundled_course_id)`.
- **Script de Migração:** `backend/scripts/migrate_course_tools_and_bundles.py`

---

### [13/10/2026] - Criação das Tabelas da Aba Apresente-se (Introductions)
- **Tabelas Criadas:**
  - `introduction_posts`: Armazena os posts de apresentação dos membros (`id`, `user_id`, `title`, `content`, `likes_count`, `comments_count`, `created_at`, `updated_at`).
  - `introduction_comments`: Armazena os comentários e respostas nos posts de apresentação (`id`, `post_id`, `user_id`, `content`, `created_at`).
  - `introduction_likes`: Armazena as curtidas dos usuários nos posts com restrição de unicidade (`id`, `post_id`, `user_id`, `created_at`).
- **Constraint Unica:** `uq_introduction_post_like` em `(post_id, user_id)`.
- **Script de Migração:** `backend/scripts/migrate_introductions.py`

---

### [13/10/2026] - Criação da Tabela de Tutoriais Iniciais de Navegação (Tutorials)
- **Tabela Criada:** `tutorials`
- **Colunas:**
  - `id`: Chave primária inteira com sequence (`tutorials_id_seq`).
  - `title`: Título do vídeo tutorial (`VARCHAR(255)`, não nulo).
  - `description`: Descrição e orientações textuais do tutorial (`TEXT`, opcional).
  - `video_url`: URL de acesso ao vídeo (`VARCHAR(1024)`, não nulo).
  - `video_key`: Chave no armazenamento Backblaze B2 (`VARCHAR(512)`, opcional).
  - `thumbnail_url`: Imagem de capa do tutorial (`VARCHAR(1024)`, opcional).
  - `duration`: Duração formatada (`VARCHAR(50)`, opcional, ex: `05:30`).
  - `order_index`: Índice de ordenação da playlist (`INTEGER`, default `0`).
  - `is_active`: Status de ativação (`BOOLEAN`, default `TRUE`).
  - `created_at`: Data e hora de criação (`TIMESTAMP WITH TIME ZONE`).
  - `updated_at`: Data e hora da última atualização (`TIMESTAMP WITH TIME ZONE`).
- **Script de Migração:** `backend/scripts/migrate_tutorials.py`

---

### [13/10/2026] - Sincronização de Sequences e Auto-incremento (ID Defaults)
- **Tabelas Afetadas:** `users`, `webhooks`, `webhook_logs`
- **Alterações:**
  - `users.id`: Vinculação de `DEFAULT nextval('users_id_seq'::regclass)` e sincronização do valor atual com `MAX(id)`.
  - `webhooks.id`: Vinculação de `DEFAULT nextval('webhooks_id_seq'::regclass)`.
  - `webhook_logs.id`: Vinculação de `DEFAULT nextval('webhook_logs_id_seq'::regclass)`.
- **Script de Migração:** `backend/scripts/fix_id_sequences.py`

---

### [08/10/2026] - Integração com AgentFlow (Base de Conhecimento RAG e Sincronização de Transcrições)
- **Tabelas Afetadas:** `courses`, `modules`, `lesson_transcriptions`
- **Colunas Adicionadas:**
  - `courses.agentflow_kb_id`: ID da Base de Conhecimento vinculada no AgentFlow.
  - `courses.agentflow_kb_name`: Nome descritivo da Base de Conhecimento vinculada.
  - `modules.agentflow_synced_at`: Timestamp da sincronização do resumo pedagógico do módulo na base.
  - `lesson_transcriptions.agentflow_kb_id`: ID da base para a qual a aula foi exportada.
  - `lesson_transcriptions.agentflow_synced_at`: Timestamp de quando a transcrição e P&R da aula foram sincronizados.
- **Script de Migração:** `backend/scripts/migrate_agentflow_kb.py`

---

### [07/10/2026] - Sistema de Identificador de Origem e Idempotência de Aulas (Import Identifier)
- **Tabelas Afetadas:** `lessons`
- **Colunas Adicionadas:**
  - `import_identifier`: Armazena o identificador original da aula (nome original do arquivo ou código de referência) para evitar duplicação em reimportações de pastas e permitir atualização da mesma aula existente.
- **Script de Migração:** `backend/scripts/migrate_lesson_import_identifier.py`

---

### [07/10/2026] - Sistema de Capítulos e Minutagem Automática de Vídeo via IA (YouTube Style)
- **Tabelas Afetadas:** `lesson_transcriptions`
- **Colunas Adicionadas:**
  - `chapters`: Armazena lista JSON de minutagem/capítulos (`time`, `seconds`, `title`) gerados pelo GPT a partir da transcrição de áudio Whisper.
- **Script de Migração:** `backend/scripts/migrate_transcription_chapters.py`

---

### [06/10/2026] - Sistema de Funis de Mensagens e Fluxos Visuais (Funnels)
- **Tabelas Criadas:**
  - `funnels`: Armazena os funis criados com nome, descrição, gatilhos e JSON completo do fluxo/canvas (`id`, `name`, `description`, `trigger_type`, `trigger_keywords`, `flow_data`, `is_active`, `created_by_user_id`, `created_at`, `updated_at`).
  - `funnel_executions`: Rastreamento da execução de cada funil disparado para um aluno específico (`id`, `funnel_id`, `user_id`, `triggered_by`, `current_node_id`, `status`, `started_at`, `completed_at`, `logs`).
- **Índices Criados:** `ix_funnels_name`, `ix_funnels_created_by`, `ix_funnel_executions_funnel_id`, `ix_funnel_executions_user_id`.
- **Script de Migração:** `backend/scripts/migrate_funnels.py`

---

### [06/10/2026] - Sistema de Etiquetas de Alunos e Disparo em Massa de DMs com Histórico e Métricas
- **Tabelas Criadas:**
  - `student_tags`: Cadastro de etiquetas/tags (`id`, `name`, `color`, `description`, `created_at`).
  - `student_tag_assignments`: Associação N:N entre alunos e etiquetas (`id`, `student_id`, `tag_id`, `created_at`) com restrição única `(student_id, tag_id)`.
  - `chat_broadcast_campaigns`: Registro de campanhas de disparo em massa (`id`, `created_by_user_id`, `title`, `message`, `filter_type`, `filter_course_id`, `filter_tag_id`, `filter_role`, `total_recipients`, `sent_count`, `failed_count`, `delay_seconds`, `status`, `started_at`, `completed_at`, `duration_seconds`, `created_at`).
  - `chat_broadcast_recipients`: Destinatários individuais com rastreamento de entrega e visualização (`id`, `campaign_id`, `recipient_id`, `message_id`, `status`, `error_message`, `sent_at`, `read_at`, `created_at`).
- **Colunas Adicionadas:**
  - `chat_messages.read_at`: Timestamp com fuso horário da leitura da mensagem pelo destinatário.
- **Índices Criados:** `ix_student_tags_name`, `ix_student_tag_assignments_student_id`, `ix_student_tag_assignments_tag_id`, `ix_chat_broadcast_campaigns_status`, `ix_chat_broadcast_campaigns_created_at`, `ix_chat_broadcast_recipients_campaign_id`, `ix_chat_broadcast_recipients_recipient_id`, `ix_chat_broadcast_recipients_status`, `ix_chat_messages_read_at`.
- **Script de Migração:** `backend/scripts/migrate_chat_broadcasts.py`

---

### [06/10/2026] - Criação da Tabela de Leitura de Mensagens por Canal (Chat Channel Read Status)
- **Tabelas Criadas:**
  - `chat_channel_read_status`: Rastreamento de leitura das mensagens de chat (`user_id`, `channel_id`, `last_read_message_id`, `updated_at`). Permite contabilizar com precisão o número de mensagens não lidas por canal e alimentar a notificação/badge na barra lateral do Chat da Comunidade.
- **Índices Criados:** `ix_chat_channel_read_status_user_id`, `ix_chat_channel_read_status_channel_id`, `uq_chat_channel_read_user`.
- **Script de Migração:** `backend/scripts/migrate_chat_channel_read_status.py`

---

### [24/09/2026] - Criação Inicial do Esquema de Usuários e Autenticação
- **Tabelas Criadas:**
  - `users`: Armazena os usuários do sistema com criptografia Argon2id + Pepper.
  - `invites`: Gerenciamento de convites com tempo de expiração e role.
  - `password_reset_tokens`: Tokens seguros para redefinição de senha com validade de 24h.
  - `registration_verifications`: Verificação OTP de 6 dígitos via Brevo API para validação de e-mail.

---

### [24/09/2026] - Sistema de Backup Automático e Histórico (Backblaze B2 / S3)
- **Tabelas Criadas:**
  - `backup_schedules`: Armazena a rotina de agendamento automático de backups (`is_active`, `frequency`, `destination_folder`, `retention_max`, `last_run_at`, `next_run_at`, `updated_at`).
  - `backup_histories`: Histórico de dumps gerados, baixados, restaurados e importados (`filename`, `s3_key`, `file_size_bytes`, `backup_type`, `status`, `error_message`, `created_at`).
- **Script de Migração:** `backend/scripts/migrate_backup_tables.py`

---

### [29/09/2026] - Criação da Tabela de Cursos e Perfil 'aluno'
- **Tabelas Criadas:**
  - `courses`: Armazena os cursos da plataforma com título, descrição, thumbnail_url, status de publicação e datas.
- **Novos Perfis de Usuário:**
  - `aluno`: Perfil de acesso para alunos da plataforma com visualização de cursos.
- **Script de Migração:** `backend/scripts/migrate_courses_table.py`

---

### [29/09/2026] - Associação de Cursos por Aluno e Liberação via Convite
- **Tabelas Criadas:**
  - `user_courses`: Tabela de associação N:N entre `users` e `courses` para definir exatamente quais cursos cada aluno tem acesso liberado (`id`, `user_id`, `course_id`, `created_at`).
- **Colunas Adicionadas:**
  - `invites.allowed_course_ids`: Lista em formato JSON contendo os IDs dos cursos que serão automaticamente vinculados ao aluno no momento do cadastro.
- **Script de Migração:** `backend/scripts/migrate_user_courses_and_invites.py`

---

### [29/09/2026] - Criação das Tabelas de Módulos e Aulas (Modules e Lessons)
- **Tabelas Criadas:**
  - `modules`: Módulos pertencentes a um curso (`id`, `course_id`, `title`, `description`, `order_index`, `created_at`, `updated_at`).
  - `lessons`: Aulas pertencentes a um módulo (`id`, `module_id`, `title`, `description`, `video_type`, `video_url`, `duration`, `order_index`, `created_at`, `updated_at`).
- **Índices Criados:** `ix_modules_course_id`, `ix_modules_order_index`, `ix_lessons_module_id`, `ix_lessons_order_index`.
- **Script de Migração:** `backend/scripts/migrate_modules_and_lessons.py`

---

### [29/09/2026] - Criação da Tabela de Comentários de Aula (Lesson Comments)
- **Tabelas Criadas:**
  - `lesson_comments`: Comentários deixados por alunos ou administradores em cada aula (`id`, `lesson_id`, `user_id`, `content`, `created_at`, `updated_at`).
- **Índices Criados:** `ix_lesson_comments_lesson_id`, `ix_lesson_comments_user_id`.
- **Script de Migração:** `backend/scripts/migrate_lesson_comments.py`

---

### [29/09/2026] - Suporte a Múltiplos Idiomas de Vídeo por Aula (Lesson Videos)
- **Tabelas Criadas:**
  - `lesson_videos`: Armazena múltiplos vídeos por aula, organizados por idioma (`id`, `lesson_id`, `language`, `language_label`, `video_url`, `video_type`, `created_at`).
- **Índices Criados:** `ix_lesson_videos_lesson_id`, `ix_lesson_videos_language`.
- **Sincronização de Legados:** Popula automaticamente vídeos existentes como idioma 'Português' (`pt`).
- **Script de Migração:** `backend/scripts/migrate_lesson_videos.py`

---

### [30/09/2026] - Suporte a Threads e Respostas em Comentários (Lesson Comment Threads)
- **Tabela Afetada:** `lesson_comments`
- **Coluna Adicionada:**
  - `parent_id`: Chave estrangeira auto-referencial (`REFERENCES lesson_comments(id) ON DELETE CASCADE`), permitindo criar threads e respostas a comentários de aulas.
- **Índice Criado:** `ix_lesson_comments_parent_id`.
- **Script de Migração:** `backend/scripts/migrate_lesson_comments_parent_id.py`

---

### [30/09/2026] - Criação da Tabela de Anexos e Materiais de Aula (Lesson Attachments)
- **Tabela Criada:**
  - `lesson_attachments`: Armazena os documentos complementares anexados às aulas (PDF, DOCX, XLSX, ZIP, etc.) hospedados no Backblaze B2 (`id`, `lesson_id`, `title`, `file_url`, `file_type`, `file_size_bytes`, `created_at`).
- **Índice Criado:** `ix_lesson_attachments_lesson_id`.
- **Script de Migração:** `backend/scripts/migrate_lesson_attachments.py`

---

### [30/09/2026] - Suporte a Capa do Vídeo da Aula (Lesson Thumbnail)
- **Tabela Afetada:** `lessons`
- **Coluna Adicionada:**
  - `thumbnail_url`: Armazena a URL da imagem de capa (poster) da aula (`VARCHAR`), hospedada no Backblaze B2 ou estático.
- **Script de Migração:** `backend/scripts/migrate_lesson_thumbnail.py`

---

### [30/09/2026] - Título e Descrição Multilíngues por Idioma de Aula (Lesson Videos i18n)
- **Tabela Afetada:** `lesson_videos`
- **Colunas Adicionadas:**
  - `title`: Título personalizado da aula no idioma correspondente (`VARCHAR`, opcional).
  - `description`: Descrição textual detalhada da aula no idioma correspondente (`TEXT`, opcional).
- **Script de Migração:** `backend/scripts/migrate_lesson_videos_title_desc.py`

---

### [30/09/2026] - Interações da Aula: Progresso (Assistida), Avaliações (0 a 5 Estrelas) e Relato de Problemas
- **Tabelas Criadas:**
  - `lesson_progress`: Armazena o status de aula assistida/concluída por usuário (`id`, `lesson_id`, `user_id`, `is_completed`, `completed_at`, `created_at`, `updated_at`, UNIQUE `(lesson_id, user_id)`).
  - `lesson_ratings`: Armazena a nota de 1 a 5 estrelas atribuída à aula pelo usuário (`id`, `lesson_id`, `user_id`, `rating`, `created_at`, `updated_at`, UNIQUE `(lesson_id, user_id)`).
  - `lesson_reports`: Armazena os reportes de problemas encontrados na aula (`id`, `lesson_id`, `user_id`, `issue_type`, `description`, `status`, `created_at`, `updated_at`).
- **Índices Criados:**
  - `ix_lesson_progress_lesson_id`, `ix_lesson_progress_user_id`
  - `ix_lesson_ratings_lesson_id`, `ix_lesson_ratings_user_id`
  - `ix_lesson_reports_lesson_id`, `ix_lesson_reports_user_id`
- **Script de Migração:** `backend/scripts/migrate_lesson_interactions.py`

---

### [30/09/2026] - Descrição Detalhada para Anexos e Documentos da Aula
- **Tabela Afetada:** `lesson_attachments`
- **Coluna Adicionada:**
  - `description`: Descrição explicativa do documento ou material complementar (`TEXT`, opcional).
- **Script de Migração:** `backend/scripts/migrate_attachment_description.py`

---

### [30/09/2026] - Criação da Tabela de Anotações Pessoais do Aluno (Lesson Notes)
- **Tabelas Criadas:**
  - `lesson_notes`: Armazena as anotações particulares de cada aluno por aula (`id`, `lesson_id`, `user_id`, `content`, `created_at`, `updated_at`, UNIQUE `(lesson_id, user_id)`).
- **Índices Criados:**
  - `ix_lesson_notes_lesson_id`, `ix_lesson_notes_user_id`.
- **Script de Migração:** `backend/scripts/migrate_lesson_notes.py`

---

### [30/09/2026] - Suporte a Múltiplos Badges de Anotações por Aluno
- **Tabela Afetada:** `lesson_notes`
- **Alteração Estrutural:** Remoção da constraint `uq_lesson_user_note` (`ALTER TABLE lesson_notes DROP CONSTRAINT IF EXISTS uq_lesson_user_note;`), permitindo que o aluno crie múltiplos badges/cards de anotações individuais para a mesma aula, com edição e exclusão independente por item.
- **Script de Migração:** `backend/scripts/migrate_multiple_lesson_notes.py`

---

### [30/09/2026] - Personalização Visual da Área de Membros (Estilo Netflix, Cores e Capas)
- **Tabela Afetada:** `courses`
  - `bg_color`: Cor de fundo da área de membros / curso (`VARCHAR`, default `'#090d16'`).
  - `cover_image_url`: Imagem de banner panorâmico hero para o topo do curso (`VARCHAR`, opcional).
- **Tabela Afetada:** `modules`
  - `image_url`: Imagem de capa/pôster do módulo para exibição em cards estilo Netflix (`VARCHAR`, opcional).
- **Script de Migração:** `backend/scripts/migrate_course_and_module_customization.py`

---

### [30/09/2026] - Status de Disponibilidade da Aula ("Disponível" / "Em Breve")
- **Tabela Afetada:** `lessons`
- **Coluna Adicionada:**
  - `availability_status`: Define se a aula está pronta para reprodução (`'available'`) ou marcada como em produção/em breve (`'coming_soon'`), com default `'available'`.
- **Script de Migração:** `backend/scripts/migrate_lesson_availability_status.py`

---

### [30/09/2026] - Tempo de Acesso por Produto/Curso para Alunos (Vitalício e Períodos Determinados)
- **Tabela Afetada:** `user_courses`
- **Colunas Adicionadas:**
  - `access_duration`: Identificador do prazo de acesso do aluno àquele curso específico (`'lifetime'`, `'1_month'`, `'3_months'`, `'6_months'`, `'1_year'`, `'2_years'`, `'3_years'`), default `'lifetime'`.
  - `expires_at`: Data e hora (`TIMESTAMP`) de expiração do acesso do aluno ao curso (`NULL` quando for vitalício).
---

### [30/09/2026] - Módulo de Integrações e Webhooks por Marcos de Progresso (25%, 50%, 75%, 100%)
- **Tabelas Criadas:**
  - `webhooks`: Cadastro de endpoints de integração para disparo de eventos (`id`, `name`, `url`, `events`, `course_id`, `secret_key`, `is_active`, `created_at`, `updated_at`).
  - `webhook_logs`: Histórico e auditoria de cada requisição disparada (`id`, `webhook_id`, `event`, `payload`, `response_status`, `response_body`, `success`, `error_message`, `created_at`).
- **Índices Criados:**
  - `ix_webhooks_id`, `ix_webhooks_course_id`.
  - `ix_webhook_logs_id`, `ix_webhook_logs_webhook_id`.
- **Script de Migração:** `backend/scripts/migrate_webhooks_tables.py`

---

### [30/09/2026] - Módulo de Suporte e Comunidade de Dúvidas de Cursos
- **Tabelas Criadas:**
  - `support_topics`: Armazena tópicos/dúvidas de alunos sobre os cursos (`id`, `user_id`, `course_id`, `title`, `content`, `image_url`, `status`, `likes_count`, `created_at`, `updated_at`).
  - `support_replies`: Respostas enviadas por alunos e instrutores/admins (`id`, `topic_id`, `user_id`, `content`, `image_url`, `is_instructor_reply`, `created_at`).
  - `support_topic_likes`: Curtidas em tópicos para ordenação por relevância/popularidade (`id`, `topic_id`, `user_id`, `created_at`, UNIQUE `(topic_id, user_id)`).
- **Índices Criados:**
  - `ix_support_topics_id`, `ix_support_topics_user_id`, `ix_support_topics_course_id`.
  - `ix_support_replies_id`, `ix_support_replies_topic_id`, `ix_support_replies_user_id`.
  - `ix_support_topic_likes_id`, `ix_support_topic_likes_topic_id`, `ix_support_topic_likes_user_id`.
---

### [01/10/2026] - Pontuação Personalizada por Pergunta e % Mínima de Aprovação no Quiz
- **Tabelas Afetadas:**
  - `lessons`: Adicionada coluna `passing_score_pct` (INTEGER, DEFAULT 70) para definir a porcentagem mínima de aprovação do quiz por aula.
  - `quiz_questions`: Adicionada coluna `points` (INTEGER, DEFAULT 1) para atribuir pontuação/peso individual a cada pergunta.
  - `quiz_submissions`: Adicionadas colunas `total_points` (INTEGER, DEFAULT 0) e `earned_points` (INTEGER, DEFAULT 0) para histórico detalhado do cálculo por pontos.
- **Script de Migração:** `backend/scripts/migrate_quiz_scoring.py`

---

### [01/10/2026] - Convites com Expiração Indefinida e Campo de WhatsApp para Alunos
- **Tabelas Afetadas:**
  - `users`: Adicionada coluna `phone` (VARCHAR(50), NULL) para armazenar o número de WhatsApp informado pelo aluno no cadastro ou editado pelo administrador.
  - `registration_verifications`: Adicionada coluna `phone` (VARCHAR(50), NULL) para preservar o número informado durante o fluxo de verificação OTP por e-mail.
  - `invites`: Alterada coluna `expires_at` para permitir `NULL` (`DROP NOT NULL`), suportando links de convite que nunca expiram.
- **Script de Migração:** `backend/scripts/migrate_invite_indefinite_and_user_phone.py`

---

### [01/10/2026] - Melhor Resposta / Solução Oficial em Dúvidas do Suporte
- **Tabela Afetada:**
  - `support_replies`: Adicionada coluna `is_solution` (BOOLEAN, DEFAULT FALSE) para marcar respostas como solução oficial aceita pelo autor ou instrutor.
- **Script de Migração:** `backend/scripts/migrate_support_solution.py`

---

### [01/10/2026] - Criação da Tabela de Tokens de API (API Keys)
- **Tabela Criada:**
  - `api_tokens`: Armazena chaves de API permanentes para integrações externas com a plataforma (`id`, `user_id`, `name`, `token`, `masked_token`, `is_active`, `last_used_at`, `expires_at`, `created_at`).
- **Índice Criado:** `ix_api_tokens_token`.
- **Script de Migração:** `backend/scripts/migrate_api_tokens.py`

---

### [05/10/2026] - Criação da Tabela de Mensagens do Chat da Comunidade (Chat Messages)
- **Tabela Criada:**
  - `chat_messages`: Armazena as mensagens trocadas no chat da comunidade geral e nos canais dedicados por curso (`id`, `channel_type`, `course_id`, `user_id`, `message`, `created_at`, `updated_at`).
- **Índices Criados:**
  - `ix_chat_messages_id`, `ix_chat_messages_channel_type`, `ix_chat_messages_course_id`, `ix_chat_messages_user_id`, `ix_chat_messages_created_at`.
- **Script de Migração:** `backend/scripts/migrate_chat_tables.py`

---

### [05/10/2026] - Adição da Foto/Logo de Perfil do Usuário
- **Tabela Afetada:**
  - `users`: Adicionada coluna `avatar_url` (VARCHAR, NULL) para armazenar a foto de perfil/logo do usuário.
- **Script de Migração:** `backend/scripts/migrate_user_avatar.py`

---

### [05/10/2026] - Link da Página de Vendas do Curso (sales_page_url) e Vitrine de Não Adquiridos
- **Tabela Afetada:**
  - `courses`: Adicionada coluna `sales_page_url` (VARCHAR, NULL) para armazenar o link externo da página de vendas/mais informações exibido para alunos que ainda não possuem acesso ao curso.
- **Script de Migração:** `backend/scripts/migrate_course_sales_page_url.py`

---

---

### [05/10/2026] - Tabela de Depoimentos e Avaliações de Cursos (Testimonials)
- **Tabela Criada:**
  - `testimonials`: Armazena os depoimentos e avaliações dos alunos sobre os cursos (`id`, `user_id`, `course_id`, `rating`, `title`, `content`, `status`, `is_featured`, `created_at`, `updated_at`).
- **Índices Criados:**
  - `ix_testimonials_id`, `ix_testimonials_user_id`, `ix_testimonials_course_id`, `ix_testimonials_status`, `ix_testimonials_is_featured`, `ix_testimonials_created_at`.
- **Script de Migração:** `backend/scripts/migrate_testimonials.py`

---

### [05/10/2026] - Tabela de Pontuação de Gamificação e Ranking de Alunos (Gamification Points)
- **Tabela Criada:**
  - `gamification_points`: Armazena o extrato de pontuações atribuídas exclusivamente a alunos por ações meritórias (`id`, `user_id`, `action`, `points`, `description`, `reference_id`, `created_at`).
- **Índices Criados:**
  - `ix_gamification_points_id`, `ix_gamification_points_user_id`, `ix_gamification_points_action`, `ix_gamification_points_reference_id`, `ix_gamification_points_created_at`.
- **Script de Migração:** `backend/scripts/migrate_gamification.py`

---

### [05/10/2026] - Restrição de 1 Depoimento por Curso por Usuário (Unicidade de Testimonials)
- **Tabela Afetada:**
  - `testimonials`: Adicionada constraint / índice único `uq_testimonials_user_course` em `(user_id, course_id)`, impedindo cadastros duplicados de avaliações para o mesmo curso pelo mesmo aluno.
- **Script de Migração:** `backend/scripts/migrate_testimonial_unique_user_course.py`

---

### [05/10/2026] - Recursos do Chat da Comunidade (Mídia, Fixação, Curtidas, Favoritos) e Curtidas em Comentários de Aulas
- **Tabela Afetada:**
  - `chat_messages`: Adicionadas colunas `media_url` (VARCHAR(500)), `media_type` (VARCHAR(50)), `is_pinned` (BOOLEAN, default FALSE), `pinned_at` (TIMESTAMP), `pinned_by_user_id` (INTEGER, FK users). Índice `ix_chat_messages_is_pinned`.
- **Tabelas Criadas:**
  - `chat_message_likes`: Registro de curtidas por mensagem de chat (`id`, `message_id`, `user_id`, `created_at`, UNIQUE `uq_chat_message_like_user`).
  - `chat_message_favorites`: Registro de mensagens favoritadas por usuário (`id`, `message_id`, `user_id`, `created_at`, UNIQUE `uq_chat_message_favorite_user`).
  - `lesson_comment_likes`: Registro de curtidas em comentários e respostas de aulas (`id`, `comment_id`, `user_id`, `created_at`, UNIQUE `uq_lesson_comment_like_user`).
- **Script de Migração:** `backend/scripts/migrate_chat_features_and_comment_likes.py`

---

### [05/10/2026] - Transcrição Automática e Resumo Inteligente com IA (OpenAI Whisper & GPT)
- **Tabela Criada:**
  - `lesson_transcriptions`: Armazena a transcrição textual completa do vídeo da aula via OpenAI Whisper e o resumo executivo/documento HTML gerado pelo modelo GPT (`id`, `lesson_id` UNIQUE FK, `full_transcript`, `summary_html`, `summary_markdown`, `key_takeaways`, `status`, `error_message`, `generated_by_user_id` FK, `created_at`, `updated_at`).
- **Índices Criados:**
  - `ix_lesson_transcriptions_id`, `ix_lesson_transcriptions_lesson_id`.
- **Script de Migração:** `backend/scripts/migrate_lesson_transcriptions.py`

---

### [05/10/2026] - Tabela de Links da Plataforma / Redes Sociais na Barra Lateral (Platform Links)
- **Tabela Criada:**
  - `platform_links`: Armazena links externos e redes sociais (Instagram, YouTube, etc.) gerenciados pelo administrador para exibição na seção "Links" da barra lateral (`id`, `title`, `url`, `icon`, `order_index`, `is_active`, `created_at`, `updated_at`).
- **Índices Criados:**
  - `ix_platform_links_id`.
- **Script de Migração:** `backend/scripts/migrate_platform_links.py`

---

### [05/10/2026] - Métricas de Tokens e Custos em Reais (BRL) na Transcrição IA
- **Tabela Afetada:**
  - `lesson_transcriptions`: Adicionadas as colunas `audio_duration_seconds` (FLOAT), `prompt_tokens` (INTEGER), `completion_tokens` (INTEGER), `estimated_cost_usd` (FLOAT) e `estimated_cost_brl` (FLOAT) para mensuração precisa de consumo e custo das APIs da OpenAI (Whisper + GPT-4o-mini).
- **Script de Migração:** `backend/scripts/migrate_transcription_cost_columns.py`

---

### [05/10/2026] - Sistema de Suporte ao Aluno (Tópicos, Mensagens e Anexos)
- **Tabelas Criadas:**
  - `support_topics`: Tópicos/chamados de suporte abertos por alunos ou vinculados a cursos/aulas (`id`, `user_id`, `course_id`, `lesson_id`, `title`, `description`, `status`, `priority`, `created_at`, `updated_at`).
  - `support_messages`: Mensagens enviadas dentro do tópico de suporte (`id`, `topic_id`, `user_id`, `message`, `is_staff_reply`, `created_at`).
  - `support_attachments`: Anexos vinculados a tópicos ou mensagens (`id`, `topic_id`, `message_id`, `file_url`, `file_name`, `file_type`, `file_size`, `created_at`).
- **Script de Migração:** `backend/scripts/migrate_support_tables.py`

---

### [05/10/2026] - Fixação Personalizada de Dúvidas de Suporte (Support Topic Pins)
- **Tabela Criada:**
  - `support_topic_pins`: Armazena as dúvidas/tópicos de suporte fixados individualmente por cada usuário (limite de até 5 por usuário) (`id`, `topic_id`, `user_id`, `created_at`).
- **Constraint Única:**
  - `uq_support_topic_pin` em `(topic_id, user_id)` para prevenir duplicatas de fixação.
- **Índices Criados:**
  - `ix_support_topic_pins_id`, `ix_support_topic_pins_topic_id`, `ix_support_topic_pins_user_id`.
- **Script de Migração:** `backend/scripts/migrate_support_topic_pins.py`

---

### [05/10/2026] - Sistema de Favoritos Unificado (Aulas, Comentários, Dúvidas e Mensagens)
- **Tabelas Criadas:**
  - `lesson_favorites`: Aulas favoritadas pelos usuários para acesso rápido (`id`, `lesson_id`, `user_id`, `created_at`). Constraint única `uq_lesson_favorite_user` em `(lesson_id, user_id)`.
  - `lesson_comment_favorites`: Comentários de aulas favoritados pelos usuários (`id`, `comment_id`, `user_id`, `created_at`). Constraint única `uq_lesson_comment_favorite_user` em `(comment_id, user_id)`.
- **Primary Key Garantida:**
  - `lesson_comments`: Chave primária assegurada em `id`.
- **Índices Criados:**
  - `ix_lesson_favorites_lesson_id`, `ix_lesson_favorites_user_id`.
  - `ix_lesson_comment_favorites_comment_id`, `ix_lesson_comment_favorites_user_id`.
- **Script de Migração:** `backend/scripts/migrate_favorites.py`

---

### [05/10/2026] - Correção de Sequências Autoincrement no Chat (Favorites e Likes)
- **Tabelas Afetadas:**
  - `chat_message_favorites`: Criada sequência `chat_message_favorites_id_seq` e definido `DEFAULT nextval(...)` para a coluna `id`, resolvendo erro de `null value in column "id" violates not-null constraint`.
  - `chat_message_likes`: Criada sequência `chat_message_likes_id_seq` e definido `DEFAULT nextval(...)` para a coluna `id`.
- **Script de Migração:** `backend/scripts/fix_chat_favorites_sequence.py`

---

### [05/10/2026] - Sistema de Favoritos de Dúvidas de Suporte (Support Topic Favorites)
- **Tabela Criada:**
  - `support_topic_favorites`: Armazena as dúvidas de suporte favoritadas individualmente pelo usuário para o menu global de Favoritos (`id`, `topic_id`, `user_id`, `created_at`).
- **Constraint Única:**
  - `uq_support_topic_favorite` em `(topic_id, user_id)`.
- **Índices Criados:**
  - `ix_support_topic_favorites_id`, `ix_support_topic_favorites_topic_id`, `ix_support_topic_favorites_user_id`.
- **Script de Migração:** `backend/scripts/migrate_support_topic_favorites.py`

---

### [06/10/2026] - Sistema de Threads e Menções no Chat da Comunidade
- **Tabela e Colunas Afetadas:**
  - `chat_messages`: Adicionada a coluna `parent_id` (INTEGER, chave estrangeira autorreferencial para `chat_messages.id` com `ON DELETE CASCADE`) para estruturação de threads/respostas alinhadas.
  - `chat_mentions`: Nova tabela criada para rastreamento de menções (`@nome`) em mensagens (`id`, `message_id`, `mentioned_user_id`, `is_read`, `created_at`).
- **Índices Criados:**
  - `ix_chat_messages_parent_id`.
  - `ix_chat_mentions_message_id`, `ix_chat_mentions_mentioned_user_id`, `ix_chat_mentions_is_read`.
- **Script de Migração:** `backend/scripts/migrate_chat_threads_and_mentions.py`

---

### [06/10/2026] - Correção e Vinculação de Sequences de ID no PostgreSQL
- **Problema Corrigido:** Diversas tabelas no PostgreSQL tinham sequences criadas (`<tabela>_id_seq`), mas a coluna `id` estava sem o `DEFAULT nextval('...')` configurado, provocando erro de `NotNullViolation: null value in column "id"` ao inserir novos registros (como progresso de aula `lesson_progress`, tokens de reset, etc.).
- **Tabelas Corrigidas:** `lesson_progress`, `password_reset_tokens`, `chat_messages`, `courses`, `modules`, `lessons`, `api_tokens`, `invites`, `lesson_attachments`, `lesson_comments`, `lesson_notes`, `lesson_ratings`, `lesson_reports`, `lesson_transcriptions`, `lesson_videos`, `platform_links`, `quiz_options`, `gamification_points`.
- **Script de Migração/Correção:** `backend/scripts/fix_id_sequences.py`

---

### [06/10/2026] - Sistema de DMs (Mensagens Diretas) e Inbox Privada
- **Tabela e Colunas Afetadas:**
  - `chat_messages`: Adicionadas as colunas `recipient_id` (INTEGER, chave estrangeira para `users.id` com `ON DELETE CASCADE`) e `is_read` (BOOLEAN NOT NULL DEFAULT FALSE) para suportar conversas 1-a-1 e rastreamento de leitura.
- **Índices Criados:**
  - `ix_chat_messages_recipient_id` e `ix_chat_messages_is_read`.
- **Script de Migração:** `backend/scripts/migrate_chat_dms.py`

---

### [06/10/2026] - Etiquetas de Alunos e Disparo em Massa de Mensagens Diretas (DMs)
- **Tabelas Criadas:**
  - `student_tags`: Armazena etiquetas de categorização de alunos (`id`, `name`, `color`, `description`, `created_at`).
  - `student_tag_assignments`: Relacionamento N:N entre alunos e etiquetas (`id`, `student_id`, `tag_id`, `created_at`).
  - `chat_broadcast_campaigns`: Registro de campanhas de disparo em massa (`id`, `created_by_user_id`, `title`, `message`, `filter_type`, `filter_course_id`, `filter_tag_id`, `filter_role`, `total_recipients`, `sent_count`, `failed_count`, `delay_seconds`, `status`, `started_at`, `completed_at`, `duration_seconds`, `created_at`).
  - `chat_broadcast_recipients`: Histórico e auditoria de cada aluno destinatário da campanha (`id`, `campaign_id`, `recipient_id`, `message_id`, `status`, `error_message`, `sent_at`, `read_at`, `created_at`).
- **Colunas Adicionadas:**
  - `chat_messages`: Adicionada coluna `read_at` (TIMESTAMP WITH TIME ZONE NULL).
- **Script de Migração:** `backend/scripts/migrate_chat_broadcasts.py`

---

### [06/10/2026] - Botões de Ação Interativos (CTA) e Filtro de Recência em Disparos e Chat
- **Tabelas Afetadas:**
  - `chat_messages`: Adicionadas colunas `button_text` (VARCHAR(100) NULL), `button_url` (VARCHAR(500) NULL) e `button_action_type` (VARCHAR(30) NULL) para suportar botões de ação interativos (Link externo ou navegação interna) nas mensagens.
  - `chat_broadcast_campaigns`: Adicionadas colunas `filter_days` (INTEGER NULL) para segmentação por tempo de cadastro (7, 14, 30 dias), `button_text` (VARCHAR(100) NULL), `button_url` (VARCHAR(500) NULL) e `button_action_type` (VARCHAR(30) NULL) para configuração de botões de ação no disparo em massa.
- **Script de Migração:** `backend/scripts/migrate_chat_broadcast_buttons_and_recency.py`


















---

### [05/11/2026] - Sistema de Tutor IA Interativo 24h (Micro-SaaS & Assinatura)
- **Tabelas Afetadas e Criadas:**
  - `users`: Adicionadas colunas `ai_tutor_active` (BOOLEAN DEFAULT FALSE), `ai_tutor_expires_at` (TIMESTAMP WITH TIME ZONE NULL) e `ai_tutor_custom_monthly_limit` (INTEGER NULL).
  - `ai_tutor_settings`: Criada tabela para parâmetros globais (`id`, `tutor_name`, `default_monthly_free_questions`, `system_prompt`, `temperature`, `model_name`, `is_enabled`, `sales_checkout_url`, `monthly_price_brl`, `created_at`, `updated_at`).
  - `ai_tutor_messages`: Criada tabela para histórico de conversas e métricas de consumo (`id`, `user_id`, `course_id`, `lesson_id`, `role`, `content`, `prompt_tokens`, `completion_tokens`, `cost_brl`, `related_lessons_json`, `created_at`).
- **Scripts de Migração:**
  - `backend/scripts/migrate_ai_tutor.py`
  - `backend/scripts/add_tutor_name_column.py`

---

### [05/11/2026] - RAG Vetorial e Base de Conhecimento (ai_knowledge_chunks)
- **Tabelas Afetadas e Criadas:**
  - `modules`: Adicionada constraint de chave primária explícita (`pk_modules PRIMARY KEY (id)`).
  - `ai_knowledge_chunks`: Tabela criada para armazenamento dos fragmentos de aulas e embeddings normalizados da OpenAI (`id`, `course_id`, `module_id`, `lesson_id`, `chunk_index`, `content`, `start_time_seconds`, `end_time_seconds`, `embedding_json`, `token_count`, `created_at`, `updated_at`).
- **Índices Criados:**
  - `ix_ai_knowledge_chunks_course_id`
  - `ix_ai_knowledge_chunks_module_id`
  - `ix_ai_knowledge_chunks_lesson_id`
- **Script de Migração:** `backend/scripts/migrate_ai_knowledge_chunks.py`

---

### [06/11/2026] - Sistema de Avaliação de Respostas do Tutor IA (Like/Dislike e Feedback com Justificativa)
- **Tabela Afetada:** `ai_tutor_messages`
- **Colunas Adicionadas:**
  - `feedback_rating`: VARCHAR(10) NULL (registra `'like'` ou `'dislike'`).
  - `feedback_text`: TEXT NULL (armazena a justificativa/comentário pedagógico enviado pelo aluno ao avaliar negativamente a resposta).
  - `feedback_at`: TIMESTAMP NULL (timestamp UTC do registro da avaliação).
- **Script de Migração:** `backend/scripts/add_tutor_feedback_columns.py`


---

### [06/11/2026] - Modo de Acesso & Modo Manutenção do Tutor IA
- **Tabela Afetada:** `ai_tutor_settings`
- **Colunas Adicionadas:**
  - `access_mode`: VARCHAR(30) DEFAULT 'public' ('public', 'maintenance', 'private_team', 'disabled')
  - `maintenance_message`: TEXT NULL (mensagem personalizada exibida aos alunos no chat em manutenção)
- **Script de Migração:** `backend/scripts/add_tutor_access_mode_columns.py`

---

### [06/11/2026] - Diretrizes de Conduta (Permitido vs Proibido) e Sugestões de Alunos do Tutor IA
- **Tabela Afetada:** `ai_tutor_settings`
  - `allowed_topics`: TEXT NULL (escopo pedagógico de tópicos permitidos)
  - `prohibited_topics`: TEXT NULL (tópicos proibidos, ex: interpretação personalizada de trânsitos astrológicos)
  - `redirect_app_url`: VARCHAR(500) NULL (link do aplicativo/agente focado para onde o aluno será direcionado)
  - `redirect_app_name`: VARCHAR(150) NULL (nome de exibição do aplicativo parceiro)
  - `prohibited_response_guideline`: TEXT NULL (instruções de tom de recusa e encaminhamento)
- **Nova Tabela:** `ai_tutor_suggestions`
  - `id`: SERIAL PRIMARY KEY
  - `user_id`: INTEGER REFERENCES users(id) ON DELETE CASCADE
  - `course_id`: INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL
  - `lesson_id`: INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL
  - `suggestion_text`: TEXT NOT NULL
  - `category`: VARCHAR(50) DEFAULT 'platform_improvement'
  - `status`: VARCHAR(30) DEFAULT 'new' ('new', 'analyzing', 'implemented', 'dismissed')
  - `admin_notes`: TEXT NULL
  - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- **Script de Migração:** `backend/scripts/add_tutor_guidelines_and_suggestions.py`

---

### [11/11/2026] - Sistema de Stories da Comunidade (Efêmeros 24h & Destaques)
- **Novas Tabelas Criadas:**
  - `community_stories`:
    - `id`: SERIAL PRIMARY KEY
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `media_url`: VARCHAR(500) NOT NULL
    - `media_type`: VARCHAR(20) DEFAULT 'image' NOT NULL
    - `media_thumbnail_url`: VARCHAR(500) NULL
    - `caption`: VARCHAR(500) NULL
    - `duration_seconds`: INTEGER DEFAULT 5 NOT NULL
    - `is_highlight`: BOOLEAN DEFAULT FALSE NOT NULL
    - `highlight_title`: VARCHAR(100) NULL
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - `expires_at`: TIMESTAMP WITH TIME ZONE NOT NULL
  - `community_story_views`:
    - `id`: SERIAL PRIMARY KEY
    - `story_id`: INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `viewed_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    - UNIQUE (`story_id`, `user_id`)
  - `community_story_reactions`:
    - `id`: SERIAL PRIMARY KEY
    - `story_id`: INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE
    - `user_id`: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    - `reaction_type`: VARCHAR(30) NOT NULL ('fire', 'heart', 'clap', 'laugh', 'rocket')
    - `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
- **Auto-migração no Startup:** Incluído no `lifespan` do `backend/app/main.py` (PostgreSQL e SQLite).
- **Script de Migração:** `backend/scripts/migrate_community_stories.py`


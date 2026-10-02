# Log de Integridade e Histórico de Esquema do Banco de Dados

Registro de migrações e atualizações estruturais do banco de dados (PostgreSQL/SQLite) do **Projeto Base**.

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




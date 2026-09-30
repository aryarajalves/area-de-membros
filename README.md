# Área de Membros - Plataforma de Cursos e Treinamentos

Plataforma de alta performance para **Área de Membros e Gestão de Cursos Online**, construída com arquitetura moderna, responsiva e escalável utilizando **FastAPI (Backend em Python)**, **React + Vite (Frontend)**, banco de dados relacional **PostgreSQL**, armazenamento em nuvem no **Backblaze B2 (compatível com S3)** e orquestração completa via **Docker**.

---

## ✨ Principais Funcionalidades

### 🎓 1. Sala de Aula e Experiência do Aluno
- **Vitrine Netflix & Banner Hero:**
  - Banner Hero cinematográfico com suporte a capa personalizada ou gradiente dark glassmorphism.
  - Carrossel horizontal de módulos com miniaturas (posters), contadores de aulas e barra de progresso individual.
  - Vitrine de cursos com paginação inteligente (20 cursos por página) e controle de acesso individual.
- **Player de Vídeo Customizado HTML5 (`CustomVideoPlayer`):**
  - **Barra de Progresso Interativa (Scrubbing / Seek):** Avanço e retrocesso livre clicando ou arrastando na timeline do vídeo.
  - **Avançar e Voltar 10s:** Botões dedicados `-10s` e `+10s` para saltos rápidos no aprendizado.
  - **Tempo Restante Dinâmico:** Exibe o tempo decorrido, duração total e tempo que falta para o término do vídeo (ex: `00:09 / 10:00 (Faltam 09:51)`).
  - **Ajuste Fino de Áudio e Fullscreen:** Controle de volume deslizante, mute/unmute e alternância para tela cheia nativa.
- **Armazenamento e Streaming em Nuvem (Backblaze B2):**
  - Upload de arquivos de vídeo MP4, WebM, MOV ou MKV de até **2 GB (2048 MB)** diretamente para a nuvem.
  - Capas personalizadas para cada aula (Posters 1280×720, 16:9).
  - Suporte a links externos e embeds (YouTube, Vimeo, Panda Video).
- **Aulas Multilíngues (Múltiplos Idiomas):**
  - Faixas de vídeo, títulos e descrições independentes por idioma (Português, Inglês, Espanhol, Francês, Alemão, Italiano).
  - Rótulos customizáveis e alternância em tempo real no player sem recarregar a página.
- **Status "Em Breve / Em Produção":**
  - Identificação visual com badge âmbar na timeline e tela acolhedora de espera caso a aula ainda não possua vídeo gravado.
- **Comentários e Respostas:**
  - Aba de comentários da aula com respostas aninhadas em 1 nível, paginação (20 por página) e moderação por administradores.
- **Materiais Complementares:**
  - Upload de anexos de até 100 MB (PDF, Word, Excel, PowerPoint, ZIP) com títulos e descrições personalizadas.

---

### 👥 2. Gestão de Alunos e Controle de Validade (`/students`)
- **Controle Individual de Acesso por Produto:**
  - Concessão de cursos por aluno com prazos de validade específicos:
    - `Vitalício` (sem expiração)
    - `1 mês`, `3 meses`, `6 meses`, `1 ano`, `2 anos`, `3 anos`.
  - Bloqueio automático ao expirar a vigência (`403 Forbidden`).
- **Data e Horário em que Virou Aluno:**
  - Registro e exibição explícita do momento exato do cadastro: `Aluno desde: DD/MM/AAAA às HH:MM`.
- **Linha do Tempo Visual de Expiração:**
  - Para cursos não-vitalícios, exibe um painel de validade do curso com contador de dias restantes (`Faltam X dias`), barra de progresso temporal e alertas preventivos de renovação em tom âmbar quando faltarem 7 dias ou menos.
- **Histórico de Acesso e Aulas Assistidas:**
  - Modal com a linha do tempo cronológica de cada aula concluída pelo aluno no curso:
    - `Assistiu a aula completa em DD/MM/AAAA às HH:MM:SS`.
- **Exportação e Importação via Planilha (CSV e Excel):**
  - Exportação completa em **CSV (BOM UTF-8 para Excel)** e **Excel (.xlsx)** com cursos, prazos e progresso.
  - Importação em massa de novos alunos via CSV/XLSX com vinculação de múltiplos cursos, prazos e download de modelos.
- **Paginação Dinâmica de Alunos:**
  - Exibição de **20, 50, 100 ou 200 alunos por página**.

---

### 🔌 3. Módulo de Integrações & Webhooks (`/integrations`)
- **Automação Externa em Tempo Real:**
  - Conexão nativa com n8n, Zapier, Make, ActiveCampaign, CRMs e servidores externos via HTTP POST com payloads JSON.
- **Eventos de Marcos de Progresso:**
  - `course.progress.25`: Aluno atingiu 25% de conclusão.
  - `course.progress.50`: Aluno atingiu 50% de conclusão.
  - `course.progress.75`: Aluno atingiu 75% de conclusão.
  - `course.progress.100`: Aluno concluiu 100% das aulas do curso.
- **Eventos de Atividade e Matrícula:**
  - `lesson.completed`: Aula assistida/concluída.
  - `student.enrolled`: Novo aluno matriculado.
- **Eventos de Renovação de Acesso:**
  - `course.renewal.warning_7d`: Aviso disparado 7 dias antes do curso do aluno expirar.
  - `course.renewal.expired`: Notificação de expiração com status explícito: `"Renovação do Curso"`.
- **Assinatura Criptográfica HMAC-SHA256:**
  - Suporte a segredo compartilhado com envio de cabeçalho `X-Webhook-Signature: sha256=<hash>` para validação de integridade.
- **Disparo em Segundo Plano (`BackgroundTasks`):**
  - Disparos assíncronos sem bloqueio ou lentidão para o aluno na interface.
- **Disparo de Teste e Histórico de Logs:**
  - Botão "Testar" direto no card com resposta em tempo real.
  - Histórico detalhado de disparos com status HTTP, tempo em ms e JSON enviado.

---

### 🎨 4. Customização de Tema e Cores (`/settings`)
- **Seletor de Paleta Global:**
  - Presets elegantes: Dark Neon (Azul/Ciano), Obsidian Dark, Roxo Escuro, etc.
  - Color Picker hexadecimal livre para personalização da cor de fundo de toda a plataforma.
  - Persistência e aplicação dinâmica sem recarregar a aplicação.

---

### 💾 5. Backup Automático & Manual no S3 / Backblaze B2
- Geração de dumps compactados (`.dump.gz`) do PostgreSQL com envio seguro para a nuvem.
- Timestamps padronizados no **Horário Oficial de Brasília (UTC-3)**.
- Agendamento periódico configurável via APScheduler com política de retenção FIFO.
- Download direto e restauração de dados pelo painel.

---

### 🖥️ 6. Gerenciamento Avançado de Logs do Docker
- Terminal em tempo real dos contêineres Docker da aplicação (`backend` e `frontend`) via socket Unix nativo.
- Timestamps sincronizados no **Horário de Brasília (America/Sao_Paulo - UTC-3)**.
- Filtros por data, hora e severidade (`Todos`, `Info`, `Avisos`, `Erros`, `HTTP 2xx/3xx/4xx/5xx`).

---

## 📁 Estrutura de Pastas

```text
Area de Membros - Alunos/
├── backend/                       # API Python com FastAPI
│   ├── app/
│   │   ├── api/v1/endpoints/      # Rotas (courses, students, integrations, users, backups, logs)
│   │   ├── core/                  # Configurações, segurança, database e logger
│   │   ├── models/                # Modelos SQLAlchemy (user, course, webhook)
│   │   ├── schemas/               # Schemas Pydantic v2
│   │   ├── services/              # Serviços de negócio (storage, webhooks, import/export, backup)
│   │   └── main.py                # Entrypoint da aplicação FastAPI
│   ├── scripts/                   # Scripts de migração SQL rastreados
│   ├── tests/                     # Testes unitários com pytest
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                      # Interface React + Vite (Design Glassmorphism)
│   ├── src/
│   │   ├── components/            # Componentes modulares (< 500 linhas)
│   │   │   ├── course-classroom/  # Sala de aula, player de vídeo, comentários, anexos
│   │   │   ├── course-management/ # Vitrine de cursos e modais
│   │   │   ├── student-management/# Painel de alunos, linha do tempo, histórico, import/export
│   │   │   ├── integration-management/ # Webhooks, eventos de marcos, logs de disparo
│   │   │   ├── automated-backup/  # Gerenciamento de backups
│   │   │   ├── user-management/   # Gestão de convites e usuários
│   │   │   ├── PlatformSettings.jsx # Personalização de cor e tema
│   │   │   ├── LogManagement.jsx  # Logs de contêineres Docker
│   │   │   └── Sidebar.jsx        # Menu de navegação lateral
│   │   ├── context/               # ToastContext e autenticação
│   │   ├── services/              # authInterceptor e api client
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf                 # Nginx configurado com max_body_size 2500M
│   └── package.json
│
├── docker/                        # Orquestração de contêineres Docker
│   └── docker-compose.yml
└── scripts/
    └── audit_security.py          # Auditoria unificada de dependências (pip-audit + npm audit)
```

---

## 🚀 Como Executar com Docker

Para subir todo o ecossistema (PostgreSQL, Backend FastAPI e Frontend Nginx):

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

- **Frontend (Nginx + React)**: `http://localhost:3010`
- **Backend API (FastAPI)**: `http://localhost:8000`
- **Documentação Interativa Swagger**: `http://localhost:8000/docs`
- **Banco PostgreSQL**: `localhost:5435`

---

## 🧪 Suíte de Testes Unitários

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm test -- --run
```
> **171 testes unitários passando (100% de aprovação em 35 arquivos de teste)** cobrindo sala de aula, player de vídeo, histórico de alunos, webhooks e modais.

### Backend (Pytest)
```bash
docker exec area_de_membros_backend pytest tests/test_api.py
# ou localmente na pasta backend:
cd backend
pytest
```
> **19 testes unitários passando (100% de aprovação)** cobrindo endpoints de autenticação, cursos, cálculo de marcos de progresso, rotas de histórico e eventos de renovação.

---

## 🛡️ Auditoria de Segurança de Dependências

O projeto conta com um script de auditoria unificado que inspeciona pacotes do Python via `pip-audit` e bibliotecas do Node.js via `npm audit`:

```bash
python scripts/audit_security.py
```

---

## 📄 Regras de Negócio e Documentação

Para consultar a documentação completa de requisitos e comportamentos de domínio da plataforma, consulte o arquivo [BUSINESS_RULES.md](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/Arquivos/BUSINESS_RULES.md) e o histórico de migrações de banco em [DATABASE_SCHEMA_LOG.md](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/Arquivos/DATABASE_SCHEMA_LOG.md).

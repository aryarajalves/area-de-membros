# Área de Membros - Plataforma de Cursos e Treinamentos

Plataforma de alta performance para **Área de Membros e Gestão de Cursos Online**, construída com arquitetura moderna, responsiva e escalável utilizando **FastAPI (Backend em Python)**, **React + Vite (Frontend)**, banco de dados relacional **PostgreSQL**, armazenamento em nuvem no **Backblaze B2 (compatível com S3)** e orquestração completa via **Docker**.

---

## ✨ Principais Funcionalidades

### 🎓 1. Sala de Aula e Experiência do Aluno
- **Vitrine Netflix & Banner Hero:**
  - Banner Hero cinematográfico com suporte a capa personalizada ou gradiente dark glassmorphism.
  - Carrossel horizontal de módulos com miniaturas (posters), contadores de aulas e barra de progresso individual.
  - Vitrine de cursos com paginação inteligente (20 cursos por página) e controle de acesso individual.
- **Player de Vídeo Customizado HTML5 (`CustomVideoPlayer` & `VideoControls`):**
  - **Barra de Progresso Interativa (Scrubbing / Seek):** Avanço e retrocesso livre clicando ou arrastando na timeline do vídeo.
  - **Barra de Buffer Visual (`video-buffered-bar`):** Faixa translúcida no trilho de progresso que exibe exatamente quanto do vídeo foi baixado na memória à frente da reprodução.
  - **Overlay Neon de Carregamento e Buffering:** Painel central translúcido com spinner azul animado e mensagens descritivas (*"Carregando aula..."* / *"Carregando vídeo... Baixando dados de transmissão, aguarde..."*), eliminando sensações de travamento.
  - **Avançar e Voltar 10s:** Botões dedicados `-10s` e `+10s` para saltos rápidos no aprendizado.
  - **Tempo Restante Dinâmico:** Exibe o tempo decorrido, duração total e tempo que falta para o término do vídeo (ex: `00:09 / 10:00 (Faltam 09:51)`).
  - **Ajuste Fino de Áudio e Fullscreen:** Controle de volume deslizante, mute/unmute e alternância para tela cheia nativa.
  - **Campos de Descrição Expansíveis (`ExpandableTextarea`):** Botão de maximizar/restaurar para preenchimento confortável de textos longos na descrição de módulos e aulas.
- **Armazenamento e Streaming em Nuvem (Backblaze B2 / S3 Presigned URLs):**
  - **Upload em Segundo Plano (Fila Concorrente):** O envio ocorre de forma totalmente assíncrona pelo `UploadQueueContext` sem modais bloqueantes. O usuário pode salvar a aula imediatamente, fechar o formulário, criar outras aulas e enviar múltiplos vídeos grandes simultaneamente sem travar a interface.
  - **Widget Flutuante de Uploads (`BackgroundUploadWidget`):** Painel compacto no canto inferior direito que acompanha o progresso em tempo real (0% a 100%) de cada vídeo, permitindo minimizar, cancelar ou acompanhar múltiplos envios com mensagens descritivas de status e erro.
  - **Upload Direto com Presigned URLs:** Arquivos de vídeo de até **2 GB (2048 MB)** são transmitidos diretamente do navegador para o Backblaze B2 via URLs pré-assinadas seguras (`PUT`), eliminando sobrecarga no servidor proxy (Nginx/Traefik) e evitando erros de timeout.
  - **Auto-Recuperação e Resiliência B2:** Se a variável `BACKBLAZE_ENDPOINT_URL` estiver omitida no ambiente de produção, o sistema deriva automaticamente o endpoint S3 a partir do domínio configurado em `BACKBLAZE_CDN_URL`, garantindo que o upload direto permaneça sempre ativo.
  - **Fallback Automático:** Caso as credenciais do Backblaze B2 não estejam configuradas, o sistema comuta com segurança para o endpoint de upload local/backend sem interrupção para o usuário.
  - Capas personalizadas para cada aula (Posters 1280×720, 16:9).
  - Suporte a links externos e embeds (YouTube, Vimeo, Panda Video).
- **Aulas Multilíngues (Múltiplos Idiomas):**
  - Faixas de vídeo, títulos e descrições independentes por idioma (Português, Inglês, Espanhol, Francês, Alemão, Italiano).
  - Rótulos customizáveis e alternância em tempo real no player sem recarregar a página.
- **Status "Em Breve / Em Produção":**
  - Identificação visual com badge âmbar na timeline e tela acolhedora de espera caso a aula ainda não possua vídeo gravado.
- **Comentários e Respostas:**
  - Aba de comentários da aula com respostas aninhadas em 1 nível, paginação (20 por página) e moderação por administradores.
- **Vitrine de Cursos e Bloqueio Visual com Cadeado e Correntes (`ChainedLockOverlay`):**
  - Cursos não adquiridos/bloqueados exibem selo *"Disponível para Compra"*, botão *"Ver Mais Informações"* (redirecionando para a landing page configurada) e botão dedicado **"Entrar em Contato"** (`HelpCircle`) que leva o aluno diretamente para o canal interno de Suporte.
  - **Cadeado com Correntes Cruzadas:** Overlay estilizado sobre a thumbnail com correntes metálicas em 'X', escudo central em Glassmorphism neon cyan e etiqueta *"Produto Fechado / Acesso Restrito"*.
- **Transcrição e Resumo Inteligente com IA (OpenAI Whisper & GPT-4o-mini):**
  - **Extração com FFmpeg Otimizado:** Converte o vídeo em áudio MP3 otimizado mono 16kHz a 48kbps (respeitando o limite de 25 MB do Whisper para aulas de até 1h), com análise acelerada de streams remotos no Backblaze B2.
  - **Polling Silencioso em Segundo Plano:** Atualização de status em background sem piscar ou desmontar a interface.
  - **Transcrição Integral Whisper:** Transcrição completa em texto na íntegra.
  - **Resumo Executivo e Principais Pontos (Key Takeaways):** Síntese pedagógica gerada por IA com plano de ação prático.
  - **Documento HTML Inteligente:** Documento HTML5 autônomo com estilos modernos e suporte nativo a impressão/PDF (`@media print`), acessível diretamente pelo botão "Abrir Documento HTML" em nova aba.
  - **Tratamento Amigável de Quotas:** Detecção e mensagem explicativa em português caso a chave OpenAI esteja sem créditos.
  - **Interface Interativa:** Aba "Transcrição & Resumo IA" no player da aula com busca instantânea de termos, botão de cópia com feedback e re-geração para administradores.
- **Navegação Moderna em 3 Categorias (Sidebar):**
  - 🎓 **Área Pedagógica** (ou *Meu Aprendizado*): Cursos, Alunos, Suporte, Relatos de Aulas (com visualização permitida para Alunos em modo leitura).
  - 🚀 **Comunidade & Social**: Chat da Comunidade, Ranking & Conquistas, Depoimentos.
  - ⚙️ **Sistema & Configurações**: Configurações (com acesso para Alunos restrito à Cor de Fundo e Meu Perfil), Integrações, Gestão de Usuários, Backup Automático, Logs do Sistema.

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

---

### 🔑 4. Chaves de API e Tokens de Acesso (`/settings`)
- **Geração Segura de Chaves (`sk_live_...`):**
  - Chaves com 32 bytes de entropia criptográfica e hash persistido no banco de dados.
  - Prazos de expiração configuráveis: `30 dias`, `60 dias`, `90 dias`, `1 ano` ou `Não expira (Permanente)`.
  - Exibição única de segurança (`raw_token`) no momento da criação com botão de cópia e fallback garantido.
  - Gestão de chaves: listagem com mascaramento, ativação/pausa instantânea (toggle) e revogação definitiva.
- **Autenticação Dupla na API:**
  - Suporte transparente tanto a `Authorization: Bearer sk_live_...` quanto ao header `X-API-Key: sk_live_...`.
  - Atualização automática em background da data e horário do último uso (`last_used_at`).

---

### 📝 5. Aulas de Leitura (Artigos) e Quizes Interativos
- **Aulas de Artigo / Leitura (`content_type = 'text'`):**
  - Editor visual com abas de escrita e pré-visualização, formatação de títulos, listas e upload de imagens no Backblaze B2.
  - Visualizador editorial cinematográfico com barra de ações para conclusão e avaliação.
- **Aulas de Quiz Interativo (`content_type = 'quiz'`):**
  - Definição de porcentagem mínima de acertos (`passing_score_pct`) e pontuação personalizada por questão.
  - Cálculo ponderado de nota, conclusão automática ao atingir a nota de corte e proteção antifraude ocultando gabaritos.

---

### 💬 6. Comunidade & Suporte dos Cursos (`/support`)
- **Fórum Integrado de Dúvidas:**
  - Dúvidas vinculadas aos cursos liberados com histórico cronológico de respostas.
  - Curtidas (Likes) idempotentes e contadores em tempo real.
  - Eleição de **Solução Oficial / Melhor Resposta** pelos instrutores com destaque dourado e resolução automática da dúvida.
  - Cards de métricas no topo e pílulas de filtros rápidos (`Todas`, `Populares`, `Aguardando Resposta`, `Resolvidas`, `Minhas Dúvidas`).
  - Anexo de imagens com abertura em modal Lightbox de alta definição.

---

### 🎨 7. Customização de Tema e Navegação
- **Seletor de Paleta Global (`/settings`):**
  - Presets elegantes: Netflix Dark, Deep Navy, Obsidian, Slate, Emerald e Color Picker hexadecimal livre.
- **Menu Lateral Reorganizado por Foco Operacional:**
  - 🎓 **Gestão de Ensino:** Cursos, Alunos, Suporte e Relatos de Aulas.
  - 🛠️ **Administração:** Integrações e Configurações da Plataforma.
  - 🛡️ **Segurança:** Backup Automático, Gerenciamento de Logs e Gestão de Usuários (Super Admin).

---

### 💾 8. Backup Automático & Manual no S3 / Backblaze B2
- Dumps compactados (`.dump.gz`) do PostgreSQL com envio seguro para a nuvem.
- Timestamps no **Horário Oficial de Brasília (UTC-3)** e política de retenção FIFO.

---

### 🖥️ 9. Gerenciamento Avançado de Logs do Docker
- Terminal em tempo real dos contêineres Docker da aplicação (`backend` e `frontend`).
- Timestamps sincronizados no **Horário de Brasília (America/Sao_Paulo - UTC-3)** com filtros de data e severidade.

---

## 📁 Estrutura de Pastas

```text
Area de Membros - Alunos/
├── backend/                       # API Python com FastAPI
│   ├── app/
│   │   ├── api/v1/endpoints/      # Rotas (courses, students, integrations, users, api_tokens, support, quiz, backups, logs)
│   │   ├── core/                  # Configurações, segurança, database e logger
│   │   ├── models/                # Modelos SQLAlchemy (user, course, webhook, api_token, support)
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
│   │   │   ├── course-classroom/  # Sala de aula, player, artigos, quiz, comentários, anexos
│   │   │   ├── course-management/ # Vitrine de cursos e modais
│   │   │   ├── student-management/# Painel de alunos, linha do tempo, histórico, import/export
│   │   │   ├── support-management/# Fórum de dúvidas, solução oficial, lightbox
│   │   │   ├── platform-settings/ # Aparência, cores e gestão de Chaves de API
│   │   │   ├── integration-management/ # Webhooks, eventos de marcos, logs de disparo
│   │   │   ├── automated-backup/  # Gerenciamento de backups
│   │   │   ├── user-management/   # Gestão de convites e usuários (com WhatsApp e fuso Brasília)
│   │   │   ├── LogManagement.jsx  # Logs de contêineres Docker
│   │   │   └── Sidebar.jsx        # Menu de navegação lateral por categorias
│   │   ├── context/               # ToastContext (z-index 999999) e autenticação
│   │   ├── services/              # authInterceptor e api client
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf                 # Nginx configurado com max_body_size 2500M
│   └── package.json
│
├── docker/                        # Orquestração de contêineres Docker
│   ├── docker-compose.yml
│   └── docker-compose-producao.yml
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
- **Backend API (FastAPI)**: `http://localhost:8010`
- **Documentação Interativa Swagger**: `http://localhost:8010/docs`
- **Banco PostgreSQL**: `localhost:5435`

---

## 🧪 Suíte de Testes Unitários

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm test -- --run
```
> **260 testes unitários passando (100% de aprovação em 59 arquivos de teste)** cobrindo feedback visual de carregamento/buffer do player com transição de poster suave e modularização de controles (VideoControls), campos de descrição expansíveis (Maximizar/Restaurar), fila de uploads em segundo plano com painel flutuante, upload direto S3/Backblaze B2 com progresso em tempo real, sala de aula, player, artigos, quizes, suporte/comunidade, tokens de API, histórico de alunos, convites com fuso de Brasília, WhatsApp, responsividade mobile e logs.

### Backend (Pytest)
```bash
docker exec area_de_membros_backend pytest tests
# ou localmente na pasta backend:
cd backend
pytest
```
> **45 testes unitários passando (100% de aprovação)** cobrindo geração de URLs pré-assinadas S3/Backblaze B2, derivação resiliente de endpoint B2, validação de uploads diretos, autenticação JWT e API Token (Bearer / X-API-Key), cursos, marcos de progresso, rotas de convites, quizes, suporte, worker e monitoramento de logs.

---

## 🛡️ Auditoria de Segurança de Dependências

O projeto conta com um script de auditoria unificado que inspeciona pacotes do Python via `pip-audit` e bibliotecas do Node.js via `npm audit`:

```bash
python scripts/audit_security.py
```
> **Aprovado com 0 vulnerabilidades no Backend e 0 vulnerabilidades no Frontend.**

---

## 📄 Regras de Negócio e Documentação

Para consultar a documentação completa de requisitos e comportamentos de domínio da plataforma, consulte o arquivo [BUSINESS_RULES.md](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/Arquivos/BUSINESS_RULES.md) e o histórico de migrações de banco em [DATABASE_SCHEMA_LOG.md](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/Arquivos/DATABASE_SCHEMA_LOG.md).


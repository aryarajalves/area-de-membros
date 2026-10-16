# Área de Membros - Plataforma de Cursos e Treinamentos
> **Versão Oficial: `v1.2.0`** | **1.200 Testes Unitários Automatizados (100% Passing)** | **Docker Hub: `backend-1.2.0` / `frontend-1.2.0`**

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
  - **Capítulos e Minutagem Interativa com Edição (Admin/Super Admin):** Marcação de capítulos estilo YouTube com seek imediato no vídeo. Gestores contam com modal centralizado (`EditLessonChaptersModal`) para corrigir erros ortográficos ou palavras geradas incorretamente pela IA, alterar minutagens e adicionar/remover tópicos com sincronização em tempo real no player.
  - **Documento HTML Inteligente:** Documento HTML5 autônomo com estilos modernos e suporte nativo a impressão/PDF (`@media print`), acessível diretamente pelo botão "Abrir Documento HTML" em nova aba.
  - **Tratamento Amigável de Quotas:** Detecção e mensagem explicativa em português caso a chave OpenAI esteja sem créditos.
  - **Interface Interativa:** Aba "Transcrição & Resumo IA" no player da aula com busca instantânea de termos, botão de cópia com feedback e re-geração para administradores.
- **Recolhimento e Expansão de Módulos (Módulos Retráteis):**
  - Toggle interativo de abertura/fechamento por módulo na barra lateral da sala de aula com indicador animado Chevron (`ChevronDown` / `ChevronRight`) e contagem dinâmica de aulas.
  - Preservação da integridade de ações administrativas (`stopPropagation`) nos botões de gerenciar aulas, novo módulo e exclusão.
- **Navegação Moderna em 3 Categorias (Sidebar):**
  - 🎓 **Área Pedagógica** (ou *Meu Aprendizado*): Início (Tutoriais), Cursos, Alunos, Suporte, Relatos de Aulas (com visualização permitida para Alunos em modo leitura).
  - 🚀 **Comunidade & Social**: Apresente-se (Networking), Chat da Comunidade, Ranking & Conquistas, Depoimentos.
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

### ⚡ 10. Editor Visual de Funis de Automação (`/funnels`)
- **Canvas Interativo e Fluido:**
  - Navegação infinita (*pan*) com arrasto do mouse e controles de zoom centralizados (in, out, reset com indicador de porcentagem).
  - **Centralização Automática:** Ao carregar um funil existente ou navegar entre abas, o canvas calcula automaticamente o centro de massa de todos os nós e ajusta o enquadramento na tela.
  - Adição rápida de nós via menu inferior ou clique com botão direito no canvas.
- **Nós de Conteúdo, Fluxo, Lógica e Ações:**
  - **Mensagem:** Texto dinâmico com suporte a Spintax (`{Oi|Olá}`), variáveis (`{aluno}`) e até 3 botões interativos com links/ações.
  - **Mídia:** Suporte a imagens, vídeos e documentos anexos com legenda.
  - **Áudio:** Envio de arquivos de áudio com toggle para simular gravação na hora (*voice note*).
  - **Delay com Janela de Horário Comercial:** Temporizador com unidades configuráveis (segundos, minutos, horas, dias) e toggle expansível de Janela de Horário Comercial (ex: 09:00 às 20:00 e apenas dias úteis) respeitando o fuso de Brasília (`America/Sao_Paulo`).
  - **Nó de Teste A/B (`ab_split`):** Divisão estatística de tráfego com slider percentual (10% a 90%) e presets rápidos (50/50, 70/30, 80/20, 90/10), ramificando o fluxo em saídas `A` e `B` com badges temáticos nas conexões.
  - **Nó Condicional "Possui Curso?" (`course_condition`):** Verificação pedagógica de acesso ativo do aluno a um curso ou ferramenta (incluindo acesso herdado por Combos/Bundles), ramificando em saídas `SIM` (verde) e `NÃO` (vermelho).
  - **Nó Terminal "Encerrar Funil" (`stop`):** Finalização explícita do lead na automação, com opção de cancelar simultaneamente outros funis ativos do aluno.
  - **Nós de Ação Pedagógica:**
    - **Webhook:** Requisições HTTP externas customizáveis (GET/POST/PUT) com cabeçalhos e payload JSON.
    - **Matrícula Automática:** Liberação instantânea de novos cursos para o aluno com validade configurável (vitalício, meses, anos).
    - **Recompensa de XP:** Bonificação direta de experiência gamificada ao aluno.
    - **Notificação Interna:** Emissão de avisos pedagógicos no painel do aluno ou administradores.
  - **Nó de Etiquetas (Tags):**
    - **Adicionar Etiqueta:** Aplica uma ou mais tags aos alunos ao passarem pelo nó.
    - **Remover Etiqueta:** Remove tags específicas atribuídas ao contato.
    - **Verificar Etiqueta (Condicional):** Avalia se o contato possui etiquetas específicas com suporte a operadores lógicos **E (`AND`)** e **OU (`OR`)**, ramificando o fluxo em 2 saídas distintas: *"Possui etiqueta"* (verde) e *"Não possui etiqueta"* (cinza/laranja).
  - **Gatilhos Pedagógicos de Início de Funil (`trigger`):**
    - **Interesse de Compra no Curso:** Disparo automático quando o aluno clica no botão de interesse em curso fechado.
    - **Novo Aluno Cadastrado:** Disparo automático no momento do cadastro do aluno.
    - **Inatividade de Aluno:** Disparo após X dias sem acessar a plataforma.
    - **Marco de Progresso de Curso:** Disparo ao atingir 25%, 50%, 75% ou 100% de conclusão.
    - **Alerta de Renovação / Expiração:** Disparo quando faltam X dias para expirar a vigência do curso.
  - **Criação Rápida de Etiquetas com Paleta de Cores:** Modal centralizado com backdrop escuro (`FunnelCreateTagModal`) para cadastrar novas etiquetas informando nome e escolhendo entre 8 cores temáticas vibrantes.
- **Segurança de Fluxo e Confirmação de Ações:**
  - **Duplicação e Exclusão Seguras:** Modais centralizados com painel escuro translúcido para confirmação de duplicação ou exclusão tanto de nós individuais quanto do fluxo completo (`FunnelDuplicateConfirmModal`, `FunnelNodeConfirmModal`).
- **Histórico e Rastreamento Visual de Execuções (`FunnelExecutionsHistoryModal`):**
  - Modal para consultar o histórico detalhado de execuções do funil por contato.
  - **Visualização de Progresso (`FunnelExecutionFlowProgress`):** Renderização gráfica indicando exatamente até qual nó o lead avançou, se está pausado em um nó de delay ou se o fluxo foi concluído.
- **Conexões Bézier Precisas e Bidirecionais:**
  - Linhas curvas Bézier SVG suaves conectadas com precisão milimétrica no centro das bolinhas (*handles*) de entrada e saída.
  - Conexão bidirecional por arrasto (*drag-and-drop*) com detecção inteligente ao soltar tanto na bolinha quanto no card de destino.
  - Remoção de conexões pelo botão centralizado `×` e persistência do fluxo no PostgreSQL.

### 🏆 11. Gamificação RPG com 20 Níveis e Elos
- **Progressão RPG Desafiadora:**
  - 20 níveis distribuídos em 7 Elos: **Ferro (I-III)**, **Bronze (I-III)**, **Prata (I-III)**, **Ouro (I-III)**, **Platina (I-III)**, **Diamante (I-III)** e **Lenda (I-II)**.
  - Progressão balanceada por fórmula exponencial de XP.
- **Escada de Níveis RPG (`GamificationRpgLadderModal`):**
  - Modal interativo com visualização da trilha completa de elos, ícones neon temáticos, requisitos de pontuação e indicador de nível atual do aluno.
  - Layout resiliente com scroll independente e flexbox estruturado para visualização perfeita dos 20 níveis.
  - Badges dinâmicos integrados nos cards de alunos e rankings.
- **Painel de Nível e Ranking no Meu Perfil (`ProfileGamificationCard`):**
  - Card dedicado na aba Meu Perfil exibindo o Elo atual, badge temático, pontuação acumulada, barra de progresso para o próximo nível e posição no ranking em tempo real.
  - Botão de acesso rápido para inspecionar a escada completa de 20 níveis.

### 📢 12. Chat da Comunidade, Mensagens Diretas (DMs) Seguras & Broadcast
- **Criptografia Simétrica de Ponta a Ponta (DMs):**
  - Todas as conversas privadas entre usuários contam com criptografia simétrica robusta (`Fernet / AES-128-CBC` via biblioteca auditada `cryptography==50.0.2`), garantindo privacidade absoluta no banco de dados.
- **Sidebar de Membros e Perfil Interativo:**
  - Lista lateral com contatos online/offline, status de presença e modal de perfil do membro com botão de início de conversa privada imediata.
- **Recursos Ricos no Chat:**
  - Envio de áudio gravado e gravador de vídeo embutido (`ChatVideoRecorderModal`).
  - Seletor de GIFs animados integrado (`ChatGifPickerPopup`).
  - Envio de mídias com modal dedicado de legenda (`ChatImageCaptionModal`).
  - Pré-visualização automática de links externos (`ChatAttachedLinkPreview`) e anexo de links internos diretos para cursos e aulas da plataforma (`ChatInternalLinkModal`).
  - Menção de contatos com autocompletar `@` e destaque visual dinâmico.
- **Disparos em Massa (Chat Broadcast):**
  - Campanhas de mensagens segmentadas por tags de alunos, CTAs com botões interativos e histórico completo de entrega.

### 🛍️ 13. Vitrine de Cursos, Ferramentas, Combos e Rastreamento de Vendas
- **Classificação de Produtos (Cursos vs Ferramentas):**
  - Seletor de tipo de produto (`CourseTypeSelector`) permitindo catalogar conteúdos pedagógicos e ferramentas utilitárias na vitrine.
- **Criação de Combos / Bundles Agrupados (`CourseBundleSelector`, `CourseBundleGroup`):**
  - Agrupamento de múltiplos cursos e ferramentas em pacotes integrados com gestão visual unificada.
- **Rastreamento de Leads e Interesse de Vendas:**
  - Registro automático de cliques de alunos interessados em cursos fechados (`POST /courses/{id}/sales-click`).
  - **Modal de Histórico de Vendas (`CourseSalesHistoryModal`):** Gestores acompanham em tempo real os contatos que demonstraram interesse em cada produto com contadores de cliques e último acesso.

### 🎨 14. WhiteLabel e Identidade Visual Personalizada (`/settings`)
- **Customização Completa de Marca (`PlatformWhiteLabelTab` & `/api/v1/whitelabel`):**
  - Configuração de nome da plataforma, logo oficial, ícone/favicon e paleta de cores primárias.
  - Banner customizado na tela de login/boas-vindas com upload direto.
  - Aplicação reativa e persistente no TopNavbar, Sidebar e aba do navegador.

### 🧭 15. Central de Início e Tutoriais Interativos com IA (`/tutorials`)
- **Guia de Primeiros Passos e Onboarding:**
  - Vitrine de tutoriais para novos alunos com barra de progresso individual (`HomeTutorials`).
  - Geração automática de roteiros e etapas de tutorial utilizando inteligência artificial (`/api/v1/tutorials/ai-generate`).
  - Suporte a vídeos demonstrativos, links externos e checklist de passos concluídos pelo aluno.

### 🤝 16. Mural "Apresente-se" e Networking de Alunos (`/introductions`)
- **Comunidade Social de Apresentações:**
  - Feed interativo de networking onde alunos publicam biografia, foto de perfil, links sociais e vídeo de introdução (`IntroductionManagement`).
  - **Transcrição e Descrição com IA:** Upload de vídeo com transcrição automática via Whisper e síntese inteligente do perfil em texto.
  - Curtidas e comentários em tempo real com contadores dinâmicos.
  - Modais de exclusão e edição com confirmação segura e layout responsivo.

### 🔐 17. Gestão de Convites, Redirecionamento Inteligente e Auto-Migrações
- **Cópia de Link de Convite Desbloqueada:**
  - O botão de copiar link fica permanentemente disponível em todas as linhas da tabela de convites (`InviteTableTab.jsx`), permitindo copiar links mesmo para convites já utilizados ou expirados.
- **Redirecionamento Inteligente de Convite Utilizado ou Expirado:**
  - **Convite já utilizado (`already_used`):** Se o aluno possuir sessão ativa no navegador, é redirecionado instantaneamente para a tela principal da Área de Membros; caso a sessão esteja expirada, é direcionado com segurança para o login com notificação amigável.
  - **Convite expirado (`is_expired`):** Ao acessar um link de convite com validade esgotada, o sistema detecta a flag no backend (`GET /api/v1/users/invites/validate`), limpa o token da URL e redireciona de imediato para a tela de login (ou home se já autenticado), disparando notificação Toast explicativa (*"Este convite expirou. Entre em contato com o suporte para receber um novo link."*), eliminando telas de erro travadas.
- **Auto-Migrações Preventivas no Startup (`main.py`):**
  - No evento `lifespan` do FastAPI, a aplicação executa checagens e comandos SQL automáticos e idempotentes (`ALTER TABLE courses ADD COLUMN IF NOT EXISTS item_type/tool_url` e criação de `course_bundles`/`course_sales_clicks`). Isso assegura total resiliência entre o ORM e instâncias PostgreSQL de produção, prevenindo incidentes de colunas ausentes (`UndefinedColumn`) sem exigir intervenção manual via terminal.
- **Criação Manual e Registro Público Seguro:**
  - Cadastro de alunos e administradores com vinculação de cursos, validação rigorosa de senha com 12+ caracteres e fuso horário oficial de Brasília.
- **Handler Global de Exceções no FastAPI:**
  - Captura padronizada de erros inesperados retornando JSON `{"detail": "..."}` com status HTTP 500 e log estruturado, prevenindo vazamento de stack traces.

### 🛡️ 18. Diretrizes de Engenharia e Prevenção de Loops de Teste
- **Transparência de Progresso em Tempo Real:**
  - Operações de longa duração (builds de frontend, uploads Docker Hub, migrações de banco e suítes completas de testes) emitem notificações visuais de status a cada etapa, eliminando períodos de silêncio do agente de IA.
- **Bloqueio Obrigatório na 3ª Tentativa de Teste:**
  - Caso qualquer teste falhe por 2 vezes consecutivas, a 3ª tentativa deve ser obrigatoriamente precedida por um relatório detalhado no chat com a causa raiz e a correção proposta. Se falhar na 3ª vez, a execução é interrompida imediatamente para alinhamento com o usuário, extinguindo loops infinitos.

---

## 📁 Estrutura de Pastas

```text
Area de Membros - Alunos/
├── backend/                       # API Python com FastAPI
│   ├── app/
│   │   ├── api/v1/endpoints/      # Rotas (courses, students, funnels, chat_broadcast, student_tags, integrations, users, api_tokens, support, quiz, backups, logs, tutorials, introductions, whitelabel)
│   │   ├── core/                  # Configurações, segurança, database e logger
│   │   ├── models/                # Modelos SQLAlchemy (user, course, funnel, chat_broadcast, student_tag, webhook, api_token, support, tutorial, introduction)
│   │   ├── schemas/               # Schemas Pydantic v2
│   │   ├── services/              # Serviços de negócio (funnel, chat_broadcast, gamification, storage, webhooks, import/export, backup, ai_transcription)
│   │   └── main.py                # Entrypoint da aplicação FastAPI com Global Exception Handler
│   ├── scripts/                   # Scripts de migração SQL rastreados
│   ├── tests/                     # Testes unitários com pytest
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                      # Interface React + Vite (Design Glassmorphism)
│   ├── src/
│   │   ├── components/            # Componentes modulares (< 500 linhas)
│   │   │   ├── funnels/           # Editor visual de funis, canvas, nós e conexões
│   │   │   ├── course-classroom/  # Sala de aula, player, módulos retráteis, artigos, quiz, comentários, anexos
│   │   │   ├── course-management/ # Vitrine de cursos e modais
│   │   │   ├── student-management/# Painel de alunos, tags, broadcast, linha do tempo, histórico, import/export
│   │   │   ├── gamification/      # Ranking, escada de níveis RPG, regras e pódios
│   │   │   ├── support-management/# Fórum de dúvidas, solução oficial, lightbox
│   │   │   ├── platform-settings/ # Aparência, cores, WhiteLabel, Meu Perfil com RPG e gestão de Chaves de API
│   │   │   ├── home-tutorials/    # Central de tutoriais de início com IA
│   │   │   ├── introductions/     # Mural Apresente-se e networking com vídeo IA
│   │   │   ├── integration-management/ # Webhooks, eventos de marcos, logs de disparo
│   │   │   ├── automated-backup/  # Gerenciamento de backups
│   │   │   ├── user-management/   # Gestão de convites, criação manual de usuários (com WhatsApp e fuso Brasília)
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
    ├── check_limits.py            # Validação rigorosa de limites de linhas de código
    └── audit_security.py          # Auditoria unificada de dependências (pip-audit + npm audit)
```

---

## 🚀 Como Executar com Docker

### 📦 Imagens Oficiais de Produção (Docker Hub)

As imagens oficiais de produção estão publicadas no Docker Hub com versionamento semântico rígido (sem uso de tag `latest` para garantir deploys 100% reproduzíveis e imutáveis):

| Serviço | Imagem Docker Oficial | Descrição |
| :--- | :--- | :--- |
| **Backend API & Worker** | `aryalvesfernandes/area-de-membros:backend-1.1.0` | API FastAPI em Python 3.11 com worker periódico e auto-migrações preventivas no startup. |
| **Frontend Web** | `aryalvesfernandes/area-de-membros:frontend-1.1.0` | Interface React + Vite de alta performance servida por Nginx otimizado. |

#### Deploy em Produção (Docker Swarm / Traefik):
```bash
docker stack deploy -c docker/docker-compose-producao.yml area_de_membros
```

#### Execução em Desenvolvimento Local:
Para subir todo o ecossistema local (PostgreSQL, Backend FastAPI e Frontend Nginx):

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

- **Frontend (Nginx + React)**: `http://localhost:3010`
- **Backend API (FastAPI)**: `http://localhost:8010`
- **Documentação Interativa Swagger**: `http://localhost:8010/docs`
- **Banco PostgreSQL**: `localhost:5435`

---

## 🧪 Suíte de Testes Unitários

> 🏆 **Total de 1.200 testes unitários automatizados (100% de aprovação)** cobrindo ponta a ponta as regras de negócio da plataforma.

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm test -- --run
```
> **964 testes unitários passando (100% de aprovação)** cobrindo WhiteLabel customizado (`PlatformWhiteLabelTab`), tutoriais de início e onboarding com IA, editor de funis com auto-enquadramento, novos nós lógicos de Teste A/B (`FunnelNodeAbSplit`), condicional de curso (`FunnelNodeCourseCondition`), nó terminal (`FunnelNodeStop`), delay comercial com fuso de Brasília, nós de ação pedagógica (Webhook, Matrícula Automática, Recompensa XP, Notificação Interna), novos gatilhos pedagógicos com modais de configuração dedicados, nós de tags (Adicionar, Remover, Verificar AND/OR), modais de duplicação/exclusão de nós e fluxos com backdrop, histórico de execuções com rastreamento de leads no funil (`FunnelExecutionFlowProgress`), chat privado criptografado com DMs seguras, gravador de vídeo embutido, links internos/externos com preview, vitrine com combos/bundles e histórico de vendas, cópia de link de convite em todos os status (`InviteTableTab`), redirecionamento inteligente de convites já utilizados e redirecionamento automático de convites expirados.

### Backend (Pytest)
```bash
docker exec area_de_membros_backend pytest tests
# ou localmente na pasta backend:
cd backend
pytest
```
> **236 testes unitários passando (100% de aprovação)** cobrindo execução e validação dos novos nós lógicos (`test_funnel_logic_nodes.py`: Teste A/B com split percentual, condicional de posse de curso com verificação de bundles, nó stop com cancelamento de fluxos paralelos e delay com janela de horário comercial), execução dos nós de ação de funil (`test_funnel_action_nodes.py`: webhook com headers, matrícula automática com prazos, gamificação XP e notificação interna), gatilhos pedagógicos (`test_funnel_pedagogical_triggers.py`: interesse em curso, criação de aluno, inatividade, marcos de progresso e alertas de expiração), auto-migrações preventivas no startup (`main.py`), validação de convites expirados com flag `is_expired` (`test_invite_phone.py`), criptografia simétrica Fernet/AES-128 para DMs (`test_chat_encryption.py`), gerenciamento de membros de chat (`test_chat_members.py`), rastreamento de leads e cliques de vendas (`test_course_sales_clicks.py`), combos/bundles e ferramentas (`test_course_tools_and_bundles.py`), nós de etiquetas e regras de funis (`test_funnel_tag_processor.py`), rotas e validações de convites e registro público (`test_public_register.py`), criação de usuários com senha de 12+ caracteres, tutoriais IA, gamificação RPG, Favoritos, uploads S3 e handler global de exceções.

---

## 🛡️ Auditoria de Segurança de Dependências

O projeto conta com um script de auditoria unificado que inspeciona pacotes do Python via `pip-audit` e bibliotecas do Node.js via `npm audit`:

```bash
python scripts/audit_security.py
```
> **Aprovado com 0 vulnerabilidades no Backend e 0 vulnerabilidades no Frontend** (incluindo o pacote de criptografia `cryptography==50.0.2` atualizado e auditado).

---

## 📄 Regras de Negócio e Documentação

Para consultar a documentação completa de requisitos e comportamentos de domínio da plataforma, consulte o arquivo [BUSINESS_RULES.md](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/Arquivos/BUSINESS_RULES.md) e o histórico de migrações de banco em [DATABASE_SCHEMA_LOG.md](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/Arquivos/DATABASE_SCHEMA_LOG.md).



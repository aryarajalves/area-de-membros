# Regras de NegÃ³cio do Sistema (Ãrea de Membros)

Este documento registra as decisÃµes de regras de negÃ³cio da plataforma para consulta e orientaÃ§Ã£o do agente e da equipe.

---

## 0. Tela de InÃ­cio e Tutoriais da Plataforma (Onboarding)
- **BotÃ£o "InÃ­cio" na Barra Lateral (`Sidebar`):**
  - Posicionado como o primeiro item da categoria pedagÃ³gica (*"Meu Aprendizado"* para alunos e *"Ãrea PedagÃ³gica"* para administradores), com Ã­cone `Home`.
  - VisÃ­vel e acessÃ­vel para todos os perfis autenticados (`aluno`, `admin`, `superadmin`).
- **Comportamento de Entrada e Redirecionamento AutomÃ¡tico:**
  - **Com Tutoriais Publicados:** Se houver ao menos 1 vÃ­deo tutorial cadastrado no sistema, tanto alunos quanto administradores caem automaticamente na tela **InÃ­cio** ao acessar a Ãrea de Membros.
  - **Sem Tutoriais Publicados:** Caso ainda nÃ£o exista nenhum vÃ­deo tutorial cadastrado no banco de dados, o usuÃ¡rio Ã© direcionado automaticamente e de forma transparente para a tela de **Cursos** (`courses`).
- **Estrutura Visual da Tela:**
  - **Player em Destaque:** Exibe o vÃ­deo ativo em proporÃ§Ã£o widescreen 16:9, suportando tanto arquivos hospedados em nuvem (Backblaze B2 / MP4) quanto links externos (YouTube e Vimeo via embed responsivo).
  - **Card de InformaÃ§Ãµes:** TÃ­tulo da aula de tutorial em destaque, duraÃ§Ã£o estimada (`MM:SS`) e descriÃ§Ã£o detalhada com tÃ³picos abordados.
  - **Playlist Lateral Interativa:** Lista numerada de todas as aulas de tutorial cadastradas, permitindo alternar de aula instantaneamente com um clique.
- **PermissÃµes de GestÃ£o e Upload de Tutoriais:**
  - **Alunos:** TÃªm acesso estritamente de visualizaÃ§Ã£o e aprendizado (sem botÃµes de adicionar, editar ou excluir).
  - **Administradores e Super Admins:** Possuem acesso completo de gestÃ£o atravÃ©s do botÃ£o **`+ Nova Aula de Tutorial`** no topo, alÃ©m de botÃµes para **Editar** e **Excluir** diretamente em cada item da playlist.
  - **ExclusÃ£o Segura:** Toda exclusÃ£o de tutorial exige confirmaÃ§Ã£o obrigatÃ³ria em popup modal centralizado com fundo escuro (`DeleteTutorialConfirmModal`), removendo o registro e limpando a mÃ­dia do Backblaze B2 quando aplicÃ¡vel.
- **RenderizaÃ§Ã£o e PrÃ©-visualizaÃ§Ã£o do VÃ­deo no Modal (`TutorialVideoPreview`):**
  - Ao selecionar um arquivo de vÃ­deo do computador para upload, o modal exibe imediatamente um player nativo HTML5 renderizando o vÃ­deo com controles de reproduÃ§Ã£o, facilitando a conferÃªncia do arquivo antes de salvar.
  - Para links externos (YouTube/Vimeo) ou ediÃ§Ã£o de tutoriais existentes, o componente renderiza o respectivo embed ou player nativo responsivo no padrÃ£o glassmorphism.
- **TranscriÃ§Ã£o e GeraÃ§Ã£o de DescriÃ§Ã£o Detalhada com IA (`generateTutorialAiDescriptionApi`):**
  - No modal de tutorial, junto ao campo *"DescriÃ§Ã£o / O que vocÃª vai aprender"*, hÃ¡ o botÃ£o em destaque **"Gerar com IA"** (`Sparkles`).
  - Ao ser acionado com um vÃ­deo selecionado ou informado, o backend extrai o Ã¡udio via FFmpeg, realiza a transcriÃ§Ã£o completa utilizando a API OpenAI Whisper (`whisper-1`) e, em seguida, gera via GPT (`gpt-4o-mini`) uma descriÃ§Ã£o pedagÃ³gica detalhada citando todos os passos, telas, orientaÃ§Ãµes e tÃ³picos que o instrutor fala no vÃ­deo.
  - O texto gerado e a duraÃ§Ã£o estimada em formato cronÃ´metro (`MM:SS`) sÃ£o automaticamente preenchidos nos respectivos campos do formulÃ¡rio para revisÃ£o do gestor.
- **Layout Responsivo e AdaptaÃ§Ã£o Mobile (`home-tutorials.css`):**
  - Em smartphones e tablets (`<= 1024px` e `<= 768px`), o layout de grade de duas colunas colapsa automaticamente para coluna Ãºnica vertical sem quebras.
  - O Player 16:9 se ajusta Ã  largura total da tela, com as informaÃ§Ãµes da aula logo abaixo e a Playlist de tutoriais posicionada na sequÃªncia inferior com rolagem fluida, eliminando completamente sobreposiÃ§Ãµes visuais entre os cards.
  - O cabeÃ§alho se organiza em fluxo vertical com botÃ£o de criaÃ§Ã£o expandido e toque acessÃ­vel.

---

## 1. GestÃ£o de Cursos e Controle de Acesso por Aluno
- **Visibilidade de Cursos:** A visibilidade de um curso **NÃO** Ã© definida globalmente no curso para todos os alunos. Cada aluno tem sua prÃ³pria lista de cursos aos quais possui acesso liberado e seu respectivo prazo de validade individual por produto.
- **Redirecionamento ao Clicar em Links de Cursos (Chat, Favoritos e Links Diretos):**
  - **Com Acesso Liberado / Comprado (ou Administrador):** O usuário é redirecionado instantaneamente para **dentro do curso** (abrindo a sala de aula interativa `CourseClassroom` no SPA).
  - **Sem Acesso / Não Adquirido:**
    - Se o curso possuir **Link da Página de Vendas (`sales_page_url`)** configurado na sua edição: O usuário é redirecionado para a aba da página de vendas em nova aba (`_blank`), preservando a plataforma na tela de cursos.
    - Se o curso **NÃO possuir link da página de vendas**: O sistema mantém o usuário na aba de Cursos (`courses`) e exibe uma notificação explicativa informando que ele não possui acesso ao produto.
- **Perfis de Acesso na Interface:**
  - NÃ£o existe a opÃ§Ã£o "UsuÃ¡rio comum" (`user`) na interface de criaÃ§Ã£o de convites, ediÃ§Ã£o de perfil ou filtro de usuÃ¡rios. Os perfis selecionÃ¡veis nos modais sÃ£o exclusivamente **`Aluno` (`aluno`)** e **`Administrador (Admin)` (`admin`)** (alÃ©m do `Super Admin` protegido).
- **DefiniÃ§Ã£o de Acesso e Tempo de Acesso por Produto/Curso:**
  - **Na criaÃ§Ã£o de convite (`/invite`):** Ao selecionar o tipo **Aluno**, o administrador marca quais produtos/cursos aquele aluno terÃ¡ acesso e define, **para cada produto selecionado individualmente**, o **Tempo de Acesso**:
    - `VitalÃ­cio` (`lifetime` â sem expiraÃ§Ã£o)
    - `1 mÃªs` (`1_month` â 30 dias)
    - `3 meses` (`3_months` â 90 dias)
    - `6 meses` (`6_months` â 180 dias)
    - `1 ano` (`1_year` â 365 dias)
    - `2 anos` (`2_years` â 730 dias)
    - `3 anos` (`3_years` â 1095 dias)
    Quando o aluno conclui o cadastro, o sistema vincula os cursos e calcula a data de expiraÃ§Ã£o (`expires_at`) de cada curso a partir da ativaÃ§Ã£o da conta.
  - **Na ediÃ§Ã£o do aluno (`/users/{id}`):** O Super Admin pode marcar/desmarcar quais cursos estÃ£o liberados para o aluno e definir/alterar o tempo de acesso (`VitalÃ­cio`, `6 meses`, `1 ano`, `2 anos`, etc.) de cada produto especificamente.
- **PermissÃ£o de VisualizaÃ§Ã£o e Vitrine de Cursos:**
  - `superadmin` e `admin`: TÃªm visÃ£o completa e acesso irrestrito a todos os cursos cadastrados na plataforma.
  - `aluno`: Visualiza **todos** os cursos cadastrados e publicados na vitrine da Ãrea de Membros (`/courses`), permitindo que conheÃ§a novos treinamentos disponÃ­veis para compra.
    - **Cursos com Acesso Liberado:** O aluno visualiza o botÃ£o destacado **"Acessar Curso"** (`PlayCircle`) e pode navegar livremente por mÃ³dulos e aulas.
    - **Cursos NÃ£o Adquiridos / Sem Acesso:** O card do curso exibe o selo **"DisponÃ­vel para Compra"** com Ã­cone de cadeado (`Lock`), overlay sobre a thumbnail da capa com correntes cruzadas estilizadas e cadeado central indicando **"Produto Fechado"**, alÃ©m do botÃ£o Ãºnico **"Ver Mais InformaÃ§Ãµes"** (`ExternalLink`) na parte inferior do card.
    - **Redirecionamento e Rastreamento de Interesse:**
      - Ao clicar em "Ver Mais InformaÃ§Ãµes" (ou no card/capa/tÃ­tulo de um produto nÃ£o adquirido), o sistema registra automaticamente no backend o clique de interesse (`POST /courses/{course_id}/sales-click`) vinculado ao aluno autenticado com timestamp UTC.
      - O aluno Ã© redirecionado em nova aba para a URL configurada no campo `sales_page_url` do curso. Se o curso nÃ£o possuir URL cadastrada, o sistema exibe feedback amigÃ¡vel informando que a pÃ¡gina estarÃ¡ disponÃ­vel em breve.
    - **BotÃ£o e Modal de HistÃ³rico de Interesse na PÃ¡gina de Vendas (`CourseSalesHistoryModal`):**
      - **Acesso:** Nos cards dos cursos (`CourseCard`), gestores (`admin` e `superadmin`) visualizam o botÃ£o dedicado **"HistÃ³rico"** (`History`) ao lado das aÃ§Ãµes de editar e excluir.
      - **Agrupamento Inteligente por Lead/Contato:** Se o mesmo aluno clicou mais de uma vez para ir Ã  pÃ¡gina de vendas, todos os seus cliques sÃ£o consolidados em um **Ãºnico card de contato**. O card exibe o badge com o total de cliques daquele lead (ex: `2 cliques`, `5 cliques`), avatar, nome, e-mail e perfil.
      - **OrdenaÃ§Ã£o pelo Ãltimo Clique:** A lista de contatos Ã© sempre ordenada dinamicamente colocando no topo o lead que clicou por Ãºltimo (`lastClickAt DESC`).
      - **Detalhamento Sanfonado (AcordeÃ£o):** Ao clicar sobre o card de um contato, o painel se expande exibindo o histÃ³rico completo de acessos individuais daquele aluno com numeraÃ§Ã£o sequencial (`#1`, `#2`, etc.), destaque para o `(Ãltimo clique)` e data/hora de cada acesso no **HorÃ¡rio Oficial de BrasÃ­lia (`America/Sao_Paulo` / UTC-3)** no formato `DD/MM/AAAA Ã s HH:mm:ss`.
      - **Sistema de PaginaÃ§Ã£o de Contatos:** A listagem Ã© paginada em 6 contatos por pÃ¡gina, com controles de navegaÃ§Ã£o (*"Anterior"*, *"PrÃ³xima"*, indicador de pÃ¡ginas *"X / Y"* e contador *"Mostrando XâY de Z contatos"*), permitindo rÃ¡pida consulta sem sobrecarregar a interface.
      - **Filtro RÃ¡pido e UX:** Campo de busca em tempo real por nome/e-mail com reset automÃ¡tico para a pÃ¡gina 1 ao pesquisar, badge consolidado no topo informando o total de cliques registrados e quantidade de contatos Ãºnicos, estado de carregamento com spinner, estado vazio amigÃ¡vel e backdrop preto translÃºcido fixo (nÃ£o fecha ao clicar fora).
    - **SeguranÃ§a de Acesso:** O acesso direto ao conteÃºdo interno (`/courses/{id}`) de cursos nÃ£o adquiridos permanece estritamente bloqueado (`HTTP 403`).
- **CriaÃ§Ã£o e EdiÃ§Ã£o de Cursos:**
  - O formulÃ¡rio conta com o campo **Link da PÃ¡gina de Vendas / Mais InformaÃ§Ãµes (`sales_page_url`)** (opcional), permitindo que o administrador insira o endereÃ§o externo da landing page ou checkout do treinamento.
  - O modal de criar/editar curso **nÃ£o** possui checkbox de "Curso publicado (visÃ­vel para alunos)".
  - O campo **DescriÃ§Ã£o do Curso** conta com o componente [`ExpandableTextarea`](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/frontend/src/components/common/ExpandableTextarea.jsx) com o botÃ£o destacado **"Tela Cheia"** (`Maximize2`), abrindo um **popup gigante no meio da tela** (`94vw Ã 86vh`) para digitaÃ§Ã£o ampla, com contador dinÃ¢mico de palavras e caracteres, preservaÃ§Ã£o de quebras de linha e fechamento via botÃ£o "Concluir EdiÃ§Ã£o" ou tecla `Esc`.
  - A imagem de capa (Thumbnail) pode ser enviada diretamente do computador do usuÃ¡rio (upload) ou mantida via URL.
  - **EspecificaÃ§Ãµes recomendadas para a Thumbnail:**
    - DimensÃµes recomendadas: **1280 Ã 720 pixels** (ProporÃ§Ã£o widescreen 16:9).
    - Formatos aceitos: **JPG, PNG, WEBP**.
    - Tamanho mÃ¡ximo: **atÃ© 5 MB**.
- **Ordem de PosiÃ§Ã£o e ExibiÃ§Ã£o dos Cursos:**
  - Cada curso possui o campo numÃ©rico **Ordem de PosiÃ§Ã£o / ExibiÃ§Ã£o (`order_index`)** configurÃ¡vel no modal de criaÃ§Ã£o e ediÃ§Ã£o do curso.
  - A ordenaÃ§Ã£o na plataforma (tanto para administradores quanto para alunos na vitrine) Ã© crescente por ordem (`order_index ASC`), com desempate pelos mais recentes (`id DESC`). Cursos com nÃºmeros menores (ex: `1`, `2`, `3`) aparecem primeiro na lista e na vitrine. O valor padrÃ£o Ã© `0`.
- **PaginaÃ§Ã£o de Cursos:**
  - A listagem exibe no mÃ¡ximo **20 cursos por pÃ¡gina**.
  - Abaixo da grade de cursos, hÃ¡ controles de navegaÃ§Ã£o ("Anterior", "PrÃ³xima", contador de pÃ¡ginas e cursos exibidos).
- **Tipos de ConteÃºdo: Cursos Tradicionais vs Ferramentas / Aplicativos (`item_type`):**
  - **Curso Tradicional (`course`):** Possui estrutura pedagÃ³gica com mÃ³dulos, aulas gravadas, materiais complementares, progresso e sala de aula interna (`CourseClassroom`).
  - **Ferramenta / Aplicativo (`tool`):** Representa um software, extensÃ£o ou aplicativo web externo (ex: BÃºssola, ZapVoice, dashboards externos). Conta com o campo obrigatÃ³rio **Link de Acesso da Ferramenta (`tool_url`)**.
  - **Comportamento do Card da Ferramenta (`CourseCard`):**
    - Quando o aluno possui acesso: o card exibe a badge lilÃ¡s **"ð ï¸ Ferramenta / App"** e o botÃ£o principal **"Acessar Ferramenta"** (`ExternalLink`), abrindo a URL configurada diretamente em nova aba do navegador.
    - Quando o aluno nÃ£o possui acesso: exibe o overlay de produto fechado com correntes e o botÃ£o **"Ver Mais InformaÃ§Ãµes"** direcionando para a pÃ¡gina de vendas (`sales_page_url`).
- **Pacotes e Combos de Produtos (`course_bundles`):**
  - No formulÃ¡rio de criaÃ§Ã£o e ediÃ§Ã£o (`CourseFormModal`), o gestor pode selecionar quais outros cursos ou ferramentas estÃ£o **inclusos neste pacote** atravÃ©s do componente [`CourseBundleSelector`](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/frontend/src/components/course-management/CourseBundleSelector.jsx).
  - O sistema impede auto-associaÃ§Ã£o (um curso nÃ£o pode conter a si mesmo no pacote).
  - **PropagaÃ§Ã£o AutomÃ¡tica de Acesso (`grant_bundle_access_for_user`):** Sempre que um aluno recebe matrÃ­cula em um curso ou pacote pai (seja por criaÃ§Ã£o direta, convite `/invite`, ediÃ§Ã£o de usuÃ¡rio ou importaÃ§Ã£o por planilha), o backend automaticamente vincula e concede acesso imediato a todas as ferramentas e cursos inclusos no combo, garantindo que o aluno receba o pacote completo sem necessidade de liberaÃ§Ã£o manual item a item.
  - O card do curso exibe a badge verde **"ð¦ Combo (+X)"** indicando a quantidade de itens inclusos.
  - **Agrupamento Visual de Pacotes/Combos na Plataforma ([`CourseBundleGroup`](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/frontend/src/components/course-management/CourseBundleGroup.jsx)):**
    - Todos os produtos (cursos e ferramentas) vinculados ao mesmo pacote/combo sÃ£o renderizados visualmente agrupados dentro de uma **caixa destacada exclusiva** com estÃ©tica Neon e Glassmorphism (`border: 1.5px solid rgba(16, 185, 129, 0.45)`).
    - O container de pacote conta com cabeÃ§alho ilustrado com Ã­cone de pacote (`Package`), badge "PACOTE / COMBO", contadores de produtos inclusos (cursos e ferramentas), status de liberaÃ§Ã£o do pacote (`Acesso Liberado` vs `Combo Bloqueado`) e grade interna contendo os cards dos produtos inclusos (`CourseCard` com badge `Item do Combo`).
    - Cursos e produtos avulsos nÃ£o vinculados a pacotes continuam sendo exibidos individualmente na grade regular de cursos.

---

- **Anúncios e Ofertas de Upsell / Cross-sell por Progresso de Curso (`course_upsell_offers`):**
  - **Localização:** Aba **"Anúncios & Upsell"** (`Megaphone`) dentro do modal de edição do curso (`CourseFormModal`), acessível para administradores e superadmins.
  - **Marcos de Disparo:** O gestor configura uma ou mais ofertas definindo a porcentagem de conclusão do curso em que o anúncio deve surgir (ex: `35%`, `50%`, `75%`).
  - **Formatos de Mídia Suportados:**
    - `Imagem / Banner`: Exibe banner promocional (JPG, PNG, WEBP) com bordas suaves e destaque neon.
    - `Vídeo Promocional`: Exibe player de vídeo responsivo (arquivo MP4 nativo ou embed do YouTube/Vimeo).
  - **Regra de Posse (Não Exibir para Alunos que já Compraram):**
    - Antes de exibir a oferta, o sistema valida se o aluno autenticado já possui acesso ativo ao curso ou ferramenta promovido (`UserCourse`). Se o aluno já adquiriu o produto, a oferta é ignorada.
  - **Regra de Exibição Única (Anti-Spam):**
    - Cada oferta é exibida no máximo 1 única vez para o aluno. Ao fechar o modal ("X" ou "Continuar estudando"), o sistema registra a dispensa em `course_upsell_views(offer_id, user_id)` e a oferta nunca mais reaparece para aquele aluno.
  - **Rastreamento de Cliques e Integração com Histórico de Vendas:**
    - Ao clicar no botão de CTA (ex: *"Garantir Minha Vaga"*), o aluno é direcionado para a página de vendas ou checkout configurada em nova aba (`_blank`), e o clique é registrado tanto em `course_upsell_views.clicked_at` quanto em `course_sales_clicks`, alimentando automaticamente o modal de histórico de interesse de vendas (`CourseSalesHistoryModal`).
  - **Card Facultativo de Próximo Nível na Barra Lateral Direita (`show_in_sidebar`):**
    - **Controle Facultativo:** No formulário do anúncio de upsell, há a opção de marcar se aquela oferta deve ser exibida também na barra lateral da sala de aula (`show_in_sidebar: true`).
    - **Posicionamento:** Fica fixado no topo da barra lateral direita, logo abaixo do bloco "Meu Progresso" e antes da lista de módulos.
    - **Inteligência de Posse:** Se o aluno já comprou o produto promovido, o card não é exibido.
    - **Ação e Métricas:** O botão direciona o aluno para a página de vendas/checkout e registra o clique no histórico de vendas.

---

## 2. Estrutura Interna do Curso (MÃ³dulos e Aulas)
- **Acesso ao Curso:**
  - Em cada card de curso, hÃ¡ a aÃ§Ã£o **"Acessar Curso"** (alÃ©m do clique direto na capa/tÃ­tulo), abrindo o ambiente de sala de aula (`CourseClassroom`).
- **GestÃ£o de MÃ³dulos:**
  - MÃ³dulos organizam os tÃ³picos do curso (TÃ­tulo, DescriÃ§Ã£o, Ordem).
  - O campo de DescriÃ§Ã£o possui botÃµes de **"Tela Cheia"** (popup gigante) e **"Maximizar / Restaurar"** (`ExpandableTextarea`), permitindo expandir a Ã¡rea de digitaÃ§Ã£o para textos extensos com facilidade.
  - **GeraÃ§Ã£o de TÃ­tulo e DescriÃ§Ã£o do MÃ³dulo com IA baseada nas TranscriÃ§Ãµes das Aulas (`ModuleModal`):**
    - No modal de **"Editar MÃ³dulo"**, administradores e instrutores contam com o botÃ£o de destaque **"Gerar com IA"** (`Sparkles`) ao lado do campo "TÃ­tulo do MÃ³dulo *".
    - **Popup de ConfirmaÃ§Ã£o ObrigatÃ³rio:** Ao clicar no botÃ£o, o sistema exibe um popup modal centralizado com backdrop preto translÃºcido (nÃ£o fechÃ¡vel por clique externo) informando que a IA analisarÃ¡ as transcriÃ§Ãµes e conteÃºdos de todas as aulas daquele mÃ³dulo para formular um tÃ­tulo atrativo (preservando identificadores numÃ©ricos como 'MÃ³dulo 2') e uma descriÃ§Ã£o pedagÃ³gica didÃ¡tica de 2 a 3 parÃ¡grafos curtos.
    - Ao confirmar, o sistema aciona o endpoint `POST /courses/{course_id}/modules/{module_id}/generate-ai-overview`, preenche os campos do formulÃ¡rio no modal em tempo real e atualiza a interface, permitindo ao gestor revisar e salvar as alteraÃ§Ãµes.
  - A exclusÃ£o de um mÃ³dulo apaga em cascata todas as aulas associadas apÃ³s confirmaÃ§Ã£o em popup modal preto.
  - **Recolhimento e ExpansÃ£o de MÃ³dulos na Playlist Lateral (ModuleTimelineSidebar):**
    - O cabeÃ§alho de cada mÃ³dulo na barra lateral da sala de aula funciona como um controle retrÃ¡til (*accordion/collapsible*).
    - **Fechar o MÃ³dulo:** Ao clicar sobre o tÃ­tulo ou cabeÃ§alho de um mÃ³dulo aberto, ele recolhe imediatamente a sua lista de aulas, mantendo a visualizaÃ§Ã£o limpa e compacta, exibindo indicador em chevron (ChevronRight) e o nÃºmero de aulas do mÃ³dulo.
    - **Abrir o MÃ³dulo:** Ao clicar novamente sobre o mÃ³dulo fechado, ele expande sua timeline vertical exibindo todas as aulas numeradas, minutagens e status com chevron voltado para baixo (ChevronDown).
    - **AÃ§Ãµes de GestÃ£o:** Os botÃµes de adicionar aula (+), editar e excluir mÃ³dulo continuam protegidos com isolamento de clique (stopPropagation), permitindo a gestÃ£o sem fechar ou reabrir acidentalmente o mÃ³dulo.
- **GestÃ£o de Aulas (Lessons):**
  - Cada aula pertence a um mÃ³dulo e contÃ©m:
    - **Nome/TÃ­tulo da Aula** (obrigatÃ³rio).
    - **DescriÃ§Ã£o da Aula** (opcional, com botÃµes de **"Tela Cheia"** com popup gigante e **"Maximizar / Restaurar"** para escrita confortÃ¡vel, renderizada abaixo do player com quebras de linha preservadas).
    - **DuraÃ§Ã£o Estimada AutomÃ¡tica (Formato CronÃ´metro Exato):** Especificada no formato cronÃ´metro exato (ex: `15:30`, `25:40`, `01:10:20`). Ã calculada e preenchida **automaticamente**:
      - **No Cadastro/EdiÃ§Ã£o da Aula:** Ao selecionar o arquivo de vÃ­deo no computador, o sistema lÃª os metadados do vÃ­deo no navegador em milissegundos e jÃ¡ preenche o campo "DuraÃ§Ã£o Estimada" automaticamente no formato `MM:SS` ou `HH:MM:SS`.
      - **Na ImportaÃ§Ã£o em Lote:** O sistema calcula a duraÃ§Ã£o de cada vÃ­deo localmente e cadastra a aula jÃ¡ com a minutagem exata.
      - **Na TranscriÃ§Ã£o por IA:** O backend afere os segundos precisos via `ffprobe` e sincroniza `lesson.duration` no banco de dados.
      - **GeraÃ§Ã£o AutomÃ¡tica de TÃ­tulo e DescriÃ§Ã£o com IA na ConclusÃ£o da TranscriÃ§Ã£o:**
        - Assim que o processamento da transcriÃ§Ã£o por IA (Whisper) Ã© finalizado em background, o sistema analisa a transcriÃ§Ã£o completa e gera **automaticamente** um tÃ­tulo otimizado e atrativo (mÃ¡ximo de 65 caracteres) e uma descriÃ§Ã£o pedagÃ³gica envolvente de 2 a 3 parÃ¡grafos curtos.
        - Os dados gerados sÃ£o salvos imediatamente nas colunas `title` e `description` da tabela `Lesson` e sincronizados nas faixas de vÃ­deo correspondentes (`lesson_videos`), atualizando a interface em tempo real via eventos globais no frontend sem necessidade de intervenÃ§Ã£o manual do gestor.
      - **GeraÃ§Ã£o Sob Demanda de TÃ­tulo e DescriÃ§Ã£o com IA na VisÃ£o Geral (`LessonOverviewTab`):**
        - Sempre que uma aula jÃ¡ possuir transcriÃ§Ã£o concluÃ­da, a aba **"VisÃ£o Geral"** exibe para administradores e instrutores o botÃ£o destacado **"Gerar TÃ­tulo e DescriÃ§Ã£o com IA"** (`Sparkles`), permitindo re-gerar o conteÃºdo pedagÃ³gico a qualquer momento.
        - **Popup de ConfirmaÃ§Ã£o ObrigatÃ³rio:** Ao clicar no botÃ£o, o sistema abre um popup modal centralizado de confirmaÃ§Ã£o com backdrop translÃºcido escuro (nÃ£o fechÃ¡vel por clique externo) explicando que o tÃ­tulo e a descriÃ§Ã£o atuais serÃ£o substituÃ­dos pelo conteÃºdo pedagÃ³gico gerado com base na transcriÃ§Ã£o. A geraÃ§Ã£o sÃ³ Ã© iniciada apÃ³s o clique em **"Sim, Gerar com IA"**, mantendo a opÃ§Ã£o segura de **"Cancelar"**.
        - Ao confirmar, o sistema aciona o GPT-4o-mini para re-gerar o tÃ­tulo conciso e a descriÃ§Ã£o pedagÃ³gica envolvente, salvando imediatamente na tabela `Lesson` e atualizando o player e a visÃ£o geral em tempo real.
      - **GeraÃ§Ã£o Sob Demanda de TÃ­tulo e DescriÃ§Ã£o com IA no Modal de EdiÃ§Ã£o da Aula (`LessonModal`):**
        - No modal de ediÃ§Ã£o de aula, na aba **"Dados Gerais"**, administradores e instrutores contam com o botÃ£o destacado **"Gerar com IA"** (`Sparkles`) no cabeÃ§alho do campo "TÃ­tulo da Aula *".
        - **Popup de ConfirmaÃ§Ã£o ObrigatÃ³rio:** Ao clicar no botÃ£o, o sistema abre o modal centralizado de confirmaÃ§Ã£o com backdrop translÃºcido escuro (nÃ£o fechÃ¡vel por clique externo) informando que a IA formularÃ¡ um novo tÃ­tulo atrativo e uma descriÃ§Ã£o pedagÃ³gica completa a partir da transcriÃ§Ã£o existente da aula.
        - Ao confirmar, o sistema aciona o endpoint `POST /courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/generate-metadata` e preenche imediatamente os campos "TÃ­tulo da Aula" e "Breve Resumo ou DescriÃ§Ã£o da Aula" no formulÃ¡rio em tempo real, permitindo que o gestor revise, complemente se desejar e salve as alteraÃ§Ãµes com total flexibilidade.
      - **Upload em Segundo Plano no Backblaze B2 (MÃºltiplos VÃ­deos):** arquivos de vÃ­deo MP4, WebM, MOV ou MKV de atÃ© **2 GB (2048 MB)** sÃ£o enviados diretamente para a nuvem no bucket Backblaze B2 (`AreaDeMembros/videos/`) atravÃ©s de URLs prÃ©-assinadas (S3 Presigned URLs). O envio ocorre em **segundo plano** gerenciado pelo `UploadQueueContext`, **sem nenhum modal bloqueante**. O usuÃ¡rio pode preencher e salvar a aula imediatamente, fechar o formulÃ¡rio, criar novas aulas e enviar mÃºltiplos vÃ­deos concorrentemente. Um painel flutuante discreto no canto inferior direito (`BackgroundUploadWidget`) exibe o progresso individual e permite cancelamento ou acompanhamento em tempo real.
      - **ImportaÃ§Ã£o em Lote de Aulas e MÃ³dulos via Pasta Local com IA AutomÃ¡tica (`BatchCourseImportModal`):**
        - **Acesso:** DisponÃ­vel na sala de aula (`CourseClassroom`) para administradores e instrutores atravÃ©s do botÃ£o em destaque **"Importar Pasta de Aulas"** (`FolderUp`).
        - **Leitura de DiretÃ³rios pelo Navegador:** Permite ao usuÃ¡rio selecionar uma pasta do seu computador contendo subpastas e arquivos de vÃ­deo usando a API nativa de diretÃ³rios (`webkitdirectory`).
        - **Mapeamento AutomÃ¡tico:**
          - Cada subpasta Ã© mapeada como um **MÃ³dulo** do curso. Se jÃ¡ existir um mÃ³dulo com o mesmo tÃ­tulo cadastrado no curso, o sistema identifica como "MÃ³dulo Existente" e vincula as novas aulas a ele sem duplicar o mÃ³dulo.
          - **Ordem de ExibiÃ§Ã£o Manual e AutomÃ¡tica do MÃ³dulo:** Cada card de mÃ³dulo no modal exibe um campo numÃ©rico editÃ¡vel **"Ordem: [N]"** no cabeÃ§alho. O sistema preenche inicialmente com o nÃºmero extraÃ­do do tÃ­tulo (ex: 'MÃ³dulo 2' -> `2`) ou com o `order_index` do mÃ³dulo existente, permitindo que o administrador altere livremente o nÃºmero antes de iniciar a importaÃ§Ã£o. Na criaÃ§Ã£o ou atualizaÃ§Ã£o, esse valor Ã© persistido no banco de dados.
          - Cada arquivo de vÃ­deo (`.mp4`, `.webm`, `.mov`, `.mkv`) Ã© mapeado para uma **Aula**, com tÃ­tulo limpo derivado do nome do arquivo e ordenaÃ§Ã£o alfanumÃ©rica natural (`01`, `02`, `10`).
        - **ExpansÃ£o Fluida e Rolagem Sem Bloqueios das Aulas:** As aulas de cada mÃ³dulo expandido fluem naturalmente integradas Ã  barra de rolagem principal do modal, permitindo visualizar todas as aulas (mesmo mais de 10 ou 13 aulas) sem scroll interno conflitante ou travamentos na rolagem.
        - **DesmarcaÃ§Ã£o FlexÃ­vel de MÃ³dulos e Aulas:** O modal apresenta a Ã¡rvore hierÃ¡rquica em acordeÃ£o com checkboxes individuais. O administrador pode desmarcar mÃ³dulos inteiros ou aulas especÃ­ficas que jÃ¡ foram importadas anteriormente ou que nÃ£o deseja subir, alÃ©m de contar com botÃµes rÃ¡pidos "Marcar Todas" e "Desmarcar Todas".
        - **Fila Sequencial e Disparo Imediato de IA:** Ao iniciar a importaÃ§Ã£o:
          1. Cria ou reutiliza o MÃ³dulo no banco de dados.
          2. Gera a Presigned URL S3 e faz o upload direto do vÃ­deo para o Backblaze B2 com acompanhamento de progresso de 0% a 100%. Em aulas com mÃºltiplas faixas de idioma, realiza o upload de cada faixa e as cadastra vinculadas Ã  aula.
          3. Cadastra a Aula no sistema vinculada ao vÃ­deo e mÃ³dulo (incluindo faixas de mÃºltiplos idiomas quando presentes).
          4. **Disparo Imediato da IA na Aula:** Imediatamente apÃ³s a criaÃ§Ã£o da aula, aciona a transcriÃ§Ã£o por inteligÃªncia artificial (OpenAI Whisper + GPT-4o) para gerar a minutagem, capÃ­tulos e resumo inteligente em background.
          5. **GeraÃ§Ã£o AutomÃ¡tica de TÃ­tulo e DescriÃ§Ã£o do MÃ³dulo com IA:** Ao concluir o upload de todas as aulas selecionadas de um mÃ³dulo, o sistema aciona automaticamente a IA (GPT-4o-mini) para analisar os tÃ­tulos e resumos das aulas e gerar um tÃ­tulo atrativo e profissional preservando o identificador numÃ©rico original (ex: `MÃ³dulo 01 - Fundamentos e Estrutura dos Signos`) e uma descriÃ§Ã£o didÃ¡tica completa de 2 a 3 parÃ¡grafos, atualizando o mÃ³dulo no banco de dados em tempo real.
          6. AvanÃ§a para o prÃ³ximo mÃ³dulo da fila de forma sequencial e resiliente.
        - **Suporte a MÃºltiplos Idiomas por Subpastas (OpÃ§Ã£o A):**
          - O sistema reconhece pastas estruturadas no padrÃ£o `Modulo 01/PT/01 - Introducao.mp4`, `Modulo 01/EN/01 - Introduction.mp4`, `Modulo 01/ES/01 - Introduccion.mp4`.
          - Os arquivos com o mesmo identificador/numeraÃ§Ã£o de aula dentro de subpastas de idiomas (PT, EN, ES, FR, DE, IT) sÃ£o unificados automaticamente em uma **Ãºnica aula** contendo as faixas de vÃ­deo correspondentes (`lesson_videos`).
          - O modal exibe badges com as bandeiras dos idiomas identificados (ex: `ð§ð· ðºð¸ ðªð¸`) ao lado de cada aula, e realiza o upload sequencial de todas as faixas cadastradas.
        - **Upload e ReplicaÃ§Ã£o de Capas (MÃ³dulos e Aulas) na ImportaÃ§Ã£o em Lote:** O gestor pode anexar manualmente imagens de capa diretamente no modal de importaÃ§Ã£o antes de iniciar o processo:
          - **Capa do MÃ³dulo:** BotÃ£o "+ Capa MÃ³dulo" no cabeÃ§alho de cada mÃ³dulo, permitindo escolher uma imagem do computador com prÃ©-visualizaÃ§Ã£o miniatura e botÃ£o de remoÃ§Ã£o. Caso o mÃ³dulo seja novo, Ã© criado com `image_url`; caso jÃ¡ exista, a capa Ã© atualizada na conclusÃ£o.
          - **Capa da Aula Individual:** BotÃ£o "+ Capa" ao lado do tamanho de cada aula, permitindo anexar imagens individuais que sÃ£o enviadas para o Backblaze B2 (`AreaDeMembros/thumbnails/`) e associadas como `thumbnail_url` da respectiva aula.
          - **ReplicaÃ§Ã£o de Capa para Todas as Aulas (3 Formas RÃ¡pidas):**
            1. **BotÃ£o "Replicar p/ todas" na Linha da Aula:** Sempre que o usuÃ¡rio anexar uma capa em qualquer aula, surge imediatamente ao lado um botÃ£o destacado "Replicar p/ todas" (`Copy`). Ao clicar, essa imagem Ã© copiada instantaneamente para todas as outras aulas de todos os mÃ³dulos.
            2. **BotÃ£o "Capa p/ Aulas do MÃ³dulo" no CabeÃ§alho do MÃ³dulo:** Permite escolher 1 imagem de capa do computador e aplicÃ¡-la em lote especificamente para todas as aulas daquele mÃ³dulo.
            3. **BotÃ£o "Capa p/ Todas as Aulas" na Barra Superior:** Permite escolher 1 imagem de capa do computador e aplicÃ¡-la em lote para todas as aulas de todos os mÃ³dulos importados.
        - **Controle e UX:** Barra de progresso geral no topo, indicador de status por aula, botÃ£o para interromper a fila a qualquer momento, backdrop fixo nÃ£o fechÃ¡vel por clique externo e recarregamento automÃ¡tico do curso ao concluir.
        - **ReinicializaÃ§Ã£o do Estado ao Fechar e Reabrir:** Ao fechar o modal de ImportaÃ§Ã£o em Lote (seja pelo botÃ£o "X" superior ou "Fechar" inferior), todo o estado temporÃ¡rio do lote Ã© resetado imediatamente (lista de mÃ³dulos, aulas analisadas, capas vinculadas e seleÃ§Ã£o de arquivos). Ao reabrir o modal em "Importar Pasta de Aulas", ele sempre se inicia 100% limpo em seu estado inicial de Dropzone, garantindo que importaÃ§Ãµes anteriores ou canceladas nÃ£o persistam na interface.
        - **InterrupÃ§Ã£o Imediata do Upload em Lote:** Ao clicar em "Interromper Envio", qualquer requisiÃ§Ã£o HTTP ativa para o storage (Presigned URL e XMLHttpRequest PUT no Backblaze B2) Ã© abortada imediatamente no mesmo segundo (`xhr.abort()` e `AbortController.abort()`). O status da aula em progresso Ã© restaurado com seguranÃ§a para "Pronta para envio", liberando a interface instantaneamente sem aguardar o tÃ©rmino de uploads de arquivos pesados.
        - **ReimportaÃ§Ã£o e Retentativa de Aulas com Falha:**
          - **BotÃ£o Individual de ReimportaÃ§Ã£o:** Ao ocorrer qualquer erro durante o upload ou criaÃ§Ã£o da aula (exibindo `(!) Falha`), Ã© renderizado imediatamente um botÃ£o `âº Reimportar` ao lado do status da aula. Ao clicar, o sistema reinicia o processo especificamente para aquela aula de forma isolada e transparente.
          - **BotÃ£o de Reimportar Falhas do MÃ³dulo:** No cabeÃ§alho de cada mÃ³dulo com aulas pendentes de erro, surge o botÃ£o `âº Reimportar Falhas`, permitindo reprocessar todas as aulas com falha daquele mÃ³dulo com um Ãºnico clique.
          - **BotÃ£o Geral de Reimportar Falhas no RodapÃ©:** Sempre que houver 1 ou mais aulas com falha em qualquer mÃ³dulo, surge no rodapÃ© do modal o botÃ£o destacado `âº Reimportar Falhas (N)`. Ao clicar, todas as aulas falhadas tÃªm o status resetado para pendente e a fila de processamento Ã© retomada automaticamente, pulando com seguranÃ§a as aulas jÃ¡ concluÃ­das anteriormente e aproveitando o ID do mÃ³dulo jÃ¡ criado para nÃ£o gerar duplicatas.
        - **Enquadramento e ProporÃ§Ãµes de Capas de MÃ³dulos (Cards Netflix):**
          - **ProporÃ§Ã£o Ideal de PÃ´ster:** Recomenda-se a proporÃ§Ã£o vertical **2:3 ou 3:4** (ex: `600Ã900px` ou `1080Ã1620px`), idÃªntica a pÃ´steres de filmes e sÃ©ries da Netflix.
          - **Camadas Inteligentes de ApresentaÃ§Ã£o:** Para suportar qualquer imagem enviada pelo usuÃ¡rio (mesmo artes quadradas 1:1 com mandalas circulares ou banners horizontais 16:9), os cards de mÃ³dulos utilizam renderizaÃ§Ã£o em duas camadas:
            1. **Fundo AtmosfÃ©rico (`Ambient Glow`):** Preenche o card com desfoque suave (`blur(16px) brightness(0.35)`) espelhando as cores da arte original, eliminando bordas pretas secas.
            2. **PÃ´ster Contido em Alta DefiniÃ§Ã£o (`contain`):** MantÃ©m a arte integralmente visÃ­vel sem cortar textos, circunferÃªncias ou bordas laterais, eliminando completamente distorÃ§Ãµes e efeito de super zoom.
            3. **DegradÃª CinematogrÃ¡fico:** Camada de gradiente escuro garantindo contraste e leitura nÃ­tida do identificador do mÃ³dulo e contagem de aulas.
      - **Aba PadrÃ£o:** Por padrÃ£o, o modal de criaÃ§Ã£o e ediÃ§Ã£o da aula jÃ¡ se inicia diretamente na aba **"Upload do PC (Backblaze B2)"**.
      - **Capa do VÃ­deo da Aula (Thumbnail / Poster):**
        - Cada aula possui suporte a uma capa personalizada exclusiva, hospedada no Backblaze B2 (`AreaDeMembros/thumbnails/`).
        - DimensÃµes recomendadas no painel: **1280 Ã 720 pixels (ProporÃ§Ã£o widescreen 16:9)**, formatos **JPG, PNG, WEBP (atÃ© 5 MB)**.
        - A capa Ã© renderizada como atributo `poster` no player HTML5 antes do aluno dar o play, e como apresentaÃ§Ã£o de destaque caso nenhum vÃ­deo tenha sido enviado ainda.
      - **Streaming Nativo e Player Customizado:**
        - O player de vÃ­deo HTML5 da aula conta com barra de controles interativa sobreposta (`CustomVideoPlayer`).
        - **Barra de Progresso Interativa (Scrubbing / Seek):** O aluno pode clicar ou arrastar livremente na barra de progresso para avanÃ§ar ou retroceder a reproduÃ§Ã£o em qualquer ponto do vÃ­deo instantaneamente.
        - **AvanÃ§ar e Retroceder 10 Segundos:** BotÃµes dedicados `-10s` (`RotateCcw`) e `+10s` (`RotateCw`) para saltos Ã¡geis durante o estudo.
        - **Indicador Exato de Tempo Restante:** O display de tempo exibe o tempo decorrido, a duraÃ§Ã£o total e destaca explicitamente quanto tempo falta para o tÃ©rmino do vÃ­deo (ex: `00:09 / 10:00 (Faltam 09:51)`), com fallback inteligente para a duraÃ§Ã£o estimada cadastrada na aula caso o vÃ­deo ainda esteja em buffer de metadados.
        - **Controle de Velocidade de ReproduÃ§Ã£o (Playback Rate):** O player conta com seletor dedicado de velocidade (`0.5x`, `0.75x`, `1x normal`, `1.25x`, `1.5x`, `1.75x`, `2x`) com menu popover translÃºcido, feedback com Ã­cone de velocÃ­metro (`Gauge`), indicador ativo e persistÃªncia automÃ¡tica da preferÃªncia do aluno no `localStorage` entre aulas e recarregamentos de pÃ¡gina.
        - **Controles de Volume e Tela Cheia:** Ajuste fino de volume com slider, botÃ£o mute/unmute e alternÃ¢ncia para tela cheia nativa.
      - **Thumbnails dos Cursos:** Capas enviadas por upload tambÃ©m sÃ£o hospedadas no Backblaze B2 (`AreaDeMembros/thumbnails/`).
      - **Limpeza AutomÃ¡tica:** Ao excluir um curso ou aula, as mÃ­dias vinculadas correspondentes sÃ£o automaticamente deletadas do Backblaze B2.
      - **Link Externo / Embed:** Suporte mantido a links do YouTube, Vimeo, Panda Video ou URL externa.
      - **Suporte MultilÃ­ngue (Aulas em MÃºltiplos Idiomas):**
        - A mesma aula pode conter faixas de vÃ­deo em mÃºltiplos idiomas (ex: PortuguÃªs ð§ð·, InglÃªs ðºð¸, Espanhol ðªð¸, FrancÃªs ð«ð·, AlemÃ£o ð©ðª, Italiano ð®ð¹, etc.).
        - **Nome Personalizado do Idioma (RÃ³tulo):** O administrador pode alterar o nome exibido de cada idioma cadastrado (campo `language_label`, ex: "PortuguÃªs (Brasil)", "InglÃªs (UK)", "Espanhol Neutro", etc.). O nome editado reflete em tempo real nas abas de ediÃ§Ã£o e nos botÃµes de troca de idioma do player visualizados pelo aluno.
        - **Nome e DescriÃ§Ã£o da Aula por Idioma:** AlÃ©m do vÃ­deo, cada idioma cadastrado possui seu prÃ³prio **Nome da Aula** e **DescriÃ§Ã£o da Aula** especÃ­ficos, permitindo que a interface se adapte completamente ao idioma selecionado pelo aluno.
          - **Campo de DescriÃ§Ã£o Maximizado com Tela Cheia:** O campo de descriÃ§Ã£o de cada faixa de idioma utiliza o componente `ExpandableTextarea` com altura padrÃ£o expandida (`rows={6}`, `minHeight="170px"`) e botÃ£o **"Tela Cheia"** (`Maximize2`), permitindo escrita e leitura amplas sem que o texto fique recolhido ou difÃ­cil de visualizar.
          - **RenderizaÃ§Ã£o Visual do VÃ­deo Anexado (`LessonVideoPreviewPlayer`):** Tanto em vÃ­deos enviados do computador (Backblaze B2) quanto em links externos (YouTube/Vimeo), o sistema **NÃO** exibe links de texto brutos. Em vez disso, renderiza diretamente o player de vÃ­deo interativo (16:9 widescreen) para que o gestor possa assistir, pausar e conferir a mÃ­dia na hora, com botÃ£o dedicado de remoÃ§Ã£o/troca.
        - Cada faixa de idioma possui seu prÃ³prio vÃ­deo independente, com suporte individual a upload direto para o Backblaze B2 ou links externos (YouTube, Vimeo, Panda Video, URL).
        - No cadastro/ediÃ§Ã£o da aula, o gerenciador em abas permite adicionar, remover e alternar entre os idiomas cadastrados, editando individualmente o rÃ³tulo do idioma, o tÃ­tulo, a descriÃ§Ã£o e o vÃ­deo de cada faixa.
        - No player da sala de aula (`LessonPlayer`), ao alternar entre os botÃµes de idiomas, o tÃ­tulo da aula e o texto da aba de visÃ£o geral sÃ£o atualizados dinamicamente em tempo real para os textos daquele idioma.
        - Ao excluir uma aula ou curso, todos os vÃ­deos de todos os idiomas vinculados sÃ£o limpos automaticamente do banco e do Backblaze B2.
      - **Status de Disponibilidade da Aula ("DisponÃ­vel" vs "Em Breve"):**
        - O modal de criar e editar aula conta com um seletor de disponibilidade (`DisponÃ­vel` / `Em Breve`) persistido na coluna `availability_status` da tabela `lessons`.
        - **Comportamento HÃ­brido:** Se a aula for explicitamente marcada como "Em Breve" OU se foi criada mas ainda nÃ£o possui nenhum vÃ­deo enviado/vinculado, o sistema a reconhece automaticamente como aula em produÃ§Ã£o/em breve.
        - **VisÃ£o do Aluno:**
          - Na Timeline lateral (`ModuleTimelineSidebar`) e listas de aulas, a aula recebe um badge de destaque Ã¢mbar `Em Breve` com Ã­cone de relÃ³gio (`Clock`).
          - Ao abrir a aula no player, em vez de exibir tela preta ou mensagem genÃ©rica de erro, o player widescreen exibe uma tela cinematogrÃ¡fica "Aula em Breve / Aula em ProduÃ§Ã£o" estilizada, com a thumbnail de capa (se houver), mensagem acolhedora informando que o conteÃºdo serÃ¡ liberado em breve, e bloqueio de conclusÃ£o prematura.
        - **VisÃ£o do Administrador / Instrutor:** O administrador visualiza o status e conta com botÃ£o direto "Editar Aula e Subir VÃ­deo" na tela de prÃ©-visualizaÃ§Ã£o da aula para anexar o vÃ­deo assim que estiver pronto.
    - **Aulas de Leitura e Artigo (`content_type == 'text'`):**
      - **Editor de Artigo (`LessonArticleEditor`):** No modal de criaÃ§Ã£o e ediÃ§Ã£o da aula, a aba "Texto do Artigo" conta com abas interativas ("Escrever Texto" vs "PrÃ©-visualizar Artigo").
      - **Upload de Imagens no Artigo:** BotÃ£o dedicado "Enviar Imagem do PC" para envio de imagens (JPG, PNG, WEBP atÃ© 5 MB hospedadas no Backblaze B2) inserindo automaticamente a tag markdown `![Legenda](url)` na posiÃ§Ã£o do cursor, alÃ©m de botÃ£o "Link URL" para imagens externas.
      - **Atalhos RÃ¡pidos de FormataÃ§Ã£o:** Barra de ferramentas para inserÃ§Ã£o de SubtÃ­tulos (`## `), Negrito (`**texto**`), Itens de Lista (`- `) e divisores.
      - **VisualizaÃ§Ã£o Editorial (`LessonTextViewer`):** Renderiza o artigo com diagramaÃ§Ã£o cinematogrÃ¡fica, imagens ilustrativas centralizadas com bordas suaves e legendas explicativas, alÃ©m da barra completa de aÃ§Ãµes (`LessonActionToolbar`) com avaliaÃ§Ã£o por estrelas, botÃ£o "Relatar Problema" e marcaÃ§Ã£o de conclusÃ£o sincronizada com a API do backend.
    - **Aulas de Quiz Interativo (`content_type == 'quiz'`):**
      - **Porcentagem MÃ­nima de AprovaÃ§Ã£o ConfigurÃ¡vel:** O administrador/instrutor pode definir a porcentagem de acertos exigida para que o aluno seja aprovado no quiz (coluna `passing_score_pct` na tabela `lessons`, padrÃ£o 70%, ajustÃ¡vel de 1% a 100%).
      - **PontuaÃ§Ã£o e Peso por QuestÃ£o:** Cada pergunta possui seu prÃ³prio valor em pontos configurÃ¡vel (coluna `points` na tabela `quiz_questions`, inteiro >= 1, padrÃ£o 1 ponto). O editor exibe em tempo real a soma total de pontos do quiz.
      - **CÃ¡lculo Ponderado de Nota:** A nota final obtida Ã© calculada proporcionalmente aos pontos das perguntas: `(pontos_obtidos / total_pontos) * 100`.
      - **CritÃ©rio de AprovaÃ§Ã£o AutomÃ¡tica:** Se o aluno atingir nota igual ou superior a `passing_score_pct`, a tentativa Ã© aprovada (`passed = True`) e a aula Ã© marcada automaticamente como concluÃ­da no progresso do curso. Caso contrÃ¡rio, a aula permanece nÃ£o concluÃ­da e o aluno pode refazer o quiz.
      - **SeguranÃ§a Antifraude:** O endpoint de consulta do quiz pelo aluno oculta o campo `is_correct` das opÃ§Ãµes, impossibilitando descobrir o gabarito via DevTools do navegador.
      - **Feedback Visual Claro:** O aluno visualiza os pontos de cada questÃ£o no card, a meta mÃ­nima no banner superior (`AprovaÃ§Ã£o com X%`) e, ao submeter, visualiza a pontuaÃ§Ã£o obtida versus total de pontos (`X de Y pontos`), a nota percentual e o feedback de aprovaÃ§Ã£o ou incentivo para refazer.
  - **Reprodutor de VÃ­deo Customizado (`CustomVideoPlayer` e `VideoControls`):**
    - **Feedback Imediato de Carregamento e Buffering:** O player oferece feedback visual instantÃ¢neo ao alternar entre aulas ou quando a rede oscila.
    - **Overlay Central Neon de Buffering:** Sempre que a transmissÃ£o precisa carregar dados na rede (`waiting`, `stalled`, `seeking`), o centro da tela exibe um painel elegante translÃºcido com spinner animado e mensagens claras ("Carregando vÃ­deo... Baixando dados de transmissÃ£o, aguarde..."), eliminando a sensaÃ§Ã£o de tela congelada.
    - **Barra de Buffer Visual na Timeline:** O trilho de progresso exibe uma barra de buffer translÃºcida (`video-buffered-bar`) Ã  frente do tempo atual, permitindo acompanhar o carregamento contÃ­nuo dos pacotes de mÃ­dia.
    - **Streaming e Compatibilidade de Formatos:** O backend serve requisiÃ§Ãµes de corte de intervalo (HTTP 206 Partial Content / Range requests) com `media_type` ajustado conforme a extensÃ£o (`.mp4`, `.mov`, `.webm`, `.mkv`), otimizando o fluxo de dados.
  - **NavegaÃ§Ã£o:** O player permite avanÃ§ar para a "PrÃ³xima Aula" ou retroceder para a "Aula Anterior" diretamente na interface.
- **Aba de ComentÃ¡rios da Aula:**
  - Aba dedicada abaixo do player de cada aula.
  - **Caixa de Envio Premium (NewCommentBox):** Card com Glassmorphism, degradê suave, bordas translúcidas e anel de foco dinâmico em azul (#3b82f6). Exibe avatar com iniciais do usuário logado, badge de perfil, atalho Ctrl+Enter e botão Limpar.
  - Alunos e administradores podem enviar comentÃ¡rios com dÃºvidas ou feedbacks.
  - Cada comentÃ¡rio exibe o nome do autor, badge de perfil (Aluno, Admin, Super Admin), avatar e data/hora no formato de BrasÃ­lia.
  - **PaginaÃ§Ã£o de ComentÃ¡rios:**
    - A listagem exibe inicialmente os primeiros **20 comentÃ¡rios** da aula.
    - Quando houver mais de 20 comentÃ¡rios, a barra de navegaÃ§Ã£o ("Anterior", "PrÃ³xima", contador "PÃ¡gina X de Y" e intervalo "Exibindo XâY de Z comentÃ¡rios") permite navegar entre as pÃ¡ginas.
    - Ao enviar um novo comentÃ¡rio, caso ultrapasse o limite da pÃ¡gina atual, a navegaÃ§Ã£o Ã© direcionada para a Ãºltima pÃ¡gina para exibir o comentÃ¡rio recÃ©m-criado.
  - O autor do comentÃ¡rio pode excluir seu prÃ³prio comentÃ¡rio a qualquer momento.
  - Superadmin e Admin possuem privilÃ©gio de moderaÃ§Ã£o, podendo excluir qualquer comentÃ¡rio.
  - Toda exclusÃ£o exige confirmaÃ§Ã£o explÃ­cita em popup modal com fundo escuro.
  - **Respostas e Threads em 1 NÃ­vel:**
    - Tanto alunos quanto administradores podem responder a qualquer comentÃ¡rio clicando no botÃ£o "Responder".
    - A estrutura organiza as respostas em **1 nÃ­vel de thread** (todas as respostas ficam aninhadas diretamente abaixo do comentÃ¡rio raiz original com linha conectora lateral sutil).
    - Clicar em "Responder" em uma resposta prÃ©-existente insere automaticamente a menÃ§Ã£o `@Nome` no campo de texto e ancora a resposta na thread principal.
    - Se houver respostas, o comentÃ¡rio exibe o botÃ£o de alternÃ¢ncia "Ver X respostas" / "Ocultar respostas".
    - O autor da resposta ou administradores podem excluir uma resposta individual; ao excluir o comentÃ¡rio raiz original, toda a thread com suas respostas Ã© excluÃ­da em cascata.
  - **Curtidas em ComentÃ¡rios e Respostas:**
    - Alunos e gestores podem curtir ou descurtir comentÃ¡rios raÃ­zes e respostas de aulas clicando no botÃ£o de coraÃ§Ã£o (`Heart`).
    - Cada usuÃ¡rio pode registrar no mÃ¡ximo 1 curtida por comentÃ¡rio/resposta (chave Ãºnica `uq_lesson_comment_like_user` na tabela `lesson_comment_likes`).
    - O botÃ£o exibe o contador total de curtidas e adquire destaque visual vermelho (`#ef4444`) quando curtido pelo prÃ³prio usuÃ¡rio logado (`liked_by_me`).
    - Quando um aluno curte o comentÃ¡rio de outro aluno, o sistema de gamificaÃ§Ã£o bonifica o autor do comentÃ¡rio com pontos de engajamento comunitÃ¡rio.
- **Aba de Materiais Complementares e Anexos da Aula:**
  - Aba dedicada **"Materiais Complementares"** abaixo do player da aula, exibindo contador em badge de quantos arquivos estÃ£o disponÃ­veis.
  - **Upload Direto na Sala de Aula (Admin/Super Admin):** Quando logado como admin ou superadmin, a aba "Materiais Complementares" exibe no topo a barra de ferramentas de gestão com o botão em destaque "+ Anexar Arquivo do PC". O arquivo é enviado diretamente ao storage e associado à aula em tempo real, atualizando o contador em badge e a lista instantaneamente, além de disponibilizar botão de exclusão de cada documento com confirmação em modal escuro.
  - **Upload e GestÃ£o:** No modal de criar ou editar aula, o instrutor pode anexar arquivos do seu computador de atÃ© 100 MB (PDF, Word, Excel, PowerPoint, ZIP, RAR, TXT, CSV), armazenados no Backblaze B2 (`AreaDeMembros/attachments/`).
  - **TÃ­tulo e DescriÃ§Ã£o do Documento:** Para cada arquivo anexado, o instrutor pode definir tanto o **nome exibido** quanto uma **descriÃ§Ã£o textual explicativa** (ex: instruÃ§Ãµes de uso da planilha, exercÃ­cios da apostila, etc.).
  - **Acesso pelos Alunos:** Os alunos visualizam cada material com seu Ã­cone correspondente (PDF em vermelho, planilhas em verde, compactados em amarelo, etc.), tÃ­tulo, descriÃ§Ã£o explicativa quando informada, tamanho formatado (KB/MB) e o botÃ£o **"Acessar"** para abrir/baixar o arquivo.
  - **Limpeza AutomÃ¡tica em Nuvem:** Ao remover um anexo ou excluir a aula/curso, os arquivos correspondentes sÃ£o automaticamente deletados do Backblaze B2.
- **Popups de Upload e ExclusÃ£o de MÃ­dias e Arquivos:**
  - **Upload de Arquivos/VÃ­deos/Capas:**
    - Ao iniciar qualquer envio de arquivo (vÃ­deo da aula atÃ© 2 GB, capa da aula atÃ© 5 MB, capa do curso atÃ© 5 MB, documentos/anexos atÃ© 100 MB), o sistema abre obrigatoriamente um popup modal centralizado com fundo escuro translÃºcido (`UploadProgressModal`).
    - O modal exibe spinner animado, Ã­cone de nuvem, mensagem explicativa e barra de progresso contÃ­nua animada.
    - O modal **nÃ£o** permite fechamento acidental ao clicar fora do painel central.
    - O modal fecha automaticamente assim que a transferÃªncia para a nuvem for concluÃ­da com sucesso ou em caso de erro.
  - **ConfirmaÃ§Ã£o de ExclusÃ£o de Arquivos/MÃ­dias:**
    - Toda aÃ§Ã£o de remoÃ§Ã£o de mÃ­dia ou documento (remover anexo, remover capa da aula, remover capa do curso, desvincular vÃ­deo da aula ou remover faixa de idioma) exige obrigatoriamente um popup modal de confirmaÃ§Ã£o centralizado (`FileDeleteConfirmModal`).
    - Possui fundo preto translÃºcido, nÃ£o fecha ao clicar fora e conta estritamente com **1 botÃ£o Cancelar** e **1 botÃ£o Confirmar ExclusÃ£o**.
    - A exclusÃ£o fÃ­sica ou lÃ³gica sÃ³ Ã© disparada apÃ³s a confirmaÃ§Ã£o no modal.

---

## 3. InteraÃ§Ãµes com a Aula (ConclusÃ£o, AvaliaÃ§Ã£o e Relato de Problemas)
- **MarcaÃ§Ã£o de Aula como Assistida (Progresso do Aluno):**
  - Cada aluno pode marcar e desmarcar a aula como concluÃ­da atravÃ©s do botÃ£o interativo "Marcar como Assistida" / "Aula ConcluÃ­da" na barra de aÃ§Ãµes (`LessonActionToolbar`) localizada logo abaixo do tÃ­tulo e duraÃ§Ã£o da aula.
  - O status Ã© registrado na tabela `lesson_progress` vinculado ao aluno autenticado e Ã  aula especÃ­fica.
  - Na lista de aulas da barra lateral do curso, as aulas jÃ¡ assistidas recebem instantaneamente um Ã­cone de verificaÃ§Ã£o verde (`CheckCircle2`) e o **nome da aula fica riscado no meio (`line-through`)**, facilitando a identificaÃ§Ã£o visual imediata do avanÃ§o pelo aluno.
- **AvaliaÃ§Ã£o da Aula (0 a 5 Estrelas):**
  - O aluno pode registrar sua avaliaÃ§Ã£o na aula clicando na escala interativa de 1 a 5 estrelas.
  - Ao passar o mouse pelas estrelas, o componente exibe um destaque dourado interativo.
  - O sistema armazena a nota individual de cada aluno na tabela `lesson_ratings` e exibe dinamicamente a mÃ©dia aritmÃ©tica consolidada e a contagem total de avaliaÃ§Ãµes recebidas pela aula.
- **Relato de Problemas na Aula:**
  - O aluno conta com a opÃ§Ã£o "Relatar Problema" na barra de aÃ§Ãµes da aula.
  - Ao clicar, abre-se um modal centralizado com fundo escuro translÃºcido (`LessonReportModal`) que nÃ£o fecha com clique fora acidental.
  - Categorias de problemas prÃ©-definidas:
    - VÃ­deo nÃ£o carrega / trava (`video`)
    - Ãudio baixo / com ruÃ­do (`audio`)
    - Material ou anexo com erro / link quebrado (`material`)
    - DÃºvida ou erro no conteÃºdo apresentado (`content`)
    - Outro problema (`other`)
  - O campo de descriÃ§Ã£o textual detalhada Ã© obrigatÃ³rio para garantir clareza no diagnÃ³stico da equipe de suporte.
  - Os relatos ficam persistidos na tabela `lesson_reports` com status inicial `open` (em aberto).
- **Central de GestÃ£o de Relatos e NotificaÃ§Ãµes no Painel:**
  - **Menu Lateral (Categoria Geral):**
    - Administradores (`admin` e `superadmin`) visualizam o item **"Relatos de Aulas"** na categoria **Geral** da barra lateral.
    - **NotificaÃ§Ã£o:** Ao lado do item "Relatos de Aulas", Ã© exibido um **badge numÃ©rico em vermelho** contendo a quantidade de problemas em aberto (`status == 'open'`). Se nÃ£o houver chamados pendentes, o badge fica oculto.
  - **Tela de GestÃ£o (`LessonReportsManagement`):**
    - **MÃ©tricas no Topo:** Cards exibindo "Total de Relatos", "Pendentes / Em Aberto" (em vermelho) e "Resolvidos" (em verde).
    - **Filtros e Busca:** Campo de busca textual (aluno, e-mail, aula, curso, descriÃ§Ã£o) e seletores por tipo de problema e status.
    - **IdentificaÃ§Ã£o do Autor do Relato:** Cada card exibe o nome, e-mail e um **badge de perfil** colorido identificando o tipo de usuÃ¡rio (`Super Admin`, `Admin`, `Aluno` ou `UsuÃ¡rio`).
    - **Fuso HorÃ¡rio de BrasÃ­lia:** A data e a hora do chamado sÃ£o obrigatoriamente convertidas e exibidas no **HorÃ¡rio Oficial de BrasÃ­lia (`America/Sao_Paulo`)**, garantindo exatidÃ£o no acompanhamento.
    - **AÃ§Ãµes Administrativas com ConfirmaÃ§Ã£o:**
      - **Popup de ConfirmaÃ§Ã£o para "Marcar como Resolvido":** Ao clicar no botÃ£o para resolver o chamado, um modal centralizado com fundo preto translÃºcido (`ActionConfirmModal`) Ã© exibido para confirmaÃ§Ã£o antes de atualizar o status.
      - **Reabertura:** O administrador pode reabrir o chamado a qualquer momento.
      - Ao resolver ou reabrir, o contador do badge na barra lateral Ã© atualizado em tempo real.
      - **ExclusÃ£o Segura:** OpÃ§Ã£o de excluir o registro com popup de confirmaÃ§Ã£o centralizado com fundo escuro translÃºcido.

---

## 4. AnotaÃ§Ãµes Privadas do Aluno na Aula
- **Privacidade Absoluta:**
  - O aluno possui uma aba dedicada **"Minhas AnotaÃ§Ãµes"** abaixo do player da aula.
  - **Acesso Estritamente Restrito:** Apenas o prÃ³prio aluno que escreveu as anotaÃ§Ãµes tem acesso a elas. Nenhum outro aluno, nem mesmo administradores ou instrutores, tem acesso ou visualizaÃ§Ã£o das anotaÃ§Ãµes privadas do aluno na interface.
  - Os registros na tabela `lesson_notes` sÃ£o estritamente filtrados pelo `user_id` do aluno autenticado e pela aula especÃ­fica (`lesson_id`).
- **Estrutura em Badges / Cards Individuais:**
  - Ao salvar uma anotaÃ§Ã£o, ela se transforma em um **badge/card individual estilizado**, permitindo ao aluno registrar mÃºltiplos apontamentos e insights ao longo da aula.
  - O cabeÃ§alho exibe um badge com o total de anotaÃ§Ãµes feitas pelo aluno na aula.
  - **Data e HorÃ¡rio de BrasÃ­lia:** Cada badge de anotaÃ§Ã£o exibe uma tag com a data e horÃ¡rio no **HorÃ¡rio Oficial de BrasÃ­lia (`America/Sao_Paulo`)**, indicando com exatidÃ£o quando a anotaÃ§Ã£o foi criada e se foi editada.
  - **EdiÃ§Ã£o Inline de Cada Badge:**
    - Cada badge conta com a opÃ§Ã£o **"Editar"** que abre o editor inline exclusivo daquele apontamento, permitindo alterar o texto e salvar ou cancelar com facilidade.
  - **ExclusÃ£o Segura com ConfirmaÃ§Ã£o:**
    - Cada badge conta com a opÃ§Ã£o **"Excluir"**.
    - Ao clicar, Ã© exibido obrigatoriamente um popup modal centralizado com fundo escuro translÃºcido (`FileDeleteConfirmModal`), atendendo Ã s regras de UX contra deleÃ§Ãµes acidentais.
  - **Salvamento Ãgil de Novas AnotaÃ§Ãµes:**
    - Campo de nova anotaÃ§Ã£o com contador de caracteres.
    - BotÃ£o "Salvar AnotaÃ§Ã£o" com spinner de loading e feedback por toast.
    - Atalho de teclado rÃ¡pido: `Ctrl + Enter` para criar o novo badge instantaneamente.
  - **PaginaÃ§Ã£o de Badges (20 por pÃ¡gina):**
    - A listagem exibe no mÃ¡ximo os **20 primeiros badges de anotaÃ§Ãµes** por pÃ¡gina.
    - Quando houver mais de 20 anotaÃ§Ãµes, a barra de navegaÃ§Ã£o inferior exibe o intervalo (ex: `Exibindo 1â20 de 25 anotaÃ§Ãµes`), indicador de pÃ¡gina (`PÃ¡gina 1 de 2`) e botÃµes de navegaÃ§Ã£o `Anterior` e `PrÃ³xima`.
    - Ao criar uma nova anotaÃ§Ã£o, a navegaÃ§Ã£o retorna automaticamente para a pÃ¡gina 1 para exibir o badge recÃ©m-adicionado de imediato.

---

## 5. PersonalizaÃ§Ã£o Visual Estilo Netflix (Cursos, MÃ³dulos e Aulas)
- **ConfiguraÃ§Ã£o Completa pelos Administradores (`admin` e `superadmin`):**
  - **Cor de Fundo Global da Ãrea de Membros (Aba `ConfiguraÃ§Ãµes` na Barra Lateral):**
    - PadrÃ£o `#090d16` (*Netflix Dark*).
    - Configurada globalmente atravÃ©s do botÃ£o **"ConfiguraÃ§Ãµes"** na categoria **Geral** da barra lateral (`PlatformSettings`), e **nÃ£o** individualmente dentro de cada curso â garantindo que toda a plataforma (barra lateral, vitrine de cursos, salas de aula e popups de todos os cursos) mantenha uma Ãºnica identidade visual consistente.
    - Conta com seletor livre de cor (`color picker` + input hexadecimal), prÃ©-visualizaÃ§Ã£o ao vivo e presets rÃ¡pidos: **Netflix Dark (`#090d16`)**, **Preto OLED (`#000000`)**, **Grafite Escuro (`#121620`)**, **Azul Meia-Noite (`#0b1120`)** e **Claro ClÃ¡ssico (`#f8fafc`)**.
  - **Banner Hero CinemÃ¡tico do Curso (`cover_image_url` na tabela `courses`):**
    - Imagem panorÃ¢mica exibida no topo da sala de aula com degradÃª cinemÃ¡tico integrado Ã  cor de fundo escolhida, tÃ­tulo em destaque, botÃ£o CTA ("Comece Agora" / "Continuar Assistindo") e barra de progresso percentual do aluno.
    - Caso nÃ£o seja informado um Banner Hero especÃ­fico, utiliza automaticamente a capa principal do curso (`thumbnail_url`) ou um degradÃª radial elegante.
  - **Imagem de Capa / PÃ´ster dos MÃ³dulos (`image_url` na tabela `modules`):**
    - Cada mÃ³dulo pode ter sua prÃ³pria imagem de capa configurada via URL ou upload direto para o Backblaze B2 no modal de Criar/Editar MÃ³dulo.
    - Os mÃ³dulos sÃ£o exibidos em uma **trilha horizontal de pÃ´steres verticais (Estilo Netflix / BE.EXPERT)** logo abaixo do Banner Hero, mostrando tag `MÃDULO X`, imagem de fundo com degradÃª, tÃ­tulo e progresso de conclusÃ£o das aulas daquele mÃ³dulo.
  - **ExperiÃªncia Imersiva sem Barra Lateral e SeleÃ§Ã£o Sob Demanda:**
    - Ao entrar em um curso, a barra lateral esquerda do sistema (`Sidebar`) Ã© ocultada automaticamente para proporcionar imersÃ£o total na cor de fundo configurada.
    - O botÃ£o **"Voltar aos Cursos"** no topo possui estilo *Dark Glassmorphism* (pÃ­lula translÃºcida com Ã­cone dourado) e o tÃ­tulo do curso ao lado Ã© exibido com alto contraste.
    - Ao entrar no curso, as aulas e o player **nÃ£o aparecem abertos inicialmente**: a seÃ§Ã£o inferior de aulas + player de vÃ­deo sÃ³ Ã© exibida na parte de baixo quando o aluno **aperta no card do mÃ³dulo escolhido** (ou clica em "Comece Agora" / "Continuar Assistindo").
    - **Layout Editorial de Aula + Timeline de MÃ³dulos (ao clicar em um mÃ³dulo):**
      - **Player Widescreen no Topo:** O player de vÃ­deo ocupa toda a largura superior da seÃ§Ã£o da aula com cantos arredondados e sombra cinemÃ¡tica, sem caixa branca ao redor.
      - **Grid em 2 Colunas Abaixo do Player:**
        - **Coluna Esquerda (Editorial & InteraÃ§Ãµes):** TÃ­tulo da aula em destaque, trilha de navegaÃ§Ã£o (*breadcrumb* `InÃ­cio > Curso > MÃ³dulo > Editar esse conteÃºdo`), descriÃ§Ã£o editorial limpa sobre o fundo escuro da Ã¡rea de membros, barra de aÃ§Ãµes com botÃ£o verde em pÃ­lula (`Marcar como Assistida` / `Aula ConcluÃ­da`), alÃ©m das abas interativas (`VisÃ£o Geral`, `Materiais Complementares`, `Minhas AnotaÃ§Ãµes`, `ComentÃ¡rios`).
        - **Coluna Direita (`ModuleTimelineSidebar`):** Exibe no topo o indicador circular `Meu Progresso - X% (X de Y aulas)` e, logo abaixo, a Ã¡rvore vertical de mÃ³dulos e aulas em formato de **Timeline** (cada mÃ³dulo com seu anel de progresso; o mÃ³dulo selecionado expande uma linha vertical conectora listando as aulas numeradas `1. ...`, `2. ...` com marcador dourado na aula ativa e verde nas aulas concluÃ­das). Para tÃ­tulos longos de aula, o card aplica limitaÃ§Ã£o elegante de atÃ© **2 linhas com reticÃªncias (`line-clamp: 2`)** e exibe o tÃ­tulo completo em **tooltip nativo ao passar o mouse (`title`)**, preservando o alinhamento e a harmonia visual da barra lateral sem cards desproporcionais.
  - **Imagem de Fundo / Capa das Aulas (`thumbnail_url` na tabela `lessons`):**
    - AlÃ©m de servir como pÃ´ster do player de vÃ­deo da aula, a miniatura da aula tambÃ©m Ã© exibida na timeline e nos cards de aulas do mÃ³dulo selecionado.
  - **Limpeza AutomÃ¡tica no Backblaze B2:**
    - Ao substituir ou remover imagens de curso, banner hero, capa de mÃ³dulo ou miniatura de aula (sempre com popup de confirmaÃ§Ã£o centralizado), ou ao excluir o registro pai, os arquivos antigos correspondentes no Backblaze B2 sÃ£o removidos automaticamente.

---

## 6. Acompanhamento de Alunos e Progresso (`/students`)
- **LocalizaÃ§Ã£o na Barra Lateral:**
  - O botÃ£o **"Alunos"** fica localizado na categoria **Geral** da barra lateral, posicionado **logo abaixo de "Relatos de Aulas"** e acima de "ConfiguraÃ§Ãµes".
  - VisÃ­vel exclusivamente para perfis com permissÃ£o de gestÃ£o: **`superadmin`** e **`admin`**.
- **Listagem, MÃ©tricas e Filtros AvanÃ§ados:**
  - O painel exibe no topo os contadores gerais: **Total de Alunos**, **Alunos Ativos** e **Progresso MÃ©dio Geral**.
  - **Barra de Busca e Filtros AvanÃ§ados (`StudentFilterBar`):**
    - **Busca Textual:** Campo de pesquisa dinÃ¢mica por nome ou e-mail do aluno com botÃ£o de envio e botÃ£o de limpar busca.
    - **Filtro de OrdenaÃ§Ã£o (`order_by`):**
      - `Mais recentes (Cadastro)` (padrÃ£o)
      - `ð¯ Mais perto de terminar o curso`: ordena alunos pelo maior percentual de conclusÃ£o (`overall_progress_percent` decrescente).
      - `â³ Quase precisando renovar`: prioriza alunos matriculados em cursos com menor nÃºmero de dias restantes para expirar (`days_remaining`), seguidos por cursos expirados e, por Ãºltimo, acessos vitalÃ­cios.
      - `ð¤ Ordem alfabÃ©tica (A-Z)` e `ð¤ Ordem alfabÃ©tica (Z-A)`: ordenaÃ§Ã£o alfabÃ©tica pelo nome completo.
      - `Mais antigos (Cadastro)`
    - **Filtro por Curso (`course_id`):** Dropdown dinÃ¢mico com "Todos os Cursos" e todos os cursos cadastrados na plataforma, exibindo apenas alunos com matrÃ­cula ativa no curso selecionado.
    - **Filtro por MÃªs (`registration_month`):** Seletor de mÃªs/ano (`YYYY-MM`) que filtra alunos cadastrados naquele mÃªs especÃ­fico segundo o fuso de BrasÃ­lia.
    - **Filtro por Data EspecÃ­fica (`registration_date`):** Seletor de dia exato (`YYYY-MM-DD`) que filtra alunos cadastrados no dia civil selecionado.
    - **AÃ§Ã£o Limpar Filtros:** BotÃ£o contextual que reseta todos os filtros e a ordenaÃ§Ã£o com 1 clique.
  - **PaginaÃ§Ã£o e Controle de Quantidade por PÃ¡gina:**
    - Exibe no mÃ¡ximo **20 alunos por vez** por padrÃ£o.
    - Conta com um dropdown seletor estilizado que permite alternar a exibiÃ§Ã£o para **20, 50, 100 ou 200 alunos de uma Ãºnica vez**.
    - Barra inferior permanente informando o intervalo exibido (ex: `Exibindo 1â20 de 45 alunos`), indicador de pÃ¡gina (`PÃ¡gina 1 de 3`) e botÃµes de navegaÃ§Ã£o `Anterior` e `PrÃ³xima`.
- **Detalhes Exibidos por Aluno:**
  - **IdentificaÃ§Ã£o e HorÃ¡rio Oficial de BrasÃ­lia:** Nome completo, e-mail, WhatsApp com link direto, badge de status (`Aluno Ativo` / `Inativo`), porcentagem geral de conclusÃ£o e a tag `Aluno desde: DD/MM/AAAA Ã s HH:MM` **obrigatoriamente convertida e exibida no HorÃ¡rio Oficial de BrasÃ­lia (`America/Sao_Paulo`)**.
  - **Cursos aos quais o Aluno tem Acesso:**
    - Miniatura e tÃ­tulo de cada curso vinculado.
    - Prazo de acesso individual (`VitalÃ­cio` ou `Expira em DD/MM/AAAA` / alerta de `Acesso Expirado`).
    - **Linha do Tempo de Validade do Curso (Cursos NÃ£o-VitalÃ­cios):**
      - Quando o curso possui prazo determinado de expiraÃ§Ã£o, exibe uma seÃ§Ã£o visual de linha do tempo destacando:
        - Tempo restante: `Faltam X dias` (ou `Acesso Expirado`).
        - Alerta em Ã¢mbar para renovaÃ§Ã£o prÃ³xima quando faltar 7 dias ou menos.
        - Barra de progresso do perÃ­odo de acesso (tempo decorrido vs tempo total da concessÃ£o).
        - Marcadores temporais com data de inÃ­cio e tÃ©rmino exato (`TÃ©rmino: DD/MM/AAAA Ã s HH:MM`).
    - **HistÃ³rico de Acesso e Aulas Assistidas:**
      - BotÃ£o dedicado **"HistÃ³rico de Acesso"** em cada curso vinculado ao aluno.
      - Abre modal centralizado escuro translÃºcido (`StudentAccessHistoryModal`) com a listagem cronolÃ³gica de todas as aulas concluÃ­das pelo aluno naquele curso:
        - TÃ­tulo da aula e nome do mÃ³dulo correspondente.
        - Mensagem explÃ­cita com data e horÃ¡rio completo: `Assistiu a aula completa em DD/MM/AAAA Ã s HH:MM:SS`.
        - **PaginaÃ§Ã£o de Aulas ConcluÃ­das:** Limite de **no mÃ¡ximo 20 aulas por pÃ¡gina** (`PAGE_SIZE = 20`). Quando houver mais de 20 aulas, Ã© exibida a barra de paginaÃ§Ã£o com contador dinÃ¢mico (ex: `Exibindo 1â20 de 35 aulas concluÃ­das`), indicador de pÃ¡gina (`PÃ¡gina 1 de 2`) e botÃµes `Anterior` e `PrÃ³xima`.
        - Endpoint da API: `GET /api/v1/students/{student_id}/courses/{course_id}/history`.
    - **Disparo Manual de Eventos de Webhook/IntegraÃ§Ã£o:**
      - BotÃ£o dedicado em tom Ã¢mbar **"Disparar Evento"** em cada curso do aluno, ao lado do botÃ£o de histÃ³rico.
      - Abre o modal de disparo manual (`StudentTriggerWebhookModal`), permitindo que administradores forcem o envio de qualquer um dos 8 eventos suportados para as ferramentas de automaÃ§Ã£o vinculadas (n8n, ActiveCampaign, Make, etc.):
        - **Obrigatoriedade de Webhook Configurado:** SÃ³ Ã© permitido disparar eventos se houver pelo menos uma integraÃ§Ã£o de webhook ativa cadastrada para o curso (ou global). Se nÃ£o houver nenhum webhook configurado, o modal exibe um alerta explicativo de bloqueio e desativa o botÃ£o de disparo.
        - **SeleÃ§Ã£o da IntegraÃ§Ã£o Configurada:** O modal apresenta o seletor **"Selecione a IntegraÃ§Ã£o Configurada"**, permitindo que o administrador escolha exatamente qual webhook cadastrado irÃ¡ receber o disparo (ex: `ð Webhook N8N`, `ð Webhook Make`) ou opte por `â¡ Todas as IntegraÃ§Ãµes Ativas`.
        - **Eventos Suportados:** `course.progress.25`, `course.progress.50`, `course.progress.75`, `course.progress.100`, `lesson.completed`, `student.enrolled`, `course.renewal.warning_7d`, `course.renewal.expired`.
        - Endpoint da API: `POST /api/v1/students/{student_id}/courses/{course_id}/trigger-webhook` com payload contendo `event` e `webhook_id` opcional para direcionamento exato.
        - Carrega mÃ©tricas consolidadas em tempo real do aluno no curso e envia o payload assinado via HMAC SHA-256 para a integraÃ§Ã£o selecionada, gravando o histÃ³rico completo na tabela `webhook_logs`.
    - **Progresso Detalhado do Curso:** Quantidade exata de aulas assistidas vs total de aulas cadastradas (ex: `8 de 10 aulas`), barra de progresso visual colorida e porcentagem de conclusÃ£o.
    - **AtÃ© onde o aluno foi:** Exibe o tÃ­tulo da Ãºltima aula concluÃ­da pelo aluno naquele curso (ex: `Ãltima aula concluÃ­da: Aula 8 - TrÃ¢nsitos PlanetÃ¡rios`).
    - Badge de status do curso: `ConcluÃ­do` (100%), `Em Andamento` (> 0%) ou `NÃ£o Iniciado` (0%).
    - Controle de recolher/expandir a lista de cursos de cada aluno para manter a tela limpa e Ã¡gil.

- **ExportaÃ§Ã£o e ImportaÃ§Ã£o de Alunos via Planilha (CSV e Excel):**
  - **ExportaÃ§Ã£o:**
    - Localizado no cabeÃ§alho do painel de alunos, com dropdown para escolher entre **Exportar CSV (`.csv`)** e **Exportar Excel (`.xlsx`)**.
    - Exporta todos os alunos cadastrados com os cursos aos quais tÃªm acesso, validade de acesso, total de aulas, aulas concluÃ­das, progresso percentual e Ãºltima aula assistida.
    - O arquivo CSV Ã© codificado com BOM UTF-8 (`utf-8-sig`) e delimitador `;`, garantindo abertura nativa perfeita com acentuaÃ§Ã£o correta no Microsoft Excel no Windows.
  - **ImportaÃ§Ã£o:**
    - BotÃ£o **"Importar Alunos"** abre modal dedicado no padrÃ£o de design escuro translÃºcido com fechamento apenas via botÃ£o (sem fechar ao clicar fora).
    - Suporta upload de arquivos nos formatos **CSV (`.csv`)** e **Excel (`.xlsx`, `.xls`)**.
    - O sistema permite baixar planilhas modelo de exemplo (.csv e .xlsx) diretamente pelo modal para facilitar o preenchimento pelo administrador.
    - **Colunas Suportadas:** Aceita nomes de colunas em portuguÃªs ou inglÃªs (`Nome/Name`, `Email/E-mail`, `Senha/Password`, `Cursos/Courses`, `Tempo de Acesso/Duration`).
    - **AssociaÃ§Ã£o de Cursos:** A coluna de cursos aceita IDs numÃ©ricos ou nomes/tÃ­tulos dos cursos separados por vÃ­rgula ou ponto-e-vÃ­rgula.
    - **Cursos PadrÃ£o e DuraÃ§Ã£o PadrÃ£o:** No modal, o administrador pode selecionar cursos padrÃ£o adicionais e o tempo de acesso padrÃ£o (`VitalÃ­cio`, `1 mÃªs`, `3 meses`, `6 meses`, `1 ano`, `2 anos`, `3 anos`), que serÃ£o aplicados automaticamente caso a planilha nÃ£o especifique ou para complementar os acessos.
    - **Senha Segura:** Se a senha nÃ£o for fornecida na planilha, o sistema gera uma senha segura temporÃ¡ria para o aluno.
    - **AtualizaÃ§Ã£o Segura:** Se o e-mail do aluno jÃ¡ existir na plataforma, a conta Ã© atualizada com os novos cursos e prazos sem duplicar o usuÃ¡rio nem sobrescrever a senha existente.
    - **Resumo do Processamento:** Ao concluir a importaÃ§Ã£o, o modal exibe um resumo claro de alunos criados, atualizados e eventuais erros/avisos de linhas invÃ¡lidas.

---

## 7. MÃ³dulo de IntegraÃ§Ãµes e Webhooks (`/integrations`)
- **LocalizaÃ§Ã£o na Barra Lateral:**
  - O botÃ£o **"IntegraÃ§Ãµes"** fica localizado na categoria **Geral** da barra lateral, posicionado **logo abaixo de "Alunos"** e acima de "ConfiguraÃ§Ãµes".
  - VisÃ­vel exclusivamente para perfis com permissÃ£o de gestÃ£o: **`superadmin`** e **`admin`**.
- **Objetivo do MÃ³dulo:**
  - Permitir a conexÃ£o com ferramentas externas de automaÃ§Ã£o (n8n, Zapier, Make, ActiveCampaign, CRMs, Webhooks proprietÃ¡rios) enviando notificaÃ§Ãµes em tempo real atravÃ©s de requisiÃ§Ãµes HTTP POST com payloads em JSON.
- **Eventos de Disparo DisponÃ­veis:**
  - `course.progress.25`: Disparado quando o aluno atinge exatamente o marco de **25% de conclusÃ£o** de um curso.
  - `course.progress.50`: Disparado quando o aluno atinge exatamente o marco de **50% de conclusÃ£o** de um curso.
  - `course.progress.75`: Disparado quando o aluno atinge exatamente o marco de **75% de conclusÃ£o** de um curso.
  - `course.progress.100`: Disparado quando o aluno completa **100% das aulas** de um curso.
  - `lesson.completed`: Disparado individualmente a cada aula assistida/marcada como concluÃ­da.
  - `student.enrolled`: Disparado quando um novo aluno Ã© matriculado ou recebe acesso a um produto.
  - `course.renewal.warning_7d`: Disparado **1 semana antes (7 dias)** de expirar o prazo de acesso do aluno ao curso, permitindo campanhas preventivas de renovaÃ§Ã£o.
  - `course.renewal.expired`: Disparado quando termina o prazo do curso, enviando notificaÃ§Ã£o com status explÃ­cito: **"RenovaÃ§Ã£o do Curso"**.
- **VerificaÃ§Ã£o Programada e Manual de RenovaÃ§Ãµes:**
  - Endpoint `POST /api/v1/integrations/check-renewals` disponÃ­vel para rotas cron/agendamentos periÃ³dicos e checagens manuais no painel.
  - **FrequÃªncia e Regra de Disparo (VerificaÃ§Ã£o DiÃ¡ria):**
    - A checagem dos eventos `course.renewal.warning_7d` (aviso 7 dias antes) e `course.renewal.expired` (expiraÃ§Ã£o com status "RenovaÃ§Ã£o do Curso") deve ser realizada atravÃ©s de uma **verificaÃ§Ã£o periÃ³dica diÃ¡ria** (rotina agendada uma vez ao dia).
    - Aplica-se apenas para alunos que estÃ£o efetivamente matriculados em cursos com prazo determinado.
    - Se um aluno for matriculado com prazo curto (ex: faltando menos de 7 dias para vencer), o sistema nÃ£o dispara imediatamente no ato da matrÃ­cula, mantendo a cadÃªncia da verificaÃ§Ã£o diÃ¡ria automÃ¡tica para evitar disparos descontextualizados no momento do onboarding.
- **ConfiguraÃ§Ã£o do Webhook:**
  - **Nome:** Identificador legÃ­vel da integraÃ§Ã£o (ex: "Disparo n8n Marcos Alunos", "Zapier ParabÃ©ns 100%").
  - **URL de Destino:** Endpoint pÃºblico seguro que receberÃ¡ os payloads via mÃ©todo POST.
  - **Chave Secreta (Assinatura HMAC-SHA256):** Campo opcional onde o usuÃ¡rio pode definir um segredo compartilhado. Se preenchido, o sistema calcula a assinatura HMAC-SHA256 do corpo da requisiÃ§Ã£o e envia no cabeÃ§alho `X-Webhook-Signature: sha256=<hash>`, permitindo ao servidor receptor validar a autenticidade e integridade do webhook.
  - **Filtro de Curso:** O webhook pode escutar eventos de **"Todos os Cursos"** ou ser restrito a um **curso especÃ­fico**.
  - **SeleÃ§Ã£o FlexÃ­vel de Eventos:** Suporta marcar individualmente quaisquer combinaÃ§Ãµes de eventos ou o botÃ£o de atalho "Selecionar Todos".
  - **AtivaÃ§Ã£o:** Chave de ativaÃ§Ã£o para habilitar ou pausar o envio de eventos sem precisar excluir a configuraÃ§Ã£o.
- **Disparo AssÃ­ncrono e Resiliente:**
  - Todos os webhooks de progresso e conclusÃ£o de aula sÃ£o despachados de forma assÃ­ncrona em background via `BackgroundTasks` do FastAPI no momento em que o aluno conclui uma aula (`POST /courses/{course_id}/lessons/{lesson_id}/progress`).
  - O cÃ¡lculo de porcentagem avalia o progresso anterior vs o novo progresso apÃ³s a conclusÃ£o da aula, garantindo que os webhooks dos marcos (25%, 50%, 75%, 100%) disparem no momento exato em que a barra atinge ou ultrapassa a meta.
  - O tempo de resposta para o aluno na interface nÃ£o sofre atraso nem bloqueio durante a comunicaÃ§Ã£o com servidores externos (timeout configurado de 10 segundos).
- **HistÃ³rico e Logs de ExecuÃ§Ã£o:**
  - Cada disparo Ã© registrado na tabela `webhook_logs` com status HTTP retornado, tempo de execuÃ§Ã£o em milissegundos (`execution_time_ms`), payload JSON enviado e corpo da resposta recebida.
  - O painel conta com modal de histÃ³rico detalhado acessÃ­vel pelo botÃ£o "Logs", com pesquisa rÃ¡pida e expansÃ£o do JSON enviado para auditoria e diagnÃ³stico.
- **Teste Imediato pelo Painel:**
  - Cada webhook possui o botÃ£o **"Testar"**, permitindo enviar um payload mock instantÃ¢neo ao endpoint configurado e exibindo o status HTTP e retorno com toast feedback na tela.

---

## 8. Convites de Acesso e Cadastro de Alunos
- **Tempo de Validade do Convite:**
  - O administrador pode escolher o tempo para o link do convite expirar: `1 hora`, `6 horas`, `12 horas`, `24 horas (1 dia)`, `48 horas (2 dias)`, `7 dias` ou **`Indefinido (nÃ£o expira)`** (`duration_hours = 0` ou `None`, com `expires_at = NULL` no banco de dados).
  - Links com prazo indefinido permanecem vÃ¡lidos permanentemente atÃ© serem utilizados pelo convidado ou excluÃ­dos pelo administrador.
  - Na tabela de convites gerados, o tempo restante Ã© exibido como badge amigÃ¡vel `NÃ£o expira` (`Indefinido`).
- **Data e HorÃ¡rio de CriaÃ§Ã£o (HorÃ¡rio Oficial de BrasÃ­lia):**
  - Tanto na tabela de **"Convites Gerados"** (coluna **"CRIADO EM"**) quanto no modal de sucesso apÃ³s gerar um convite, a data e o horÃ¡rio de criaÃ§Ã£o sÃ£o exibidos explicitamente no **HorÃ¡rio Oficial de BrasÃ­lia** (`America/Sao_Paulo`), no formato amigÃ¡vel `DD/MM/AAAA Ã s HH:MM` (ex: `01/10/2026 Ã s 13:01`).
- **NÃºmero de WhatsApp / Telefone do UsuÃ¡rio:**
  - Na tela de cadastro via convite (`/register`), o preenchimento do **WhatsApp / Telefone Ã© obrigatÃ³rio** (`phone` com validaÃ§Ã£o de formato e comprimento mÃ­nimo no backend e frontend).
  - **Seletor de Bandeira e DDI Internacional:**
    - O campo jÃ¡ vem configurado com a bandeira do **Brasil ð§ð· (`+55`)** como padrÃ£o prÃ©-selecionado.
    - O usuÃ¡rio pode clicar no seletor para escolher qualquer outro paÃ­s (Portugal ðµð¹ `+351`, Estados Unidos ðºð¸ `+1`, Angola ð¦ð´ `+244`, MoÃ§ambique ð²ð¿ `+258`, Espanha ðªð¸ `+34`, Argentina ð¦ð· `+54`, etc.), adaptando dinamicamente o DDI e a mÃ¡scara de digitaÃ§Ã£o.
    - O nÃºmero completo persistido armazena o DDI com o nÃºmero (ex: `+55 (11) 98765-4321` ou `+351 912345678`).
  - O nÃºmero Ã© persistido na coluna `phone` das tabelas `registration_verifications` e `users`.
  - No painel de acompanhamento de alunos (`/students`) e na tabela de **"UsuÃ¡rios Criados"** (`/users`), Ã© exibida a coluna dedicada **WhatsApp** com link direto verde (`https://wa.me/...`) considerando automaticamente o DDI internacional ou fallback nacional para nÃºmeros legados, e traÃ§o (`â`) discreto caso o usuÃ¡rio nÃ£o possua nÃºmero cadastrado.
  - As exportaÃ§Ãµes de alunos em CSV e Excel (XLSX) incluem a coluna dedicada **`WhatsApp/Telefone`**.
- **Acesso via Link de Convite de Conta Já Criada ou Convite Expirado:**
  - Se um lead tentar acessar o sistema utilizando um link de convite (`/register?token=...` ou `?token=...`):
    - **Convite Já Utilizado com Sessão Ativa:** Caso o usuário já possua uma sessão ativa e válida no navegador, o sistema redireciona automaticamente para a **tela principal** da plataforma (área de cursos) e limpa os parâmetros de convite da URL, com feedback via toast (*"Você já possui uma conta ativa. Redirecionando para a tela principal..."*).
    - **Convite Já Utilizado sem Autenticação / Sessão Expirada:** Redireciona imediatamente para a **tela de login**, limpando os parâmetros da URL, preenchendo automaticamente o e-mail registrado (`used_by_email`), e exibindo toast orientando o login (*"Sua conta já foi criada anteriormente com este convite. Faça login para acessar seus cursos."*).
    - **Convite Expirado com Sessão Ativa:** Redireciona automaticamente para a **tela principal**, limpando os parâmetros da URL, com feedback via toast (*"Este convite expirou, mas você já possui uma sessão ativa. Redirecionando para a tela principal..."*).
    - **Convite Expirado sem Autenticação / Sessão Expirada:** Redireciona imediatamente para a **tela de login**, limpando os parâmetros da URL e exibindo toast orientando o usuário (*"Este convite expirou. Solicite um novo convite ao administrador do sistema."*).
- **CriaÃ§Ã£o Manual Direta de UsuÃ¡rios pelo Administrador (`/users`):**
  - O cabeÃ§alho da GestÃ£o de UsuÃ¡rios conta com o botÃ£o principal em destaque **`+ Criar UsuÃ¡rio`** (para cadastro imediato direto) e o botÃ£o secundÃ¡rio **`Gerar Convite`** (para criar links com tempo de expiraÃ§Ã£o).
  - **Sem Necessidade de ValidaÃ§Ã£o de E-mail (Sem OTP):** Ao criar manualmente pelo painel, a conta do usuÃ¡rio Ã© criada imediatamente ativa (`is_active = True`), dispensando o envio e confirmaÃ§Ã£o de cÃ³digo de 6 dÃ­gitos no e-mail.
  - **ValidaÃ§Ã£o de E-mail Duplicado:** O sistema realiza a verificaÃ§Ã£o estrita de unicidade do e-mail. Caso o e-mail jÃ¡ pertenÃ§a a outro usuÃ¡rio, a criaÃ§Ã£o Ã© bloqueada com mensagem clara de erro (`Este e-mail jÃ¡ estÃ¡ cadastrado no sistema`).
  - **DefiniÃ§Ã£o de Credenciais e Perfil:**
    - O administrador preenche diretamente o **Nome Completo**, **E-mail**, **WhatsApp/Telefone** (com suporte ao seletor internacional de DDI), **Senha de Acesso** (com botÃ£o interativo de alternar visibilidade / ocultar senha, checklist em tempo real e validaÃ§Ã£o estrita de requisitos: **no mÃ­nimo 12 caracteres, pelo menos 1 letra maiÃºscula, 1 minÃºscula, 1 nÃºmero e 1 caractere especial**) e o **Tipo de UsuÃ¡rio** (`aluno` ou `admin`).
    - Senhas sÃ£o validadas estritamente no frontend e backend e criptografadas com seguranÃ§a mÃ¡xima utilizando o algoritmo padrÃ£o da plataforma (Argon2id).
  - **LiberaÃ§Ã£o Imediata de Cursos e Tempo de Acesso:**
    - Ao selecionar o tipo `aluno`, o administrador pode selecionar os produtos/cursos aos quais o novo aluno terÃ¡ acesso imediato e definir o perÃ­odo individual de vigÃªncia (`VitalÃ­cio`, `1 mÃªs`, `3 meses`, `6 meses`, `1 ano`, `2 anos`, `3 anos`).
    - As datas de expiraÃ§Ã£o (`expires_at`) em `user_courses` sÃ£o calculadas e persistidas no ato da criaÃ§Ã£o com base no momento do cadastro.

---

## 9. Perguntas em Aberto e HistÃ³rico de DecisÃµes
- [x] [RESOLVIDO] Como devem ser tratados os disparos do evento "RenovaÃ§Ã£o do Curso (7 dias antes)" caso o aluno seja matriculado faltando menos de 7 dias para expirar? Deve disparar imediatamente no momento da matrÃ­cula ou apenas na verificaÃ§Ã£o periÃ³dica do cron diÃ¡rio?
  - **DecisÃ£o do Dono do Projeto:** Deve ser uma verificaÃ§Ã£o periÃ³dica diÃ¡ria e aplicada apenas para alunos que forem efetivamente matriculados (sem disparo forÃ§ado imediato no momento do cadastro do aluno, respeitando o ciclo da verificaÃ§Ã£o diÃ¡ria).
- [x] [RESOLVIDO] O tempo de expiraÃ§Ã£o do convite pode ser indefinido? E o aluno pode informar o nÃºmero de WhatsApp no cadastro?
  - **DecisÃ£o do Dono do Projeto:** Sim, o tempo de expiraÃ§Ã£o pode ser indefinido (nÃ£o expira).
- [x] [RESOLVIDO] O WhatsApp no cadastro deve ser obrigatÃ³rio ou opcional? Como deve funcionar o DDI e bandeiras?
  - **DecisÃ£o do Dono do Projeto:** O WhatsApp Ã© estritamente obrigatÃ³rio. A bandeira do Brasil ð§ð· (+55) Ã© o padrÃ£o inicial, e o usuÃ¡rio pode selecionar outras bandeiras para aplicar o DDI de outros paÃ­ses.
- [ ] [NOVO] No nÃ³ de Mensagem do Funil, quando o aluno receber botÃµes interativos, o clique em cada botÃ£o deve ramificar para um nÃ³ especÃ­fico do fluxo visual ou registrar uma tag/aÃ§Ã£o?
- [ ] [NOVO] Na execuÃ§Ã£o de nÃ³s de Delay longos (ex: mais de 10 minutos), o funil deve persistir o agendamento no banco de dados para retomar apÃ³s eventuais reinÃ­cios de servidor?
- [ ] [NOVO] Quando o aluno subir de nÃ­vel de RPG (Level Up), o sistema deve disparar uma animaÃ§Ã£o/modal comemorativo na tela com efeitos visuais ou apenas atualizar o badge silenciosamente?
- [ ] [NOVO] Os nÃ­veis mais altos do sistema de RPG (como Elo Diamante e Elo Lenda) devem conceder privilÃ©gios automÃ¡ticos adicionais na plataforma (ex: selos diferenciados no chat da comunidade ou acesso a cursos/aulas especiais)?


---

## 10. Comunidade VIP, Suporte e DÃºvidas dos Cursos
- **Acesso e ParticipaÃ§Ã£o:**
  - Alunos e Instrutores/Admins podem publicar dÃºvidas tÃ©cnicas vinculadas aos cursos aos quais tÃªm acesso.
  - Alunos sÃ³ podem publicar e interagir em dÃºvidas de cursos aos quais possuem acesso liberado.
- **InteraÃ§Ãµes e Engajamento:**
  - **Curtidas (Likes):** Alunos e administradores podem curtir dÃºvidas de forma idempotente (`POST /api/v1/support/topics/{id}/like`). O card de dÃºvida exibe o coraÃ§Ã£o preenchido e contador atualizado.
  - **ComentÃ¡rios e Respostas:** Clicar no botÃ£o de comentÃ¡rio ou no card abre o modal detalhado da discussÃ£o com histÃ³rico cronolÃ³gico de respostas.
  - **ExclusÃ£o de DÃºvidas e Respostas:**
    - O autor da publicaÃ§Ã£o e os administradores (`superadmin`, `admin`) podem excluir dÃºvidas e respostas a qualquer momento.
    - Toda aÃ§Ã£o de exclusÃ£o exige confirmaÃ§Ã£o explÃ­cita em popup modal com fundo escuro translÃºcido.
- **Status da DÃºvida ("Aguardando Resposta" vs "Resolvida"):**
  - Novas dÃºvidas entram com status `open` ("Aguardando Resposta").
  - O autor da dÃºvida e administradores contam com botÃ£o dedicado no cabeÃ§alho da dÃºvida para alternar o status entre `open` e `resolved` ("Marcar como Resolvida" / "Reabrir DÃºvida").
- **SoluÃ§Ã£o Oficial / Melhor Resposta:**
  - O autor da dÃºvida e administradores podem eleger uma resposta como **"SoluÃ§Ã£o Oficial"** (`is_solution = true`).
  - A resposta eleita recebe destaque cinematogrÃ¡fico dourado (`border-gold`, badge `SoluÃ§Ã£o Oficial` com estrela e botÃ£o ativo `SoluÃ§Ã£o`).
  - Ao marcar uma resposta como soluÃ§Ã£o oficial, a dÃºvida Ã© automaticamente marcada como resolvida (`status = 'resolved'`).
- **Cards de MÃ©tricas e PÃ­lulas de Filtros RÃ¡pidos:**
  - No topo da tela de suporte, sÃ£o exibidas 4 mÃ©tricas consolidadas em tempo real:
    - `Total de DÃºvidas`
    - `Aguardando Resposta`
    - `Taxa de ResoluÃ§Ã£o %`
    - `Membros Ativos`
  - Filtros rÃ¡pidos em formato de pÃ­lulas permitem alternar dinamicamente entre: `Todas as DÃºvidas`, `Fixadas por Mim`, `Mais Populares`, `Aguardando Resposta`, `Resolvidas` e `Minhas DÃºvidas`.
- **FixaÃ§Ã£o Personalizada de DÃºvidas de Suporte (Support Topic Pins):**
  - **Limite MÃ¡ximo por UsuÃ¡rio:** Cada usuÃ¡rio (aluno, admin ou superadmin) pode fixar atÃ© no mÃ¡ximo **5 dÃºvidas** de suporte de sua preferÃªncia (`support_topic_pins`).
  - **IndependÃªncia de Lista:** A fixaÃ§Ã£o Ã© estritamente pessoal e individual. As dÃºvidas que o Aluno A fixa nÃ£o alteram a visualizaÃ§Ã£o dos outros alunos ou administradores.
  - **Bloqueio AmigÃ¡vel ao Exceder o Limite:** Ao tentar fixar uma 6Âª dÃºvida, o sistema bloqueia a aÃ§Ã£o retornando HTTP 400 com a mensagem clara: *"VocÃª atingiu o limite de 5 dÃºvidas fixadas. Desafixe uma dÃºvida para fixar outra."*, exibindo toast de erro no frontend.
  - **Destaque Visual no Topo:** Na listagem padrÃ£o de dÃºvidas, as dÃºvidas fixadas pelo usuÃ¡rio logado aparecem com destaque prioritÃ¡rio no topo, fundo escurecido sutil, borda ciano neon (`#38bdf8`) e badge distintivo `ð Fixada por vocÃª`.
  - **BotÃ£o de AÃ§Ã£o RÃ¡pida:** No card da dÃºvida, o botÃ£o de alfinete (`Pin`) permite alternar a fixaÃ§Ã£o instantaneamente com um clique (toggle pin/unpin) com feedback via toast.
  - **PÃ­lula de Acesso RÃ¡pido ("Fixadas por Mim"):** Permite consultar em um clique exclusivamente as dÃºvidas que o prÃ³prio usuÃ¡rio fixou.
- **Anexos e VisualizaÃ§Ã£o Lightbox:**
  - DÃºvidas e respostas suportam anexo de imagens (PNG, JPG, WEBP de atÃ© 10 MB).
  - Clicar sobre qualquer imagem anexada abre o modal Lightbox de alta definiÃ§Ã£o, centralizado e com fundo escuro de alto contraste.

---

## 11. ConfiguraÃ§Ãµes da Plataforma (AparÃªncia e Chaves de API)
- **Acesso:** Exclusivo para administradores e super administradores atravÃ©s da opÃ§Ã£o **"ConfiguraÃ§Ãµes"** na barra lateral.
- **Estrutura em Abas:**
  - **Aba 1: "AparÃªncia" (Cor de Fundo da Plataforma):**
    - Permite ao administrador personalizar a cor de fundo global da plataforma (Netflix Dark, Deep Navy, Obsidian, Slate, Emerald, ou qualquer cor hexadecimal customizada).
    - Presets visuais prÃ©-definidos com clique rÃ¡pido e preview instantÃ¢neo na tela.
    - Salvamento persistido nas preferÃªncias da plataforma.
  - **Aba 2: "Chaves de API" (Tokens de Acesso):**
    - **Finalidade:** Permite integrar a plataforma de membros com ferramentas externas (n8n, Make, Zapier, Webhooks de checkout, CRMs, etc.) sem expor credenciais de login.
    - **Formato das Chaves:** PadrÃ£o industrial com prefixo `sk_live_` gerado criptograficamente com 32 bytes de entropia (`sk_live_<hex>`).
    - **Tempo de ExpiraÃ§Ã£o ConfigurÃ¡vel:**
      - `30 dias`
      - `60 dias`
      - `90 dias`
      - `1 ano (365 dias)`
      - `NÃ£o expira (Permanente)`
    - **ExibiÃ§Ã£o Ãnica de SeguranÃ§a:** A chave completa sem mÃ¡scara (`raw_token`) Ã© exibida **uma Ãºnica vez** no momento de sua criaÃ§Ã£o atravÃ©s de um popup modal de seguranÃ§a com botÃ£o de cÃ³pia rÃ¡pida. ApÃ³s o fechamento do modal, a chave nÃ£o pode ser recuperada, permanecendo no banco apenas seu hash/mascaramento.
    - **GestÃ£o de Chaves:**
      - Listagem completa das chaves do usuÃ¡rio com nome descritivo, token mascarado (`sk_live_****...`), status de ativaÃ§Ã£o, validade e data do Ãºltimo acesso (`last_used_at`).
      - **Pausar / Reativar (Toggle):** Possibilidade de pausar temporariamente uma chave sem precisar excluÃ­-la, bloqueando requisiÃ§Ãµes que a utilizem atÃ© que seja reativada.
      - **RevogaÃ§Ã£o / ExclusÃ£o:** Possibilidade de revogar permanentemente uma chave de API com confirmaÃ§Ã£o obrigatÃ³ria em popup modal com fundo escuro translÃºcido.
    - **AutenticaÃ§Ã£o no Backend:**
      - A autenticaÃ§Ã£o de usuÃ¡rio nas rotas da API aceita tanto `Authorization: Bearer sk_live_...` quanto o header `X-API-Key: sk_live_...`, integrando-se de forma transparente com o `get_current_user`.
      - AtualizaÃ§Ã£o automÃ¡tica em background do campo `last_used_at` a cada requisiÃ§Ã£o vÃ¡lida realizada com a chave.
      - Bloqueio imediato (`401 Unauthorized`) caso a chave esteja pausada ou expirada.

---

## 12. Estrutura de NavegaÃ§Ã£o do Menu Lateral (Categorias)
- **OrganizaÃ§Ã£o por Foco Operacional (Proposta 2):**
  - **Categoria "GestÃ£o de Ensino" (ou "Meu Aprendizado" para alunos):**
    - `Cursos`: Ambiente de aulas, mÃ³dulos e quizes (visÃ­vel para Alunos e Administradores).
    - `Alunos`: GestÃ£o de matrÃ­culas, acompanhamento de progresso e tempo de acesso (Admin/Super Admin).
    - `Suporte`: FÃ³rum de dÃºvidas, respostas oficiais e suporte dos cursos (Alunos e Administradores).
    - `Relatos de Aulas`: NotificaÃ§Ãµes e moderaÃ§Ã£o de problemas relatados em aulas (Admin/Super Admin).
    - `Chat da Comunidade`: Ambiente de bate-papo em tempo real entre alunos, professores e administradores, posicionado logo abaixo de Relatos de Aulas (Alunos e Administradores).
  - **Categoria "AdministraÃ§Ã£o":**
    - `IntegraÃ§Ãµes`: Webhooks e disparos para ferramentas externas (Admin/Super Admin).
    - `ConfiguraÃ§Ãµes`: AparÃªncia da plataforma e Chaves de API (Admin/Super Admin).
  - **Categoria "SeguranÃ§a":**
    - `Backup AutomÃ¡tico`, `Gerenciamento de logs` e `GestÃ£o de UsuÃ¡rio` (restrito exclusivamente a Super Admin).

---

## 13. ExperiÃªncia Mobile e AdaptaÃ§Ã£o para Celulares (Smartphones)
- **Menu Lateral RetrÃ¡til (Drawer / Gaveta):**
  - Em telas com largura inferior ou igual a `768px`, a barra lateral deixa de ocupar espaÃ§o fixo dividindo a tela e passa a se comportar como um **Drawer deslizante**.
  - O drawer permanece recolhido fora da tela (`translateX(-100%)`) e desliza suavemente ao ser acionado.
  - Ao abrir o menu no celular, uma camada de fundo escurecida translÃºcida com desfoque (`sidebar-backdrop`) cobre a Ã¡rea externa.
  - O menu pode ser fechado tocando no botÃ£o `X` no topo do menu, tocando no backdrop escuro ou selecionando qualquer item da navegaÃ§Ã£o (fechamento automÃ¡tico).
- **CabeÃ§alho Superior Mobile (`MobileHeader`):**
  - Em dispositivos mÃ³veis (`<= 768px`), uma barra superior exclusiva Ã© exibida no topo contendo:
    - BotÃ£o hambÃºrguer interativo para abrir o menu lateral.
    - Logotipo e tÃ­tulo oficial "Ãrea de Membros".
    - Avatar com a inicial do usuÃ¡rio autenticado.
- **Sala de Aula e Player de VÃ­deo no Celular:**
  - O player de vÃ­deo mantÃ©m a proporÃ§Ã£o `16:9` widescreen fluida sem corte lateral em qualquer tamanho de tela mÃ³vel.
  - Em telas menores que `900px`, a divisÃ£o em 2 colunas da sala de aula (conteÃºdo Ã  esquerda e mÃ³dulos/materiais Ã  direita) se transforma em um layout empilhado de 1 coluna (`classroom-layout-grid`), garantindo que o vÃ­deo e textos fiquem no topo em largura total e a lista de aulas/materiais logo abaixo.
- **Tabelas e Listagens no Celular:**
  - Tabelas com mÃºltiplas colunas (GestÃ£o de Alunos, Convites, UsuÃ¡rios, Backups, Relatos) contam com rolagem horizontal fluida por toque (`overflow-x: auto; -webkit-overflow-scrolling: touch;`), preservando a legibilidade dos dados sem espremer colunas nem estourar a largura da janela.

---

## 14. Chat da Comunidade e Bate-papo dos Alunos
- **Objetivo:** Proporcionar um espaÃ§o de interaÃ§Ã£o, networking e troca de ideias diretamente dentro da plataforma, conectando alunos e instrutores.
- **Estrutura de Canais de Conversa:**
  - **Comunidade Geral (`channel_type == 'general'`):**
    - Canal global Ãºnico aberto para todos os usuÃ¡rios com conta ativa (Alunos, Instrutores e Administradores).
    - Canal fixado em destaque na barra lateral do chat.
  - **Canais por Curso (`channel_type == 'course'`):**
    - Cada curso cadastrado possui seu canal dedicado exclusivo para os alunos matriculados.
    - **Regra de Visibilidade e Acesso:**
      - Alunos visualizam e enviam mensagens **apenas** nos canais dos cursos aos quais possuem acesso ativo (`UserCourse` nÃ£o expirado). Tentativas de leitura ou envio para cursos nÃ£o matriculados retornam `403 Forbidden`.
      - Instrutores e Administradores (`superadmin`, `admin`) tÃªm acesso irrestrito a todos os canais para suporte e moderaÃ§Ã£o.
- **Recursos da Interface e ExperiÃªncia do UsuÃ¡rio:**
  - **BalÃµes de Mensagem Estilizados:**
    - IdentificaÃ§Ã£o clara do remetente com avatar circular colorido contendo a inicial do usuÃ¡rio.
    - Badge do perfil do usuÃ¡rio: `Super Admin` (roxo neon), `Instrutor` (azul neon) e `Aluno` (esmeralda).
    - HorÃ¡rio formatado da mensagem (hora e minuto).
    - DiferenciaÃ§Ã£o visual suave para mensagens enviadas pelo prÃ³prio usuÃ¡rio autenticado versus mensagens recebidas.
  - **Scroll AutomÃ¡tico Inteligente:**
    - Rolagem suave atÃ© a Ãºltima mensagem recebida ao carregar ou enviar novidades.
  - **Envio RÃ¡pido e Atalhos:**
    - Suporte a tecla `Enter` para envio imediato e `Shift + Enter` para pular linha.
    - ValidaÃ§Ã£o de mensagens vazias e limite de atÃ© 3.000 caracteres.
    - Estado de carregamento com spinner no botÃ£o de envio enquanto a mensagem Ã© persistida.
  - **Integração Completa ao Layout da Plataforma (Sidebar e TopNavbar Contínuos):**
    - Ao selecionar **Chat da Comunidade**, a barra lateral principal do sistema (`Sidebar`) e a barra superior global (`TopNavbar`) permanecem **100% visíveis e ativas**, permitindo que o usuário alterne livremente entre as abas da plataforma (Início, Cursos, Alunos, Suporte, Configurações, etc.) sem perda de navegação.
    - O painel do Chat é renderizado dentro da área de conteúdo principal com altura perfeitamente ajustada (`calc(100vh - 64px)`), eliminando o efeito de "tela azul" isolada e mantendo a identidade visual integrada e consistente da Área de Membros.
  - **SincronizaÃ§Ã£o InstantÃ¢nea em Tempo Real via WebSocket (`/api/v1/chat/ws`):**
    - ConexÃ£o nativa e persistente via WebSocket com autenticaÃ§Ã£o por token JWT.
    - Novas mensagens enviadas por qualquer aluno ou administrador sÃ£o entregues instantaneamente na tela dos participantes conectados sem necessidade de recarregar a pÃ¡gina ou aguardar polling.
    - Eventos de exclusÃ£o de mensagem, curtidas e mensagens fixadas/desafixadas tambÃ©m sÃ£o transmitidos e refletidos em tempo real.
    - Mecanismo de Heartbeat (`ping/pong` a cada 25s) e reconexÃ£o automÃ¡tica com fallback de seguranÃ§a.
  - **Curtir Mensagens do Chat:**
    - Alunos e gestores podem curtir e descurtir mensagens de texto ou mÃ­dia clicando no botÃ£o de coraÃ§Ã£o (`Heart`).
    - Contador em tempo real do nÃºmero de curtidas por mensagem com destaque vermelho para o usuÃ¡rio que curtiu (`liked_by_me`).
    - Cada usuÃ¡rio pode curtir apenas uma Ãºnica vez por mensagem (tabela `chat_message_likes`).
    - Curtir mensagens de outros alunos gera bonificaÃ§Ã£o de engajamento no sistema de gamificaÃ§Ã£o.
  - **Favoritar Mensagens e Filtro de Favoritas:**
    - BotÃ£o de estrela (`Star`) em cada balÃ£o de mensagem para favoritar/desfavoritar (tabela `chat_message_favorites`).
    - BotÃ£o de alternÃ¢ncia **"â­ Favoritas"** no cabeÃ§alho do chat (`ChatHeader`), permitindo filtrar instantaneamente o canal para exibir apenas as mensagens salvas pelo usuÃ¡rio autenticado.
  - **Fixar Mensagens no Topo do Chat (Pin) e Redirecionamento por Clique:**
    - PrivilÃ©gio restrito a Administradores e Instrutores (`admin` e `superadmin`).
    - O gestor pode fixar ou desafixar mensagens importantes no canal (`is_pinned`, `pinned_at`, `pinned_by_user_id`).
    - Quando hÃ¡ uma mensagem fixada no canal, um banner superior estilizado em azul neon no cabeÃ§alho (`chat-pinned-message-banner`) exibe o autor e o conteÃºdo da mensagem fixada, acompanhado de botÃ£o de desafixaÃ§Ã£o rÃ¡pida para gestores.
    - **Redirecionamento ao Clicar na Mensagem Fixada:** Ao clicar em qualquer parte do banner da mensagem fixada, o chat executa uma rolagem suave (`scrollIntoView({ behavior: 'smooth', block: 'center' })`) atÃ© a mensagem correspondente na conversa e ativa temporariamente uma animaÃ§Ã£o de destaque luminoso em neon azul ciano (`chat-message-highlighted`) ao redor do balÃ£o, facilitando a localizaÃ§Ã£o visual imediata pelo usuÃ¡rio. O clique no botÃ£o de desafixaÃ§Ã£o (`X`) possui `stopPropagation()` para nÃ£o disparar a rolagem.
    - A mensagem tambÃ©m recebe o selo `ð Fixada` nos seus metadados.
  - **Envio de MÃ­dias no Chat (Imagens e Documentos):**
    - BotÃ£o de anexo (`Paperclip`) na barra de entrada (`ChatInputBar`) permitindo selecionar imagens (JPG, PNG, WEBP, GIF) ou documentos (PDF, DOCX, XLSX, TXT, ZIP) de atÃ© 25 MB.
    - Suporte a upload em nuvem no Backblaze B2 (`AreaDeMembros/chat_media/`) com fallback em servidor local.
  - **Menções e Links Internos de Aulas no Chat (ChatInternalLinkBadge, parseLessonUrl):**
    - Ao anexar ou mencionar uma aula no chat (internal://lesson/:courseId/:lessonId), o sistema obrigatoriamente exibe de forma clara e destacada **qual é o Curso** e **qual é o Módulo** em que aquela aula se encontra antes do usuário clicar para assistir.
    - **Parâmetros e Cache de Contexto:** A URL da menção inclui os parâmetros de consulta course e module codificados (internal://lesson/:courseId/:lessonId?course=...&module=...). Para links legados ou gerados externamente sem parâmetros, o frontend consulta o endpoint seguro /api/v1/courses/lessons/{lesson_id}/context e armazena os metadados em cache em memória compartilhado (lessonContextCache), evitando requisições repetidas.
    - **Visual do Badge / Card:** Renderiza título da aula com ícone PlayCircle verde esmeralda, acompanhado de subtítulo estilizado com tags coloridas: 📚 Nome do Curso (em azul neon) e 📂 Nome do Módulo (em lilás neon).
    - **Tooltip Explicativo:** Ao passar o mouse sobre a menção, o atributo 	itle apresenta: Curso: {Curso} • Módulo: {Módulo} • Aula: {Aula} (Clique para assistir).
    - **Pré-visualização Antes do Envio (ChatAttachedLinkPreview):** O preview de anexo no rodapé da barra de mensagens exibe o contexto com formato Aula vinculada • {Curso} › {Módulo}.
    - **Redirecionamento Inteligente:** O clique na menção executa navegação interna no SPA direcionando para a sala de aula do curso de forma transparente.
  - **Barra Lateral Direita de Membros do Chat (`ChatMembersSidebar`):**
    - Exibe a lista completa de usuÃ¡rios com permissÃ£o de acesso e visualizaÃ§Ã£o no canal atual:
      - **Comunidade Geral (`general`):** Lista todos os alunos, instrutores e administradores ativos cadastrados no sistema.
      - **Canais por Curso (`course`):** Lista os administradores e instrutores com acesso global, alÃ©m dos alunos que possuem matrÃ­cula ativa e nÃ£o expirada no respectivo curso.
    - **Agrupamento SemÃ¢ntico por PapÃ©is:**
      - **Super Admin:** Membros com perfil `superadmin` com destaque roxo/neon e Ã­cone de coroa (`Crown`).
      - **Administradores:** Membros com perfil `admin` com destaque azul neon e Ã­cone de escudo (`Shield`).
      - **Alunos:** Alunos matriculados com destaque verde esmeralda e Ã­cone de capelo (`GraduationCap`).
    - **IdentificaÃ§Ã£o Visual dos Contatos:** Cada item apresenta foto/avatar/logo oficial, nome completo, subtÃ­tulo do cargo, indicador de status online/offline em tempo real baseado em conexÃµes WebSocket e selo `(VocÃª)` para o usuÃ¡rio logado.
    - **Filtro e Busca RÃ¡pida:** Campo de pesquisa no topo filtrando participantes dinamicamente por nome e e-mail.
    - **BotÃ£o de AlternÃ¢ncia no CabeÃ§alho (`ChatHeader`):** BotÃ£o com Ã­cone de usuÃ¡rios (`Users`) permitindo recolher e expandir a barra lateral direita conforme a preferÃªncia do usuÃ¡rio.
    - **Modal de Perfil do Contato (`ChatMemberProfileModal`):**
      - Ao clicar em um contato, abre um modal centralizado em Dark Glassmorphism com *backdrop blur* escuro cobrindo o fundo (fechÃ¡vel apenas via botÃ£o fechar).
      - Exibe a logo/foto do participante em destaque ampliado com status online, nome, badge oficial do perfil, e-mail, telefone/WhatsApp (se disponÃ­vel) e data de cadastro.
      - BotÃ£o de aÃ§Ã£o rÃ¡pida **"Conversar no Privado (DM)"** (`MessageSquare`) abrindo a caixa de mensagens diretas 1-a-1 com o contato selecionado.
    - **Mensagens Diretas Privadas 1-a-1 (DM) com Suporte Completo a MÃ­dias e Ferramentas (`ChatDmModal`, `ChatDmConversationView`):**
      - O chat privado de DM possui paridade integral de funcionalidades com o chat pÃºblico da comunidade.
      - **Envio de MÃ­dias Diversificadas na DM:** A barra de entrada (`ChatInputBar`) na DM conta com todos os botÃµes e recursos:
        1. **Anexo de Arquivos Gerais e PDFs:** BotÃ£o com clipe (`Paperclip`) para envio de documentos PDF, planilhas, apostilas, textos e compactados (ZIP/RAR) de atÃ© 25 MB.
        2. **Imagens com Legenda e Ctrl+V:** BotÃ£o de imagem (`ImageIcon`) abrindo modal de prÃ©-visualizaÃ§Ã£o com legenda, alÃ©m de suporte para colar imagens diretamente da Ã¡rea de transferÃªncia (`Ctrl+V`) ou arrastar (drag & drop).
        3. **CatÃ¡logo de GIFs Animados:** BotÃ£o `[GIF]` com busca e categorias temÃ¡ticas de GIFs.
        4. **Seletor de Emojis:** BotÃ£o de carinha sorridente (`Smile`) com abas categorizadas e inserÃ§Ã£o rÃ¡pida.
        5. **GravaÃ§Ã£o e Envio de Ãudio Nativo:** Microfone integrado com gravaÃ§Ã£o em tempo real, timer, cancelamento e envio de Ã¡udio no formato WebM/OGG.
        6. **GravaÃ§Ã£o de VÃ­deo pela CÃ¢mera:** BotÃ£o de vÃ­deo (`Video`) abrindo modal de gravaÃ§Ã£o via webcam com espelhamento ao vivo, timer e revisÃ£o antes do envio.
        7. **Links Internos Interativos com CTA:** InserÃ§Ã£o de links para abas, cursos ou aulas especÃ­ficas da Ãrea de Membros.
      - **RenderizaÃ§Ã£o Rica de MÃ­dias nos BalÃµes da DM (`ChatMessageMediaAttachment`):**
        - Fotos e GIFs com thumbnail de visualizaÃ§Ã£o nÃ­tida e zoom em nova aba ao clicar.
        - VÃ­deos com player nativo responsivo HTML5 e controles de reproduÃ§Ã£o.
        - Ãudios com player de Ã¡udio estilizado e Ã­cone de microfone verde.
        - Documentos e PDFs em card com Ã­cone de documento, nome e link direto para visualizaÃ§Ã£o/download.
      - **PrÃ©-visualizaÃ§Ã£o SemÃ¢ntica na Inbox de DMs:** Quando uma mensagem enviada na DM nÃ£o possui texto (apenas mÃ­dia anexada), a listagem de conversas exibe preview descritivo (`ð· [Foto/GIF]`, `ð¥ [VÃ­deo]`, `ð¤ [Ãudio]`, `ð [Documento]`, `ð [MÃ­dia]`).
      - **Paginação de DMs Ativas (`ChatDmPagination`):**
        - A lista de conversas ativas no modal de DMs (`Inbox` e `Não lidas`) exibe no máximo **20 conversas por página**.
        - Apresenta barra de paginação no rodapé informando a contagem de conversas exibidas (`Exibindo X–Y de Z DMs`), indicador da página atual e botões de navegação (*"Anterior"* e *"Próxima"*).
        - Os botões de navegação são desativados de forma reativa nos limites (primeira e última página).
        - Ao alternar entre as abas (*Inbox* e *Não lidas*), o estado de paginação é reiniciado automaticamente para a página 1.
    - Miniatura de prÃ©-visualizaÃ§Ã£o antes do envio com botÃ£o de remoÃ§Ã£o rÃ¡pida.
    - Permite envio de mensagem de texto com mÃ­dia vinculada, ou somente a mÃ­dia isolada.
    - Imagens sÃ£o renderizadas no chat com zoom ao clicar, e documentos em card seguro com link de abertura.
  - **Colar (Ctrl+V) e Arrastar (Drag & Drop) Imagens com Legenda (`ChatImageCaptionModal`):**
    - O usuÃ¡rio pode colar imagens diretamente da Ã¡rea de transferÃªncia (`Ctrl + V`) ou arrastar arquivos de imagem para a Ã¡rea do chat.
    - Ao colar ou soltar, abre automaticamente o modal centralizado de prÃ©-visualizaÃ§Ã£o da imagem com campo de **Legenda** para digitaÃ§Ã£o confortÃ¡vel antes do envio ou cancelamento.
  - **GravaÃ§Ã£o e Envio de VÃ­deo pela CÃ¢mera/Webcam (`ChatVideoRecorderModal`):**
    - BotÃ£o com Ã­cone de cÃ¢mera de vÃ­deo (`Video`) na barra de ferramentas do chat.
    - Permite gravar vÃ­deos diretamente pela cÃ¢mera/webcam do computador ou smartphone via `navigator.mediaDevices.getUserMedia`.
    - Apresenta timer com indicador pulsante, prÃ©-visualizaÃ§Ã£o ao vivo espelhada, conferÃªncia do vÃ­deo gravado com controles de reproduÃ§Ã£o nativos, campo de legenda opcional e upload direto em nuvem no formato WebM/MP4.
  - **CatÃ¡logo e Seletor de GIFs Animados (`ChatGifPickerPopup`):**
    - BotÃ£o dedicado `[GIF]` na barra de ferramentas.
    - Abre popup interativo acima do campo de digitaÃ§Ã£o com busca instantÃ¢nea em portuguÃªs/inglÃªs e filtros por categorias em alta (Palmas, CelebraÃ§Ã£o, Risos, Concordo, ReaÃ§Ãµes, DanÃ§a, Amor), permitindo anexar o GIF diretamente Ã  mensagem.
  - **MaximizaÃ§Ã£o e ExpansÃ£o da Caixa de Texto:**
    - BotÃ£o destacado de alternÃ¢ncia (`Maximize2` / `Minimize2`) na barra de ferramentas.
    - Permite alternar entre o modo de digitaÃ§Ã£o compacto (1 linha com auto-expansÃ£o suave) e o modo maximizado amplo (Ã¡rea expandida com mÃºltiplas linhas para redaÃ§Ã£o confortÃ¡vel de textos longos e parÃ¡grafos).
  - **Compartilhamento de Links Internos de Abas, Cursos e Aulas (`ChatInternalLinkModal`, `ChatAttachedLinkPreview`, `chatMentionUtils` e `useUrlNavigation`):**
    - **BotÃ£o na Barra de Ferramentas:** Ãcone de elo (`Link2` / `ð`) com tooltip "Inserir link de aba, curso ou aula".
    - **Modal Interativo de SeleÃ§Ã£o (`ChatInternalLinkModal`):** Apresenta popup escuro centralizado com campo de busca em tempo real e 3 categorias:
      1. **Abas / MÃ³dulos:** Seleciona qualquer tela principal da plataforma (InÃ­cio, Cursos, Suporte, Ranking, Depoimentos, Apresente-se, Chat, Relatos, Alunos, Funis, ConfiguraÃ§Ãµes).
      2. **Cursos:** Consulta a lista de cursos cadastrados via `/api/v1/courses` e permite marcar qualquer curso.
      3. **Aulas EspecÃ­ficas:** Consulta a grade de mÃ³dulos e aulas via `/api/v1/courses/{id}/modules`, permitindo selecionar uma aula especÃ­fica.
    - **ExibiÃ§Ã£o Elegante no Campo de Entrada (`ChatAttachedLinkPreview`):** Ao marcar uma aula, curso ou aba, o link nÃ£o polui o campo de digitaÃ§Ã£o com markdown bruto (`[TÃ­tulo](internal://...)`). Em vez disso, Ã© renderizado um card preview estilizado em glassmorphism com Ã­cone correspondente (`PlayCircle` verde para aulas, `BookOpen` azul para cursos, `Compass` roxo para abas), o tÃ­tulo limpo e um botÃ£o de remoÃ§Ã£o rÃ¡pida (`X`). O usuÃ¡rio pode redigir mensagens complementares no campo de texto normalmente ou enviar apenas o link.
    - **Abertura Exclusiva em Nova Aba (`_blank`):** Ao clicar sobre o badge de aula, curso ou aba dentro de uma mensagem do chat, a plataforma abre o destino **estritamente em uma nova aba** no navegador (`/?tab=courses&courseId=X&lessonId=Y`). A aba atual onde o participante estÃ¡ conversando no chat permanece **100% intacta**, sem qualquer redirecionamento, troca de aba ou perda do contexto da conversa.
    - **Posicionamento Direto na Aula (Scroll Suave):** Ao abrir o link de uma aula na nova aba, a sala de aula (`CourseClassroom`) seleciona o mÃ³dulo e a aula referenciada e realiza rolagem suave automÃ¡tica (`scrollToClassroomSection`), posicionando o usuÃ¡rio diretamente em cima da aula e de seu player de vÃ­deo.
    - **Limpeza Imediata de ParÃ¢metros da URL e NavegaÃ§Ã£o Livre na Nova Aba (`useUrlNavigation`):**
      - Assim que os parÃ¢metros de consulta (`?tab=courses&courseId=X&lessonId=Y`) sÃ£o consumidos na inicializaÃ§Ã£o da nova aba, o hook `useUrlNavigation` limpa imediatamente a query string da barra de endereÃ§os usando `window.history.replaceState({}, document.title, '/')` e trava reexecuÃ§Ãµes via referÃªncia Ãºnica (`hasProcessedRef`).
      - Isso garante que, se o usuÃ¡rio estiver na aula aberta e clicar em qualquer outro item da barra lateral (`Sidebar`) como *InÃ­cio*, *Alunos*, *Suporte* ou *Chat*, ele navega livremente para a tela desejada sem que os parÃ¢metros antigos de URL reabram a aula anterior.
    - **Controle de Acesso e Redirecionamento AutomÃ¡tico para Compra:** Caso o aluno que clicou no link nÃ£o possua acesso ativo Ã quele curso ou produto (`has_access === false`):
      - Se o curso possuir **PÃ¡gina de Vendas (`sales_page_url`)**, o aluno Ã© redirecionado automaticamente para a pÃ¡gina de compra do produto.
      - Se o curso nÃ£o possuir pÃ¡gina de vendas configurada, a plataforma exibe notificaÃ§Ã£o amigÃ¡vel via toast informando que o aluno nÃ£o possui acesso Ã quele treinamento.
  - **Sistema de MenÃ§Ãµes a Contatos (@) no Chat:**
    - **MenÃ§Ã£o Global (@todos):**
      - Exclusiva para Administradores e Super Administradores (`admin` e `superadmin`).
      - Permite alertar e notificar todos os membros ativos do canal simultaneamente.
      - Na lista suspensa de menÃ§Ãµes, o item `@todos` sÃ³ Ã© exibido para gestores. Caso um aluno tente digitar manualmente `@todos`, o frontend bloqueia o envio com alerta em toast e o backend rejeita com `HTTP 403 Forbidden`.
      - BalÃµes de mensagem exibem o `@todos` com badge dourado neon em destaque (`#fbbf24`).
    - **Limite de MenÃ§Ãµes para UsuÃ¡rios Comuns (Alunos):**
      - Alunos podem mencionar no mÃ¡ximo **5 contatos** por mensagem.
      - Ao atingir o limite no seletor, um alerta em vermelho informa a restriÃ§Ã£o e desativa a seleÃ§Ã£o de novos contatos.
      - Tentativas de envio com 6 ou mais menÃ§Ãµes sÃ£o bloqueadas pelo frontend e rejeitadas pelo backend com `HTTP 400 Bad Request`.
      - Gestores (`admin` e `superadmin`) nÃ£o tÃªm limite e podem mencionar qualquer nÃºmero de contatos.
    - **Busca e Filtro DinÃ¢mico em Tempo Real:**
      - Ao digitar apÃ³s o `@`, a lista Ã© filtrada instantaneamente conferindo nome ou e-mail dos membros.
    - **PaginaÃ§Ã£o de Contatos (20 por pÃ¡gina):**
      - O popup de menÃ§Ãµes exibe no mÃ¡ximo **20 contatos por pÃ¡gina**, com controles de navegaÃ§Ã£o (setas anterior/prÃ³xima) e indicador de pÃ¡ginas (`PÃ¡g. X de Y`), evitando lentidÃ£o ou sobrecarga em comunidades com centenas de membros.
- **ModeraÃ§Ã£o e ExclusÃ£o de Mensagens:**
  - O autor da mensagem pode excluir suas prÃ³prias mensagens a qualquer momento.
  - Instrutores e Administradores possuem privilÃ©gio de moderaÃ§Ã£o, podendo excluir mensagens inadequadas de qualquer participante.
  - A exclusÃ£o exige confirmaÃ§Ã£o explÃ­cita em popup modal escuro (`DeleteChatMessageModal`) que nÃ£o fecha por clique fora e exibe feedback imediato via toast de sucesso.

---

## 15. GestÃ£o de Perfil do UsuÃ¡rio e Identidade Visual (ConfiguraÃ§Ãµes)
- **LocalizaÃ§Ã£o:** Aba **"Meu Perfil"** dentro da tela de **ConfiguraÃ§Ãµes da Ãrea de Membros** (`PlatformSettings`).
- **Campos DisponÃ­veis:**
  - **Foto / Logo de Perfil (`avatar_url`):**
    - Envio direto do computador com suporte a JPG, PNG e WEBP (atÃ© 5 MB) com upload para o Backblaze B2 (`AreaDeMembros/avatars/`) ou armazenamento local.
    - PrÃ©-visualizaÃ§Ã£o instantÃ¢nea em avatar arredondado com borda suave.
    - BotÃ£o de remoÃ§Ã£o rÃ¡pida da foto.
    - Quando cadastrada, a foto substitui a inicial do usuÃ¡rio no rodapÃ© da barra lateral (`Sidebar`) e em outros pontos da plataforma.
  - **Nome do Contato / UsuÃ¡rio (`name`).**
  - **E-mail de Acesso (`email`).**
  - **WhatsApp / Telefone de Contato (`phone`).**
  - **SeguranÃ§a e Troca de Senha (`password`):**
    - Campos "Nova Senha" e "Confirmar Nova Senha" com alternÃ¢ncia de visibilidade (`Eye/EyeOff`) e validaÃ§Ã£o de requisitos (mÃ­nimo 12 caracteres, maiÃºscula, minÃºscula, nÃºmero e sÃ­mbolo especial).
- **Regra de ProteÃ§Ã£o do Super Admin:**
  - Por diretrizes de seguranÃ§a da conta mestre do sistema, o **Super Administrador NÃO pode alterar seu nome, e-mail e senha por esta tela**.
  - Na interface, os campos de nome e e-mail aparecem desabilitados com Ã­cone de cadeado (`Lock`) e um banner explicativo destacado. O bloco de senha exibe aviso de proteÃ§Ã£o da conta mestre.
  - No backend (`PATCH /api/v1/auth/me`), qualquer tentativa de submeter alteraÃ§Ãµes de nome, e-mail ou senha para o `superadmin` Ã© sumariamente rejeitada com `400 Bad Request`.
  - O Super Admin tem permissÃ£o total e irrestrita para **alterar a sua foto de perfil / logo** a qualquer momento.
- **Outros Perfis (Administradores / Instrutores):**
  - Possuem liberdade para editar nome, e-mail (com validaÃ§Ã£o de unicidade), telefone, senha e foto de perfil normalmente.

---

## 16. Depoimentos e AvaliaÃ§Ãµes dos Cursos (Testimonials & Reviews)
- **LocalizaÃ§Ã£o:** Aba **"Depoimentos"** na barra lateral (`Sidebar`) sob a categoria **GestÃ£o de Ensino** (para gestores) e **Meu Aprendizado** (para alunos).
- **SubmissÃ£o de Depoimentos pelo Aluno:**
  - O aluno pode enviar depoimento exclusivamente para cursos aos quais possui **acesso ativo e liberado**. Cursos sem acesso ou expirados nÃ£o permitem envio de avaliaÃ§Ã£o (`HTTP 403`).
  - Cada aluno pode cadastrar **1 depoimento por curso**. Caso queira mudar sua opiniÃ£o, pode editar seu depoimento existente a qualquer momento.
  - **Campos do Depoimento:**
    - **SeleÃ§Ã£o do Curso:** lista suspensa contendo apenas os cursos liberados para o aluno.
    - **Nota em Estrelas (1 a 5 â­):** seleÃ§Ã£o interativa de estrelas com destaque dourado.
    - **TÃ­tulo do Depoimento:** resumo ou manchete da avaliaÃ§Ã£o (opcional, atÃ© 200 caracteres).
    - **Texto do Relato / OpiniÃ£o:** descriÃ§Ã£o da experiÃªncia, aprendizado e resultados obtidos (mÃ­nimo 3 caracteres, atÃ© 5.000 caracteres com contador dinÃ¢mico).
- **Fluxo de ModeraÃ§Ã£o pelo Administrador:**
  - Todo novo depoimento submetido ou editado por aluno entra automaticamente com status **"Aguardando ModeraÃ§Ã£o" (`pending`)**.
  - Apenas depoimentos com status **"Aprovado" (`approved`)** sÃ£o exibidos na vitrine pÃºblica para outros alunos e visitantes. O autor sempre consegue visualizar seu prÃ³prio depoimento para acompanhar o status.
  - Administradores e Super Admins contam com botÃµes rÃ¡pidos de aÃ§Ã£o:
    - **Aprovar (`approved`):** torna o depoimento visÃ­vel para a comunidade.
    - **Rejeitar (`rejected`):** reprova o depoimento mantendo arquivado internamente.
    - **Destacar (`is_featured`):** fixa o depoimento com selo de destaque dourado e posiciona no topo da listagem.
- **ExclusÃ£o de Depoimentos:**
  - O prÃ³prio aluno autor pode excluir seu depoimento a qualquer momento.
  - Administradores podem excluir qualquer depoimento inapropriado.
  - ExclusÃ£o exige confirmaÃ§Ã£o em modal escuro centralizado com aviso e feedback por toast.

---

## 17. GamificaÃ§Ã£o e Ranking dos Alunos (Leaderboard & Points)
- **LocalizaÃ§Ã£o:** Aba **"Ranking & Conquistas"** (`Trophy`) na barra lateral (`Sidebar`) em pÃ¡gina inteira dedicada.
- **ParticipaÃ§Ã£o Exclusiva de Alunos:**
  - Apenas usuÃ¡rios com o perfil **`Aluno` (`aluno`)** acumulam pontos e disputam as posiÃ§Ãµes do pÃ³dio e da tabela de classificaÃ§Ã£o.
  - Administradores e instrutores nÃ£o entram na disputa do ranking para garantir competiÃ§Ã£o justa entre os alunos.
- **Tabela de PontuaÃ§Ã£o por AÃ§Ãµes MeritÃ³rias:**
  - **Melhor SoluÃ§Ã£o no Suporte (`support_solution`):** **+50 pontos**. AtribuÃ­do quando a resposta do aluno a uma dÃºvida de colega for marcada como SoluÃ§Ã£o Oficial pelo autor da dÃºvida ou instrutor.
  - **ConclusÃ£o de Aula (`lesson_completed`):** **+15 pontos**. AtribuÃ­do ao assistir e concluir uma aula de qualquer curso (pontuaÃ§Ã£o Ãºnica por aula).
  - **Resposta a DÃºvida no Suporte (`support_reply`):** **+10 pontos**. AtribuÃ­do ao responder e ajudar colegas de curso no fÃ³rum de suporte.
  - **Curtida Recebida no Suporte (`support_like`):** **+5 pontos**. AtribuÃ­do ao receber curtidas da comunidade em tÃ³picos e dÃºvidas.
  - **ComentÃ¡rio Construtivo em Aula (`lesson_comment`):** **+5 pontos**. AtribuÃ­do ao comentar e debater nas aulas.
  - **Mensagem no Chat da Comunidade (`chat_message`):** **+2 pontos** por mensagem, com **limite diÃ¡rio de atÃ© 10 mensagens pontuadas por dia (mÃ¡ximo de 20 pontos/dia)** para estimular conversas saudÃ¡veis e evitar flood/spam.
- **PerÃ­odos de ClassificaÃ§Ã£o e HistÃ³rico de CampeÃµes:**
  - **Ranking Mensal (Ao Vivo):** reinicia a pontuaÃ§Ã£o a cada mÃªs (ex: Outubro/2026), premiando os alunos mais ativos e engajados do perÃ­odo atual.
  - **HistÃ³rico Geral (All-Time):** histÃ³rico acumulado de todos os tempos.
  - **Meses Anteriores (Top 10 Encerrado):** histÃ³rico congelado dos meses que jÃ¡ foram finalizados (ex: Setembro/2026, Agosto/2026). O mÃªs corrente Ã© bloqueado dessa aba atÃ© seu encerramento total.
  - **Anos Anteriores (Top 10 Encerrado):** histÃ³rico congelado dos anos civis concluÃ­dos (ex: 2025, 2024). O ano em curso nunca Ã© listado nessa aba atÃ© ser concluÃ­do.
  - **Corte Estrito no Top 10:** Tanto para meses finalizados quanto para anos finalizados, o sistema exibe estritamente os **10 primeiros alunos com maior pontuaÃ§Ã£o** acumulada no perÃ­odo correspondente.
  - **InsÃ­gnias Comemorativas de PerÃ­odo Fechado:**
    - ð¥ 1Âº Lugar: *"CampeÃ£o do MÃªs"* ou *"CampeÃ£o do Ano"*.
    - ð¥ 2Âº Lugar: *"Vice do MÃªs"* ou *"Vice do Ano"*.
    - ð¥ 3Âº Lugar: *"3Âº Lugar do MÃªs"* ou *"3Âº Lugar do Ano"*.
    - Top 4 ao 10: *"Top 10 do MÃªs"* ou *"Top 10 do Ano"*.
- **PÃ³dio e InsÃ­gnias:**
  - **ð¥ 1Âº Lugar:** PÃ³dio Ouro com a insÃ­gnia *"Mestre da Comunidade"*.
  - **ð¥ 2Âº Lugar:** PÃ³dio Prata com a insÃ­gnia *"Mentor Destaque"*.
  - **ð¥ 3Âº Lugar:** PÃ³dio Bronze com a insÃ­gnia *"Aluno NotÃ¡vel"*.
  - **Top 4 ao 10:** InsÃ­gnia *"Top Estudante"*.
  - **Demais Alunos:** InsÃ­gnia *"Aluno Ativo"*.
- **HistÃ³rico de Conquistas no Card do Aluno (`/students`):**
  - No card de cada aluno na GestÃ£o de Alunos, Ã© exibido o badge destacado com o total de pontos (`ð X pts`), o badge de NÃ­vel RPG (`ð¡ï¸ Nv. X â¢ Patente`) com barra de XP integrada e o botÃ£o **"Pontos & Conquistas"**.
  - O modal (`StudentGamificationHistoryModal`) exibe a pontuaÃ§Ã£o total, o rank do aluno, a insÃ­gnia conquistada, o card consolidado do NÃ­vel RPG com barra de progresso detalhada e botÃ£o para visualizaÃ§Ã£o da Escada Completa de 20 NÃ­veis.

### 17.1. Sistema de NÃ­veis RPG (20 NÃ­veis Progressivos com Elos e Patentes)
- **Estrutura dos 20 NÃ­veis:**
  - Divididos em **5 Elos temÃ¡ticos** com 4 divisÃµes cada (exceto o nÃ­vel mÃ¡ximo que Ã© coroado como Lenda Suprema):
    1. **Elo Bronze (NÃ­veis 1 ao 4):**
       - **NÃ­vel 1 (Bronze I):** 0 pts (ponto de partida de todo aluno).
       - **NÃ­vel 2 (Bronze II):** 25 pts (primeiras aulas concluÃ­das).
       - **NÃ­vel 3 (Bronze III):** 60 pts.
       - **NÃ­vel 4 (Bronze IV):** 110 pts.
    2. **Elo Prata (NÃ­veis 5 ao 8):**
       - **NÃ­vel 5 (Prata I):** 180 pts.
       - **NÃ­vel 6 (Prata II):** 270 pts.
       - **NÃ­vel 7 (Prata III):** 380 pts.
       - **NÃ­vel 8 (Prata IV):** 510 pts.
    3. **Elo Ouro (NÃ­veis 9 ao 12):**
       - **NÃ­vel 9 (Ouro I):** 660 pts.
       - **NÃ­vel 10 (Ouro II):** 840 pts.
       - **NÃ­vel 11 (Ouro III):** 1.050 pts.
       - **NÃ­vel 12 (Ouro IV):** 1.300 pts.
    4. **Elo Diamante (NÃ­veis 13 ao 16):**
       - **NÃ­vel 13 (Diamante I):** 1.600 pts.
       - **NÃ­vel 14 (Diamante II):** 1.950 pts.
       - **NÃ­vel 15 (Diamante III):** 2.350 pts.
       - **NÃ­vel 16 (Diamante IV):** 2.800 pts.
    5. **Elo Lenda (NÃ­veis 17 ao 20):**
       - **NÃ­vel 17 (Lenda I):** 3.300 pts.
       - **NÃ­vel 18 (Lenda II):** 3.850 pts.
       - **NÃ­vel 19 (Lenda III):** 4.450 pts.
       - **NÃ­vel 20 (Lenda Suprema):** 5.000 pts (**NÃ­vel MÃ¡ximo** com indicador MAX e 100% de maestria).
- **Curva Progressiva de Desafio (RPG):**
  - Cada nÃ­vel exige um montante adicional de pontos maior que o nÃ­vel anterior (ex: +25, +35, +50, +70 ... atÃ© +600 nos elos mais altos), tornando a ascensÃ£o mais desafiadora e prestigiosa.
- **VisualizaÃ§Ã£o e Componentes da Interface:**
  - **Card do Aluno (`StudentCard`):** Exibe o badge de nÃ­vel estilizado com a cor oficial do Elo (Bronze, Prata, Ouro, Diamante ou Lenda), mini barra de XP e tooltip explicativo.
  - **VisÃ£o Geral no Modal (`StudentRpgLevelOverviewCard`):** Card em destaque com escudo do elo, nome da patente, barra animada de progresso no nÃ­vel atual, pontos faltantes para o prÃ³ximo nÃ­vel e atalho "Ver 20 NÃ­veis".
  - **Escada Completa de 20 NÃ­veis (`GamificationRpgLadderModal`):** Popup modal escuro (`rgba(0,0,0,0.85)`) agrupado por elos, destacando visualmente o nÃ­vel atual do aluno e marcando com check verde os nÃ­veis jÃ¡ conquistados.
  - **Tabela de ClassificaÃ§Ã£o do Ranking (`RankingTable`):** Exibe o badge de nÃ­vel RPG de cada aluno na listagem do ranking.
  - **Modal de HistÃ³rico de Pontos do Aluno (`StudentGamificationHistoryModal`):** Apresenta mÃ©tricas consolidadas e a linha do tempo cronolÃ³gica com paginaÃ§Ã£o de **20 pontuaÃ§Ãµes por pÃ¡gina** (`HistoryPaginationBar`), permitindo navegar com facilidade entre as conquistas sem sobrecarregar a interface.
---

## 18. TranscriÃ§Ã£o de VÃ­deos e Resumo Inteligente com IA (OpenAI Whisper & GPT)
- **LocalizaÃ§Ã£o:** Aba **"TranscriÃ§Ã£o & Resumo IA"** (`Sparkles`) no player da aula (`LessonPlayer`).
- **MecÃ¢nica de Processamento:**
  - ExtraÃ§Ã£o de Ã¡udio otimizada via FFmpeg compacto em MP3 mono 16kHz a 48kbps, garantindo que mesmo aulas de atÃ© 1 hora fiquem abaixo do limite de 25 MB da API OpenAI Whisper.
  - TranscriÃ§Ã£o textual completa atravÃ©s do modelo `whisper-1`.
  - AnÃ¡lise pedagÃ³gica e geraÃ§Ã£o de Resumo Executivo, Principais Pontos (Key Takeaways) e Documento HTML5 autÃ´nomo via `gpt-4o-mini`.
- **GeraÃ§Ã£o e EdiÃ§Ã£o AutomÃ¡tica do TÃ­tulo da Aula por IA:**
  - A partir da transcriÃ§Ã£o textual completa do vÃ­deo gerada pelo Whisper, o modelo `gpt-4o-mini` analisa o assunto central e gera um tÃ­tulo conciso, profissional e pedagÃ³gico para a aula (`generated_lesson_title`, mÃ¡x. 60â70 caracteres, sem prefixos ou aspas).
  - O sistema salva e substitui automaticamente o tÃ­tulo da aula no banco de dados (`lesson.title`) ao finalizar a transcriÃ§Ã£o.
  - No frontend, o evento `lesson-title-updated` atualiza em tempo real o cabeÃ§alho da aula ativa no player e a lista/linha do tempo de aulas na barra lateral (`CourseClassroom`), sem exigir recarregamento manual da pÃ¡gina pelo usuÃ¡rio.
- **Documento HTML Inteligente:**
  - Documento HTML5 completo com tipografia moderna, seÃ§Ãµes pedagÃ³gicas bem definidas e estilos de impressÃ£o `@media print` para quem desejar imprimir ou salvar como PDF.
  - AcessÃ­vel diretamente pelo botÃ£o **"Abrir Documento HTML"** via endpoint com streaming nativo (`GET /api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/transcription/html`).
  - **AutenticaÃ§Ã£o em Nova Aba:** O endpoint suporta autenticaÃ§Ã£o tanto via header `Authorization: Bearer <token>` quanto via query parameter `?token=<jwt_token>`. Isso permite que o navegador abra a nova aba diretamente sem ser bloqueado com erro 401.
- **Controle de Acesso e Custos de API (Exclusivo Administradores e Super Admins):**
  - O acionamento da transcriÃ§Ã£o/re-geraÃ§Ã£o Ã© **restrito a Administradores e Super Admins** (`require_admin_or_superadmin`), evitando gastos desnecessÃ¡rios de API por alunos.
  - Ao clicar no botÃ£o **"Re-gerar"**, o sistema abre obrigatoriamente um **popup modal centralizado de confirmaÃ§Ã£o** (`ConfirmRetriggerAiModal`) com backdrop escuro translÃºcido, explicando que a aÃ§Ã£o reprocessarÃ¡ o Ã¡udio da aula na IA, evitando cliques acidentais e cobranÃ§as desnecessÃ¡rias de tokens.
  - Uma vez processado, o material gerado Ã© persistido na tabela `lesson_transcriptions` e fica permanentemente disponÃ­vel para todos os alunos matriculados no curso.
  - **MÃ©tricas e Custos em Reais (BRL):** O sistema calcula os custos oficiais cobrados pela OpenAI com base na duraÃ§Ã£o do Ã¡udio (`$0.006/min` no Whisper-1) e no consumo exato de tokens do GPT-4o-mini (`$0.15/1M` prompt tokens e `$0.60/1M` completion tokens), convertidos para reais com base na taxa `OPENAI_USD_BRL_RATE` (padrÃ£o `5.50`).
  - **Confidencialidade Rigorosa de Custos:** Os dados de custo em reais (`estimated_cost_brl`, `estimated_cost_formatted`) e tokens consumidos sÃ£o enviados pela API e exibidos na interface (badge `ð° Custo: R$ X,XX`) **exclusivamente para Administradores e Super Admins**. Para o perfil `aluno`, o backend omite esses campos (retornando `null`) e a interface oculta qualquer indicaÃ§Ã£o de custo.
- **ExibiÃ§Ã£o Seletiva entre Perfis (Aluno vs Gestor):**
  - **TranscriÃ§Ã£o Integral e Busca no Texto:** O card com a **TranscriÃ§Ã£o Integral** completa do vÃ­deo e o campo de pesquisa em tempo real, alÃ©m do botÃ£o de "Copiar Texto" da transcriÃ§Ã£o integral, sÃ£o exibidos **exclusivamente para Administradores e Super Admins**. No backend, o campo `full_transcript` Ã© omitido (`""`) para requisiÃ§Ãµes de alunos.
  - **ExperiÃªncia do Aluno:** Alunos visualizam uma interface limpa e focada no aprendizado, com os **Principais Pontos da Aula (Key Takeaways)**, a **Minutagem dos CapÃ­tulos** e o **Resumo da Aula** sintetizado.
- **Recursos da Interface:**
  - Busca em tempo real na transcriÃ§Ã£o com destaque de trechos filtrados (Admin e Super Admin).
  - BotÃ£o de cÃ³pia rÃ¡pida com feedback visual e toast (Admin e Super Admin).
  - BotÃ£o de re-gerar protegido por modal central de confirmaÃ§Ã£o (Admin e Super Admin).
  - Badge de custo em reais na barra de aÃ§Ãµes (visÃ­vel apenas para gestores).
- **EdiÃ§Ã£o de CapÃ­tulos e Minutagens por Administradores e Super Admins:**
  - **PermissÃ£o de EdiÃ§Ã£o:** Administradores e Super Admins possuem permissÃ£o para editar os capÃ­tulos e minutagens gerados pela IA (`PUT /courses/{c_id}/modules/{m_id}/lessons/{l_id}/transcription/chapters`), permitindo corrigir erros ortogrÃ¡ficos ou palavras transcritas incorretamente pelo modelo (ex: termos tÃ©cnicos ou neologismos), ajustar tempos e adicionar/remover tÃ³picos da minutagem.
  - **Interface de EdiÃ§Ã£o:** No card de CapÃ­tulos (`LessonChaptersCard`), Ã© exibido o botÃ£o **"Editar CapÃ­tulos"** (`Pencil`) exclusivamente para gestores. Ao clicar, o sistema abre o modal centralizado (`EditLessonChaptersModal`) com backdrop escuro translÃºcido (nÃ£o fechÃ¡vel por clique externo).
  - **SincronizaÃ§Ã£o em Tempo Real:** Ao salvar as alteraÃ§Ãµes, os novos capÃ­tulos sÃ£o persistidos no banco de dados, a interface da aba atualiza imediatamente e o evento `video-chapters-loaded` Ã© disparado, sincronizando os marcadores do player de vÃ­deo sem requerer recarregamento da pÃ¡gina.
  - **RestriÃ§Ã£o de Alunos:** O perfil `aluno` visualiza os capÃ­tulos apenas em modo de leitura/navegaÃ§Ã£o com seek interativo, sem botÃµes de ediÃ§Ã£o ou acesso ao endpoint (retornando `HTTP 403 Forbidden` caso tente submeter alteraÃ§Ãµes).

---

## 19. OrganizaÃ§Ã£o da NavegaÃ§Ã£o e Menu Lateral (Proposta 2: 3 Categorias Modernas)
- A barra lateral (`Sidebar`) agrupa as funcionalidades da plataforma em **3 categorias elegantes e compactas**:
  1. ð **Ãrea PedagÃ³gica** (exibida como **Meu Aprendizado** para o Aluno):
     - **Cursos** (`courses`): CatÃ¡logo e sala de aula (Todos).
     - **Alunos** (`students`): GestÃ£o de alunos e matrÃ­culas (Admin/Super Admin).
     - **Suporte** (`support`): Central de suporte e tira-dÃºvidas (Todos).
     - **Relatos de Aulas** (`lesson-reports`): Problemas tÃ©cnicos reportados com contadores e badge numÃ©rico (Todos). Alunos visualizam a listagem geral em modo somente leitura (sem botÃµes de resoluÃ§Ã£o ou exclusÃ£o), enquanto gestores (Admin e Super Admin) realizam a moderaÃ§Ã£o completa.
  2. ð **Comunidade & Social**:
     - **Chat da Comunidade** (`chat`): Canais de bate-papo em tempo real com suporte a mÃ­dias, curtidas e mensagens fixadas (Todos).
     - **Ranking & Conquistas** (`ranking`): GamificaÃ§Ã£o, pÃ³dio e pontuaÃ§Ã£o dos alunos (Todos).
     - **Depoimentos** (`testimonials`): AvaliaÃ§Ãµes em estrelas e relatos aprovados sobre os cursos (Todos).
  3. âï¸ **Sistema & ConfiguraÃ§Ãµes**:
     - **ConfiguraÃ§Ãµes** (`settings`):
       - **Alunos:** Visualizam as abas **"Cor de Fundo da Plataforma"** e **"Meu Perfil"**, permitindo customizar seu visual, foto/avatar e dados de cadastro. As abas "Tokens de API", "Links da Plataforma" e "WhiteLabel" ficam ocultas.
       - **Admin e Super Admin:** Visualizam as 5 abas completas (**"Cor de Fundo da Plataforma"**, **"Meu Perfil"**, **"Tokens de API"**, **"Links da Plataforma"** e **"WhiteLabel"**).
       - **ExibiÃ§Ã£o de NÃ­vel RPG e Ranking no Meu Perfil (`ProfileGamificationCard`):**
         - Localizado no topo da aba **"Meu Perfil"**, exibe em tempo real o status de gamificaÃ§Ã£o do usuÃ¡rio:
         - **Para Alunos:** Mostra o badge e escudo do Elo (Bronze, Prata, Ouro, Diamante ou Lenda), nÃºmero do nÃ­vel (1 ao 20), divisÃ£o, patente, barra de progresso animada de XP com porcentagem e pontos restantes para subir de nÃ­vel, alÃ©m da posiÃ§Ã£o ordinal no ranking mensal (`#X`), insÃ­gnia conquistada, total de pontos e atalhos rÃ¡pidos para "Ver 20 NÃ­veis" (`GamificationRpgLadderModal`) e "Ver Ranking" da comunidade.
         - **Para Administradores e Super Admins:** Exibe o selo distintivo de gestÃ£o (`Super Administrador Mestre` ou `Administrador da Plataforma`), indicando atuaÃ§Ã£o como supervisor da comunidade (fora da disputa direta de alunos) e mÃ©tricas gerais da disputa ativa da comunidade com atalhos diretos para inspecionar os nÃ­veis e o ranking completo.
     - **IntegraÃ§Ãµes** (`integrations`): Webhooks de checkout Kiwify/Hotmart (Admin/Super Admin).
     - **GestÃ£o de UsuÃ¡rios** (`users`): GestÃ£o de administradores e convites (Super Admin).
     - **Backup AutomÃ¡tico** (`backup`): Snapshots de banco e uploads em nuvem Backblaze B2 (Super Admin).
     - **Logs do Sistema** (`logs`): Auditoria de eventos do servidor (Super Admin).

  4. ð **Links (Parte Inferior da Barra Lateral)**:
     - Localizada na base do menu de navegaÃ§Ã£o lateral (logo acima do card de perfil do usuÃ¡rio), exibe os links cadastrados e ativos de redes sociais e pÃ¡ginas externas importantes.
     - Abre cada link em uma nova aba com seguranÃ§a (`target="_blank" rel="noopener noreferrer"`).
     - VisÃ­vel para todos os perfis (Alunos, Administradores e Super Admins).

---

## 20. GestÃ£o de Links da Plataforma e Redes Sociais
- **LocalizaÃ§Ã£o:** Aba **"Links da Plataforma"** (`Link2`) dentro de **ConfiguraÃ§Ãµes** (`/settings`), acessÃ­vel exclusivamente por Administradores e Super Admins.
- **Campos do Link:**
  - **TÃ­tulo:** RÃ³tulo descritivo exibido na barra lateral (ex: "Instagram Oficial", "Canal do YouTube").
  - **URL de Destino:** Link externo completo iniciado com `https://` ou `http://` (com botÃ£o de teste rÃ¡pido em nova aba).
  - **Ãcone:** Seletor com Ã­cones prÃ©-definidos estilizados com cores oficiais (Instagram, YouTube, WhatsApp, Telegram, Website/Globo, Twitter/X, Facebook, LinkedIn, Discord, GitHub, Link GenÃ©rico).
  - **Ordem de ExibiÃ§Ã£o:** NÃºmero inteiro ordenando a lista (menor nÃºmero aparece primeiro no menu).
  - **Status Ativo/Oculto:** Permite ativar ou ocultar o link da barra lateral a qualquer momento sem precisar deletÃ¡-lo.
- **ConfirmaÃ§Ã£o de ExclusÃ£o:** Modal com backdrop preto translÃºcido protetor, sem fechamento ao clicar fora e apenas 1 botÃ£o de cancelar alÃ©m do botÃ£o de confirmaÃ§Ã£o.
- **SincronizaÃ§Ã£o em Tempo Real:** Toda alteraÃ§Ã£o de link dispara atualizaÃ§Ã£o instantÃ¢nea na barra lateral atravÃ©s do evento `platform_links_updated`.

---

## 21. Backup AutomÃ¡tico e SincronizaÃ§Ã£o em Nuvem (PostgreSQL & Backblaze B2)
- **LocalizaÃ§Ã£o:** Aba **"Backup AutomÃ¡tico"** (`Database`) na categoria **Sistema & ConfiguraÃ§Ãµes** da barra lateral, de acesso exclusivo para **Super Admin**.
- **ExibiÃ§Ã£o ObrigatÃ³ria no HorÃ¡rio Oficial de BrasÃ­lia (`America/Sao_Paulo`):**
  - **Cards de MÃ©tricas:**
    - O card de **"Ãltimo Backup"** deve exibir a data e hora em que o backup foi gerado estritamente no **HorÃ¡rio Oficial de BrasÃ­lia** no formato `DD/MM/AAAA, HH:MM` (ex: `05/10/2026, 17:27`), sincronizado com o timestamp contido no nome do arquivo fÃ­sico (`teste_2026_10_05_17_27_47.dump.gz`).
    - O card de **"PrÃ³ximo Backup"** deve exibir o horÃ¡rio da prÃ³xima execuÃ§Ã£o agendada convertido para o HorÃ¡rio de BrasÃ­lia. Caso o agendamento esteja ativo e o horÃ¡rio anterior jÃ¡ tenha passado, o sistema recalcula dinamicamente para o prÃ³ximo ciclo futuro relativo ao momento atual.
  - **Tabela de Backups (Coluna "CRIADO EM"):**
    - Todas as linhas da listagem de backups no S3/B2 exibem o momento da criaÃ§Ã£o no HorÃ¡rio de BrasÃ­lia completo com segundos: `DD/MM/AAAA, HH:MM:SS` (ex: `05/10/2026, 17:27:47`).
- **Nomenclatura PadrÃ£o dos Arquivos:**
  - O nome gerado inclui o timestamp no fuso de BrasÃ­lia (`YYYY_MM_DD_HH_MM_SS`), permitindo auditoria visual imediata do momento exato do dump.

---

## 22. Chat da Comunidade â Galeria de MÃ­dias e GravaÃ§Ã£o de Ãudio
- **BotÃ£o de Acesso Ã  Galeria de MÃ­dias:**
  - Localizado no cabeÃ§alho do chat (`ChatHeader`), diretamente ao lado do botÃ£o de filtro de favoritas (`â­ Favoritas`).
  - RÃ³tulo: **"MÃ­dias & Arquivos"** com Ã­cone de pasta (`FolderOpen`).
  - Ao clicar, abre o modal de galeria de mÃ­dias (`ChatMediaGalleryModal`).
- **Modal de Galeria de MÃ­dias:**
  - **PadrÃ£o de Popups:** Centralizado na tela, com painel backdrop preto translÃºcido escuro (`rgba(0, 0, 0, 0.85)`), bloqueio de fechamento ao clicar fora (fechamento forÃ§ado apenas via botÃ£o `X`) e 1 Ãºnico botÃ£o de fechar no cabeÃ§alho.
  - **Abas de Filtro:**
    - `Todas` (`all`): Exibe todas as mÃ­dias trocadas no canal.
    - `Fotos` (`image`): Apenas imagens (JPG, PNG, WEBP, GIF).
    - `VÃ­deos` (`video`): VÃ­deos MP4, WebM, MOV, MKV com miniatura e botÃ£o de play.
    - `Ãudios` (`audio`): Ãudios gravados e enviados com reproduÃ§Ã£o nativa.
    - `Documentos` (`file`): PDFs, planilhas, arquivos compactados e documentos de texto com Ã­cone e botÃ£o de download/visualizaÃ§Ã£o.
  - **AÃ§Ã£o "Ver no Chat":** Em cada item da galeria, hÃ¡ um botÃ£o de sobreposiÃ§Ã£o "Ver no Chat". Ao clicar, o modal se fecha automaticamente e a lista de mensagens do chat realiza um scroll suave atÃ© a mensagem original com highlight luminoso de destaque.
- **GravaÃ§Ã£o e Envio de Ãudio Nativo:**
  - O usuÃ¡rio pode gravar Ã¡udios diretamente pelo botÃ£o de microfone (`Mic`) no rodapÃ© do chat (`ChatInputBar`).
  - Utiliza `MediaRecorder` nativo do navegador (`audio/webm`).
  - Exibe timer de gravaÃ§Ã£o dinÃ¢mico com indicador vermelho pulsante e botÃµes para "Descartar" ou "Enviar".
  - O Ã¡udio Ã© transmitido e hospedado com seguranÃ§a e renderizado com player interativo no histÃ³rico do canal.
- **Upload Ampliado de Arquivos:**
  - O seletor de anexos aceita imagens, vÃ­deos, Ã¡udios e documentos de atÃ© 25 MB por arquivo.

---

## 23. BotÃ£o e Dropdown de Favoritos no CabeÃ§alho Superior Global (TopNavbar)
- **LocalizaÃ§Ã£o:**
  - Posicionado na barra superior fixa global da plataforma (`TopNavbar`), acessÃ­vel a partir de qualquer tela (Cursos, Suporte, Chat, Ranking, Depoimentos, ConfiguraÃ§Ãµes).
  - Componente: botÃ£o estilizado com borda translÃºcida, Ã­cone de marcador (`Bookmark`) em destaque ciano/azul e rÃ³tulo **"Favoritos"**.
  - **Badge NumÃ©rico DinÃ¢mico:** Exibe um contador em formato pÃ­lula com o total consolidado de itens favoritados pelo usuÃ¡rio ativo. O badge Ã© ocultado automaticamente se a contagem for zero e atualizado em tempo real via evento customizado de broadcast `window.dispatchEvent(new CustomEvent('favorites_updated'))`.
- **Dropdown de Favoritos (`FavoritesDropdown`):**
  - **Menu Flutuante / Suspenso:** Abre abaixo do botÃ£o com alinhamento Ã  direita, cantos arredondados, fundo escuro profundo (`#0f172a`), bordas sutis e efeito glassmorphism com sombra pronunciada.
  - **Abas Organizadoras:**
    1. **DÃºvidas:** Lista os tÃ³picos de suporte favoritados pelo aluno/administrador. Exibe tÃ­tulo da dÃºvida, status e autor.
    2. **Aulas:** Lista as aulas marcadas como favoritas pelo aluno. Exibe tÃ­tulo da aula, nome do curso e duraÃ§Ã£o estimada.
    3. **ComentÃ¡rios:** Lista os comentÃ¡rios de aulas favoritados pelo usuÃ¡rio. Exibe o comentÃ¡rio, autor e aula de origem.
    4. **Mensagens:** Lista as mensagens favoritadas no Chat da Comunidade e em DMs (Mensagens Diretas).
       - **Identificação da Origem (Local):**
         - Se a mensagem for de um **Chat em Grupo de Curso**: Exibe badge 👥 Grupo: {Nome do Curso}.
         - Se a mensagem for de um **Chat em Grupo Geral**: Exibe badge 👥 Grupo: Comunidade Geral.
         - Se a mensagem for de uma **DM (Mensagem Direta)**: Exibe badge 💬 DM com {Nome do Interlocutor} (mostra com quem o usuário estava conversando).
       - Exibe o trecho da mensagem entre aspas, o nome do autor original e o tempo relativo do envio.
  - **Contadores por Aba:** Cada aba exibe um badge numérico discreto com a quantidade de itens favoritados naquele tipo.
  - **Navegação Direta:**
    - Ao clicar em um tópico de dúvida favoritado, o sistema navega automaticamente para a aba de Suporte e abre o tópico.
    - Ao clicar em uma aula favoritada, o sistema navega diretamente para a sala de aula correspondente.
    - Ao clicar em um comentário favoritado, o sistema navega para a aula e centraliza a visualização no comentário.
    - Ao clicar em uma mensagem favoritada:
      - **Se for DM:** Abre diretamente o modal de DMs (ChatDmModal) na conversa com o contato correspondente.
      - **Se for Chat em Grupo:** Navega para o Chat da Comunidade (ChatManagement), seleciona o canal (geral ou curso) e faz scroll até a mensagem com highlight.
  - **RemoÃ§Ã£o RÃ¡pida:** Cada card na listagem possui botÃ£o `X` discreto para desfavoritar o item diretamente de dentro do menu, com sincronizaÃ§Ã£o imediata nos contadores.
  - **Mecanismos de Favoritar no Sistema:**
    - **Aulas:** BotÃ£o "Favoritar / Favoritada" (`Bookmark`) na barra de aÃ§Ãµes inferior da aula (`LessonActionToolbar`).
    - **ComentÃ¡rios de Aulas:** BotÃ£o de marcador (`Bookmark`) em cada item de comentÃ¡rio (`CommentItem`).
    - **DÃºvidas do Suporte:** BotÃ£o de favoritar tÃ³pico na visualizaÃ§Ã£o de detalhes do suporte.
    - **Mensagens do Chat:** AÃ§Ã£o de favoritar mensagem no menu de aÃ§Ãµes da mensagem.
  - **Estrutura de Banco de Dados:**
    - Tabelas dedicadas `lesson_favorites` (chave primÃ¡ria composta `lesson_id + user_id`) e `lesson_comment_favorites` (chave primÃ¡ria composta `comment_id + user_id`), com exclusÃ£o em cascata ao remover a aula/comentÃ¡rio ou usuÃ¡rio.

---

## 24. Central de NotificaÃ§Ãµes no TopNavbar (MenÃ§Ãµes e Threads)
- **LocalizaÃ§Ã£o:**
  - BotÃ£o de sino (`Bell`) posicionado na barra superior fixa global da plataforma (`TopNavbar`), ao lado dos botÃµes de Favoritos e DMs.
  - **Badge NumÃ©rico de Alerta:** Exibe contador em formato pÃ­lula na cor de destaque laranja (`#f97316`) com o total de notificaÃ§Ãµes nÃ£o lidas (`unreadNotifCount`). Suporta indicaÃ§Ã£o `99+` se exceder 99.
  - **SincronizaÃ§Ã£o em Tempo Real:** Atualizado via polling e evento customizado global `window.dispatchEvent(new CustomEvent('notifications_updated'))`.
- **Modal de NotificaÃ§Ãµes (`NotificationsModal`):**
  - **PadrÃ£o de Popups:** Centralizado na tela com backdrop preto translÃºcido (`rgba(0, 0, 0, 0.75)`), efeito glassmorphism, bloqueio total de scroll no fundo (`overflow: hidden` no `document.body`) e portal renderizado via `createPortal(..., document.body)` para escapar de qualquer `backdrop-filter` ou hierarquia do layout.
  - **Abas Organizadoras:**
    1. **Caixa de entrada (`inbox`):** ReÃºne todas as notificaÃ§Ãµes nÃ£o lidas (menÃ§Ãµes `@` e novas respostas dentro das threads do usuÃ¡rio).
    2. **MenÃ§Ãµes (`mentions`):** Filtra todas as menÃ§Ãµes diretas com `@` recebidas pelo usuÃ¡rio logado no chat.
    3. **Seguindo / Threads (`threads`):** Filtra as respostas enviadas por outros usuÃ¡rios dentro das threads iniciadas pelo usuÃ¡rio ativo.
    4. **Todas (`all`):** HistÃ³rico completo de notificaÃ§Ãµes (lidas e nÃ£o lidas).
  - **AÃ§Ãµes RÃ¡pidas:**
    - **Marcar lidas:** BotÃ£o no cabeÃ§alho para marcar todas as menÃ§Ãµes e threads como lidas de uma sÃ³ vez (`/api/v1/chat/notifications/mark-all-read`).
    - **Marcar individual:** AÃ§Ã£o direta em cada card para marcar aquela notificaÃ§Ã£o especÃ­fica como lida.
    - **NavegaÃ§Ã£o Direta:** Ao clicar no card da notificaÃ§Ã£o, a notificaÃ§Ã£o Ã© marcada como lida e o usuÃ¡rio Ã© redirecionado para a aba do Chat da Comunidade.

---

## 25. Sistema de Etiquetas (Tags) de Alunos e Disparo em Massa de Mensagens Diretas (DMs)
- **PermissÃµes de Acesso:**
  - Exclusivo para perfis com nÃ­vel administrativo (**Super Admin** e **Admin**).
  - Alunos regulares nÃ£o possuem permissÃ£o para criar, editar ou excluir tags, nem para disparar mensagens em massa.
- **LocalizaÃ§Ã£o na Interface:**
  - BotÃµes destacados **"Etiquetas"** (`Tag`) e **"Disparo em Massa"** (`Send`) posicionados na barra de aÃ§Ãµes superior da tela de **GestÃ£o de Alunos** (`StudentManagement`).
  - Cada card de aluno (`StudentCard`) exibe as badges das etiquetas atribuÃ­das e um botÃ£o rÃ¡pido `+ Tag` para atribuir ou remover tags individualmente.
- **Sistema de GestÃ£o de Etiquetas (`StudentTagsModal` & `StudentAssignTagsModal`):**
  - Permite criar novas etiquetas informando nome e selecionando cor com paleta rÃ¡pida ou seletor hexadecimal.
  - Exibe a contagem em tempo real de quantos alunos estÃ£o associados a cada etiqueta.
  - Permite editar nome e cor das etiquetas existentes.
  - **Popup ObrigatÃ³rio de ConfirmaÃ§Ã£o de ExclusÃ£o (`StudentTagDeleteConfirmModal`):**
    - Ao clicar no botÃ£o de lixeira de qualquer etiqueta, o sistema obrigatoriamente abre um popup centralizado de confirmaÃ§Ã£o com backdrop preto translÃºcido protetor (`rgba(0, 0, 0, 0.85)`).
    - O popup nÃ£o fecha ao clicar fora e possui apenas 1 botÃ£o de cancelar alÃ©m do botÃ£o de confirmaÃ§Ã£o ("Sim, Excluir").
    - Exibe com clareza o nome da etiqueta em sua cor oficial e alerta ao administrador que a exclusÃ£o removerÃ¡ a tag de todos os alunos associados, preservando integralmente o cadastro e o acesso dos alunos Ã  plataforma.
  - Modal de atribuiÃ§Ã£o individual com busca rÃ¡pida e seleÃ§Ã£o de mÃºltiplas etiquetas simultÃ¢neas.
- **SegmentaÃ§Ã£o de PÃºblico para Disparo em Massa (`ChatBroadcastModal`):**
  - **PÃºblico-alvo:**
    1. **Todos os Alunos:** Disparo global para todos os alunos ativos da plataforma.
    2. **Por Curso EspecÃ­fico:** Filtra apenas os alunos matriculados no curso selecionado.
    3. **Sem Cursos:** Filtra exclusivamente alunos/leads cadastrados que ainda nÃ£o possuem matrÃ­cula em nenhum curso ativo.
    4. **Por Etiqueta:** Dispara exclusivamente para os alunos vinculados Ã  etiqueta escolhida.
    5. **Por RecÃªncia de Entrada:** Filtra alunos com base na data de criaÃ§Ã£o da conta (`created_at`) nos **Ãºltimos 7 dias**, **Ãºltimos 14 dias** ou **Ãºltimos 30 dias**, ideal para onboardings, boas-vindas e ofertas para novos alunos.
    6. **SeleÃ§Ã£o Manual:** Permite selecionar alunos especÃ­ficos diretamente na interface.
  - **BotÃ£o de AÃ§Ã£o Interativo (CTA) na Mensagem:**
    - O administrador pode configurar opcionalmente um botÃ£o de aÃ§Ã£o destacado junto ao comunicado (`button_text`, `button_url`, `button_action_type`).
    - **AÃ§Ãµes Suportadas:**
      - **Link Externo (URL):** Checkouts de venda Kiwify/Hotmart, links de convite para grupos de WhatsApp/Telegram, pÃ¡ginas externas, etc. (abertura em nova aba com `target="_blank"`).
      - **NavegaÃ§Ã£o Interna:** Abrir curso ou aula especÃ­fica da plataforma (`action_type: 'course'` ou `'lesson'`).
    - **RenderizaÃ§Ã£o Visual:** O botÃ£o Ã© renderizado diretamente dentro do balÃ£o da conversa privada do aluno (`ChatMessageItem` e `ChatDmConversationView`) com estilo neon/gradiente destacado e prÃ©-visualizaÃ§Ã£o ao vivo no modal de envio.
  - **Filtro de Perfil:**
    - OpÃ§Ã£o de enviar **"Apenas Alunos"** ou incluir administradores (**"Alunos + Administradores"**).
  - **Estimativa PrÃ©via em Tempo Real:**
    - Antes do disparo, o sistema consulta a API (`/api/v1/chat/broadcast/estimate`) e apresenta um card com a quantidade exata de destinatÃ¡rios Ãºnicos elegÃ­veis e o tempo estimado de duraÃ§Ã£o do envio com delay de 1s por aluno.
  - **DiÃ¡logo de ConfirmaÃ§Ã£o:**
    - Apresenta resumo completo (pÃºblico, total de alunos, prÃ©via da mensagem e tempo estimado) antes do envio definitivo.
- **Taxa de VazÃ£o e Processamento em Segundo Plano:**
  - **Delay Estrito:** O processamento aplica um intervalo obrigatÃ³rio de **1 segundo** (`await asyncio.sleep(1)`) entre cada mensagem enviada, garantindo estabilidade e evitando sobrecarga no servidor e nos sockets.
  - **ExecuÃ§Ã£o AssÃ­ncrona:** O disparo Ã© delegado para `BackgroundTasks` da FastAPI, retornando resposta imediata para a interface do administrador enquanto as mensagens sÃ£o entregues em segundo plano.
  - **IntegraÃ§Ã£o Nativa com o Chat:** Cada mensagem Ã© registrada individualmente na tabela `chat_messages` com `is_dm=True`, remetente do administrador e destinatÃ¡rio do aluno, emitindo o evento WebSocket `new_dm` para atualizar instantaneamente o chat e o badge do aluno.
- **HistÃ³rico de Disparos e Rastreamento de Leitura (`ChatBroadcastHistoryModal`):**
  - Acesso atravÃ©s do botÃ£o **"HistÃ³rico"** no modal de disparo em massa.
  - **MÃ©tricas Consolidadas por Campanha:**
    - TÃ­tulo/assunto da campanha e autor do disparo.
    - Total de destinatÃ¡rios, enviados com sucesso e eventuais falhas.
    - Taxa percentual de visualizaÃ§Ã£o/leitura (`% lidos`).
    - DuraÃ§Ã£o total da execuÃ§Ã£o (em segundos ou minutos).
    - Data e hora do disparo formatadas no HorÃ¡rio Oficial de BrasÃ­lia.
  - **Detalhamento de DestinatÃ¡rios (`ChatBroadcastCampaignDetailView`):**
    - Listagem individual de todos os alunos que receberam a mensagem.
    - Barra de busca por nome ou e-mail e filtros rÃ¡pidos (Todos, Apenas Lidos, NÃ£o Lidos).
    - Status de entrega individual (`sent` ou `failed`).
    - **Rastreamento de VisualizaÃ§Ã£o Preciso:**
      - Exibe badge verde com o momento exato da leitura: `Visualizado em DD/MM/AAAA Ã s HH:MM` (gravado na abertura da conversa pelo aluno via `read_at`).
      - Exibe badge cinza `NÃ£o lido ainda` para alunos que ainda nÃ£o abriram a DM.
  - **PaginaÃ§Ã£o PadrÃ£o de 20 Itens por PÃ¡gina (`HistoryPaginationBar`):**
    - Tanto a lista principal de campanhas de disparos (`ChatBroadcastHistoryModal`) quanto a listagem de destinatÃ¡rios da campanha (`ChatBroadcastCampaignDetailView`) exibem exatamente **20 itens por pÃ¡gina**.
    - Barra de paginaÃ§Ã£o responsiva com contador dinÃ¢mico (`Exibindo XâY de Z itens`), botÃµes de navegaÃ§Ã£o "Anterior" / "PrÃ³xima" e botÃµes numÃ©ricos com destaque na pÃ¡gina ativa.

---

## 26. SincronizaÃ§Ã£o em Tempo Real via WebSocket dos Badges do TopNavbar (Favoritos, DMs e NotificaÃ§Ãµes)
- **ConexÃ£o Global ContÃ­nua:** Mantida ativamente em segundo plano pelo hook `useTopNavbarSocket` conectado a `/api/v1/chat/ws?token=...` em qualquer aba da plataforma (Cursos, Sala de Aula, Suporte, Chat, Ranking, ConfiguraÃ§Ãµes, GestÃ£o de Alunos, etc.), com reconexÃ£o automÃ¡tica e heartbeat ping (`ping`/`pong`).
- **Eventos em Tempo Real:**
  1. **Favoritos (`favorites_updated`):** Disparado instantaneamente pelo backend via `chat_manager.send_to_user_sync` ao alternar favoritos em aulas, comentÃ¡rios de aulas, tÃ³picos de suporte ou mensagens do chat. O badge de Favoritos recalcula imediatamente seu total sem precisar atualizar a pÃ¡gina.
  2. **Mensagens Diretas / DMs (`new_dm`, `dm_read`, `dm_sent`):** Disparado ao receber novas DMs (incluindo disparos em massa) ou ao marcar conversas como lidas. O badge vermelho de DMs Ã© atualizado na hora em tempo real para os destinatÃ¡rios online.
  3. **NotificaÃ§Ãµes / Sininho (`new_notification`, `notifications_updated`):** Disparado em tempo real ao ser mencionado (`@nome`) em qualquer mensagem de canal ou ao receber novas respostas nas threads iniciadas pelo usuÃ¡rio ativo. O badge laranja do sino Ã© atualizado instantaneamente.
- **Isolamento e SeguranÃ§a de UsuÃ¡rio:** Os eventos direcionados sÃ£o enviados estritamente para as conexÃµes ativas do usuÃ¡rio destinatÃ¡rio via `chat_manager.send_to_user_sync(user_id, ...)`, impedindo vazamento de dados entre clientes conectados.

---

## 27. Sistema de Funis de Mensagens e Fluxos Visuais (Funnels)
- **LocalizaÃ§Ã£o:** Item de navegaÃ§Ã£o **"Funis de Mensagens"** (`GitBranch`) na barra lateral (`Sidebar`) sob a categoria **Comunidade & Social**, acessÃ­vel por Administradores e Super Admins.
- **Estrutura e Conceito:**
  - Permite aos administradores criar e gerenciar fluxos automatizados de mensagens com nÃ³s encadeados em um canvas interativo.
  - **CatÃ¡logo de NÃ³s Oficiais:**
    1. **Categoria Gatilhos (`trigger`):**
       - **Gatilho "Aluno Criado":** Atua como nÃ³ de inÃ­cio automÃ¡tico de sequÃªncias para novos membros.
       - **Prioridade Absoluta de NÃ³ Inicial (`is_start`):** Se algum nÃ³ de gatilho estiver presente no fluxo, ele Ã© **automaticamente o primeiro nÃ³ do funil** (`is_start: true`). O cabeÃ§alho do gatilho exibe conjuntamente o badge **`[GATILHO]`** (Ã¢mbar) e o badge **`[â¶ INÃCIO]`** (verde destacado). Enquanto houver um nÃ³ de gatilho no fluxo, nenhum outro nÃ³ (mensagem, Ã¡udio, mÃ­dia ou delay) exibe o badge de inÃ­cio. Caso o gatilho seja removido, o nÃ³ de mensagem retoma automaticamente o status e badge de inÃ­cio.
       - **Bloqueio de ConexÃµes de Entrada (Target):** Como o Gatilho Ã© o ponto inicial disparado por eventos externos, ele **possui exclusivamente porta de saÃ­da (output)** e Ã© **terminantemente proibido de receber conexÃµes de entrada**. O sistema bloqueia tentativas de conectar qualquer nÃ³ apontando para trÃ¡s em direÃ§Ã£o ao gatilho, exibe notificaÃ§Ã£o explicativa e expurga automaticamente conexÃµes reversas.
       - **ConfiguraÃ§Ã£o de Tempo / Atraso:** Permite disparar **imediatamente** (`0 dias`) ou com delay de **X dias apÃ³s a criaÃ§Ã£o do aluno** (presets rÃ¡pidos: `Imediatamente (0d)`, `7 dias`, `14 dias`, `21 dias`, alÃ©m de campo numÃ©rico customizado).
       - **ExecuÃ§Ã£o AutomÃ¡tica no Backend:** Quando um aluno Ã© cadastrado (seja via cadastro pÃºblico, convite com cÃ³digo OTP ou criaÃ§Ã£o manual pelo administrador), o sistema localiza os funis ativos com gatilho imediato (`0d`) e inicia a sequÃªncia. Para gatilhos com atraso (`days_after > 0`), a rotina periÃ³dica do worker e o endpoint `POST /api/v1/funnels/check-triggers` verificam e disparam o fluxo uma Ãºnica vez por aluno.
    2. **Categoria Mensagens (`message`):** Envia mensagem privada (DM) para o aluno com suporte a tags dinÃ¢micas `{aluno}`, variaÃ§Ãµes Spintax (ex: `{OlÃ¡|Oi|E aÃ­}`) sorteadas a cada execuÃ§Ã£o, e atÃ© 3 botÃµes de aÃ§Ã£o interativos.
    3. **Categoria MÃ­dias (`media`):** Envia imagens, vÃ­deos ou documentos via URL direta com legenda opcional e suporte a Spintax.
    4. **Categoria Ãudio (`audio`):** Envia mensagens de Ã¡udio (MP3/WebM) com opÃ§Ã£o de simular gravaÃ§Ã£o de voz na hora.
    5. **Categoria Controle de Fluxo (`delay`):** Aplica uma pausa temporizada em segundos (`seconds`) antes de avanÃ§ar para o prÃ³ximo nÃ³ do fluxo.
    6. **Categoria Etiquetas / Tags (`tag`):** Gerencia e avalia etiquetas do contato através de três abas no topo do nó:
       - **Aba `+ Adicionar Tag` (`add`):** Aplica uma ou mais etiquetas ao contato ao atingir este nó. Possui 1 saída padrão à direita (`output` centralizada).
       - **Aba `- Remover Tag` (`remove`):** Remove uma ou mais etiquetas do contato ao atingir este nó. Possui 1 saída padrão à direita (`output` centralizada).
       - **Aba `Verificar Tag` (`condition`):** Avalia se o aluno cumpre o critério de etiquetas configurado e **bifurca o fluxo em 2 saídas exclusivas à direita**:
         - **Saída SIM (Verde Esmeralda - `output_yes` / top: 35%):** Segue por este caminho quando o aluno cumpre a condição (AND/OR). Aresta desenhada em verde esmeralda com marcador e etiqueta `SIM`.
         - **Saída NÃO (Vermelha - `output_no` / top: 65%):** Segue por este caminho quando o aluno NÃO cumpre a condição. Aresta desenhada em vermelho neon com marcador e etiqueta `NÃO`.
       - **Modos e Operadores Lógicos:** `Possui etiqueta(s)` (`has_tags`) ou `NÃO possui` (`not_has_tags`), com operador `AND (Todas)` ou `OR (Pelo menos 1)`.
       - **Unicidade de Portas na Bifurcação:** Permite conectar simultaneamente 1 nó na saída SIM e 1 nó na saída NÃO, mantendo a regra 1:1 por porta (`sourceHandle`).
       - **Criação Rápida com Paleta de Cores:** Busca em tempo real com criação de etiqueta via modal popup com escolha de cores.
    7. **Categoria Ações & Contatos (`action_*`):**
       - **Webhook Externo (`action_webhook`):** Dispara requisições HTTP (GET/POST/PUT) com payload JSON dinâmico contendo dados do aluno.
       - **Matrícula Automática (`action_enrollment`):** Concede matrícula imediata em um curso ou pacote da plataforma com tempo de acesso configurável.
       - **Recompensa XP (`action_gamification_xp`):** Credita pontos de gamificação (XP) e histórico de recompensa diretamente ao aluno.
       - **Notificação Interna (`action_internal_notify`):** Envia alerta interno para administradores ou canais quando o aluno atinge determinada etapa.
    8. **Categoria Lógica e Divisão de Fluxo (`ab_split`):**
       - **Nó de Teste A/B (Split de Tráfego):** Divide os alunos de forma randômica ponderada entre duas saídas:
         - **Saída A (`output_a` / top: 35%):** Segue pelo Caminho A com a porcentagem configurada (ex: 50%, 70%, 80%, etc.). Aresta identificada com badge `A` em ciano.
         - **Saída B (`output_b` / top: 65%):** Segue pelo Caminho B com a porcentagem complementar (`100% - A%`). Aresta identificada com badge `B` em âmbar.
    9. **Nó Condicional "Possui Curso?" (`condition_course`):**
       - Avalia se o aluno possui matrícula ativa no curso selecionado (ou qualquer curso ativo), suportando inclusive acessos herdados de Pacotes/Combos (`CourseBundle`).
       - **Saída SIM (`output_yes` / top: 35%):** Segue se o aluno possui o curso (verde com badge `SIM`).
       - **Saída NÃO (`output_no` / top: 65%):** Segue se o aluno ainda NÃO comprou/não possui acesso (vermelho com badge `NÃO`), permitindo direcionar para oferta de compra.
    10. **Nó Terminal de Encerrar Funil (`stop`):**
       - Finaliza imediatamente a cadeia de execução do funil para o aluno.
       - **Nó Terminal:** Possui exclusivamente porta de entrada (`input`) e é **terminantemente proibido de possuir porta ou arestas de saída**.
       - **Opção Cancelar Outros Funis (`cancel_other_funnels`):** Permite interromper e remover o aluno de quaisquer outros funis em andamento para evitar mensagens concorrentes ou em duplicidade.
    11. **Delay com Janela de Horário Comercial:**
       - Integrado ao nó de **Delay**: além do tempo base (segundos, minutos, horas ou dias), permite ativar **"Janela de Horário Comercial"** com horários de início e término (padrão 09:00 às 20:00 no Horário de Brasília) e filtro opcional para apenas dias úteis (Segunda a Sexta).
       - Caso o tempo de espera expire fora do intervalo ou de madrugada, o envio é ajustado para as 09:00 do próximo dia útil elegível.


---

## 26. Diretrizes de Segurança da API, Rate Limiting e CORS
- **Rate Limiting (Limitação de Requisições contra Força Bruta e DoS):**
  - Gerenciado centralmente via biblioteca `slowapi` (`Limiter` com chave baseada em IP remoto).
  - **Rotas com Limitação Ativa:**
    - `POST /api/v1/auth/login`: **Máximo de 5 requisições por minuto** por IP. Bloqueia tentativas massivas de força bruta e protege o consumo de CPU/RAM do algoritmo de hash Argon2id (64 MB de memória).
    - `POST /api/v1/auth/reset-password/confirm`: **Máximo de 5 requisições por minuto** por IP para confirmação de redefinição de senha.
    - `POST /api/v1/auth/public-register`: **Máximo de 5 cadastros por hora** por IP para prevenir criação automatizada de contas falsas (bots/spam).
    - `POST /api/v1/chat/messages`: **Máximo de 60 mensagens por minuto** por usuário para mitigar flooding e spam nos canais de conversa.
  - **Resposta Padronizada ao Exceder Limite:**
    - Retorna `HTTP 429 Too Many Requests` com JSON padronizado `{"detail": "Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente."}` tratado de forma consistente pelo frontend.
- **Configuração de CORS (Cross-Origin Resource Sharing):**
  - Controlado pela variável de ambiente `CORS_ORIGINS` no `.env` (lista de origens separadas por vírgula).
  - Em ambiente de desenvolvimento local, o valor padrão `*` permite acesso local simplificado.
  - Em ambiente de produção, é obrigatório definir os domínios oficiais (ex: `https://suaplataforma.com.br`) garantindo que apenas o frontend autorizado acesse a API com credenciais de autenticação (`allow_credentials=True`).
- **Armazenamento Seguro de Chaves de API (Hashing SHA-256):**
  - Chaves de API (`sk_live_...`) nunca são gravadas em texto puro no banco de dados.
  - Ao criar um token em `POST /api/v1/api-tokens`, a chave original é exibida apenas uma vez ao administrador e seu hash criptográfico `SHA-256` é persistido na coluna `token`.
  - Ao receber requisições com `X-API-Key` ou `Authorization: Bearer sk_live_...`, o sistema calcula o SHA-256 e busca no banco.
  - **Migração Transparente:** Tokens legados gravados em texto plano continuam funcionando e são automaticamente atualizados para hash SHA-256 no primeiro uso.
- **Criptografia de Segredos de Webhooks e Integrações em Repouso:**
  - Segredos e chaves de assinatura de webhooks (`secret_key`) são criptografados em repouso no banco via **Fernet (AES-128-CBC + HMAC-SHA256)** sob o prefixo `enc:v1:`, utilizando a chave mestra do sistema (`app.core.encryption`).
  - No disparo de eventos e cálculo de assinaturas HMAC, os segredos são descriptografados transparentemente em memória.
- **Cabeçalhos de Segurança HTTP (Security Headers OWASP):**
  - Configurados no proxy reverso Nginx e reforçados via middleware no FastAPI:
    - `X-Frame-Options: SAMEORIGIN`: Impede ataques de Clickjacking.
    - `X-Content-Type-Options: nosniff`: Neutraliza ataques de MIME-sniffing.
    - `Referrer-Policy: strict-origin-when-cross-origin`: Protege o vazamento de caminhos de URL em requisições externas.
    - `Permissions-Policy: geolocation=(), camera=(self), microphone=(self)`: Restringe permissões de dispositivos sensíveis apenas à própria plataforma.
- **Parametrização e Resiliência do Pool de Banco de Dados (PostgreSQL):**
  - O pool de conexões do SQLAlchemy é parametrizado via variáveis de ambiente com defaults resilientes:
    - `DB_POOL_SIZE`: Conexões permanentes abertas no pool base (padrão: `10`).
    - `DB_MAX_OVERFLOW`: Conexões temporárias extras permitidas para absorver picos de tráfego (padrão: `20`, totalizando até 30 conexões simultâneas).
    - `DB_POOL_TIMEOUT`: Tempo limite em segundos de espera por conexão livre antes de timeout (padrão: `15s`), evitando filas travadas indefinidamente.
    - `DB_POOL_RECYCLE`: Intervalo de reciclagem de conexões inativas (padrão: `1800s` / 30 minutos) para prevenir desconexões silenciosas (*idle disconnects*).
    - `pool_pre_ping=True`: Validação automática de integridade da conexão antes de entregá-la à requisição.

---

## 15. Políticas de Segurança Avançada, Proteção Anti-Pirataria e Lockout

### 15.1. Bloqueio Temporário por Tentativas Incorretas (Account Lockout)
- **Regra:** Se um usuário digitar a senha incorreta por 5 vezes consecutivas, a conta é automaticamente bloqueada por 15 minutos.
- **Mensagem Amigável:** O sistema informa quantas tentativas restam a cada erro e, ao bloquear, avisa quantos minutos o usuário precisa aguardar.
- **Desbloqueio:** O bloqueio expira automaticamente após 15 minutos ou é redefinido imediatamente se o usuário redefinir sua senha com sucesso.

### 15.2. Invalidação Imediata de Sessões JWT (	oken_version)
- **Regra:** Todo token de acesso emitido carrega uma claim 	oken_version.
- **Gatilhos de Invalidação:** Quando o usuário altera sua senha (seja pelo perfil ou via link de recuperação) ou efetua logout (/logout), o 	oken_version no banco é incrementado, invalidando instantaneamente qualquer token antigo em circulação.

### 15.3. Proteção Anti-Pirataria (Single-Session Enforcement para Alunos)
- **Regra para Alunos:** Alunos têm enforced a política de sessão única. Ao realizar um novo login em outro computador, navegador ou dispositivo móvel, a sessão anterior é automaticamente deslogada na requisição seguinte com erro 401.
- **Exceção para Administradores:** Administradores e Super Admins mantêm permissão para sessões simultâneas para monitoramento e gestão operacional de múltiplos dispositivos.

### 15.4. Validação de Conteúdo Real de Arquivos em Uploads (Magic Bytes)
- **Regra:** Toda rota de upload (fotos de perfil, thumbnails de cursos, vídeos de aulas e documentos anexos) valida não apenas a extensão nominal do arquivo, mas inspeciona a assinatura binária real (Magic Bytes) no início do buffer. Arquivos executáveis ou scripts maliciosos renomeados com extensões permitidas (.jpg, .png, .pdf) são rejeitados com HTTP 400.

### 15.5. Trava de Inicialização contra Credenciais Padrão (Startup Security Check)
- **Regra:** No startup da aplicação (lifespan), o sistema inspeciona se a SECRET_KEY ou SECURITY_PASSWORD_PEPPER utilizam chaves padrão ou possuem entropia insuficiente (< 32 caracteres para JWT e < 16 para pepper), emitindo alerta de alta prioridade nos logs do servidor.

---

## 16. Monitoramento de Infraestrutura, Recursos do Servidor e Alertas por Webhook

### 16.1. Acesso e Visibilidade
- **Permissão de Acesso:** O painel de **Infraestrutura & Recursos** é restrito ao perfil superadmin (e administradores autorizados), posicionado no menu de Sistema da Barra Lateral (Sidebar) e navegável pelas abas administrativas de topo.

### 16.2. Recursos de Hardware e Diretrizes
- **Métricas Coletadas:** Leitura em tempo real de Memória RAM (total, livre, utilizada e porcentagem), Processamento de CPU e consumo de memória RSS do container da API (rea_de_membros_backend).
- **Picos de Hardware (24h):** O sistema registra e atualiza automaticamente os maiores picos de RAM e CPU registrados no dia, com timestamp formatado no Horário Oficial de Brasília (UTC-3).
- **Proteção contra Sobrecarga (OOM Killer):** O limite configurado para alerta de RAM atua de forma preventiva antes que o sistema operacional encerre processos por falta de memória.

### 16.3. Conexões e Pool do PostgreSQL
- **Métricas do Pool:** Monitora conexões ativas em uso instantâneo, conexões ociosas prontas no pool, ocupação percentual e capacidade total (DB_POOL_SIZE + DB_MAX_OVERFLOW).
- **Histórico Horário:** Armazena e exibe a tabela de histórico de conexões das últimas 24 horas com classificação de status (Normal, Atenção, Crítico).

### 16.4. Alertas e Notificações por Webhook
- **Disparo Automático:** Quando o percentual de ocupação do Pool, de RAM ou de CPU ultrapassar os limites configurados (sliders), o backend dispara imediatamente um payload JSON para o Webhook configurado.
- **Intervalo Anti-Spam (Cooldown):** Respeita o intervalo configurado (5, 15, 30 ou 60 minutos) para evitar envios repetitivos durante picos prolongados.
- **Notificação de Normalização:** Caso configurado, envia um aviso confirmando que o tráfego e os recursos retornaram aos patamares seguros.
- **Teste de Webhook:** O administrador pode testar a entrega a qualquer momento através do botão *Testar Webhook*.


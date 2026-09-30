# Regras de Negócio do Sistema (Área de Membros)

Este documento registra as decisões de regras de negócio da plataforma para consulta e orientação do agente e da equipe.

---

## 1. Gestão de Cursos e Controle de Acesso por Aluno
- **Visibilidade de Cursos:** A visibilidade de um curso **NÃO** é definida globalmente no curso para todos os alunos. Cada aluno tem sua própria lista de cursos aos quais possui acesso liberado e seu respectivo prazo de validade individual por produto.
- **Perfis de Acesso na Interface:**
  - Não existe a opção "Usuário comum" (`user`) na interface de criação de convites, edição de perfil ou filtro de usuários. Os perfis selecionáveis nos modais são exclusivamente **`Aluno` (`aluno`)** e **`Administrador (Admin)` (`admin`)** (além do `Super Admin` protegido).
- **Definição de Acesso e Tempo de Acesso por Produto/Curso:**
  - **Na criação de convite (`/invite`):** Ao selecionar o tipo **Aluno**, o administrador marca quais produtos/cursos aquele aluno terá acesso e define, **para cada produto selecionado individualmente**, o **Tempo de Acesso**:
    - `Vitalício` (`lifetime` — sem expiração)
    - `1 mês` (`1_month` — 30 dias)
    - `3 meses` (`3_months` — 90 dias)
    - `6 meses` (`6_months` — 180 dias)
    - `1 ano` (`1_year` — 365 dias)
    - `2 anos` (`2_years` — 730 dias)
    - `3 anos` (`3_years` — 1095 dias)
    Quando o aluno conclui o cadastro, o sistema vincula os cursos e calcula a data de expiração (`expires_at`) de cada curso a partir da ativação da conta.
  - **Na edição do aluno (`/users/{id}`):** O Super Admin pode marcar/desmarcar quais cursos estão liberados para o aluno e definir/alterar o tempo de acesso (`Vitalício`, `6 meses`, `1 ano`, `2 anos`, etc.) de cada produto especificamente.
- **Permissão de Visualização e Expiração:**
  - `superadmin` e `admin`: Têm visão completa de todos os cursos cadastrados na plataforma.
  - `aluno`: Visualiza **apenas** os cursos que foram expressamente liberados para a sua conta e cujo prazo de acesso esteja vigente (`expires_at IS NULL` ou `expires_at > agora`). Cursos com prazo expirado deixam de aparecer na vitrine do aluno e têm o acesso bloqueado (`403`).
- **Criação e Edição de Cursos:**
  - O modal de criar/editar curso **não** possui checkbox de "Curso publicado (visível para alunos)".
  - A imagem de capa (Thumbnail) pode ser enviada diretamente do computador do usuário (upload) ou mantida via URL.
  - **Especificações recomendadas para a Thumbnail:**
    - Dimensões recomendadas: **1280 × 720 pixels** (Proporção widescreen 16:9).
    - Formatos aceitos: **JPG, PNG, WEBP**.
    - Tamanho máximo: **até 5 MB**.
- **Paginação de Cursos:**
  - A listagem exibe no máximo **20 cursos por página**.
  - Abaixo da grade de cursos, há controles de navegação ("Anterior", "Próxima", contador de páginas e cursos exibidos).

---

## 2. Estrutura Interna do Curso (Módulos e Aulas)
- **Acesso ao Curso:**
  - Em cada card de curso, há a ação **"Acessar Curso"** (além do clique direto na capa/título), abrindo o ambiente de sala de aula (`CourseClassroom`).
- **Gestão de Módulos:**
  - Módulos organizam os tópicos do curso (Título, Descrição, Ordem).
  - A exclusão de um módulo apaga em cascata todas as aulas associadas após confirmação em popup modal preto.
- **Gestão de Aulas (Lessons):**
  - Cada aula pertence a um módulo e contém:
    - **Nome/Título da Aula** (obrigatório).
    - **Descrição da Aula** (opcional, renderizada abaixo do player com quebras de linha preservadas).
    - **Duração Estimada:** Especificada em **minutos** (ex: `20 min` ou formato cronômetro `15:30`). No formulário de cadastro/edição, o campo deixa explícito no rótulo `(em minutos)` e instrução de ajuda. Se o administrador preencher apenas números (ex: `20`), o sistema normaliza e exibe automaticamente como `20 min` tanto no player da aula quanto na listagem de aulas do curso.
      - **Upload do Computador (Backblaze B2):** arquivos de vídeo MP4, WebM, MOV ou MKV de até **2 GB (2048 MB)** são enviados diretamente para a nuvem no bucket Backblaze B2 (`AreaDeMembros/videos/`). O Nginx do frontend está configurado com `client_max_body_size 2500M;` para permitir transferências de arquivos de grande porte.
      - **Aba Padrão:** Por padrão, o modal de criação e edição da aula já se inicia diretamente na aba **"Upload do PC (Backblaze B2)"**.
      - **Capa do Vídeo da Aula (Thumbnail / Poster):**
        - Cada aula possui suporte a uma capa personalizada exclusiva, hospedada no Backblaze B2 (`AreaDeMembros/thumbnails/`).
        - Dimensões recomendadas no painel: **1280 × 720 pixels (Proporção widescreen 16:9)**, formatos **JPG, PNG, WEBP (até 5 MB)**.
        - A capa é renderizada como atributo `poster` no player HTML5 antes do aluno dar o play, e como apresentação de destaque caso nenhum vídeo tenha sido enviado ainda.
      - **Streaming Nativo e Player Customizado:**
        - O player de vídeo HTML5 da aula conta com barra de controles interativa sobreposta (`CustomVideoPlayer`).
        - **Barra de Progresso Interativa (Scrubbing / Seek):** O aluno pode clicar ou arrastar livremente na barra de progresso para avançar ou retroceder a reprodução em qualquer ponto do vídeo instantaneamente.
        - **Avançar e Retroceder 10 Segundos:** Botões dedicados `-10s` (`RotateCcw`) e `+10s` (`RotateCw`) para saltos ágeis durante o estudo.
        - **Indicador Exato de Tempo Restante:** O display de tempo exibe o tempo decorrido, a duração total e destaca explicitamente quanto tempo falta para o término do vídeo (ex: `00:09 / 10:00 (Faltam 09:51)`), com fallback inteligente para a duração estimada cadastrada na aula caso o vídeo ainda esteja em buffer de metadados.
        - **Controles de Volume e Tela Cheia:** Ajuste fino de volume com slider, botão mute/unmute e alternância para tela cheia nativa.
      - **Thumbnails dos Cursos:** Capas enviadas por upload também são hospedadas no Backblaze B2 (`AreaDeMembros/thumbnails/`).
      - **Limpeza Automática:** Ao excluir um curso ou aula, as mídias vinculadas correspondentes são automaticamente deletadas do Backblaze B2.
      - **Link Externo / Embed:** Suporte mantido a links do YouTube, Vimeo, Panda Video ou URL externa.
      - **Suporte Multilíngue (Aulas em Múltiplos Idiomas):**
        - A mesma aula pode conter faixas de vídeo em múltiplos idiomas (ex: Português 🇧🇷, Inglês 🇺🇸, Espanhol 🇪🇸, Francês 🇫🇷, Alemão 🇩🇪, Italiano 🇮🇹, etc.).
        - **Nome Personalizado do Idioma (Rótulo):** O administrador pode alterar o nome exibido de cada idioma cadastrado (campo `language_label`, ex: "Português (Brasil)", "Inglês (UK)", "Espanhol Neutro", etc.). O nome editado reflete em tempo real nas abas de edição e nos botões de troca de idioma do player visualizados pelo aluno.
        - **Nome e Descrição da Aula por Idioma:** Além do vídeo, cada idioma cadastrado possui seu próprio **Nome da Aula** e **Descrição da Aula** específicos, permitindo que a interface se adapte completamente ao idioma selecionado pelo aluno.
        - Cada faixa de idioma possui seu próprio vídeo independente, com suporte individual a upload direto para o Backblaze B2 ou links externos (YouTube, Vimeo, Panda Video, URL).
        - No cadastro/edição da aula, o gerenciador em abas permite adicionar, remover e alternar entre os idiomas cadastrados, editando individualmente o rótulo do idioma, o título, a descrição e o vídeo de cada faixa.
        - No player da sala de aula (`LessonPlayer`), ao alternar entre os botões de idiomas, o título da aula e o texto da aba de visão geral são atualizados dinamicamente em tempo real para os textos daquele idioma.
        - Ao excluir uma aula ou curso, todos os vídeos de todos os idiomas vinculados são limpos automaticamente do banco e do Backblaze B2.
      - **Status de Disponibilidade da Aula ("Disponível" vs "Em Breve"):**
        - O modal de criar e editar aula conta com um seletor de disponibilidade (`Disponível` / `Em Breve`) persistido na coluna `availability_status` da tabela `lessons`.
        - **Comportamento Híbrido:** Se a aula for explicitamente marcada como "Em Breve" OU se foi criada mas ainda não possui nenhum vídeo enviado/vinculado, o sistema a reconhece automaticamente como aula em produção/em breve.
        - **Visão do Aluno:**
          - Na Timeline lateral (`ModuleTimelineSidebar`) e listas de aulas, a aula recebe um badge de destaque âmbar `Em Breve` com ícone de relógio (`Clock`).
          - Ao abrir a aula no player, em vez de exibir tela preta ou mensagem genérica de erro, o player widescreen exibe uma tela cinematográfica "Aula em Breve / Aula em Produção" estilizada, com a thumbnail de capa (se houver), mensagem acolhedora informando que o conteúdo será liberado em breve, e bloqueio de conclusão prematura.
        - **Visão do Administrador / Instrutor:** O administrador visualiza o status e conta com botão direto "Editar Aula e Subir Vídeo" na tela de pré-visualização da aula para anexar o vídeo assim que estiver pronto.
  - **Navegação:** O player permite avançar para a "Próxima Aula" ou retroceder para a "Aula Anterior" diretamente na interface.
- **Aba de Comentários da Aula:**
  - Aba dedicada abaixo do player de cada aula.
  - Alunos e administradores podem enviar comentários com dúvidas ou feedbacks.
  - Cada comentário exibe o nome do autor, badge de perfil (Aluno, Admin, Super Admin), avatar e data/hora no formato de Brasília.
  - **Paginação de Comentários:**
    - A listagem exibe inicialmente os primeiros **20 comentários** da aula.
    - Quando houver mais de 20 comentários, a barra de navegação ("Anterior", "Próxima", contador "Página X de Y" e intervalo "Exibindo X–Y de Z comentários") permite navegar entre as páginas.
    - Ao enviar um novo comentário, caso ultrapasse o limite da página atual, a navegação é direcionada para a última página para exibir o comentário recém-criado.
  - O autor do comentário pode excluir seu próprio comentário a qualquer momento.
  - Superadmin e Admin possuem privilégio de moderação, podendo excluir qualquer comentário.
  - Toda exclusão exige confirmação explícita em popup modal com fundo escuro.
  - **Respostas e Threads em 1 Nível:**
    - Tanto alunos quanto administradores podem responder a qualquer comentário clicando no botão "Responder".
    - A estrutura organiza as respostas em **1 nível de thread** (todas as respostas ficam aninhadas diretamente abaixo do comentário raiz original com linha conectora lateral sutil).
    - Clicar em "Responder" em uma resposta pré-existente insere automaticamente a menção `@Nome` no campo de texto e ancora a resposta na thread principal.
    - Se houver respostas, o comentário exibe o botão de alternância "Ver X respostas" / "Ocultar respostas".
    - O autor da resposta ou administradores podem excluir uma resposta individual; ao excluir o comentário raiz original, toda a thread com suas respostas é excluída em cascata.
- **Aba de Materiais Complementares e Anexos da Aula:**
  - Aba dedicada **"Materiais Complementares"** abaixo do player da aula, exibindo contador em badge de quantos arquivos estão disponíveis.
  - **Upload e Gestão:** No modal de criar ou editar aula, o instrutor pode anexar arquivos do seu computador de até 100 MB (PDF, Word, Excel, PowerPoint, ZIP, RAR, TXT, CSV), armazenados no Backblaze B2 (`AreaDeMembros/attachments/`).
  - **Título e Descrição do Documento:** Para cada arquivo anexado, o instrutor pode definir tanto o **nome exibido** quanto uma **descrição textual explicativa** (ex: instruções de uso da planilha, exercícios da apostila, etc.).
  - **Acesso pelos Alunos:** Os alunos visualizam cada material com seu ícone correspondente (PDF em vermelho, planilhas em verde, compactados em amarelo, etc.), título, descrição explicativa quando informada, tamanho formatado (KB/MB) e o botão **"Acessar"** para abrir/baixar o arquivo.
  - **Limpeza Automática em Nuvem:** Ao remover um anexo ou excluir a aula/curso, os arquivos correspondentes são automaticamente deletados do Backblaze B2.
- **Popups de Upload e Exclusão de Mídias e Arquivos:**
  - **Upload de Arquivos/Vídeos/Capas:**
    - Ao iniciar qualquer envio de arquivo (vídeo da aula até 2 GB, capa da aula até 5 MB, capa do curso até 5 MB, documentos/anexos até 100 MB), o sistema abre obrigatoriamente um popup modal centralizado com fundo escuro translúcido (`UploadProgressModal`).
    - O modal exibe spinner animado, ícone de nuvem, mensagem explicativa e barra de progresso contínua animada.
    - O modal **não** permite fechamento acidental ao clicar fora do painel central.
    - O modal fecha automaticamente assim que a transferência para a nuvem for concluída com sucesso ou em caso de erro.
  - **Confirmação de Exclusão de Arquivos/Mídias:**
    - Toda ação de remoção de mídia ou documento (remover anexo, remover capa da aula, remover capa do curso, desvincular vídeo da aula ou remover faixa de idioma) exige obrigatoriamente um popup modal de confirmação centralizado (`FileDeleteConfirmModal`).
    - Possui fundo preto translúcido, não fecha ao clicar fora e conta estritamente com **1 botão Cancelar** e **1 botão Confirmar Exclusão**.
    - A exclusão física ou lógica só é disparada após a confirmação no modal.

---

## 3. Interações com a Aula (Conclusão, Avaliação e Relato de Problemas)
- **Marcação de Aula como Assistida (Progresso do Aluno):**
  - Cada aluno pode marcar e desmarcar a aula como concluída através do botão interativo "Marcar como Assistida" / "Aula Concluída" na barra de ações (`LessonActionToolbar`) localizada logo abaixo do título e duração da aula.
  - O status é registrado na tabela `lesson_progress` vinculado ao aluno autenticado e à aula específica.
  - Na lista de aulas da barra lateral do curso, as aulas já assistidas recebem instantaneamente um ícone de verificação verde (`CheckCircle2`) e o **nome da aula fica riscado no meio (`line-through`)**, facilitando a identificação visual imediata do avanço pelo aluno.
- **Avaliação da Aula (0 a 5 Estrelas):**
  - O aluno pode registrar sua avaliação na aula clicando na escala interativa de 1 a 5 estrelas.
  - Ao passar o mouse pelas estrelas, o componente exibe um destaque dourado interativo.
  - O sistema armazena a nota individual de cada aluno na tabela `lesson_ratings` e exibe dinamicamente a média aritmética consolidada e a contagem total de avaliações recebidas pela aula.
- **Relato de Problemas na Aula:**
  - O aluno conta com a opção "Relatar Problema" na barra de ações da aula.
  - Ao clicar, abre-se um modal centralizado com fundo escuro translúcido (`LessonReportModal`) que não fecha com clique fora acidental.
  - Categorias de problemas pré-definidas:
    - Vídeo não carrega / trava (`video`)
    - Áudio baixo / com ruído (`audio`)
    - Material ou anexo com erro / link quebrado (`material`)
    - Dúvida ou erro no conteúdo apresentado (`content`)
    - Outro problema (`other`)
  - O campo de descrição textual detalhada é obrigatório para garantir clareza no diagnóstico da equipe de suporte.
  - Os relatos ficam persistidos na tabela `lesson_reports` com status inicial `open` (em aberto).
- **Central de Gestão de Relatos e Notificações no Painel:**
  - **Menu Lateral (Categoria Geral):**
    - Administradores (`admin` e `superadmin`) visualizam o item **"Relatos de Aulas"** na categoria **Geral** da barra lateral.
    - **Notificação:** Ao lado do item "Relatos de Aulas", é exibido um **badge numérico em vermelho** contendo a quantidade de problemas em aberto (`status == 'open'`). Se não houver chamados pendentes, o badge fica oculto.
  - **Tela de Gestão (`LessonReportsManagement`):**
    - **Métricas no Topo:** Cards exibindo "Total de Relatos", "Pendentes / Em Aberto" (em vermelho) e "Resolvidos" (em verde).
    - **Filtros e Busca:** Campo de busca textual (aluno, e-mail, aula, curso, descrição) e seletores por tipo de problema e status.
    - **Identificação do Autor do Relato:** Cada card exibe o nome, e-mail e um **badge de perfil** colorido identificando o tipo de usuário (`Super Admin`, `Admin`, `Aluno` ou `Usuário`).
    - **Fuso Horário de Brasília:** A data e a hora do chamado são obrigatoriamente convertidas e exibidas no **Horário Oficial de Brasília (`America/Sao_Paulo`)**, garantindo exatidão no acompanhamento.
    - **Ações Administrativas com Confirmação:**
      - **Popup de Confirmação para "Marcar como Resolvido":** Ao clicar no botão para resolver o chamado, um modal centralizado com fundo preto translúcido (`ActionConfirmModal`) é exibido para confirmação antes de atualizar o status.
      - **Reabertura:** O administrador pode reabrir o chamado a qualquer momento.
      - Ao resolver ou reabrir, o contador do badge na barra lateral é atualizado em tempo real.
      - **Exclusão Segura:** Opção de excluir o registro com popup de confirmação centralizado com fundo escuro translúcido.

---

## 4. Anotações Privadas do Aluno na Aula
- **Privacidade Absoluta:**
  - O aluno possui uma aba dedicada **"Minhas Anotações"** abaixo do player da aula.
  - **Acesso Estritamente Restrito:** Apenas o próprio aluno que escreveu as anotações tem acesso a elas. Nenhum outro aluno, nem mesmo administradores ou instrutores, tem acesso ou visualização das anotações privadas do aluno na interface.
  - Os registros na tabela `lesson_notes` são estritamente filtrados pelo `user_id` do aluno autenticado e pela aula específica (`lesson_id`).
- **Estrutura em Badges / Cards Individuais:**
  - Ao salvar uma anotação, ela se transforma em um **badge/card individual estilizado**, permitindo ao aluno registrar múltiplos apontamentos e insights ao longo da aula.
  - O cabeçalho exibe um badge com o total de anotações feitas pelo aluno na aula.
  - **Data e Horário de Brasília:** Cada badge de anotação exibe uma tag com a data e horário no **Horário Oficial de Brasília (`America/Sao_Paulo`)**, indicando com exatidão quando a anotação foi criada e se foi editada.
  - **Edição Inline de Cada Badge:**
    - Cada badge conta com a opção **"Editar"** que abre o editor inline exclusivo daquele apontamento, permitindo alterar o texto e salvar ou cancelar com facilidade.
  - **Exclusão Segura com Confirmação:**
    - Cada badge conta com a opção **"Excluir"**.
    - Ao clicar, é exibido obrigatoriamente um popup modal centralizado com fundo escuro translúcido (`FileDeleteConfirmModal`), atendendo às regras de UX contra deleções acidentais.
  - **Salvamento Ágil de Novas Anotações:**
    - Campo de nova anotação com contador de caracteres.
    - Botão "Salvar Anotação" com spinner de loading e feedback por toast.
    - Atalho de teclado rápido: `Ctrl + Enter` para criar o novo badge instantaneamente.
  - **Paginação de Badges (20 por página):**
    - A listagem exibe no máximo os **20 primeiros badges de anotações** por página.
    - Quando houver mais de 20 anotações, a barra de navegação inferior exibe o intervalo (ex: `Exibindo 1–20 de 25 anotações`), indicador de página (`Página 1 de 2`) e botões de navegação `Anterior` e `Próxima`.
    - Ao criar uma nova anotação, a navegação retorna automaticamente para a página 1 para exibir o badge recém-adicionado de imediato.

---

## 5. Personalização Visual Estilo Netflix (Cursos, Módulos e Aulas)
- **Configuração Completa pelos Administradores (`admin` e `superadmin`):**
  - **Cor de Fundo Global da Área de Membros (Aba `Configurações` na Barra Lateral):**
    - Padrão `#090d16` (*Netflix Dark*).
    - Configurada globalmente através do botão **"Configurações"** na categoria **Geral** da barra lateral (`PlatformSettings`), e **não** individualmente dentro de cada curso — garantindo que toda a plataforma (barra lateral, vitrine de cursos, salas de aula e popups de todos os cursos) mantenha uma única identidade visual consistente.
    - Conta com seletor livre de cor (`color picker` + input hexadecimal), pré-visualização ao vivo e presets rápidos: **Netflix Dark (`#090d16`)**, **Preto OLED (`#000000`)**, **Grafite Escuro (`#121620`)**, **Azul Meia-Noite (`#0b1120`)** e **Claro Clássico (`#f8fafc`)**.
  - **Banner Hero Cinemático do Curso (`cover_image_url` na tabela `courses`):**
    - Imagem panorâmica exibida no topo da sala de aula com degradê cinemático integrado à cor de fundo escolhida, título em destaque, botão CTA ("Comece Agora" / "Continuar Assistindo") e barra de progresso percentual do aluno.
    - Caso não seja informado um Banner Hero específico, utiliza automaticamente a capa principal do curso (`thumbnail_url`) ou um degradê radial elegante.
  - **Imagem de Capa / Pôster dos Módulos (`image_url` na tabela `modules`):**
    - Cada módulo pode ter sua própria imagem de capa configurada via URL ou upload direto para o Backblaze B2 no modal de Criar/Editar Módulo.
    - Os módulos são exibidos em uma **trilha horizontal de pôsteres verticais (Estilo Netflix / BE.EXPERT)** logo abaixo do Banner Hero, mostrando tag `MÓDULO X`, imagem de fundo com degradê, título e progresso de conclusão das aulas daquele módulo.
  - **Experiência Imersiva sem Barra Lateral e Seleção Sob Demanda:**
    - Ao entrar em um curso, a barra lateral esquerda do sistema (`Sidebar`) é ocultada automaticamente para proporcionar imersão total na cor de fundo configurada.
    - O botão **"Voltar aos Cursos"** no topo possui estilo *Dark Glassmorphism* (pílula translúcida com ícone dourado) e o título do curso ao lado é exibido com alto contraste.
    - Ao entrar no curso, as aulas e o player **não aparecem abertos inicialmente**: a seção inferior de aulas + player de vídeo só é exibida na parte de baixo quando o aluno **aperta no card do módulo escolhido** (ou clica em "Comece Agora" / "Continuar Assistindo").
    - **Layout Editorial de Aula + Timeline de Módulos (ao clicar em um módulo):**
      - **Player Widescreen no Topo:** O player de vídeo ocupa toda a largura superior da seção da aula com cantos arredondados e sombra cinemática, sem caixa branca ao redor.
      - **Grid em 2 Colunas Abaixo do Player:**
        - **Coluna Esquerda (Editorial & Interações):** Título da aula em destaque, trilha de navegação (*breadcrumb* `Início > Curso > Módulo > Editar esse conteúdo`), descrição editorial limpa sobre o fundo escuro da área de membros, barra de ações com botão verde em pílula (`Marcar como Assistida` / `Aula Concluída`), além das abas interativas (`Visão Geral`, `Materiais Complementares`, `Minhas Anotações`, `Comentários`).
        - **Coluna Direita (`ModuleTimelineSidebar`):** Exibe no topo o indicador circular `Meu Progresso - X% (X de Y aulas)` e, logo abaixo, a árvore vertical de módulos e aulas em formato de **Timeline** (cada módulo com seu anel de progresso; o módulo selecionado expande uma linha vertical conectora listando as aulas numeradas `1. ...`, `2. ...` com marcador dourado na aula ativa e verde nas aulas concluídas).
  - **Imagem de Fundo / Capa das Aulas (`thumbnail_url` na tabela `lessons`):**
    - Além de servir como pôster do player de vídeo da aula, a miniatura da aula também é exibida na timeline e nos cards de aulas do módulo selecionado.
  - **Limpeza Automática no Backblaze B2:**
    - Ao substituir ou remover imagens de curso, banner hero, capa de módulo ou miniatura de aula (sempre com popup de confirmação centralizado), ou ao excluir o registro pai, os arquivos antigos correspondentes no Backblaze B2 são removidos automaticamente.

---

## 6. Acompanhamento de Alunos e Progresso (`/students`)
- **Localização na Barra Lateral:**
  - O botão **"Alunos"** fica localizado na categoria **Geral** da barra lateral, posicionado **logo abaixo de "Relatos de Aulas"** e acima de "Configurações".
  - Visível exclusivamente para perfis com permissão de gestão: **`superadmin`** e **`admin`**.
- **Listagem e Métricas Rápidas:**
  - O painel exibe no topo os contadores gerais: **Total de Alunos**, **Alunos Ativos** e **Progresso Médio Geral**.
  - Barra de busca com filtro dinâmico por nome ou e-mail do aluno.
  - **Paginação e Controle de Quantidade por Página:**
    - Exibe no máximo **20 alunos por vez** por padrão.
    - Conta com um dropdown seletor estilizado que permite alternar a exibição para **20, 50, 100 ou 200 alunos de uma única vez**.
    - Barra inferior permanente informando o intervalo exibido (ex: `Exibindo 1–20 de 45 alunos`), indicador de página (`Página 1 de 3`) e botões de navegação `Anterior` e `Próxima`.
- **Detalhes Exibidos por Aluno:**
  - **Identificação e Momento de Cadastro:** Nome completo, e-mail, badge de status (`Aluno Ativo` / `Inativo`), data e horário exatos em que ele virou aluno (`Aluno desde: DD/MM/AAAA às HH:MM`) e porcentagem geral de conclusão.
  - **Cursos aos quais o Aluno tem Acesso:**
    - Miniatura e título de cada curso vinculado.
    - Prazo de acesso individual (`Vitalício` ou `Expira em DD/MM/AAAA` / alerta de `Acesso Expirado`).
    - **Linha do Tempo de Validade do Curso (Cursos Não-Vitalícios):**
      - Quando o curso possui prazo determinado de expiração, exibe uma seção visual de linha do tempo destacando:
        - Tempo restante: `Faltam X dias` (ou `Acesso Expirado`).
        - Alerta em âmbar para renovação próxima quando faltar 7 dias ou menos.
        - Barra de progresso do período de acesso (tempo decorrido vs tempo total da concessão).
        - Marcadores temporais com data de início e término exato (`Término: DD/MM/AAAA às HH:MM`).
    - **Histórico de Acesso e Aulas Assistidas:**
      - Botão dedicado **"Histórico de Acesso"** em cada curso vinculado ao aluno.
      - Abre modal centralizado escuro translúcido com a listagem cronológica de todas as aulas concluídas pelo aluno naquele curso:
        - Título da aula e nome do módulo correspondente.
        - Mensagem explícita com data e horário completo: `Assistiu a aula completa em DD/MM/AAAA às HH:MM:SS`.
        - Endpoint da API: `GET /api/v1/students/{student_id}/courses/{course_id}/history`.
    - **Progresso Detalhado do Curso:** Quantidade exata de aulas assistidas vs total de aulas cadastradas (ex: `8 de 10 aulas`), barra de progresso visual colorida e porcentagem de conclusão.
    - **Até onde o aluno foi:** Exibe o título da última aula concluída pelo aluno naquele curso (ex: `Última aula concluída: Aula 8 - Trânsitos Planetários`).
    - Badge de status do curso: `Concluído` (100%), `Em Andamento` (> 0%) ou `Não Iniciado` (0%).
    - Controle de recolher/expandir a lista de cursos de cada aluno para manter a tela limpa e ágil.

- **Exportação e Importação de Alunos via Planilha (CSV e Excel):**
  - **Exportação:**
    - Localizado no cabeçalho do painel de alunos, com dropdown para escolher entre **Exportar CSV (`.csv`)** e **Exportar Excel (`.xlsx`)**.
    - Exporta todos os alunos cadastrados com os cursos aos quais têm acesso, validade de acesso, total de aulas, aulas concluídas, progresso percentual e última aula assistida.
    - O arquivo CSV é codificado com BOM UTF-8 (`utf-8-sig`) e delimitador `;`, garantindo abertura nativa perfeita com acentuação correta no Microsoft Excel no Windows.
  - **Importação:**
    - Botão **"Importar Alunos"** abre modal dedicado no padrão de design escuro translúcido com fechamento apenas via botão (sem fechar ao clicar fora).
    - Suporta upload de arquivos nos formatos **CSV (`.csv`)** e **Excel (`.xlsx`, `.xls`)**.
    - O sistema permite baixar planilhas modelo de exemplo (.csv e .xlsx) diretamente pelo modal para facilitar o preenchimento pelo administrador.
    - **Colunas Suportadas:** Aceita nomes de colunas em português ou inglês (`Nome/Name`, `Email/E-mail`, `Senha/Password`, `Cursos/Courses`, `Tempo de Acesso/Duration`).
    - **Associação de Cursos:** A coluna de cursos aceita IDs numéricos ou nomes/títulos dos cursos separados por vírgula ou ponto-e-vírgula.
    - **Cursos Padrão e Duração Padrão:** No modal, o administrador pode selecionar cursos padrão adicionais e o tempo de acesso padrão (`Vitalício`, `1 mês`, `3 meses`, `6 meses`, `1 ano`, `2 anos`, `3 anos`), que serão aplicados automaticamente caso a planilha não especifique ou para complementar os acessos.
    - **Senha Segura:** Se a senha não for fornecida na planilha, o sistema gera uma senha segura temporária para o aluno.
    - **Atualização Segura:** Se o e-mail do aluno já existir na plataforma, a conta é atualizada com os novos cursos e prazos sem duplicar o usuário nem sobrescrever a senha existente.
    - **Resumo do Processamento:** Ao concluir a importação, o modal exibe um resumo claro de alunos criados, atualizados e eventuais erros/avisos de linhas inválidas.

---

## 7. Módulo de Integrações e Webhooks (`/integrations`)
- **Localização na Barra Lateral:**
  - O botão **"Integrações"** fica localizado na categoria **Geral** da barra lateral, posicionado **logo abaixo de "Alunos"** e acima de "Configurações".
  - Visível exclusivamente para perfis com permissão de gestão: **`superadmin`** e **`admin`**.
- **Objetivo do Módulo:**
  - Permitir a conexão com ferramentas externas de automação (n8n, Zapier, Make, ActiveCampaign, CRMs, Webhooks proprietários) enviando notificações em tempo real através de requisições HTTP POST com payloads em JSON.
- **Eventos de Disparo Disponíveis:**
  - `course.progress.25`: Disparado quando o aluno atinge exatamente o marco de **25% de conclusão** de um curso.
  - `course.progress.50`: Disparado quando o aluno atinge exatamente o marco de **50% de conclusão** de um curso.
  - `course.progress.75`: Disparado quando o aluno atinge exatamente o marco de **75% de conclusão** de um curso.
  - `course.progress.100`: Disparado quando o aluno completa **100% das aulas** de um curso.
  - `lesson.completed`: Disparado individualmente a cada aula assistida/marcada como concluída.
  - `student.enrolled`: Disparado quando um novo aluno é matriculado ou recebe acesso a um produto.
  - `course.renewal.warning_7d`: Disparado **1 semana antes (7 dias)** de expirar o prazo de acesso do aluno ao curso, permitindo campanhas preventivas de renovação.
  - `course.renewal.expired`: Disparado quando termina o prazo do curso, enviando notificação com status explícito: **"Renovação do Curso"**.
- **Verificação Programada e Manual de Renovações:**
  - Endpoint `POST /api/v1/integrations/check-renewals` disponível para rotas cron/agendamentos periódicos e checagens manuais no painel.
  - **Frequência e Regra de Disparo (Verificação Diária):**
    - A checagem dos eventos `course.renewal.warning_7d` (aviso 7 dias antes) e `course.renewal.expired` (expiração com status "Renovação do Curso") deve ser realizada através de uma **verificação periódica diária** (rotina agendada uma vez ao dia).
    - Aplica-se apenas para alunos que estão efetivamente matriculados em cursos com prazo determinado.
    - Se um aluno for matriculado com prazo curto (ex: faltando menos de 7 dias para vencer), o sistema não dispara imediatamente no ato da matrícula, mantendo a cadência da verificação diária automática para evitar disparos descontextualizados no momento do onboarding.
- **Configuração do Webhook:**
  - **Nome:** Identificador legível da integração (ex: "Disparo n8n Marcos Alunos", "Zapier Parabéns 100%").
  - **URL de Destino:** Endpoint público seguro que receberá os payloads via método POST.
  - **Chave Secreta (Assinatura HMAC-SHA256):** Campo opcional onde o usuário pode definir um segredo compartilhado. Se preenchido, o sistema calcula a assinatura HMAC-SHA256 do corpo da requisição e envia no cabeçalho `X-Webhook-Signature: sha256=<hash>`, permitindo ao servidor receptor validar a autenticidade e integridade do webhook.
  - **Filtro de Curso:** O webhook pode escutar eventos de **"Todos os Cursos"** ou ser restrito a um **curso específico**.
  - **Seleção Flexível de Eventos:** Suporta marcar individualmente quaisquer combinações de eventos ou o botão de atalho "Selecionar Todos".
  - **Ativação:** Chave de ativação para habilitar ou pausar o envio de eventos sem precisar excluir a configuração.
- **Disparo Assíncrono e Resiliente:**
  - Todos os webhooks de progresso e conclusão de aula são despachados de forma assíncrona em background via `BackgroundTasks` do FastAPI no momento em que o aluno conclui uma aula (`POST /courses/{course_id}/lessons/{lesson_id}/progress`).
  - O cálculo de porcentagem avalia o progresso anterior vs o novo progresso após a conclusão da aula, garantindo que os webhooks dos marcos (25%, 50%, 75%, 100%) disparem no momento exato em que a barra atinge ou ultrapassa a meta.
  - O tempo de resposta para o aluno na interface não sofre atraso nem bloqueio durante a comunicação com servidores externos (timeout configurado de 10 segundos).
- **Histórico e Logs de Execução:**
  - Cada disparo é registrado na tabela `webhook_logs` com status HTTP retornado, tempo de execução em milissegundos (`execution_time_ms`), payload JSON enviado e corpo da resposta recebida.
  - O painel conta com modal de histórico detalhado acessível pelo botão "Logs", com pesquisa rápida e expansão do JSON enviado para auditoria e diagnóstico.
- **Teste Imediato pelo Painel:**
  - Cada webhook possui o botão **"Testar"**, permitindo enviar um payload mock instantâneo ao endpoint configurado e exibindo o status HTTP e retorno com toast feedback na tela.

---

## 8. Perguntas em Aberto e Histórico de Decisões
- [x] [RESOLVIDO] Como devem ser tratados os disparos do evento "Renovação do Curso (7 dias antes)" caso o aluno seja matriculado faltando menos de 7 dias para expirar? Deve disparar imediatamente no momento da matrícula ou apenas na verificação periódica do cron diário?
  - **Decisão do Dono do Projeto:** Deve ser uma verificação periódica diária e aplicada apenas para alunos que forem efetivamente matriculados (sem disparo forçado imediato no momento do cadastro do aluno, respeitando o ciclo da verificação diária).






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
- **Permissão de Visualização e Vitrine de Cursos:**
  - `superadmin` e `admin`: Têm visão completa e acesso irrestrito a todos os cursos cadastrados na plataforma.
  - `aluno`: Visualiza **todos** os cursos cadastrados e publicados na vitrine da Área de Membros (`/courses`), permitindo que conheça novos treinamentos disponíveis para compra.
    - **Cursos com Acesso Liberado:** O aluno visualiza o botão destacado **"Acessar Curso"** (`PlayCircle`) e pode navegar livremente por módulos e aulas.
    - **Cursos Não Adquiridos / Sem Acesso:** O card do curso exibe o selo **"Disponível para Compra"** com ícone de cadeado (`Lock`), overlay sobre a thumbnail da capa com correntes cruzadas estilizadas e cadeado central indicando **"Produto Fechado"**, além do botão único **"Ver Mais Informações"** (`ExternalLink`) na parte inferior do card.
    - **Redirecionamento:** Ao clicar em "Ver Mais Informações", o aluno é redirecionado em nova aba para a URL configurada no campo `sales_page_url` do curso. Se o curso não possuir URL cadastrada, o sistema exibe feedback amigável informando que a página estará disponível em breve.
    - **Segurança de Acesso:** O acesso direto ao conteúdo interno (`/courses/{id}`) de cursos não adquiridos permanece estritamente bloqueado (`HTTP 403`).
- **Criação e Edição de Cursos:**
  - O formulário conta com o campo **Link da Página de Vendas / Mais Informações (`sales_page_url`)** (opcional), permitindo que o administrador insira o endereço externo da landing page ou checkout do treinamento.
  - O modal de criar/editar curso **não** possui checkbox de "Curso publicado (visível para alunos)".
  - O campo **Descrição do Curso** conta com o componente [`ExpandableTextarea`](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Area%20de%20Membros%20-%20Alunos/frontend/src/components/common/ExpandableTextarea.jsx) com o botão destacado **"Tela Cheia"** (`Maximize2`), abrindo um **popup gigante no meio da tela** (`94vw × 86vh`) para digitação ampla, com contador dinâmico de palavras e caracteres, preservação de quebras de linha e fechamento via botão "Concluir Edição" ou tecla `Esc`.
  - A imagem de capa (Thumbnail) pode ser enviada diretamente do computador do usuário (upload) ou mantida via URL.
  - **Especificações recomendadas para a Thumbnail:**
    - Dimensões recomendadas: **1280 × 720 pixels** (Proporção widescreen 16:9).
    - Formatos aceitos: **JPG, PNG, WEBP**.
    - Tamanho máximo: **até 5 MB**.
- **Ordem de Posição e Exibição dos Cursos:**
  - Cada curso possui o campo numérico **Ordem de Posição / Exibição (`order_index`)** configurável no modal de criação e edição do curso.
  - A ordenação na plataforma (tanto para administradores quanto para alunos na vitrine) é crescente por ordem (`order_index ASC`), com desempate pelos mais recentes (`id DESC`). Cursos com números menores (ex: `1`, `2`, `3`) aparecem primeiro na lista e na vitrine. O valor padrão é `0`.
- **Paginação de Cursos:**
  - A listagem exibe no máximo **20 cursos por página**.
  - Abaixo da grade de cursos, há controles de navegação ("Anterior", "Próxima", contador de páginas e cursos exibidos).

---

## 2. Estrutura Interna do Curso (Módulos e Aulas)
- **Acesso ao Curso:**
  - Em cada card de curso, há a ação **"Acessar Curso"** (além do clique direto na capa/título), abrindo o ambiente de sala de aula (`CourseClassroom`).
- **Gestão de Módulos:**
  - Módulos organizam os tópicos do curso (Título, Descrição, Ordem).
  - O campo de Descrição possui botões de **"Tela Cheia"** (popup gigante) e **"Maximizar / Restaurar"** (`ExpandableTextarea`), permitindo expandir a área de digitação para textos extensos com facilidade.
  - **Geração de Título e Descrição do Módulo com IA baseada nas Transcrições das Aulas (`ModuleModal`):**
    - No modal de **"Editar Módulo"**, administradores e instrutores contam com o botão de destaque **"Gerar com IA"** (`Sparkles`) ao lado do campo "Título do Módulo *".
    - **Popup de Confirmação Obrigatório:** Ao clicar no botão, o sistema exibe um popup modal centralizado com backdrop preto translúcido (não fechável por clique externo) informando que a IA analisará as transcrições e conteúdos de todas as aulas daquele módulo para formular um título atrativo (preservando identificadores numéricos como 'Módulo 2') e uma descrição pedagógica didática de 2 a 3 parágrafos curtos.
    - Ao confirmar, o sistema aciona o endpoint `POST /courses/{course_id}/modules/{module_id}/generate-ai-overview`, preenche os campos do formulário no modal em tempo real e atualiza a interface, permitindo ao gestor revisar e salvar as alterações.
  - A exclusão de um módulo apaga em cascata todas as aulas associadas após confirmação em popup modal preto.
- **Gestão de Aulas (Lessons):**
  - Cada aula pertence a um módulo e contém:
    - **Nome/Título da Aula** (obrigatório).
    - **Descrição da Aula** (opcional, com botões de **"Tela Cheia"** com popup gigante e **"Maximizar / Restaurar"** para escrita confortável, renderizada abaixo do player com quebras de linha preservadas).
    - **Duração Estimada Automática (Formato Cronômetro Exato):** Especificada no formato cronômetro exato (ex: `15:30`, `25:40`, `01:10:20`). É calculada e preenchida **automaticamente**:
      - **No Cadastro/Edição da Aula:** Ao selecionar o arquivo de vídeo no computador, o sistema lê os metadados do vídeo no navegador em milissegundos e já preenche o campo "Duração Estimada" automaticamente no formato `MM:SS` ou `HH:MM:SS`.
      - **Na Importação em Lote:** O sistema calcula a duração de cada vídeo localmente e cadastra a aula já com a minutagem exata.
      - **Na Transcrição por IA:** O backend afere os segundos precisos via `ffprobe` e sincroniza `lesson.duration` no banco de dados.
      - **Geração Automática de Título e Descrição com IA na Conclusão da Transcrição:**
        - Assim que o processamento da transcrição por IA (Whisper) é finalizado em background, o sistema analisa a transcrição completa e gera **automaticamente** um título otimizado e atrativo (máximo de 65 caracteres) e uma descrição pedagógica envolvente de 2 a 3 parágrafos curtos.
        - Os dados gerados são salvos imediatamente nas colunas `title` e `description` da tabela `Lesson` e sincronizados nas faixas de vídeo correspondentes (`lesson_videos`), atualizando a interface em tempo real via eventos globais no frontend sem necessidade de intervenção manual do gestor.
      - **Geração Sob Demanda de Título e Descrição com IA na Visão Geral (`LessonOverviewTab`):**
        - Sempre que uma aula já possuir transcrição concluída, a aba **"Visão Geral"** exibe para administradores e instrutores o botão destacado **"Gerar Título e Descrição com IA"** (`Sparkles`), permitindo re-gerar o conteúdo pedagógico a qualquer momento.
        - **Popup de Confirmação Obrigatório:** Ao clicar no botão, o sistema abre um popup modal centralizado de confirmação com backdrop translúcido escuro (não fechável por clique externo) explicando que o título e a descrição atuais serão substituídos pelo conteúdo pedagógico gerado com base na transcrição. A geração só é iniciada após o clique em **"Sim, Gerar com IA"**, mantendo a opção segura de **"Cancelar"**.
        - Ao confirmar, o sistema aciona o GPT-4o-mini para re-gerar o título conciso e a descrição pedagógica envolvente, salvando imediatamente na tabela `Lesson` e atualizando o player e a visão geral em tempo real.
      - **Geração Sob Demanda de Título e Descrição com IA no Modal de Edição da Aula (`LessonModal`):**
        - No modal de edição de aula, na aba **"Dados Gerais"**, administradores e instrutores contam com o botão destacado **"Gerar com IA"** (`Sparkles`) no cabeçalho do campo "Título da Aula *".
        - **Popup de Confirmação Obrigatório:** Ao clicar no botão, o sistema abre o modal centralizado de confirmação com backdrop translúcido escuro (não fechável por clique externo) informando que a IA formulará um novo título atrativo e uma descrição pedagógica completa a partir da transcrição existente da aula.
        - Ao confirmar, o sistema aciona o endpoint `POST /courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/generate-metadata` e preenche imediatamente os campos "Título da Aula" e "Breve Resumo ou Descrição da Aula" no formulário em tempo real, permitindo que o gestor revise, complemente se desejar e salve as alterações com total flexibilidade.
      - **Upload em Segundo Plano no Backblaze B2 (Múltiplos Vídeos):** arquivos de vídeo MP4, WebM, MOV ou MKV de até **2 GB (2048 MB)** são enviados diretamente para a nuvem no bucket Backblaze B2 (`AreaDeMembros/videos/`) através de URLs pré-assinadas (S3 Presigned URLs). O envio ocorre em **segundo plano** gerenciado pelo `UploadQueueContext`, **sem nenhum modal bloqueante**. O usuário pode preencher e salvar a aula imediatamente, fechar o formulário, criar novas aulas e enviar múltiplos vídeos concorrentemente. Um painel flutuante discreto no canto inferior direito (`BackgroundUploadWidget`) exibe o progresso individual e permite cancelamento ou acompanhamento em tempo real.
      - **Importação em Lote de Aulas e Módulos via Pasta Local com IA Automática (`BatchCourseImportModal`):**
        - **Acesso:** Disponível na sala de aula (`CourseClassroom`) para administradores e instrutores através do botão em destaque **"Importar Pasta de Aulas"** (`FolderUp`).
        - **Leitura de Diretórios pelo Navegador:** Permite ao usuário selecionar uma pasta do seu computador contendo subpastas e arquivos de vídeo usando a API nativa de diretórios (`webkitdirectory`).
        - **Mapeamento Automático:**
          - Cada subpasta é mapeada como um **Módulo** do curso. Se já existir um módulo com o mesmo título cadastrado no curso, o sistema identifica como "Módulo Existente" e vincula as novas aulas a ele sem duplicar o módulo.
          - **Ordem de Exibição Manual e Automática do Módulo:** Cada card de módulo no modal exibe um campo numérico editável **"Ordem: [N]"** no cabeçalho. O sistema preenche inicialmente com o número extraído do título (ex: 'Módulo 2' -> `2`) ou com o `order_index` do módulo existente, permitindo que o administrador altere livremente o número antes de iniciar a importação. Na criação ou atualização, esse valor é persistido no banco de dados.
          - Cada arquivo de vídeo (`.mp4`, `.webm`, `.mov`, `.mkv`) é mapeado para uma **Aula**, com título limpo derivado do nome do arquivo e ordenação alfanumérica natural (`01`, `02`, `10`).
        - **Expansão Fluida e Rolagem Sem Bloqueios das Aulas:** As aulas de cada módulo expandido fluem naturalmente integradas à barra de rolagem principal do modal, permitindo visualizar todas as aulas (mesmo mais de 10 ou 13 aulas) sem scroll interno conflitante ou travamentos na rolagem.
        - **Desmarcação Flexível de Módulos e Aulas:** O modal apresenta a árvore hierárquica em acordeão com checkboxes individuais. O administrador pode desmarcar módulos inteiros ou aulas específicas que já foram importadas anteriormente ou que não deseja subir, além de contar com botões rápidos "Marcar Todas" e "Desmarcar Todas".
        - **Fila Sequencial e Disparo Imediato de IA:** Ao iniciar a importação:
          1. Cria ou reutiliza o Módulo no banco de dados.
          2. Gera a Presigned URL S3 e faz o upload direto do vídeo para o Backblaze B2 com acompanhamento de progresso de 0% a 100%. Em aulas com múltiplas faixas de idioma, realiza o upload de cada faixa e as cadastra vinculadas à aula.
          3. Cadastra a Aula no sistema vinculada ao vídeo e módulo (incluindo faixas de múltiplos idiomas quando presentes).
          4. **Disparo Imediato da IA na Aula:** Imediatamente após a criação da aula, aciona a transcrição por inteligência artificial (OpenAI Whisper + GPT-4o) para gerar a minutagem, capítulos e resumo inteligente em background.
          5. **Geração Automática de Título e Descrição do Módulo com IA:** Ao concluir o upload de todas as aulas selecionadas de um módulo, o sistema aciona automaticamente a IA (GPT-4o-mini) para analisar os títulos e resumos das aulas e gerar um título atrativo e profissional preservando o identificador numérico original (ex: `Módulo 01 - Fundamentos e Estrutura dos Signos`) e uma descrição didática completa de 2 a 3 parágrafos, atualizando o módulo no banco de dados em tempo real.
          6. Avança para o próximo módulo da fila de forma sequencial e resiliente.
        - **Suporte a Múltiplos Idiomas por Subpastas (Opção A):**
          - O sistema reconhece pastas estruturadas no padrão `Modulo 01/PT/01 - Introducao.mp4`, `Modulo 01/EN/01 - Introduction.mp4`, `Modulo 01/ES/01 - Introduccion.mp4`.
          - Os arquivos com o mesmo identificador/numeração de aula dentro de subpastas de idiomas (PT, EN, ES, FR, DE, IT) são unificados automaticamente em uma **única aula** contendo as faixas de vídeo correspondentes (`lesson_videos`).
          - O modal exibe badges com as bandeiras dos idiomas identificados (ex: `🇧🇷 🇺🇸 🇪🇸`) ao lado de cada aula, e realiza o upload sequencial de todas as faixas cadastradas.
        - **Upload e Replicação de Capas (Módulos e Aulas) na Importação em Lote:** O gestor pode anexar manualmente imagens de capa diretamente no modal de importação antes de iniciar o processo:
          - **Capa do Módulo:** Botão "+ Capa Módulo" no cabeçalho de cada módulo, permitindo escolher uma imagem do computador com pré-visualização miniatura e botão de remoção. Caso o módulo seja novo, é criado com `image_url`; caso já exista, a capa é atualizada na conclusão.
          - **Capa da Aula Individual:** Botão "+ Capa" ao lado do tamanho de cada aula, permitindo anexar imagens individuais que são enviadas para o Backblaze B2 (`AreaDeMembros/thumbnails/`) e associadas como `thumbnail_url` da respectiva aula.
          - **Replicação de Capa para Todas as Aulas (3 Formas Rápidas):**
            1. **Botão "Replicar p/ todas" na Linha da Aula:** Sempre que o usuário anexar uma capa em qualquer aula, surge imediatamente ao lado um botão destacado "Replicar p/ todas" (`Copy`). Ao clicar, essa imagem é copiada instantaneamente para todas as outras aulas de todos os módulos.
            2. **Botão "Capa p/ Aulas do Módulo" no Cabeçalho do Módulo:** Permite escolher 1 imagem de capa do computador e aplicá-la em lote especificamente para todas as aulas daquele módulo.
            3. **Botão "Capa p/ Todas as Aulas" na Barra Superior:** Permite escolher 1 imagem de capa do computador e aplicá-la em lote para todas as aulas de todos os módulos importados.
        - **Controle e UX:** Barra de progresso geral no topo, indicador de status por aula, botão para interromper a fila a qualquer momento, backdrop fixo não fechável por clique externo e recarregamento automático do curso ao concluir.
        - **Reinicialização do Estado ao Fechar e Reabrir:** Ao fechar o modal de Importação em Lote (seja pelo botão "X" superior ou "Fechar" inferior), todo o estado temporário do lote é resetado imediatamente (lista de módulos, aulas analisadas, capas vinculadas e seleção de arquivos). Ao reabrir o modal em "Importar Pasta de Aulas", ele sempre se inicia 100% limpo em seu estado inicial de Dropzone, garantindo que importações anteriores ou canceladas não persistam na interface.
        - **Interrupção Imediata do Upload em Lote:** Ao clicar em "Interromper Envio", qualquer requisição HTTP ativa para o storage (Presigned URL e XMLHttpRequest PUT no Backblaze B2) é abortada imediatamente no mesmo segundo (`xhr.abort()` e `AbortController.abort()`). O status da aula em progresso é restaurado com segurança para "Pronta para envio", liberando a interface instantaneamente sem aguardar o término de uploads de arquivos pesados.
        - **Reimportação e Retentativa de Aulas com Falha:**
          - **Botão Individual de Reimportação:** Ao ocorrer qualquer erro durante o upload ou criação da aula (exibindo `(!) Falha`), é renderizado imediatamente um botão `↺ Reimportar` ao lado do status da aula. Ao clicar, o sistema reinicia o processo especificamente para aquela aula de forma isolada e transparente.
          - **Botão de Reimportar Falhas do Módulo:** No cabeçalho de cada módulo com aulas pendentes de erro, surge o botão `↺ Reimportar Falhas`, permitindo reprocessar todas as aulas com falha daquele módulo com um único clique.
          - **Botão Geral de Reimportar Falhas no Rodapé:** Sempre que houver 1 ou mais aulas com falha em qualquer módulo, surge no rodapé do modal o botão destacado `↺ Reimportar Falhas (N)`. Ao clicar, todas as aulas falhadas têm o status resetado para pendente e a fila de processamento é retomada automaticamente, pulando com segurança as aulas já concluídas anteriormente e aproveitando o ID do módulo já criado para não gerar duplicatas.
        - **Enquadramento e Proporções de Capas de Módulos (Cards Netflix):**
          - **Proporção Ideal de Pôster:** Recomenda-se a proporção vertical **2:3 ou 3:4** (ex: `600×900px` ou `1080×1620px`), idêntica a pôsteres de filmes e séries da Netflix.
          - **Camadas Inteligentes de Apresentação:** Para suportar qualquer imagem enviada pelo usuário (mesmo artes quadradas 1:1 com mandalas circulares ou banners horizontais 16:9), os cards de módulos utilizam renderização em duas camadas:
            1. **Fundo Atmosférico (`Ambient Glow`):** Preenche o card com desfoque suave (`blur(16px) brightness(0.35)`) espelhando as cores da arte original, eliminando bordas pretas secas.
            2. **Pôster Contido em Alta Definição (`contain`):** Mantém a arte integralmente visível sem cortar textos, circunferências ou bordas laterais, eliminando completamente distorções e efeito de super zoom.
            3. **Degradê Cinematográfico:** Camada de gradiente escuro garantindo contraste e leitura nítida do identificador do módulo e contagem de aulas.
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
        - **Controle de Velocidade de Reprodução (Playback Rate):** O player conta com seletor dedicado de velocidade (`0.5x`, `0.75x`, `1x normal`, `1.25x`, `1.5x`, `1.75x`, `2x`) com menu popover translúcido, feedback com ícone de velocímetro (`Gauge`), indicador ativo e persistência automática da preferência do aluno no `localStorage` entre aulas e recarregamentos de página.
        - **Controles de Volume e Tela Cheia:** Ajuste fino de volume com slider, botão mute/unmute e alternância para tela cheia nativa.
      - **Thumbnails dos Cursos:** Capas enviadas por upload também são hospedadas no Backblaze B2 (`AreaDeMembros/thumbnails/`).
      - **Limpeza Automática:** Ao excluir um curso ou aula, as mídias vinculadas correspondentes são automaticamente deletadas do Backblaze B2.
      - **Link Externo / Embed:** Suporte mantido a links do YouTube, Vimeo, Panda Video ou URL externa.
      - **Suporte Multilíngue (Aulas em Múltiplos Idiomas):**
        - A mesma aula pode conter faixas de vídeo em múltiplos idiomas (ex: Português 🇧🇷, Inglês 🇺🇸, Espanhol 🇪🇸, Francês 🇫🇷, Alemão 🇩🇪, Italiano 🇮🇹, etc.).
        - **Nome Personalizado do Idioma (Rótulo):** O administrador pode alterar o nome exibido de cada idioma cadastrado (campo `language_label`, ex: "Português (Brasil)", "Inglês (UK)", "Espanhol Neutro", etc.). O nome editado reflete em tempo real nas abas de edição e nos botões de troca de idioma do player visualizados pelo aluno.
        - **Nome e Descrição da Aula por Idioma:** Além do vídeo, cada idioma cadastrado possui seu próprio **Nome da Aula** e **Descrição da Aula** específicos, permitindo que a interface se adapte completamente ao idioma selecionado pelo aluno.
          - **Campo de Descrição Maximizado com Tela Cheia:** O campo de descrição de cada faixa de idioma utiliza o componente `ExpandableTextarea` com altura padrão expandida (`rows={6}`, `minHeight="170px"`) e botão **"Tela Cheia"** (`Maximize2`), permitindo escrita e leitura amplas sem que o texto fique recolhido ou difícil de visualizar.
          - **Renderização Visual do Vídeo Anexado (`LessonVideoPreviewPlayer`):** Tanto em vídeos enviados do computador (Backblaze B2) quanto em links externos (YouTube/Vimeo), o sistema **NÃO** exibe links de texto brutos. Em vez disso, renderiza diretamente o player de vídeo interativo (16:9 widescreen) para que o gestor possa assistir, pausar e conferir a mídia na hora, com botão dedicado de remoção/troca.
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
    - **Aulas de Leitura e Artigo (`content_type == 'text'`):**
      - **Editor de Artigo (`LessonArticleEditor`):** No modal de criação e edição da aula, a aba "Texto do Artigo" conta com abas interativas ("Escrever Texto" vs "Pré-visualizar Artigo").
      - **Upload de Imagens no Artigo:** Botão dedicado "Enviar Imagem do PC" para envio de imagens (JPG, PNG, WEBP até 5 MB hospedadas no Backblaze B2) inserindo automaticamente a tag markdown `![Legenda](url)` na posição do cursor, além de botão "Link URL" para imagens externas.
      - **Atalhos Rápidos de Formatação:** Barra de ferramentas para inserção de Subtítulos (`## `), Negrito (`**texto**`), Itens de Lista (`- `) e divisores.
      - **Visualização Editorial (`LessonTextViewer`):** Renderiza o artigo com diagramação cinematográfica, imagens ilustrativas centralizadas com bordas suaves e legendas explicativas, além da barra completa de ações (`LessonActionToolbar`) com avaliação por estrelas, botão "Relatar Problema" e marcação de conclusão sincronizada com a API do backend.
    - **Aulas de Quiz Interativo (`content_type == 'quiz'`):**
      - **Porcentagem Mínima de Aprovação Configurável:** O administrador/instrutor pode definir a porcentagem de acertos exigida para que o aluno seja aprovado no quiz (coluna `passing_score_pct` na tabela `lessons`, padrão 70%, ajustável de 1% a 100%).
      - **Pontuação e Peso por Questão:** Cada pergunta possui seu próprio valor em pontos configurável (coluna `points` na tabela `quiz_questions`, inteiro >= 1, padrão 1 ponto). O editor exibe em tempo real a soma total de pontos do quiz.
      - **Cálculo Ponderado de Nota:** A nota final obtida é calculada proporcionalmente aos pontos das perguntas: `(pontos_obtidos / total_pontos) * 100`.
      - **Critério de Aprovação Automática:** Se o aluno atingir nota igual ou superior a `passing_score_pct`, a tentativa é aprovada (`passed = True`) e a aula é marcada automaticamente como concluída no progresso do curso. Caso contrário, a aula permanece não concluída e o aluno pode refazer o quiz.
      - **Segurança Antifraude:** O endpoint de consulta do quiz pelo aluno oculta o campo `is_correct` das opções, impossibilitando descobrir o gabarito via DevTools do navegador.
      - **Feedback Visual Claro:** O aluno visualiza os pontos de cada questão no card, a meta mínima no banner superior (`Aprovação com X%`) e, ao submeter, visualiza a pontuação obtida versus total de pontos (`X de Y pontos`), a nota percentual e o feedback de aprovação ou incentivo para refazer.
  - **Reprodutor de Vídeo Customizado (`CustomVideoPlayer` e `VideoControls`):**
    - **Feedback Imediato de Carregamento e Buffering:** O player oferece feedback visual instantâneo ao alternar entre aulas ou quando a rede oscila.
    - **Overlay Central Neon de Buffering:** Sempre que a transmissão precisa carregar dados na rede (`waiting`, `stalled`, `seeking`), o centro da tela exibe um painel elegante translúcido com spinner animado e mensagens claras ("Carregando vídeo... Baixando dados de transmissão, aguarde..."), eliminando a sensação de tela congelada.
    - **Barra de Buffer Visual na Timeline:** O trilho de progresso exibe uma barra de buffer translúcida (`video-buffered-bar`) à frente do tempo atual, permitindo acompanhar o carregamento contínuo dos pacotes de mídia.
    - **Streaming e Compatibilidade de Formatos:** O backend serve requisições de corte de intervalo (HTTP 206 Partial Content / Range requests) com `media_type` ajustado conforme a extensão (`.mp4`, `.mov`, `.webm`, `.mkv`), otimizando o fluxo de dados.
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
  - **Curtidas em Comentários e Respostas:**
    - Alunos e gestores podem curtir ou descurtir comentários raízes e respostas de aulas clicando no botão de coração (`Heart`).
    - Cada usuário pode registrar no máximo 1 curtida por comentário/resposta (chave única `uq_lesson_comment_like_user` na tabela `lesson_comment_likes`).
    - O botão exibe o contador total de curtidas e adquire destaque visual vermelho (`#ef4444`) quando curtido pelo próprio usuário logado (`liked_by_me`).
    - Quando um aluno curte o comentário de outro aluno, o sistema de gamificação bonifica o autor do comentário com pontos de engajamento comunitário.
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
        - **Coluna Direita (`ModuleTimelineSidebar`):** Exibe no topo o indicador circular `Meu Progresso - X% (X de Y aulas)` e, logo abaixo, a árvore vertical de módulos e aulas em formato de **Timeline** (cada módulo com seu anel de progresso; o módulo selecionado expande uma linha vertical conectora listando as aulas numeradas `1. ...`, `2. ...` com marcador dourado na aula ativa e verde nas aulas concluídas). Para títulos longos de aula, o card aplica limitação elegante de até **2 linhas com reticências (`line-clamp: 2`)** e exibe o título completo em **tooltip nativo ao passar o mouse (`title`)**, preservando o alinhamento e a harmonia visual da barra lateral sem cards desproporcionais.
  - **Imagem de Fundo / Capa das Aulas (`thumbnail_url` na tabela `lessons`):**
    - Além de servir como pôster do player de vídeo da aula, a miniatura da aula também é exibida na timeline e nos cards de aulas do módulo selecionado.
  - **Limpeza Automática no Backblaze B2:**
    - Ao substituir ou remover imagens de curso, banner hero, capa de módulo ou miniatura de aula (sempre com popup de confirmação centralizado), ou ao excluir o registro pai, os arquivos antigos correspondentes no Backblaze B2 são removidos automaticamente.

---

## 6. Acompanhamento de Alunos e Progresso (`/students`)
- **Localização na Barra Lateral:**
  - O botão **"Alunos"** fica localizado na categoria **Geral** da barra lateral, posicionado **logo abaixo de "Relatos de Aulas"** e acima de "Configurações".
  - Visível exclusivamente para perfis com permissão de gestão: **`superadmin`** e **`admin`**.
- **Listagem, Métricas e Filtros Avançados:**
  - O painel exibe no topo os contadores gerais: **Total de Alunos**, **Alunos Ativos** e **Progresso Médio Geral**.
  - **Barra de Busca e Filtros Avançados (`StudentFilterBar`):**
    - **Busca Textual:** Campo de pesquisa dinâmica por nome ou e-mail do aluno com botão de envio e botão de limpar busca.
    - **Filtro de Ordenação (`order_by`):**
      - `Mais recentes (Cadastro)` (padrão)
      - `🎯 Mais perto de terminar o curso`: ordena alunos pelo maior percentual de conclusão (`overall_progress_percent` decrescente).
      - `⏳ Quase precisando renovar`: prioriza alunos matriculados em cursos com menor número de dias restantes para expirar (`days_remaining`), seguidos por cursos expirados e, por último, acessos vitalícios.
      - `🔤 Ordem alfabética (A-Z)` e `🔤 Ordem alfabética (Z-A)`: ordenação alfabética pelo nome completo.
      - `Mais antigos (Cadastro)`
    - **Filtro por Curso (`course_id`):** Dropdown dinâmico com "Todos os Cursos" e todos os cursos cadastrados na plataforma, exibindo apenas alunos com matrícula ativa no curso selecionado.
    - **Filtro por Mês (`registration_month`):** Seletor de mês/ano (`YYYY-MM`) que filtra alunos cadastrados naquele mês específico segundo o fuso de Brasília.
    - **Filtro por Data Específica (`registration_date`):** Seletor de dia exato (`YYYY-MM-DD`) que filtra alunos cadastrados no dia civil selecionado.
    - **Ação Limpar Filtros:** Botão contextual que reseta todos os filtros e a ordenação com 1 clique.
  - **Paginação e Controle de Quantidade por Página:**
    - Exibe no máximo **20 alunos por vez** por padrão.
    - Conta com um dropdown seletor estilizado que permite alternar a exibição para **20, 50, 100 ou 200 alunos de uma única vez**.
    - Barra inferior permanente informando o intervalo exibido (ex: `Exibindo 1–20 de 45 alunos`), indicador de página (`Página 1 de 3`) e botões de navegação `Anterior` e `Próxima`.
- **Detalhes Exibidos por Aluno:**
  - **Identificação e Horário Oficial de Brasília:** Nome completo, e-mail, WhatsApp com link direto, badge de status (`Aluno Ativo` / `Inativo`), porcentagem geral de conclusão e a tag `Aluno desde: DD/MM/AAAA às HH:MM` **obrigatoriamente convertida e exibida no Horário Oficial de Brasília (`America/Sao_Paulo`)**.
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
      - Abre modal centralizado escuro translúcido (`StudentAccessHistoryModal`) com a listagem cronológica de todas as aulas concluídas pelo aluno naquele curso:
        - Título da aula e nome do módulo correspondente.
        - Mensagem explícita com data e horário completo: `Assistiu a aula completa em DD/MM/AAAA às HH:MM:SS`.
        - **Paginação de Aulas Concluídas:** Limite de **no máximo 20 aulas por página** (`PAGE_SIZE = 20`). Quando houver mais de 20 aulas, é exibida a barra de paginação com contador dinâmico (ex: `Exibindo 1–20 de 35 aulas concluídas`), indicador de página (`Página 1 de 2`) e botões `Anterior` e `Próxima`.
        - Endpoint da API: `GET /api/v1/students/{student_id}/courses/{course_id}/history`.
    - **Disparo Manual de Eventos de Webhook/Integração:**
      - Botão dedicado em tom âmbar **"Disparar Evento"** em cada curso do aluno, ao lado do botão de histórico.
      - Abre o modal de disparo manual (`StudentTriggerWebhookModal`), permitindo que administradores forcem o envio de qualquer um dos 8 eventos suportados para as ferramentas de automação vinculadas (n8n, ActiveCampaign, Make, etc.):
        - **Obrigatoriedade de Webhook Configurado:** Só é permitido disparar eventos se houver pelo menos uma integração de webhook ativa cadastrada para o curso (ou global). Se não houver nenhum webhook configurado, o modal exibe um alerta explicativo de bloqueio e desativa o botão de disparo.
        - **Seleção da Integração Configurada:** O modal apresenta o seletor **"Selecione a Integração Configurada"**, permitindo que o administrador escolha exatamente qual webhook cadastrado irá receber o disparo (ex: `🔗 Webhook N8N`, `🔗 Webhook Make`) ou opte por `⚡ Todas as Integrações Ativas`.
        - **Eventos Suportados:** `course.progress.25`, `course.progress.50`, `course.progress.75`, `course.progress.100`, `lesson.completed`, `student.enrolled`, `course.renewal.warning_7d`, `course.renewal.expired`.
        - Endpoint da API: `POST /api/v1/students/{student_id}/courses/{course_id}/trigger-webhook` com payload contendo `event` e `webhook_id` opcional para direcionamento exato.
        - Carrega métricas consolidadas em tempo real do aluno no curso e envia o payload assinado via HMAC SHA-256 para a integração selecionada, gravando o histórico completo na tabela `webhook_logs`.
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

## 8. Convites de Acesso e Cadastro de Alunos
- **Tempo de Validade do Convite:**
  - O administrador pode escolher o tempo para o link do convite expirar: `1 hora`, `6 horas`, `12 horas`, `24 horas (1 dia)`, `48 horas (2 dias)`, `7 dias` ou **`Indefinido (não expira)`** (`duration_hours = 0` ou `None`, com `expires_at = NULL` no banco de dados).
  - Links com prazo indefinido permanecem válidos permanentemente até serem utilizados pelo convidado ou excluídos pelo administrador.
  - Na tabela de convites gerados, o tempo restante é exibido como badge amigável `Não expira` (`Indefinido`).
- **Data e Horário de Criação (Horário Oficial de Brasília):**
  - Tanto na tabela de **"Convites Gerados"** (coluna **"CRIADO EM"**) quanto no modal de sucesso após gerar um convite, a data e o horário de criação são exibidos explicitamente no **Horário Oficial de Brasília** (`America/Sao_Paulo`), no formato amigável `DD/MM/AAAA às HH:MM` (ex: `01/10/2026 às 13:01`).
- **Número de WhatsApp / Telefone do Usuário:**
  - Na tela de cadastro via convite (`/register`), o preenchimento do **WhatsApp / Telefone é obrigatório** (`phone` com validação de formato e comprimento mínimo no backend e frontend).
  - **Seletor de Bandeira e DDI Internacional:**
    - O campo já vem configurado com a bandeira do **Brasil 🇧🇷 (`+55`)** como padrão pré-selecionado.
    - O usuário pode clicar no seletor para escolher qualquer outro país (Portugal 🇵🇹 `+351`, Estados Unidos 🇺🇸 `+1`, Angola 🇦🇴 `+244`, Moçambique 🇲🇿 `+258`, Espanha 🇪🇸 `+34`, Argentina 🇦🇷 `+54`, etc.), adaptando dinamicamente o DDI e a máscara de digitação.
    - O número completo persistido armazena o DDI com o número (ex: `+55 (11) 98765-4321` ou `+351 912345678`).
  - O número é persistido na coluna `phone` das tabelas `registration_verifications` e `users`.
  - No painel de acompanhamento de alunos (`/students`) e na tabela de **"Usuários Criados"** (`/users`), é exibida a coluna dedicada **WhatsApp** com link direto verde (`https://wa.me/...`) considerando automaticamente o DDI internacional ou fallback nacional para números legados, e traço (`—`) discreto caso o usuário não possua número cadastrado.
  - As exportações de alunos em CSV e Excel (XLSX) incluem a coluna dedicada **`WhatsApp/Telefone`**.

---

## 9. Perguntas em Aberto e Histórico de Decisões
- [x] [RESOLVIDO] Como devem ser tratados os disparos do evento "Renovação do Curso (7 dias antes)" caso o aluno seja matriculado faltando menos de 7 dias para expirar? Deve disparar imediatamente no momento da matrícula ou apenas na verificação periódica do cron diário?
  - **Decisão do Dono do Projeto:** Deve ser uma verificação periódica diária e aplicada apenas para alunos que forem efetivamente matriculados (sem disparo forçado imediato no momento do cadastro do aluno, respeitando o ciclo da verificação diária).
- [x] [RESOLVIDO] O tempo de expiração do convite pode ser indefinido? E o aluno pode informar o número de WhatsApp no cadastro?
  - **Decisão do Dono do Projeto:** Sim, o tempo de expiração pode ser indefinido (não expira).
- [x] [RESOLVIDO] O WhatsApp no cadastro deve ser obrigatório ou opcional? Como deve funcionar o DDI e bandeiras?
  - **Decisão do Dono do Projeto:** O WhatsApp é estritamente obrigatório. A bandeira do Brasil 🇧🇷 (+55) é o padrão inicial, e o usuário pode selecionar outras bandeiras para aplicar o DDI de outros países.
- [ ] [NOVO] No nó de Mensagem do Funil, quando o aluno receber botões interativos, o clique em cada botão deve ramificar para um nó específico do fluxo visual ou registrar uma tag/ação?
- [ ] [NOVO] Na execução de nós de Delay longos (ex: mais de 10 minutos), o funil deve persistir o agendamento no banco de dados para retomar após eventuais reinícios de servidor?
- [ ] [NOVO] Quando o aluno subir de nível de RPG (Level Up), o sistema deve disparar uma animação/modal comemorativo na tela com efeitos visuais ou apenas atualizar o badge silenciosamente?
- [ ] [NOVO] Os níveis mais altos do sistema de RPG (como Elo Diamante e Elo Lenda) devem conceder privilégios automáticos adicionais na plataforma (ex: selos diferenciados no chat da comunidade ou acesso a cursos/aulas especiais)?


---

## 10. Comunidade VIP, Suporte e Dúvidas dos Cursos
- **Acesso e Participação:**
  - Alunos e Instrutores/Admins podem publicar dúvidas técnicas vinculadas aos cursos aos quais têm acesso.
  - Alunos só podem publicar e interagir em dúvidas de cursos aos quais possuem acesso liberado.
- **Interações e Engajamento:**
  - **Curtidas (Likes):** Alunos e administradores podem curtir dúvidas de forma idempotente (`POST /api/v1/support/topics/{id}/like`). O card de dúvida exibe o coração preenchido e contador atualizado.
  - **Comentários e Respostas:** Clicar no botão de comentário ou no card abre o modal detalhado da discussão com histórico cronológico de respostas.
  - **Exclusão de Dúvidas e Respostas:**
    - O autor da publicação e os administradores (`superadmin`, `admin`) podem excluir dúvidas e respostas a qualquer momento.
    - Toda ação de exclusão exige confirmação explícita em popup modal com fundo escuro translúcido.
- **Status da Dúvida ("Aguardando Resposta" vs "Resolvida"):**
  - Novas dúvidas entram com status `open` ("Aguardando Resposta").
  - O autor da dúvida e administradores contam com botão dedicado no cabeçalho da dúvida para alternar o status entre `open` e `resolved` ("Marcar como Resolvida" / "Reabrir Dúvida").
- **Solução Oficial / Melhor Resposta:**
  - O autor da dúvida e administradores podem eleger uma resposta como **"Solução Oficial"** (`is_solution = true`).
  - A resposta eleita recebe destaque cinematográfico dourado (`border-gold`, badge `Solução Oficial` com estrela e botão ativo `Solução`).
  - Ao marcar uma resposta como solução oficial, a dúvida é automaticamente marcada como resolvida (`status = 'resolved'`).
- **Cards de Métricas e Pílulas de Filtros Rápidos:**
  - No topo da tela de suporte, são exibidas 4 métricas consolidadas em tempo real:
    - `Total de Dúvidas`
    - `Aguardando Resposta`
    - `Taxa de Resolução %`
    - `Membros Ativos`
  - Filtros rápidos em formato de pílulas permitem alternar dinamicamente entre: `Todas as Dúvidas`, `Fixadas por Mim`, `Mais Populares`, `Aguardando Resposta`, `Resolvidas` e `Minhas Dúvidas`.
- **Fixação Personalizada de Dúvidas de Suporte (Support Topic Pins):**
  - **Limite Máximo por Usuário:** Cada usuário (aluno, admin ou superadmin) pode fixar até no máximo **5 dúvidas** de suporte de sua preferência (`support_topic_pins`).
  - **Independência de Lista:** A fixação é estritamente pessoal e individual. As dúvidas que o Aluno A fixa não alteram a visualização dos outros alunos ou administradores.
  - **Bloqueio Amigável ao Exceder o Limite:** Ao tentar fixar uma 6ª dúvida, o sistema bloqueia a ação retornando HTTP 400 com a mensagem clara: *"Você atingiu o limite de 5 dúvidas fixadas. Desafixe uma dúvida para fixar outra."*, exibindo toast de erro no frontend.
  - **Destaque Visual no Topo:** Na listagem padrão de dúvidas, as dúvidas fixadas pelo usuário logado aparecem com destaque prioritário no topo, fundo escurecido sutil, borda ciano neon (`#38bdf8`) e badge distintivo `📌 Fixada por você`.
  - **Botão de Ação Rápida:** No card da dúvida, o botão de alfinete (`Pin`) permite alternar a fixação instantaneamente com um clique (toggle pin/unpin) com feedback via toast.
  - **Pílula de Acesso Rápido ("Fixadas por Mim"):** Permite consultar em um clique exclusivamente as dúvidas que o próprio usuário fixou.
- **Anexos e Visualização Lightbox:**
  - Dúvidas e respostas suportam anexo de imagens (PNG, JPG, WEBP de até 10 MB).
  - Clicar sobre qualquer imagem anexada abre o modal Lightbox de alta definição, centralizado e com fundo escuro de alto contraste.

---

## 11. Configurações da Plataforma (Aparência e Chaves de API)
- **Acesso:** Exclusivo para administradores e super administradores através da opção **"Configurações"** na barra lateral.
- **Estrutura em Abas:**
  - **Aba 1: "Aparência" (Cor de Fundo da Plataforma):**
    - Permite ao administrador personalizar a cor de fundo global da plataforma (Netflix Dark, Deep Navy, Obsidian, Slate, Emerald, ou qualquer cor hexadecimal customizada).
    - Presets visuais pré-definidos com clique rápido e preview instantâneo na tela.
    - Salvamento persistido nas preferências da plataforma.
  - **Aba 2: "Chaves de API" (Tokens de Acesso):**
    - **Finalidade:** Permite integrar a plataforma de membros com ferramentas externas (n8n, Make, Zapier, Webhooks de checkout, CRMs, etc.) sem expor credenciais de login.
    - **Formato das Chaves:** Padrão industrial com prefixo `sk_live_` gerado criptograficamente com 32 bytes de entropia (`sk_live_<hex>`).
    - **Tempo de Expiração Configurável:**
      - `30 dias`
      - `60 dias`
      - `90 dias`
      - `1 ano (365 dias)`
      - `Não expira (Permanente)`
    - **Exibição Única de Segurança:** A chave completa sem máscara (`raw_token`) é exibida **uma única vez** no momento de sua criação através de um popup modal de segurança com botão de cópia rápida. Após o fechamento do modal, a chave não pode ser recuperada, permanecendo no banco apenas seu hash/mascaramento.
    - **Gestão de Chaves:**
      - Listagem completa das chaves do usuário com nome descritivo, token mascarado (`sk_live_****...`), status de ativação, validade e data do último acesso (`last_used_at`).
      - **Pausar / Reativar (Toggle):** Possibilidade de pausar temporariamente uma chave sem precisar excluí-la, bloqueando requisições que a utilizem até que seja reativada.
      - **Revogação / Exclusão:** Possibilidade de revogar permanentemente uma chave de API com confirmação obrigatória em popup modal com fundo escuro translúcido.
    - **Autenticação no Backend:**
      - A autenticação de usuário nas rotas da API aceita tanto `Authorization: Bearer sk_live_...` quanto o header `X-API-Key: sk_live_...`, integrando-se de forma transparente com o `get_current_user`.
      - Atualização automática em background do campo `last_used_at` a cada requisição válida realizada com a chave.
      - Bloqueio imediato (`401 Unauthorized`) caso a chave esteja pausada ou expirada.

---

## 12. Estrutura de Navegação do Menu Lateral (Categorias)
- **Organização por Foco Operacional (Proposta 2):**
  - **Categoria "Gestão de Ensino" (ou "Meu Aprendizado" para alunos):**
    - `Cursos`: Ambiente de aulas, módulos e quizes (visível para Alunos e Administradores).
    - `Alunos`: Gestão de matrículas, acompanhamento de progresso e tempo de acesso (Admin/Super Admin).
    - `Suporte`: Fórum de dúvidas, respostas oficiais e suporte dos cursos (Alunos e Administradores).
    - `Relatos de Aulas`: Notificações e moderação de problemas relatados em aulas (Admin/Super Admin).
    - `Chat da Comunidade`: Ambiente de bate-papo em tempo real entre alunos, professores e administradores, posicionado logo abaixo de Relatos de Aulas (Alunos e Administradores).
  - **Categoria "Administração":**
    - `Integrações`: Webhooks e disparos para ferramentas externas (Admin/Super Admin).
    - `Configurações`: Aparência da plataforma e Chaves de API (Admin/Super Admin).
  - **Categoria "Segurança":**
    - `Backup Automático`, `Gerenciamento de logs` e `Gestão de Usuário` (restrito exclusivamente a Super Admin).

---

## 13. Experiência Mobile e Adaptação para Celulares (Smartphones)
- **Menu Lateral Retrátil (Drawer / Gaveta):**
  - Em telas com largura inferior ou igual a `768px`, a barra lateral deixa de ocupar espaço fixo dividindo a tela e passa a se comportar como um **Drawer deslizante**.
  - O drawer permanece recolhido fora da tela (`translateX(-100%)`) e desliza suavemente ao ser acionado.
  - Ao abrir o menu no celular, uma camada de fundo escurecida translúcida com desfoque (`sidebar-backdrop`) cobre a área externa.
  - O menu pode ser fechado tocando no botão `X` no topo do menu, tocando no backdrop escuro ou selecionando qualquer item da navegação (fechamento automático).
- **Cabeçalho Superior Mobile (`MobileHeader`):**
  - Em dispositivos móveis (`<= 768px`), uma barra superior exclusiva é exibida no topo contendo:
    - Botão hambúrguer interativo para abrir o menu lateral.
    - Logotipo e título oficial "Área de Membros".
    - Avatar com a inicial do usuário autenticado.
- **Sala de Aula e Player de Vídeo no Celular:**
  - O player de vídeo mantém a proporção `16:9` widescreen fluida sem corte lateral em qualquer tamanho de tela móvel.
  - Em telas menores que `900px`, a divisão em 2 colunas da sala de aula (conteúdo à esquerda e módulos/materiais à direita) se transforma em um layout empilhado de 1 coluna (`classroom-layout-grid`), garantindo que o vídeo e textos fiquem no topo em largura total e a lista de aulas/materiais logo abaixo.
- **Tabelas e Listagens no Celular:**
  - Tabelas com múltiplas colunas (Gestão de Alunos, Convites, Usuários, Backups, Relatos) contam com rolagem horizontal fluida por toque (`overflow-x: auto; -webkit-overflow-scrolling: touch;`), preservando a legibilidade dos dados sem espremer colunas nem estourar a largura da janela.

---

## 14. Chat da Comunidade e Bate-papo dos Alunos
- **Objetivo:** Proporcionar um espaço de interação, networking e troca de ideias diretamente dentro da plataforma, conectando alunos e instrutores.
- **Estrutura de Canais de Conversa:**
  - **Comunidade Geral (`channel_type == 'general'`):**
    - Canal global único aberto para todos os usuários com conta ativa (Alunos, Instrutores e Administradores).
    - Canal fixado em destaque na barra lateral do chat.
  - **Canais por Curso (`channel_type == 'course'`):**
    - Cada curso cadastrado possui seu canal dedicado exclusivo para os alunos matriculados.
    - **Regra de Visibilidade e Acesso:**
      - Alunos visualizam e enviam mensagens **apenas** nos canais dos cursos aos quais possuem acesso ativo (`UserCourse` não expirado). Tentativas de leitura ou envio para cursos não matriculados retornam `403 Forbidden`.
      - Instrutores e Administradores (`superadmin`, `admin`) têm acesso irrestrito a todos os canais para suporte e moderação.
- **Recursos da Interface e Experiência do Usuário:**
  - **Balões de Mensagem Estilizados:**
    - Identificação clara do remetente com avatar circular colorido contendo a inicial do usuário.
    - Badge do perfil do usuário: `Super Admin` (roxo neon), `Instrutor` (azul neon) e `Aluno` (esmeralda).
    - Horário formatado da mensagem (hora e minuto).
    - Diferenciação visual suave para mensagens enviadas pelo próprio usuário autenticado versus mensagens recebidas.
  - **Scroll Automático Inteligente:**
    - Rolagem suave até a última mensagem recebida ao carregar ou enviar novidades.
  - **Envio Rápido e Atalhos:**
    - Suporte a tecla `Enter` para envio imediato e `Shift + Enter` para pular linha.
    - Validação de mensagens vazias e limite de até 3.000 caracteres.
    - Estado de carregamento com spinner no botão de envio enquanto a mensagem é persistida.
  - **Experiência Imersiva em Tela Cheia (Fullscreen):**
    - Ao selecionar **Chat da Comunidade**, a barra lateral principal do sistema e o cabeçalho mobile são ocultados automaticamente, exatamente como na sala de aula dos cursos. O chat e sua listagem de canais preenchem 100% da viewport (`100vw × 100vh`).
    - Para alternar ou sair do chat, há botões destacados **"Voltar aos Cursos"** (`ArrowLeft`) tanto no topo da lista de canais (`ChatSidebar`) quanto nas ações do cabeçalho da conversa (`ChatHeader`).
  - **Sincronização Instantânea em Tempo Real via WebSocket (`/api/v1/chat/ws`):**
    - Conexão nativa e persistente via WebSocket com autenticação por token JWT.
    - Novas mensagens enviadas por qualquer aluno ou administrador são entregues instantaneamente na tela dos participantes conectados sem necessidade de recarregar a página ou aguardar polling.
    - Eventos de exclusão de mensagem, curtidas e mensagens fixadas/desafixadas também são transmitidos e refletidos em tempo real.
    - Mecanismo de Heartbeat (`ping/pong` a cada 25s) e reconexão automática com fallback de segurança.
  - **Curtir Mensagens do Chat:**
    - Alunos e gestores podem curtir e descurtir mensagens de texto ou mídia clicando no botão de coração (`Heart`).
    - Contador em tempo real do número de curtidas por mensagem com destaque vermelho para o usuário que curtiu (`liked_by_me`).
    - Cada usuário pode curtir apenas uma única vez por mensagem (tabela `chat_message_likes`).
    - Curtir mensagens de outros alunos gera bonificação de engajamento no sistema de gamificação.
  - **Favoritar Mensagens e Filtro de Favoritas:**
    - Botão de estrela (`Star`) em cada balão de mensagem para favoritar/desfavoritar (tabela `chat_message_favorites`).
    - Botão de alternância **"⭐ Favoritas"** no cabeçalho do chat (`ChatHeader`), permitindo filtrar instantaneamente o canal para exibir apenas as mensagens salvas pelo usuário autenticado.
  - **Fixar Mensagens no Topo do Chat (Pin) e Redirecionamento por Clique:**
    - Privilégio restrito a Administradores e Instrutores (`admin` e `superadmin`).
    - O gestor pode fixar ou desafixar mensagens importantes no canal (`is_pinned`, `pinned_at`, `pinned_by_user_id`).
    - Quando há uma mensagem fixada no canal, um banner superior estilizado em azul neon no cabeçalho (`chat-pinned-message-banner`) exibe o autor e o conteúdo da mensagem fixada, acompanhado de botão de desafixação rápida para gestores.
    - **Redirecionamento ao Clicar na Mensagem Fixada:** Ao clicar em qualquer parte do banner da mensagem fixada, o chat executa uma rolagem suave (`scrollIntoView({ behavior: 'smooth', block: 'center' })`) até a mensagem correspondente na conversa e ativa temporariamente uma animação de destaque luminoso em neon azul ciano (`chat-message-highlighted`) ao redor do balão, facilitando a localização visual imediata pelo usuário. O clique no botão de desafixação (`X`) possui `stopPropagation()` para não disparar a rolagem.
    - A mensagem também recebe o selo `📌 Fixada` nos seus metadados.
  - **Envio de Mídias no Chat (Imagens e Documentos):**
    - Botão de anexo (`Paperclip`) na barra de entrada (`ChatInputBar`) permitindo selecionar imagens (JPG, PNG, WEBP, GIF) ou documentos (PDF) de até 15 MB.
    - Suporte a upload em nuvem no Backblaze B2 (`AreaDeMembros/chat_media/`) com fallback em servidor local.
    - Miniatura de pré-visualização antes do envio com botão de remoção rápida.
    - Permite envio de mensagem de texto com mídia vinculada, ou somente a mídia isolada.
    - Imagens são renderizadas no chat com zoom ao clicar, e documentos em card seguro com link de abertura.
- **Moderação e Exclusão de Mensagens:**
  - O autor da mensagem pode excluir suas próprias mensagens a qualquer momento.
  - Instrutores e Administradores possuem privilégio de moderação, podendo excluir mensagens inadequadas de qualquer participante.
  - A exclusão exige confirmação explícita em popup modal escuro (`DeleteChatMessageModal`) que não fecha por clique fora e exibe feedback imediato via toast de sucesso.

---

## 15. Gestão de Perfil do Usuário e Identidade Visual (Configurações)
- **Localização:** Aba **"Meu Perfil"** dentro da tela de **Configurações da Área de Membros** (`PlatformSettings`).
- **Campos Disponíveis:**
  - **Foto / Logo de Perfil (`avatar_url`):**
    - Envio direto do computador com suporte a JPG, PNG e WEBP (até 5 MB) com upload para o Backblaze B2 (`AreaDeMembros/avatars/`) ou armazenamento local.
    - Pré-visualização instantânea em avatar arredondado com borda suave.
    - Botão de remoção rápida da foto.
    - Quando cadastrada, a foto substitui a inicial do usuário no rodapé da barra lateral (`Sidebar`) e em outros pontos da plataforma.
  - **Nome do Contato / Usuário (`name`).**
  - **E-mail de Acesso (`email`).**
  - **WhatsApp / Telefone de Contato (`phone`).**
  - **Segurança e Troca de Senha (`password`):**
    - Campos "Nova Senha" e "Confirmar Nova Senha" com alternância de visibilidade (`Eye/EyeOff`) e validação de requisitos (mínimo 12 caracteres, maiúscula, minúscula, número e símbolo especial).
- **Regra de Proteção do Super Admin:**
  - Por diretrizes de segurança da conta mestre do sistema, o **Super Administrador NÃO pode alterar seu nome, e-mail e senha por esta tela**.
  - Na interface, os campos de nome e e-mail aparecem desabilitados com ícone de cadeado (`Lock`) e um banner explicativo destacado. O bloco de senha exibe aviso de proteção da conta mestre.
  - No backend (`PATCH /api/v1/auth/me`), qualquer tentativa de submeter alterações de nome, e-mail ou senha para o `superadmin` é sumariamente rejeitada com `400 Bad Request`.
  - O Super Admin tem permissão total e irrestrita para **alterar a sua foto de perfil / logo** a qualquer momento.
- **Outros Perfis (Administradores / Instrutores):**
  - Possuem liberdade para editar nome, e-mail (com validação de unicidade), telefone, senha e foto de perfil normalmente.

---

## 16. Depoimentos e Avaliações dos Cursos (Testimonials & Reviews)
- **Localização:** Aba **"Depoimentos"** na barra lateral (`Sidebar`) sob a categoria **Gestão de Ensino** (para gestores) e **Meu Aprendizado** (para alunos).
- **Submissão de Depoimentos pelo Aluno:**
  - O aluno pode enviar depoimento exclusivamente para cursos aos quais possui **acesso ativo e liberado**. Cursos sem acesso ou expirados não permitem envio de avaliação (`HTTP 403`).
  - Cada aluno pode cadastrar **1 depoimento por curso**. Caso queira mudar sua opinião, pode editar seu depoimento existente a qualquer momento.
  - **Campos do Depoimento:**
    - **Seleção do Curso:** lista suspensa contendo apenas os cursos liberados para o aluno.
    - **Nota em Estrelas (1 a 5 ⭐):** seleção interativa de estrelas com destaque dourado.
    - **Título do Depoimento:** resumo ou manchete da avaliação (opcional, até 200 caracteres).
    - **Texto do Relato / Opinião:** descrição da experiência, aprendizado e resultados obtidos (mínimo 3 caracteres, até 5.000 caracteres com contador dinâmico).
- **Fluxo de Moderação pelo Administrador:**
  - Todo novo depoimento submetido ou editado por aluno entra automaticamente com status **"Aguardando Moderação" (`pending`)**.
  - Apenas depoimentos com status **"Aprovado" (`approved`)** são exibidos na vitrine pública para outros alunos e visitantes. O autor sempre consegue visualizar seu próprio depoimento para acompanhar o status.
  - Administradores e Super Admins contam com botões rápidos de ação:
    - **Aprovar (`approved`):** torna o depoimento visível para a comunidade.
    - **Rejeitar (`rejected`):** reprova o depoimento mantendo arquivado internamente.
    - **Destacar (`is_featured`):** fixa o depoimento com selo de destaque dourado e posiciona no topo da listagem.
- **Exclusão de Depoimentos:**
  - O próprio aluno autor pode excluir seu depoimento a qualquer momento.
  - Administradores podem excluir qualquer depoimento inapropriado.
  - Exclusão exige confirmação em modal escuro centralizado com aviso e feedback por toast.

---

## 17. Gamificação e Ranking dos Alunos (Leaderboard & Points)
- **Localização:** Aba **"Ranking & Conquistas"** (`Trophy`) na barra lateral (`Sidebar`) em página inteira dedicada.
- **Participação Exclusiva de Alunos:**
  - Apenas usuários com o perfil **`Aluno` (`aluno`)** acumulam pontos e disputam as posições do pódio e da tabela de classificação.
  - Administradores e instrutores não entram na disputa do ranking para garantir competição justa entre os alunos.
- **Tabela de Pontuação por Ações Meritórias:**
  - **Melhor Solução no Suporte (`support_solution`):** **+50 pontos**. Atribuído quando a resposta do aluno a uma dúvida de colega for marcada como Solução Oficial pelo autor da dúvida ou instrutor.
  - **Conclusão de Aula (`lesson_completed`):** **+15 pontos**. Atribuído ao assistir e concluir uma aula de qualquer curso (pontuação única por aula).
  - **Resposta a Dúvida no Suporte (`support_reply`):** **+10 pontos**. Atribuído ao responder e ajudar colegas de curso no fórum de suporte.
  - **Curtida Recebida no Suporte (`support_like`):** **+5 pontos**. Atribuído ao receber curtidas da comunidade em tópicos e dúvidas.
  - **Comentário Construtivo em Aula (`lesson_comment`):** **+5 pontos**. Atribuído ao comentar e debater nas aulas.
  - **Mensagem no Chat da Comunidade (`chat_message`):** **+2 pontos** por mensagem, com **limite diário de até 10 mensagens pontuadas por dia (máximo de 20 pontos/dia)** para estimular conversas saudáveis e evitar flood/spam.
- **Períodos de Classificação e Histórico de Campeões:**
  - **Ranking Mensal (Ao Vivo):** reinicia a pontuação a cada mês (ex: Outubro/2026), premiando os alunos mais ativos e engajados do período atual.
  - **Histórico Geral (All-Time):** histórico acumulado de todos os tempos.
  - **Meses Anteriores (Top 10 Encerrado):** histórico congelado dos meses que já foram finalizados (ex: Setembro/2026, Agosto/2026). O mês corrente é bloqueado dessa aba até seu encerramento total.
  - **Anos Anteriores (Top 10 Encerrado):** histórico congelado dos anos civis concluídos (ex: 2025, 2024). O ano em curso nunca é listado nessa aba até ser concluído.
  - **Corte Estrito no Top 10:** Tanto para meses finalizados quanto para anos finalizados, o sistema exibe estritamente os **10 primeiros alunos com maior pontuação** acumulada no período correspondente.
  - **Insígnias Comemorativas de Período Fechado:**
    - 🥇 1º Lugar: *"Campeão do Mês"* ou *"Campeão do Ano"*.
    - 🥈 2º Lugar: *"Vice do Mês"* ou *"Vice do Ano"*.
    - 🥉 3º Lugar: *"3º Lugar do Mês"* ou *"3º Lugar do Ano"*.
    - Top 4 ao 10: *"Top 10 do Mês"* ou *"Top 10 do Ano"*.
- **Pódio e Insígnias:**
  - **🥇 1º Lugar:** Pódio Ouro com a insígnia *"Mestre da Comunidade"*.
  - **🥈 2º Lugar:** Pódio Prata com a insígnia *"Mentor Destaque"*.
  - **🥉 3º Lugar:** Pódio Bronze com a insígnia *"Aluno Notável"*.
  - **Top 4 ao 10:** Insígnia *"Top Estudante"*.
  - **Demais Alunos:** Insígnia *"Aluno Ativo"*.
- **Histórico de Conquistas no Card do Aluno (`/students`):**
  - No card de cada aluno na Gestão de Alunos, é exibido o badge destacado com o total de pontos (`🏆 X pts`), o badge de Nível RPG (`🛡️ Nv. X • Patente`) com barra de XP integrada e o botão **"Pontos & Conquistas"**.
  - O modal (`StudentGamificationHistoryModal`) exibe a pontuação total, o rank do aluno, a insígnia conquistada, o card consolidado do Nível RPG com barra de progresso detalhada e botão para visualização da Escada Completa de 20 Níveis.

### 17.1. Sistema de Níveis RPG (20 Níveis Progressivos com Elos e Patentes)
- **Estrutura dos 20 Níveis:**
  - Divididos em **5 Elos temáticos** com 4 divisões cada (exceto o nível máximo que é coroado como Lenda Suprema):
    1. **Elo Bronze (Níveis 1 ao 4):**
       - **Nível 1 (Bronze I):** 0 pts (ponto de partida de todo aluno).
       - **Nível 2 (Bronze II):** 25 pts (primeiras aulas concluídas).
       - **Nível 3 (Bronze III):** 60 pts.
       - **Nível 4 (Bronze IV):** 110 pts.
    2. **Elo Prata (Níveis 5 ao 8):**
       - **Nível 5 (Prata I):** 180 pts.
       - **Nível 6 (Prata II):** 270 pts.
       - **Nível 7 (Prata III):** 380 pts.
       - **Nível 8 (Prata IV):** 510 pts.
    3. **Elo Ouro (Níveis 9 ao 12):**
       - **Nível 9 (Ouro I):** 660 pts.
       - **Nível 10 (Ouro II):** 840 pts.
       - **Nível 11 (Ouro III):** 1.050 pts.
       - **Nível 12 (Ouro IV):** 1.300 pts.
    4. **Elo Diamante (Níveis 13 ao 16):**
       - **Nível 13 (Diamante I):** 1.600 pts.
       - **Nível 14 (Diamante II):** 1.950 pts.
       - **Nível 15 (Diamante III):** 2.350 pts.
       - **Nível 16 (Diamante IV):** 2.800 pts.
    5. **Elo Lenda (Níveis 17 ao 20):**
       - **Nível 17 (Lenda I):** 3.300 pts.
       - **Nível 18 (Lenda II):** 3.850 pts.
       - **Nível 19 (Lenda III):** 4.450 pts.
       - **Nível 20 (Lenda Suprema):** 5.000 pts (**Nível Máximo** com indicador MAX e 100% de maestria).
- **Curva Progressiva de Desafio (RPG):**
  - Cada nível exige um montante adicional de pontos maior que o nível anterior (ex: +25, +35, +50, +70 ... até +600 nos elos mais altos), tornando a ascensão mais desafiadora e prestigiosa.
- **Visualização e Componentes da Interface:**
  - **Card do Aluno (`StudentCard`):** Exibe o badge de nível estilizado com a cor oficial do Elo (Bronze, Prata, Ouro, Diamante ou Lenda), mini barra de XP e tooltip explicativo.
  - **Visão Geral no Modal (`StudentRpgLevelOverviewCard`):** Card em destaque com escudo do elo, nome da patente, barra animada de progresso no nível atual, pontos faltantes para o próximo nível e atalho "Ver 20 Níveis".
  - **Escada Completa de 20 Níveis (`GamificationRpgLadderModal`):** Popup modal escuro (`rgba(0,0,0,0.85)`) agrupado por elos, destacando visualmente o nível atual do aluno e marcando com check verde os níveis já conquistados.
  - **Tabela de Classificação do Ranking (`RankingTable`):** Exibe o badge de nível RPG de cada aluno na listagem do ranking.
  - **Modal de Histórico de Pontos do Aluno (`StudentGamificationHistoryModal`):** Apresenta métricas consolidadas e a linha do tempo cronológica com paginação de **20 pontuações por página** (`HistoryPaginationBar`), permitindo navegar com facilidade entre as conquistas sem sobrecarregar a interface.
---

## 18. Transcrição de Vídeos e Resumo Inteligente com IA (OpenAI Whisper & GPT)
- **Localização:** Aba **"Transcrição & Resumo IA"** (`Sparkles`) no player da aula (`LessonPlayer`).
- **Mecânica de Processamento:**
  - Extração de áudio otimizada via FFmpeg compacto em MP3 mono 16kHz a 48kbps, garantindo que mesmo aulas de até 1 hora fiquem abaixo do limite de 25 MB da API OpenAI Whisper.
  - Transcrição textual completa através do modelo `whisper-1`.
  - Análise pedagógica e geração de Resumo Executivo, Principais Pontos (Key Takeaways) e Documento HTML5 autônomo via `gpt-4o-mini`.
- **Geração e Edição Automática do Título da Aula por IA:**
  - A partir da transcrição textual completa do vídeo gerada pelo Whisper, o modelo `gpt-4o-mini` analisa o assunto central e gera um título conciso, profissional e pedagógico para a aula (`generated_lesson_title`, máx. 60–70 caracteres, sem prefixos ou aspas).
  - O sistema salva e substitui automaticamente o título da aula no banco de dados (`lesson.title`) ao finalizar a transcrição.
  - No frontend, o evento `lesson-title-updated` atualiza em tempo real o cabeçalho da aula ativa no player e a lista/linha do tempo de aulas na barra lateral (`CourseClassroom`), sem exigir recarregamento manual da página pelo usuário.
- **Documento HTML Inteligente:**
  - Documento HTML5 completo com tipografia moderna, seções pedagógicas bem definidas e estilos de impressão `@media print` para quem desejar imprimir ou salvar como PDF.
  - Acessível diretamente pelo botão **"Abrir Documento HTML"** via endpoint com streaming nativo (`GET /api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/transcription/html`).
  - **Autenticação em Nova Aba:** O endpoint suporta autenticação tanto via header `Authorization: Bearer <token>` quanto via query parameter `?token=<jwt_token>`. Isso permite que o navegador abra a nova aba diretamente sem ser bloqueado com erro 401.
- **Controle de Acesso e Custos de API (Exclusivo Administradores e Super Admins):**
  - O acionamento da transcrição/re-geração é **restrito a Administradores e Super Admins** (`require_admin_or_superadmin`), evitando gastos desnecessários de API por alunos.
  - Ao clicar no botão **"Re-gerar"**, o sistema abre obrigatoriamente um **popup modal centralizado de confirmação** (`ConfirmRetriggerAiModal`) com backdrop escuro translúcido, explicando que a ação reprocessará o áudio da aula na IA, evitando cliques acidentais e cobranças desnecessárias de tokens.
  - Uma vez processado, o material gerado é persistido na tabela `lesson_transcriptions` e fica permanentemente disponível para todos os alunos matriculados no curso.
  - **Métricas e Custos em Reais (BRL):** O sistema calcula os custos oficiais cobrados pela OpenAI com base na duração do áudio (`$0.006/min` no Whisper-1) e no consumo exato de tokens do GPT-4o-mini (`$0.15/1M` prompt tokens e `$0.60/1M` completion tokens), convertidos para reais com base na taxa `OPENAI_USD_BRL_RATE` (padrão `5.50`).
  - **Confidencialidade Rigorosa de Custos:** Os dados de custo em reais (`estimated_cost_brl`, `estimated_cost_formatted`) e tokens consumidos são enviados pela API e exibidos na interface (badge `💰 Custo: R$ X,XX`) **exclusivamente para Administradores e Super Admins**. Para o perfil `aluno`, o backend omite esses campos (retornando `null`) e a interface oculta qualquer indicação de custo.
- **Exibição Seletiva entre Perfis (Aluno vs Gestor):**
  - **Transcrição Integral e Busca no Texto:** O card com a **Transcrição Integral** completa do vídeo e o campo de pesquisa em tempo real, além do botão de "Copiar Texto" da transcrição integral, são exibidos **exclusivamente para Administradores e Super Admins**. No backend, o campo `full_transcript` é omitido (`""`) para requisições de alunos.
  - **Experiência do Aluno:** Alunos visualizam uma interface limpa e focada no aprendizado, com os **Principais Pontos da Aula (Key Takeaways)**, a **Minutagem dos Capítulos** e o **Resumo da Aula** sintetizado.
- **Recursos da Interface:**
  - Busca em tempo real na transcrição com destaque de trechos filtrados (Admin e Super Admin).
  - Botão de cópia rápida com feedback visual e toast (Admin e Super Admin).
  - Botão de re-gerar protegido por modal central de confirmação (Admin e Super Admin).
  - Badge de custo em reais na barra de ações (visível apenas para gestores).
- **Edição de Capítulos e Minutagens por Administradores e Super Admins:**
  - **Permissão de Edição:** Administradores e Super Admins possuem permissão para editar os capítulos e minutagens gerados pela IA (`PUT /courses/{c_id}/modules/{m_id}/lessons/{l_id}/transcription/chapters`), permitindo corrigir erros ortográficos ou palavras transcritas incorretamente pelo modelo (ex: termos técnicos ou neologismos), ajustar tempos e adicionar/remover tópicos da minutagem.
  - **Interface de Edição:** No card de Capítulos (`LessonChaptersCard`), é exibido o botão **"Editar Capítulos"** (`Pencil`) exclusivamente para gestores. Ao clicar, o sistema abre o modal centralizado (`EditLessonChaptersModal`) com backdrop escuro translúcido (não fechável por clique externo).
  - **Sincronização em Tempo Real:** Ao salvar as alterações, os novos capítulos são persistidos no banco de dados, a interface da aba atualiza imediatamente e o evento `video-chapters-loaded` é disparado, sincronizando os marcadores do player de vídeo sem requerer recarregamento da página.
  - **Restrição de Alunos:** O perfil `aluno` visualiza os capítulos apenas em modo de leitura/navegação com seek interativo, sem botões de edição ou acesso ao endpoint (retornando `HTTP 403 Forbidden` caso tente submeter alterações).

---

## 19. Organização da Navegação e Menu Lateral (Proposta 2: 3 Categorias Modernas)
- A barra lateral (`Sidebar`) agrupa as funcionalidades da plataforma em **3 categorias elegantes e compactas**:
  1. 🎓 **Área Pedagógica** (exibida como **Meu Aprendizado** para o Aluno):
     - **Cursos** (`courses`): Catálogo e sala de aula (Todos).
     - **Alunos** (`students`): Gestão de alunos e matrículas (Admin/Super Admin).
     - **Suporte** (`support`): Central de suporte e tira-dúvidas (Todos).
     - **Relatos de Aulas** (`lesson-reports`): Problemas técnicos reportados com contadores e badge numérico (Todos). Alunos visualizam a listagem geral em modo somente leitura (sem botões de resolução ou exclusão), enquanto gestores (Admin e Super Admin) realizam a moderação completa.
  2. 🚀 **Comunidade & Social**:
     - **Chat da Comunidade** (`chat`): Canais de bate-papo em tempo real com suporte a mídias, curtidas e mensagens fixadas (Todos).
     - **Ranking & Conquistas** (`ranking`): Gamificação, pódio e pontuação dos alunos (Todos).
     - **Depoimentos** (`testimonials`): Avaliações em estrelas e relatos aprovados sobre os cursos (Todos).
  3. ⚙️ **Sistema & Configurações**:
     - **Configurações** (`settings`):
       - **Alunos:** Visualizam exclusivamente as abas **"Cor de Fundo da Plataforma"** e **"Meu Perfil"**, permitindo customizar seu visual e dados de cadastro/avatar. As abas "Tokens de API" e "Links da Plataforma" ficam ocultas.
       - **Admin e Super Admin:** Visualizam as 4 abas completas (**"Cor de Fundo da Plataforma"**, **"Meu Perfil"**, **"Tokens de API"** e **"Links da Plataforma"**).
     - **Integrações** (`integrations`): Webhooks de checkout Kiwify/Hotmart (Admin/Super Admin).
     - **Gestão de Usuários** (`users`): Gestão de administradores e convites (Super Admin).
     - **Backup Automático** (`backup`): Snapshots de banco e uploads em nuvem Backblaze B2 (Super Admin).
     - **Logs do Sistema** (`logs`): Auditoria de eventos do servidor (Super Admin).

  4. 🔗 **Links (Parte Inferior da Barra Lateral)**:
     - Localizada na base do menu de navegação lateral (logo acima do card de perfil do usuário), exibe os links cadastrados e ativos de redes sociais e páginas externas importantes.
     - Abre cada link em uma nova aba com segurança (`target="_blank" rel="noopener noreferrer"`).
     - Visível para todos os perfis (Alunos, Administradores e Super Admins).

---

## 20. Gestão de Links da Plataforma e Redes Sociais
- **Localização:** Aba **"Links da Plataforma"** (`Link2`) dentro de **Configurações** (`/settings`), acessível exclusivamente por Administradores e Super Admins.
- **Campos do Link:**
  - **Título:** Rótulo descritivo exibido na barra lateral (ex: "Instagram Oficial", "Canal do YouTube").
  - **URL de Destino:** Link externo completo iniciado com `https://` ou `http://` (com botão de teste rápido em nova aba).
  - **Ícone:** Seletor com ícones pré-definidos estilizados com cores oficiais (Instagram, YouTube, WhatsApp, Telegram, Website/Globo, Twitter/X, Facebook, LinkedIn, Discord, GitHub, Link Genérico).
  - **Ordem de Exibição:** Número inteiro ordenando a lista (menor número aparece primeiro no menu).
  - **Status Ativo/Oculto:** Permite ativar ou ocultar o link da barra lateral a qualquer momento sem precisar deletá-lo.
- **Confirmação de Exclusão:** Modal com backdrop preto translúcido protetor, sem fechamento ao clicar fora e apenas 1 botão de cancelar além do botão de confirmação.
- **Sincronização em Tempo Real:** Toda alteração de link dispara atualização instantânea na barra lateral através do evento `platform_links_updated`.

---

## 21. Backup Automático e Sincronização em Nuvem (PostgreSQL & Backblaze B2)
- **Localização:** Aba **"Backup Automático"** (`Database`) na categoria **Sistema & Configurações** da barra lateral, de acesso exclusivo para **Super Admin**.
- **Exibição Obrigatória no Horário Oficial de Brasília (`America/Sao_Paulo`):**
  - **Cards de Métricas:**
    - O card de **"Último Backup"** deve exibir a data e hora em que o backup foi gerado estritamente no **Horário Oficial de Brasília** no formato `DD/MM/AAAA, HH:MM` (ex: `05/10/2026, 17:27`), sincronizado com o timestamp contido no nome do arquivo físico (`teste_2026_10_05_17_27_47.dump.gz`).
    - O card de **"Próximo Backup"** deve exibir o horário da próxima execução agendada convertido para o Horário de Brasília. Caso o agendamento esteja ativo e o horário anterior já tenha passado, o sistema recalcula dinamicamente para o próximo ciclo futuro relativo ao momento atual.
  - **Tabela de Backups (Coluna "CRIADO EM"):**
    - Todas as linhas da listagem de backups no S3/B2 exibem o momento da criação no Horário de Brasília completo com segundos: `DD/MM/AAAA, HH:MM:SS` (ex: `05/10/2026, 17:27:47`).
- **Nomenclatura Padrão dos Arquivos:**
  - O nome gerado inclui o timestamp no fuso de Brasília (`YYYY_MM_DD_HH_MM_SS`), permitindo auditoria visual imediata do momento exato do dump.

---

## 22. Chat da Comunidade — Galeria de Mídias e Gravação de Áudio
- **Botão de Acesso à Galeria de Mídias:**
  - Localizado no cabeçalho do chat (`ChatHeader`), diretamente ao lado do botão de filtro de favoritas (`⭐ Favoritas`).
  - Rótulo: **"Mídias & Arquivos"** com ícone de pasta (`FolderOpen`).
  - Ao clicar, abre o modal de galeria de mídias (`ChatMediaGalleryModal`).
- **Modal de Galeria de Mídias:**
  - **Padrão de Popups:** Centralizado na tela, com painel backdrop preto translúcido escuro (`rgba(0, 0, 0, 0.85)`), bloqueio de fechamento ao clicar fora (fechamento forçado apenas via botão `X`) e 1 único botão de fechar no cabeçalho.
  - **Abas de Filtro:**
    - `Todas` (`all`): Exibe todas as mídias trocadas no canal.
    - `Fotos` (`image`): Apenas imagens (JPG, PNG, WEBP, GIF).
    - `Vídeos` (`video`): Vídeos MP4, WebM, MOV, MKV com miniatura e botão de play.
    - `Áudios` (`audio`): Áudios gravados e enviados com reprodução nativa.
    - `Documentos` (`file`): PDFs, planilhas, arquivos compactados e documentos de texto com ícone e botão de download/visualização.
  - **Ação "Ver no Chat":** Em cada item da galeria, há um botão de sobreposição "Ver no Chat". Ao clicar, o modal se fecha automaticamente e a lista de mensagens do chat realiza um scroll suave até a mensagem original com highlight luminoso de destaque.
- **Gravação e Envio de Áudio Nativo:**
  - O usuário pode gravar áudios diretamente pelo botão de microfone (`Mic`) no rodapé do chat (`ChatInputBar`).
  - Utiliza `MediaRecorder` nativo do navegador (`audio/webm`).
  - Exibe timer de gravação dinâmico com indicador vermelho pulsante e botões para "Descartar" ou "Enviar".
  - O áudio é transmitido e hospedado com segurança e renderizado com player interativo no histórico do canal.
- **Upload Ampliado de Arquivos:**
  - O seletor de anexos aceita imagens, vídeos, áudios e documentos de até 25 MB por arquivo.

---

## 23. Botão e Dropdown de Favoritos no Cabeçalho Superior Global (TopNavbar)
- **Localização:**
  - Posicionado na barra superior fixa global da plataforma (`TopNavbar`), acessível a partir de qualquer tela (Cursos, Suporte, Chat, Ranking, Depoimentos, Configurações).
  - Componente: botão estilizado com borda translúcida, ícone de marcador (`Bookmark`) em destaque ciano/azul e rótulo **"Favoritos"**.
  - **Badge Numérico Dinâmico:** Exibe um contador em formato pílula com o total consolidado de itens favoritados pelo usuário ativo. O badge é ocultado automaticamente se a contagem for zero e atualizado em tempo real via evento customizado de broadcast `window.dispatchEvent(new CustomEvent('favorites_updated'))`.
- **Dropdown de Favoritos (`FavoritesDropdown`):**
  - **Menu Flutuante / Suspenso:** Abre abaixo do botão com alinhamento à direita, cantos arredondados, fundo escuro profundo (`#0f172a`), bordas sutis e efeito glassmorphism com sombra pronunciada.
  - **Abas Organizadoras:**
    1. **Dúvidas:** Lista os tópicos de suporte favoritados pelo aluno/administrador. Exibe título da dúvida, status e autor.
    2. **Aulas:** Lista as aulas marcadas como favoritas pelo aluno. Exibe título da aula, nome do curso e duração estimada.
    3. **Comentários:** Lista os comentários de aulas favoritados pelo usuário. Exibe o comentário, autor e aula de origem.
    4. **Mensagens:** Lista as mensagens favoritadas no Chat da Comunidade. Exibe autor e trecho da mensagem.
  - **Contadores por Aba:** Cada aba exibe um badge numérico discreto com a quantidade de itens favoritados naquele tipo.
  - **Navegação Direta:**
    - Ao clicar em um tópico de dúvida favoritado, o sistema navega automaticamente para a aba de Suporte e abre o tópico.
    - Ao clicar em uma aula favoritada, o sistema navega diretamente para a sala de aula correspondente.
    - Ao clicar em um comentário favoritado, o sistema navega para a aula e centraliza a visualização no comentário.
    - Ao clicar em uma mensagem favoritada, o sistema navega para o Chat da Comunidade.
  - **Remoção Rápida:** Cada card na listagem possui botão `X` discreto para desfavoritar o item diretamente de dentro do menu, com sincronização imediata nos contadores.
  - **Mecanismos de Favoritar no Sistema:**
    - **Aulas:** Botão "Favoritar / Favoritada" (`Bookmark`) na barra de ações inferior da aula (`LessonActionToolbar`).
    - **Comentários de Aulas:** Botão de marcador (`Bookmark`) em cada item de comentário (`CommentItem`).
    - **Dúvidas do Suporte:** Botão de favoritar tópico na visualização de detalhes do suporte.
    - **Mensagens do Chat:** Ação de favoritar mensagem no menu de ações da mensagem.
  - **Estrutura de Banco de Dados:**
    - Tabelas dedicadas `lesson_favorites` (chave primária composta `lesson_id + user_id`) e `lesson_comment_favorites` (chave primária composta `comment_id + user_id`), com exclusão em cascata ao remover a aula/comentário ou usuário.

---

## 24. Central de Notificações no TopNavbar (Menções e Threads)
- **Localização:**
  - Botão de sino (`Bell`) posicionado na barra superior fixa global da plataforma (`TopNavbar`), ao lado dos botões de Favoritos e DMs.
  - **Badge Numérico de Alerta:** Exibe contador em formato pílula na cor de destaque laranja (`#f97316`) com o total de notificações não lidas (`unreadNotifCount`). Suporta indicação `99+` se exceder 99.
  - **Sincronização em Tempo Real:** Atualizado via polling e evento customizado global `window.dispatchEvent(new CustomEvent('notifications_updated'))`.
- **Modal de Notificações (`NotificationsModal`):**
  - **Padrão de Popups:** Centralizado na tela com backdrop preto translúcido (`rgba(0, 0, 0, 0.75)`), efeito glassmorphism, bloqueio total de scroll no fundo (`overflow: hidden` no `document.body`) e portal renderizado via `createPortal(..., document.body)` para escapar de qualquer `backdrop-filter` ou hierarquia do layout.
  - **Abas Organizadoras:**
    1. **Caixa de entrada (`inbox`):** Reúne todas as notificações não lidas (menções `@` e novas respostas dentro das threads do usuário).
    2. **Menções (`mentions`):** Filtra todas as menções diretas com `@` recebidas pelo usuário logado no chat.
    3. **Seguindo / Threads (`threads`):** Filtra as respostas enviadas por outros usuários dentro das threads iniciadas pelo usuário ativo.
    4. **Todas (`all`):** Histórico completo de notificações (lidas e não lidas).
  - **Ações Rápidas:**
    - **Marcar lidas:** Botão no cabeçalho para marcar todas as menções e threads como lidas de uma só vez (`/api/v1/chat/notifications/mark-all-read`).
    - **Marcar individual:** Ação direta em cada card para marcar aquela notificação específica como lida.
    - **Navegação Direta:** Ao clicar no card da notificação, a notificação é marcada como lida e o usuário é redirecionado para a aba do Chat da Comunidade.

---

## 25. Sistema de Etiquetas (Tags) de Alunos e Disparo em Massa de Mensagens Diretas (DMs)
- **Permissões de Acesso:**
  - Exclusivo para perfis com nível administrativo (**Super Admin** e **Admin**).
  - Alunos regulares não possuem permissão para criar, editar ou excluir tags, nem para disparar mensagens em massa.
- **Localização na Interface:**
  - Botões destacados **"Etiquetas"** (`Tag`) e **"Disparo em Massa"** (`Send`) posicionados na barra de ações superior da tela de **Gestão de Alunos** (`StudentManagement`).
  - Cada card de aluno (`StudentCard`) exibe as badges das etiquetas atribuídas e um botão rápido `+ Tag` para atribuir ou remover tags individualmente.
- **Sistema de Gestão de Etiquetas (`StudentTagsModal` & `StudentAssignTagsModal`):**
  - Permite criar novas etiquetas informando nome e selecionando cor com paleta rápida ou seletor hexadecimal.
  - Exibe a contagem em tempo real de quantos alunos estão associados a cada etiqueta.
  - Permite editar nome e cor das etiquetas existentes.
  - **Popup Obrigatório de Confirmação de Exclusão (`StudentTagDeleteConfirmModal`):**
    - Ao clicar no botão de lixeira de qualquer etiqueta, o sistema obrigatoriamente abre um popup centralizado de confirmação com backdrop preto translúcido protetor (`rgba(0, 0, 0, 0.85)`).
    - O popup não fecha ao clicar fora e possui apenas 1 botão de cancelar além do botão de confirmação ("Sim, Excluir").
    - Exibe com clareza o nome da etiqueta em sua cor oficial e alerta ao administrador que a exclusão removerá a tag de todos os alunos associados, preservando integralmente o cadastro e o acesso dos alunos à plataforma.
  - Modal de atribuição individual com busca rápida e seleção de múltiplas etiquetas simultâneas.
- **Segmentação de Público para Disparo em Massa (`ChatBroadcastModal`):**
  - **Público-alvo:**
    1. **Todos os Alunos:** Disparo global para todos os alunos ativos da plataforma.
    2. **Por Curso Específico:** Filtra apenas os alunos matriculados no curso selecionado.
    3. **Sem Cursos:** Filtra exclusivamente alunos/leads cadastrados que ainda não possuem matrícula em nenhum curso ativo.
    4. **Por Etiqueta:** Dispara exclusivamente para os alunos vinculados à etiqueta escolhida.
    5. **Por Recência de Entrada:** Filtra alunos com base na data de criação da conta (`created_at`) nos **últimos 7 dias**, **últimos 14 dias** ou **últimos 30 dias**, ideal para onboardings, boas-vindas e ofertas para novos alunos.
    6. **Seleção Manual:** Permite selecionar alunos específicos diretamente na interface.
  - **Botão de Ação Interativo (CTA) na Mensagem:**
    - O administrador pode configurar opcionalmente um botão de ação destacado junto ao comunicado (`button_text`, `button_url`, `button_action_type`).
    - **Ações Suportadas:**
      - **Link Externo (URL):** Checkouts de venda Kiwify/Hotmart, links de convite para grupos de WhatsApp/Telegram, páginas externas, etc. (abertura em nova aba com `target="_blank"`).
      - **Navegação Interna:** Abrir curso ou aula específica da plataforma (`action_type: 'course'` ou `'lesson'`).
    - **Renderização Visual:** O botão é renderizado diretamente dentro do balão da conversa privada do aluno (`ChatMessageItem` e `ChatDmConversationView`) com estilo neon/gradiente destacado e pré-visualização ao vivo no modal de envio.
  - **Filtro de Perfil:**
    - Opção de enviar **"Apenas Alunos"** ou incluir administradores (**"Alunos + Administradores"**).
  - **Estimativa Prévia em Tempo Real:**
    - Antes do disparo, o sistema consulta a API (`/api/v1/chat/broadcast/estimate`) e apresenta um card com a quantidade exata de destinatários únicos elegíveis e o tempo estimado de duração do envio com delay de 1s por aluno.
  - **Diálogo de Confirmação:**
    - Apresenta resumo completo (público, total de alunos, prévia da mensagem e tempo estimado) antes do envio definitivo.
- **Taxa de Vazão e Processamento em Segundo Plano:**
  - **Delay Estrito:** O processamento aplica um intervalo obrigatório de **1 segundo** (`await asyncio.sleep(1)`) entre cada mensagem enviada, garantindo estabilidade e evitando sobrecarga no servidor e nos sockets.
  - **Execução Assíncrona:** O disparo é delegado para `BackgroundTasks` da FastAPI, retornando resposta imediata para a interface do administrador enquanto as mensagens são entregues em segundo plano.
  - **Integração Nativa com o Chat:** Cada mensagem é registrada individualmente na tabela `chat_messages` com `is_dm=True`, remetente do administrador e destinatário do aluno, emitindo o evento WebSocket `new_dm` para atualizar instantaneamente o chat e o badge do aluno.
- **Histórico de Disparos e Rastreamento de Leitura (`ChatBroadcastHistoryModal`):**
  - Acesso através do botão **"Histórico"** no modal de disparo em massa.
  - **Métricas Consolidadas por Campanha:**
    - Título/assunto da campanha e autor do disparo.
    - Total de destinatários, enviados com sucesso e eventuais falhas.
    - Taxa percentual de visualização/leitura (`% lidos`).
    - Duração total da execução (em segundos ou minutos).
    - Data e hora do disparo formatadas no Horário Oficial de Brasília.
  - **Detalhamento de Destinatários (`ChatBroadcastCampaignDetailView`):**
    - Listagem individual de todos os alunos que receberam a mensagem.
    - Barra de busca por nome ou e-mail e filtros rápidos (Todos, Apenas Lidos, Não Lidos).
    - Status de entrega individual (`sent` ou `failed`).
    - **Rastreamento de Visualização Preciso:**
      - Exibe badge verde com o momento exato da leitura: `Visualizado em DD/MM/AAAA às HH:MM` (gravado na abertura da conversa pelo aluno via `read_at`).
      - Exibe badge cinza `Não lido ainda` para alunos que ainda não abriram a DM.
  - **Paginação Padrão de 20 Itens por Página (`HistoryPaginationBar`):**
    - Tanto a lista principal de campanhas de disparos (`ChatBroadcastHistoryModal`) quanto a listagem de destinatários da campanha (`ChatBroadcastCampaignDetailView`) exibem exatamente **20 itens por página**.
    - Barra de paginação responsiva com contador dinâmico (`Exibindo X–Y de Z itens`), botões de navegação "Anterior" / "Próxima" e botões numéricos com destaque na página ativa.

---

## 26. Sincronização em Tempo Real via WebSocket dos Badges do TopNavbar (Favoritos, DMs e Notificações)
- **Conexão Global Contínua:** Mantida ativamente em segundo plano pelo hook `useTopNavbarSocket` conectado a `/api/v1/chat/ws?token=...` em qualquer aba da plataforma (Cursos, Sala de Aula, Suporte, Chat, Ranking, Configurações, Gestão de Alunos, etc.), com reconexão automática e heartbeat ping (`ping`/`pong`).
- **Eventos em Tempo Real:**
  1. **Favoritos (`favorites_updated`):** Disparado instantaneamente pelo backend via `chat_manager.send_to_user_sync` ao alternar favoritos em aulas, comentários de aulas, tópicos de suporte ou mensagens do chat. O badge de Favoritos recalcula imediatamente seu total sem precisar atualizar a página.
  2. **Mensagens Diretas / DMs (`new_dm`, `dm_read`, `dm_sent`):** Disparado ao receber novas DMs (incluindo disparos em massa) ou ao marcar conversas como lidas. O badge vermelho de DMs é atualizado na hora em tempo real para os destinatários online.
  3. **Notificações / Sininho (`new_notification`, `notifications_updated`):** Disparado em tempo real ao ser mencionado (`@nome`) em qualquer mensagem de canal ou ao receber novas respostas nas threads iniciadas pelo usuário ativo. O badge laranja do sino é atualizado instantaneamente.
- **Isolamento e Segurança de Usuário:** Os eventos direcionados são enviados estritamente para as conexões ativas do usuário destinatário via `chat_manager.send_to_user_sync(user_id, ...)`, impedindo vazamento de dados entre clientes conectados.

---

## 27. Sistema de Funis de Mensagens e Fluxos Visuais (Funnels)
- **Localização:** Item de navegação **"Funis de Mensagens"** (`GitBranch`) na barra lateral (`Sidebar`) sob a categoria **Comunidade & Social**, acessível por Administradores e Super Admins.
- **Estrutura e Conceito:**
  - Permite aos administradores criar e gerenciar fluxos automatizados de mensagens com nós encadeados em um canvas interativo.
  - **4 Nós Básicos Oficiais:**
    1. **Nó de Texto (`message`):** Envia mensagem privada (DM) para o aluno com suporte a tags dinâmicas `{aluno}`, variações Spintax (ex: `{Olá|Oi|E aí}`) sorteadas a cada execução, e até 3 botões de ação interativos.
    2. **Nó de Mídia (`media`):** Envia imagens, vídeos ou documentos via URL direta com legenda opcional e suporte a Spintax.
    3. **Nó de Áudio (`audio`):** Envia mensagens de áudio (MP3/WebM) com opção de simular gravação de voz na hora.
    4. **Nó de Delay / Espera (`delay`):** Aplica uma pausa temporizada em segundos (`seconds`) antes de avançar para o próximo nó do fluxo.
  - **Canvas Visual Interativo (`FunnelCanvasPage`):**
    - Grid pontilhado Dark/Neon, suporte a movimentação/arrasto (pan), controles de zoom (+, -, reset), arrasto fluido de nós e desenho de conexões em curvas Bezier estéticas entre os nós.
    - Barra de ferramentas com edição de título do funil, salvamento instantâneo, exportação em JSON e exclusão com modal de confirmação.
    - **Menu Flutuante "+ Adicionar Nó" (`FunnelNodeMenu`):**
      - Ao ser acionado pelo botão inferior central da tela, posiciona-se automaticamente **acima do botão** (`bottom: 80px`), garantindo que todas as opções fiquem visíveis sem cortar na borda da tela.
      - Ao ser acionado com clique do mouse no canvas, inverte sua abertura para cima (`translateY(-100%)`) caso a posição do cursor esteja próxima do limite inferior da tela.
- **Disparo e Execução (`FunnelService`):**
  - **Gatilho via Botão de Disparo em Massa:** No modal de envio de mensagens em massa (`ChatBroadcastModal`), o administrador pode configurar um botão de ação com o tipo `"Disparar Funil" (`funnel`)` selecionando o funil desejado.
  - **Acionamento na DM do Aluno:** Quando o aluno recebe o comunicado na conversa privada (DM) e clica no botão, o frontend dispara a execução imediata através do endpoint `POST /api/v1/funnels/{funnel_id}/trigger`, iniciando a sequência de nós configurada no funil para aquele aluno em segundo plano com entrega instantânea via WebSocket e registro no histórico de execuções (`FunnelExecution`).

---

## 28. Integração com AgentFlow (Base de Conhecimento e Robô de Dúvidas)
- **Vínculo Curso ➔ Base de Conhecimento:**
  - No modal de Criação e Edição de Cursos (`CourseFormModal`), o gestor pode selecionar a qual **Base de Conhecimento do AgentFlow** o curso estará associado.
  - **Design do Seletor (`AgentFlowKbSelector`):**
    - Componente dropdown customizado com design Dark Glassmorphism, ícone temático e iluminação neon índigo (`#818cf8`).
    - **Exibição Limpa:** O dropdown e os itens da lista exibem **estritamente o nome da base** (ex: `Base - Tarcira`), sem textos extensos ou descrições no item.
    - **Feedback de Sincronização:** Quando uma base é selecionada, o componente exibe um badge sutil confirmando que as transcrições das aulas serão enviadas para aquela base.
    - **Criação Rápida no Modal (`AgentFlowCreateKbModal`):** O botão "+ Criar Nova Base" permite cadastrar uma nova base no AgentFlow sem sair da tela do curso.
- **Sincronização e Re-sincronização de Aulas (`AgentFlowLessonSync`):**
  - Na aba de Transcrição / IA da aula (`LessonAiTranscriptionTab`), o gestor visualiza o status de sincronização com o AgentFlow.
  - **Popup Centralizado de Confirmação:** Ao clicar no botão **"Re-sincronizar"**, o sistema obrigatoriamente abre um popup modal centralizado com fundo escuro translúcido (*backdrop blur*, não fechável por clique externo), solicitando confirmação explícita antes de re-enviar os trechos, perguntas, respostas e resumos para o AgentFlow, evitando reprocessamentos acidentais.
  - **Popup Bloqueante de Progresso em Tempo Real (`AgentFlowSyncProgressModal`):** Durante toda a execução da sincronização (seja inicial ou re-sincronização), é exibido obrigatoriamente um popup centralizado bloqueante na tela com animação de progresso, etapas dinâmicas de processamento e alerta explícito de segurança orientando o usuário a não sair da tela até a conclusão definitiva do envio.
  - **Fatiamento Inteligente com Overlay Contextual (*Contextual Chunking*):**
    - **Overlay de Contexto:** Cada trecho salvo na base de conhecimento do AgentFlow recebe obrigatoriamente no corpo do texto um cabeçalho explícito: `[Contexto da Aula: Curso: "{curso}" | Módulo: "{modulo}" | Aula: "{aula}"]`. Isso garante que as buscas semânticas vetoriais no RAG recuperem trechos que já contenham o contexto completo da origem.
    - **Overlap Real sem Quebra de Palavras:** Os trechos possuem tamanho máximo de ~1.100 caracteres com overlap de ~180 caracteres, quebrando estritamente em finais de frase (`. `, `! `, `? `) ou fronteiras de palavras (` `), impedindo cortes no meio de palavras (como "deal" em vez de "ideal").
    - **Envio Unificado de Perguntas & Respostas:** O backend gera perguntas e respostas didáticas formuladas com base no conteúdo da aula com variações de dúvidas de alunos (`question_variations`), enviando simultaneamente as P&R didáticas, os trechos contextuais e os resumos oficiais da aula e do módulo.












# Roadmap de Melhorias da Área de Membros

Este documento consolida as oportunidades de expansão, melhorias pedagógicas, segurança de conteúdo e engajamento para a plataforma, excluindo fluxos de automação externa, WhatsApp e funis.

---

## Sumário Executivo

| Módulo / Frente | Objetivo Principal | Impacto |
| :--- | :--- | :--- |
| **1. Certificados de Conclusão** | Emissão oficial de PDF com QR Code de validação pública | 🌟 Alto (Valor Percebido) |
| **2. Proteção Anti-Pirataria (DRM)** | Marca d'água dinâmica e flutuante sobre o player de vídeo | 🔒 Alto (Segurança de Conteúdo) |
| **3. Liberação Programada (Drip)** | Bloqueio de módulos por dias após a matrícula | 🛡️ Alto (Redução de Reembolsos) |
| **4. Gamificação & Celebração RPG** | Modal de Level Up com efeitos visuais e badges de prestígio | 🚀 Alto (Retenção e Dopamina) |
| **5. Aulas Bônus por Elo** | Recompensas pedagógicas exclusivas para alunos mais dedicados | 🏆 Médio-Alto (Engajamento) |
| **6. Quizzes com Nota Mínima** | Fixação de conteúdo obrigatória para desbloqueio de aulas | 📚 Médio (Qualidade Pedagógica) |
| **7. Aplicativo Web (PWA)** | Instalação no celular (Android/iOS) em tela cheia | 📱 Alto (Acessibilidade Mobile) |
| **8. Refinamentos do Player e Sala** | Atalhos de teclado e persistência de velocidade de reprodução | ⚡ Médio (Experiência do Aluno) |

---

## 1. 🎓 Certificados de Conclusão de Curso (PDF + QR Code) [CONCLUÍDO ✅]

### Descrição da Funcionalidade
Permitir que o aluno emita e faça o download de um Certificado de Conclusão oficial em PDF ao atingir 100% de conclusão de todas as aulas de um curso.

### Requisitos Funcionais:
- [x] **Gatilho de Conclusão:** O botão *"Emitir Certificado"* é desbloqueado no topo do curso apenas quando a barra de progresso atinge 100%.
- [x] **Geração de PDF no Backend:** Renderização de PDF via biblioteca Python (ex: `ReportLab` ou `WeasyPrint`), gerando um design profissional, limpo e escuro/ouro ou clássico.
- [x] **Dados Contidos no Certificado:**
  - Nome completo do aluno;
  - Nome do curso concluído;
  - Carga horária estimada em horas;
  - Data e hora de conclusão (horário oficial de Brasília);
  - Assinatura digital / nome do instrutor;
  - Código único e irrepetível de autenticidade (ex: `CERT-2026-X8F9A2`);
  - QR Code impresso no canto inferior direito.
- [x] **Página Pública de Validação:**
  - Rota pública `/validar-certificado/{codigo}` que qualquer pessoa ou empresa pode consultar pelo celular apontando para o QR Code, exibindo o status de autenticidade emitido pela plataforma.
- [x] **Gestão pelo Administrador:**
  - Na edição do curso, campo para definir a carga horária (ex: *40 horas*) e modelo de assinatura.

---

## 2. 🔒 Proteção Anti-Pirataria (Marca d'Água Dinâmica no Player) [CONCLUÍDO ✅]

### Descrição da Funcionalidade
Exibir uma marca d'água flutuante, translúcida e intermitente sobre o vídeo durante a reprodução para inibir e rastrear gravações de tela (screen recording) não autorizadas.

### Requisitos Funcionais:
- [ ] **Identificação Única:** A marca d'água exibe o e-mail ou o nome e documento do aluno autenticado.
- [ ] **Comportamento Intermitente e Aleatório:**
  - Não fica estática no mesmo canto da tela (o que facilitaria ser coberta por tarjas).
  - A cada 15 a 30 segundos, a marca d'água muda suavemente de posição na tela (canto superior, inferior, centro-direito, etc.) com opacidade sutil (15% a 25%), legível o suficiente para identificar a origem sem prejudicar a experiência visual.
- [ ] **Bloqueio de Menu de Contexto no Vídeo:** Desativar clique direito sobre o player para dificultar o download direto de streams de vídeo.
- [ ] **Ativação por Curso:** O gestor pode ligar/desligar a marca d'água nas configurações do curso ou da plataforma.

---

## 3. ⏳ Liberação Programada de Módulos (Drip Content)

### Descrição da Funcionalidade
Permitir que módulos de um curso sejam liberados gradualmente para o aluno, protegendo o infoproduto contra compras que consomem todo o material e pedem reembolso nos primeiros 7 dias.

### Requisitos Funcionais:
- [x] **Tipos de Liberação:**
  - **Imediata:** Módulo liberado no momento da matrícula (padrão atual).
  - **Por Dias após a Matrícula:** Módulo liberado X dias após a ativação do aluno (ex: *Módulo Avançado liberado após 8 dias*).
  - **Por Data Específica:** Módulo liberado em uma data/hora exata (ideal para turmas ao vivo ou lançamentos).
- [x] **Interface do Aluno:**
  - O card do módulo bloqueado exibe um selo informativo: *"Disponível em X dias (DD/MM/AAAA)"* com ícone de calendário/relógio e barra desativada.
- [x] **Proteção no Backend:** O endpoint de listagem e de aulas retorna `is_locked: true` para impedir requisições manuais antes do prazo.

---

## 4. 🎮 Gamificação: Celebração Visual de "Level Up" no RPG [CONCLUÍDO ✅]

### Descrição da Funcionalidade
Gerar uma experiência comemorativa de alto impacto visual e dopamina quando o aluno atinge os pontos de XP necessários para subir de nível ou Elo (ex: de Bronze para Prata, Ouro, Platina, Diamante ou Lenda).

### Requisitos Funcionais:
- [x] **Modal de Conquista com Efeitos:**
  - Disparar um popup comemorativo em tela cheia com animação de partículas/confetes neon, som sutil de vitória (com opção de mutar) e o novo brasão/elo em destaque.
  - Mensagem personalizada: *"Parabéns, [Nome]! Você alcançou o Elo Ouro!"*.
  - Exibição de pontos acumulados e novos privilégios conquistados.
- [x] **Badges e Molduras no Chat da Comunidade:**
  - Ao enviar mensagens no Chat da Comunidade, o avatar do aluno ganha uma moldura colorida ou tag correspondente ao seu Elo atual, dando status e prestígio social perante os demais membros.

---

## 5. 🏆 Desbloqueio de Aulas e Módulos Bônus por Elo [CONCLUÍDO ✅]

### Descrição da Funcionalidade
Vincular o progresso do aluno a recompensas práticas, liberando aulas bônus, masterclasses ou materiais complementares apenas para quem alcançou determinado nível no ranking.

### Requisitos Funcionais:
- [x] **Regra de Acesso no Módulo:**
  - Campo no módulo: *"Requisito de Gamificação"* (ex: *Exige Elo Ouro ou superior*).
- [x] **Vitrine de Recompensa:**
  - Para quem ainda não tem o nível necessário, o módulo aparece com visual especial de "Cofre Fechado": *"Suba para o Elo Ouro para desbloquear esta Masterclass"*.
  - Estimula o aluno a concluir mais aulas e interagir na comunidade para conquistar o XP necessário.

---

## 6. 📝 Quizzes com Nota Mínima para Avançar

### Descrição da Funcionalidade
Tornar o questionário de fixação ao fim de módulos ou aulas em um critério pedagógico de aprovação.

### Requisitos Funcionais:
- [ ] **Configuração do Quiz:**
  - O instrutor define a nota mínima de corte (ex: *70% de acertos*).
  - Define o número máximo de tentativas ou liberação imediata de retentativa.
- [ ] **Travamento de Próxima Aula:**
  - Enquanto o aluno não atinge a porcentagem de aprovação, a aula subsequente permanece com status pendente.
- [ ] **Feedback Imediato:**
  - Exibição do gabarito com explicação pedagógica de cada questão após a submissão.

---

## 7. 📱 PWA (Progressive Web App - Ícone de Aplicativo no Celular)

### Descrição da Funcionalidade
Permitir que o aluno acesse a Área de Membros no smartphone como se fosse um aplicativo nativo instalado pela App Store ou Google Play, sem custo de publicação de lojas.

### Requisitos Funcionais:
- [ ] **Manifesto Web (`manifest.json`):**
  - Nome da plataforma (respeitando o White Label), cores de tema, orientação em tela cheia (`display: standalone`) e ícones de alta resolução (192px e 512px).
- [ ] **Banner / Botão de Instalação:**
  - No menu mobile ou topo da tela, botão discreto *"Instalar Aplicativo"* acionando o prompt nativo de instalação do navegador.
- [ ] **Experiência Imersiva:**
  - Abre em tela cheia sem a barra de URL do navegador, com transições suaves e carregamento instantâneo.

---

## 8. ⚡ Refinamentos de Usabilidade do Player e Classroom [CONCLUÍDO ✅]

### Descrição da Funcionalidade
Ajustes finos para elevar o conforto de consumo de conteúdo dos alunos a um padrão premium.

### Requisitos Funcionais:
- [x] **Atalhos de Teclado no Player de Vídeo:**
  - `Espaço` ou `K`: Play / Pausa.
  - `Seta Esquerda` / `Seta Direita`: Voltar / Avançar 10 segundos.
  - `F`: Ativar / Desativar tela cheia (Fullscreen).
  - `M`: Mudo (Mute) / Desmudo.
  - `Seta Cima` / `Seta Baixo`: Aumentar / Diminuir volume.
- [x] **Persistência da Velocidade de Reprodução:**
  - Se o aluno escolher assistir em `1.5x` ou `2.0x`, salvar essa preferência no perfil/navegador para que as próximas aulas já iniciem automaticamente na velocidade desejada.
- [x] **Modo Teatro (Expandido):**
  - Botão para expandir o player de vídeo ocupando quase a totalidade da tela, recolhendo temporariamente a timeline lateral.

---

## Status de Implementação

- [x] **Certificados de Conclusão com QR Code:** Concluído e operacional.
- [x] **Marca d'Água Anti-Pirataria no Player:** Concluído e operacional.
- [ ] **Fase 2 (Gamificação e Retenção):** Modal de Level Up + Badges de Elo no Chat + PWA no Celular
- [ ] **Fase 3 (Controle Pedagógico Avançado):** Liberação Programada de Módulos (Drip Content) + Quizzes com Nota Mínima
- [x] **Fase 4 (Refinamento de Experiência):** Atalhos de Teclado + Velocidade Memorizada + Modo Teatro [CONCLUÍDO ✅]

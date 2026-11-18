# Checklist para Publicação na Google Play Store

Este documento lista tudo o que já está pronto e o que falta executar (no código, no Firebase, no Android Studio e na Google Play Console) para publicar o aplicativo da Área de Membros / Comunidade na **Google Play Store**.

---

## Já Concluído (Base Técnica)
- [x] **Capacitor configurado no Frontend:** `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` e `@capacitor/push-notifications` instalados e projeto Android gerado em `frontend/android/`.
- [x] **Push Notifications (Frontend):** Serviço `frontend/src/services/pushNotifications.js` e hook `frontend/src/hooks/usePushNotifications.js` integrados ao login/logout no `App.jsx` (com *no-op* seguro na Web).
- [x] **Push Notifications (Backend):** Modelo `UserDeviceToken` (`user_device_tokens`), auto-migração no startup (`backend/app/main.py`), serviço `push_notification_service.py`, rotas `/api/v1/push/*` e disparo automático em DMs e notificações da comunidade.
- [x] **Base de Moderação (UGC):** Denúncia de posts (`FeedReportModal`), diretrizes da comunidade (`FeedCommunityGuidelinesModal`) e sistema de strikes/moderação (`FeedAdminModerationModal`).

---

## Fase 1 — Conformidade Obrigatória no Código (Antes do Build Final)
Sem estes itens, a Google Play Store reprova o app na revisão:

- [x] **1. Bloquear Usuário (Comunidade e DM):**
  - Permitir que o aluno bloqueie outro usuário na comunidade/DM, ocultando posts, comentários e mensagens do usuário bloqueado para quem bloqueou.
- [x] **2. Auto-exclusão de Conta:**
  - Botão/fluxo para o próprio aluno excluir a própria conta **dentro do app** (em *Configurações / Meu Perfil*).
  - **Página web pública** (`/excluir-conta`) para solicitação de exclusão de conta/dados fora do app (obrigatório no formulário *Data Safety* da Play Console).
- [x] **3. Política de Privacidade e Termos Públicos:**
  - Páginas públicas acessíveis sem login (`/privacidade` e `/termos`) explicando os dados coletados (nome, e-mail, fotos, tokens de notificação).
- [x] **4. Blindagem de Vendas / Upsells no App Android (`isNativeApp()`):**
  - Ocultar links/botões de checkout e páginas de vendas externas quando rodando no app Android (`CourseSidebarUpsellCard`, `CourseUpsellModal`, cards de cursos bloqueados e eventos exclusivos).
  - Nos cursos bloqueados no app, manter apenas estado neutro (*cadeado*) ou botão neutro de dúvida levando à DM interna (sem preço nem checkout automático).
  - Manter os botões de WhatsApp no app apenas para **Suporte/Ajuda** (sem texto de venda).
- [ ] **5. Configurar URL da API de Produção:**
  - Definir `VITE_API_BASE_URL` apontando para o domínio HTTPS real do backend ao gerar o `npm run build` para o app Android (ex: `https://api.seudominio.com`).
  - Garantir `CORS_ORIGINS` no backend aceitando a origem do app Capacitor (`https://localhost` / `capacitor://localhost` ou domínio configurado).

---

## Fase 2 — Firebase e Configuração Nativa Android
- [ ] **1. Definir o `appId` definitivo:**
  - Ajustar o `appId` em `frontend/capacitor.config.json` (ex: `com.suaempresa.comunidade`) — depois de publicado na Play Store, **não pode ser alterado**.
- [ ] **2. Criar projeto no Firebase Console:**
  - Registrar o app Android usando o mesmo `appId` definido acima.
  - Baixar o arquivo `google-services.json` e salvar em `frontend/android/app/google-services.json`.
- [ ] **3. Configurar credencial do Backend (FCM):**
  - No Firebase Console (*Configurações do Projeto > Contas de serviço*), gerar a chave privada JSON.
  - Preencher `FIREBASE_CREDENTIALS_JSON` ou `FIREBASE_CREDENTIALS_PATH` no `.env` de produção do backend.
- [ ] **4. Ícone e Splash Screen do App:**
  - Gerar e aplicar os ícones adaptativos e tela de abertura (Splash Screen) dentro de `frontend/android/app/src/main/res/`.
- [ ] **5. Testar Push Notification real:**
  - Rodar o app em um celular Android físico ou emulador com Google Play Services e validar o recebimento de push (app aberto, minimizado e fechado).

---

## Fase 3 — Build do `.aab` Assinado (Android Studio)
- [ ] **1. Instalar Android Studio** e SDK Android atualizado (atendendo ao *Target SDK* exigido pela Play Store no ano vigente).
- [ ] **2. Gerar Chave de Assinatura (`keystore.jks`):**
  - Criar a `keystore` no Android Studio e guardar **em backup seguro (nuvem/cofre)** — se perder essa chave, não será possível enviar atualizações futuras do app.
- [ ] **3. Sincronizar e Compilar:**
  - Rodar na pasta `frontend/`:
    ```bash
    npm run build
    npx cap sync android
    ```
  - Abrir `frontend/android/` no Android Studio e gerar o pacote **`.aab`** (*Build > Generate Signed Bundle / APK > Android App Bundle*).

---

## Fase 4 — Conta e Publicação na Google Play Console
- [ ] **1. Conta de Desenvolvedor:**
  - Usar sua **Conta Pessoal** (atenção: contas pessoais novas exigem **12 testadores por 14 dias contínuos** em teste fechado antes da produção) **OU** abrir **Conta Organizacional (CNPJ + número D-U-N-S)** para publicar direto sem a trava dos 14 dias.
- [ ] **2. Materiais da Ficha da Loja:**
  - Ícone: `512 x 512 px` (PNG)
  - Imagem de destaque (*Feature Graphic*): `1024 x 500 px` (PNG/JPG)
  - Screenshots de celular: 4 a 6 telas mostrando comunidade, aulas e perfil
  - Título, descrição curta (até 80 caracteres) e descrição completa
- [ ] **3. Declarações Obrigatórias na Play Console:**
  - URL da **Política de Privacidade**
  - URL de **Exclusão de Conta**
  - Formulário **Segurança dos Dados (*Data Safety*)**
  - **Classificação Indicativa** (questionário IARC)
  - **Acesso ao App (Revisores do Google):** cadastrar um **e-mail e senha de aluno de teste ativo** com acesso a pelo menos 1 curso e à comunidade para o revisor conseguir testar o app.
- [ ] **4. Submeter `.aab` para revisão** e aguardar aprovação do Google.

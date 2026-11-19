# Perfil White-Label do App Android (Modelo 2)

Para criar um novo app exclusivo para um expert, duplique esta pasta com o nome do cliente (ex: `apps-config/astrologo/`) e preencha:

1. `app.config.json`:
   - `appId`: ID único na Play Store (ex: `com.astrologo.comunidade`) — **não pode mudar após publicar**.
   - `appName`: Nome exibido no celular do aluno.
   - `apiBaseUrl`: URL HTTPS do backend desse expert (ex: `https://back.crassus.com.br`).
2. `google-services.json` *(opcional até configurar o Firebase)*:
   - Baixado do Firebase Console para esse `appId` específico.

Depois, na pasta `frontend/`, execute:
```bash
npm run cap:prepare -- astrologo
npm run build
npx cap sync android
```

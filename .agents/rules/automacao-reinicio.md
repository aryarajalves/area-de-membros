---
trigger: always_on
---

# Regra de Reinício e Validação de Serviços

1. **Build do Frontend e Reinício Obrigatório dos Contêineres:**
   - Como o contêiner `area_de_membros_frontend` utiliza Nginx servindo a pasta compilada `../frontend/dist:/usr/share/nginx/html:ro`, **toda vez** que você terminar de implementar ou alterar qualquer coisa no sistema, você **DEVE obrigatoriamente**:
     1. Executar `npm run build` dentro da pasta `frontend` para atualizar os arquivos de `dist/`.
     2. Reiniciar os contêineres Docker com `docker restart area_de_membros_frontend area_de_membros_backend`.
     3. Validar se a porta `http://localhost:3010` está respondendo (`HTTP 200`).

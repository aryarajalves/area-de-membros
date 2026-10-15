# Regra de Transparência de Progresso e Notificação de Loops de Teste

Para garantir total transparência com o usuário e evitar que o agente passe longos períodos em silêncio ou entre em loops infinitos de tentativa e erro, estabelecemos este protocolo obrigatório de comunicação.

**Protocolo Obrigatório:**

1. **Narrativa em Tempo Real (Fim do Silêncio):**
   - O agente **NUNCA** deve executar sequências de ferramentas ou comandos demorados em silêncio.
   - Sempre que uma ação envolver mais de 1 passo ou comandos que levem tempo (testes, builds, uploads Docker, migrações), o agente **DEVE** emitir uma mensagem de status curta e clara antes ou durante o passo:
     - 🔍 *"Analisando a causa do erro no arquivo X..."*
     - ⏳ *"Rodando teste unitário pontual de Y..."*
     - ⚙️ *"Compilando o frontend com Vite..."*
     - 🚀 *"Iniciando envio das camadas para o Docker Hub..."*

2. **Alerta Obrigatório na 3ª Tentativa de Teste (Bloqueio de Loop Infinito):**
   - **REGRA DA 3ª VEZ:** Se um teste falhar e o agente for executar o mesmo teste pela **terceira vez**, ele **DEVE obrigatoriamente parar e avisar no chat** antes de rodar o teste novamente:
     - Qual é o teste específico que está falhando;
     - Qual foi o erro exato retornado na 1ª e na 2ª tentativa;
     - O que foi ajustado e o que será testado nesta 3ª tentativa;
     - Se falhar na 3ª tentativa, o agente **NÃO pode tentar uma 4ª vez silenciosamente**: deve obrigatoriamente interromper a execução e solicitar direcionamento do usuário.

3. **Testes Pontuais no Desenvolvimento Rápido:**
   - Durante o desenvolvimento de um recurso ou ajuste, o agente deve priorizar rodar apenas os testes do componente/rota modificada (1 a 5 segundos de execução), poupando tempo.
   - A suíte completa de todos os testes deve ser executada apenas quando o usuário solicitar explicitamente ("valide tudo") ou antes de commits/pushes de releases para produção.

**Benefício:** O usuário sabe a cada segundo o que o agente está fazendo e loops de tentativa e erro são eliminados na raiz.

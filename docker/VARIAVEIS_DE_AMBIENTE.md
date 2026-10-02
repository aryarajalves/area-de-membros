# 📖 Guia de Variáveis de Ambiente (Docker Produção)

Este documento detalha **todas** as variáveis de ambiente utilizadas na stack de produção (`docker-compose-producao.yml` e `.env.producao.example`) da **Área de Membros**.

Qualquer desenvolvedor, sysadmin ou responsável pelo deploy pode consultar este guia para entender a finalidade de cada configuração, valores recomendados e as regras de segurança aplicadas.

---

## 📑 Índice
1. [Domínios e Roteamento (Traefik)](#1-domínios-e-roteamento-traefik)
2. [Imagens Docker](#2-imagens-docker)
3. [Banco de Dados (PostgreSQL)](#3-banco-de-dados-postgresql)
4. [Autenticação e Segurança (JWT e Pepper)](#4-autenticação-e-segurança-jwt-e-pepper)
5. [Credenciais Iniciais do Super Administrador](#5-credenciais-iniciais-do-super-administrador)
6. [Envio de E-mails Transacionais (Brevo)](#6-envio-de-e-mails-transacionais-brevo)
7. [Armazenamento em Nuvem e Backups (Backblaze B2 / S3)](#7-armazenamento-em-nuvem-e-backups-backblaze-b2--s3)
8. [Webhooks e Automações Externas (n8n, Zapier, Make)](#8-webhooks-e-automações-externas-n8n-zapier-make)
9. [Worker e Rotinas em Background](#9-worker-e-rotinas-em-background)
10. [Regras de Tamanho e Criptografia das Chaves](#10-regras-de-tamanho-e-criptografia-das-chaves)

---

## 1. Domínios e Roteamento (Traefik)

Essas variáveis configuram os nomes de domínio utilizados pelo proxy reverso **Traefik** para emissão automática de certificado SSL (Let's Encrypt) e roteamento de tráfego HTTPS.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `FRONTEND_DOMAIN` | Domínio público onde os alunos e admins acessam a interface web. | Rótulos do Traefik no serviço `frontend`. | `membros.meudominio.com` |
| `API_DOMAIN` | Domínio público exclusivo para a API FastAPI. | Rótulos do Traefik no serviço `backend`. | `api-membros.meudominio.com` |
| `SERVER_URL` | URL completa da aplicação web (com `https://`). Usada pelo backend para gerar links de convites, ativação de conta e recuperação de senha enviados por e-mail. | Backend (`core/config.py`). | `https://membros.meudominio.com` |
| `VITE_API_BASE_URL` | URL base que o frontend utiliza para fazer requisições HTTP para a API. | Frontend e Nginx. | `https://api-membros.meudominio.com` |

---

## 2. Imagens Docker

Controlam quais versões das imagens pré-compiladas no Docker Hub serão baixadas e executadas pelos serviços do Docker Swarm.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `BACKEND_IMAGE` | Imagem Docker da API FastAPI e do Worker de rotinas agendadas. | Serviços `backend` e `worker`. | `aryalvesfernandes/area-de-membros:backend-1.0.1` |
| `FRONTEND_IMAGE` | Imagem Docker da interface React compilada com servidor Nginx. | Serviço `frontend`. | `aryalvesfernandes/area-de-membros:frontend-1.0.1` |

---

## 3. Banco de Dados (PostgreSQL)

O sistema foi padronizado para utilizar **exclusivamente uma única string de conexão oficial**, evitando duplicação e inconsistências de host/porta/usuário.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | URI de conexão padrão do PostgreSQL com driver `psycopg2`. Define o usuário, senha, endereço do host, porta e nome da base de dados. | Backend (`core/database.py`, `backup_service.py` e migrações). | `postgresql://postgres:SuaSenhaForte@postgres:5432/area_de_membros` |

---

## 4. Autenticação e Segurança (JWT e Pepper)

Controlam a assinatura dos tokens de sessão dos usuários e a camada de proteção adicional das senhas criptografadas.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `SECRET_KEY` | Chave secreta de alta entropia utilizada para assinar criptograficamente os tokens JWT (`HS256`). **Nunca deve ser exposta**. | `core/security.py` na geração e validação de tokens JWT. | Sequência de 64 caracteres hexadecimais (32 bytes). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tempo de validade do token de acesso do usuário em minutos. Após esse período, o token expira e exige novo login. | `core/config.py` (Padrão: `1440` minutos = 24 horas). | `1440` |
| `SECURITY_PASSWORD_PEPPER` | "Pimenta" criptográfica do servidor. Uma string secreta anexada a cada senha de usuário antes do hashing com Argon2/Bcrypt. Caso o banco de dados seja vazado, as senhas permanecem indecifráveis sem essa chave do servidor. | `core/security.py` na verificação de senhas. | Sequência de 64 caracteres hexadecimais (32 bytes). |

---

## 5. Credenciais Iniciais do Super Administrador

Utilizadas no processo de inicialização (bootstrap automático) da plataforma para criar o primeiro usuário com perfil `superadmin` caso o banco de dados esteja vazio.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `SUPERADMIN_NAME` | Nome exibido do primeiro administrador no painel. | `core/init_db.py`. | `Super Admin` |
| `SUPERADMIN_EMAIL` | E-mail de login do primeiro administrador. | `core/init_db.py`. | `admin@meudominio.com` |
| `SUPERADMIN_PASSWORD` | Senha inicial de acesso do primeiro administrador. | `core/init_db.py`. | `SenhaForteComplexa@2026!` |

---

## 6. Envio de E-mails Transacionais (Brevo)

Integração com a API REST da Brevo (antigo Sendinblue) para envio de convites de novos alunos, links de redefinição de senha e alertas.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `BREVO_API_KEY` | Chave de API de envio gerada no painel da Brevo. | `services/email_service.py`. | `xkeysib-98a72b...` |
| `BREVO_SENDER_EMAIL` | Endereço de e-mail do remetente autenticado na Brevo (com SPF/DKIM configurados). | `services/email_service.py`. | `suporte@meudominio.com` |
| `BREVO_SENDER_NAME` | Nome que aparecerá para o aluno na caixa de entrada. | `services/email_service.py`. | `Área de Membros` |

---

## 7. Armazenamento em Nuvem e Backups (Backblaze B2 / S3)

O sistema utiliza a API compatível com Amazon S3 da Backblaze B2 para armazenar vídeos pesados de aulas (até 2 GB), capas personalizadas e os dumps de backups automáticos do banco de dados.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `B2_ENDPOINT_URL` | URL do endpoint S3 da região onde o bucket foi criado. | `services/b2_service.py`, `backup_service.py`. | `https://s3.us-east-005.backblazeb2.com` |
| `B2_KEY_ID` | Identificador da Application Key (Key ID) gerada no Backblaze. | `services/b2_service.py`, `backup_service.py`. | `005c2195f082e6d0000000002` |
| `B2_APPLICATION_KEY` | Chave secreta de aplicação do Backblaze (gerada junto com o Key ID). | `services/b2_service.py`, `backup_service.py`. | Chave secreta de 31 caracteres alfanuméricos. |
| `B2_BUCKET_NAME` | Nome exato do bucket criado no painel da Backblaze B2. | `services/b2_service.py`, `backup_service.py`. | `AreaDeMembros` |
| `BACKBLAZE_CDN_URL` | *(Opcional)* URL de um CDN (como Cloudflare) conectado ao bucket para distribuição global de vídeos. | `services/b2_service.py`. | `https://cdn.meudominio.com` |
| `B2_FOLDER` | Subpasta raiz dentro do bucket para segregar backups. | `services/backup_service.py`. | `areademembros/backups/` |
| `B2_RETENTION_MAX` | Número máximo de arquivos de backup retidos no bucket. Backups mais antigos além desse limite são deletados automaticamente. | `services/backup_service.py` (Padrão: `30`). | `30` |

---

## 8. Webhooks e Automações Externas (n8n, Zapier, Make)

Permitem que a plataforma notifique seus servidores de automação sempre que um aluno alcançar marcos de progresso (ex: 25%, 50%, 100%) ou tiver o acesso prestes a expirar.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `WEBHOOK_TRIGGER_URL` | URL do endpoint HTTP POST receptor (no n8n, Make ou servidor próprio). | `services/webhook_service.py`. | `https://n8n.meudominio.com/webhook/area-membros` |
| `WEBHOOK_SECRET_KEY` | Chave secreta compartilhada enviada no cabeçalho `X-Webhook-Secret` para que o seu n8n valide que a requisição veio realmente da Área de Membros. | `services/webhook_service.py`. | `whsec_98a712...` (32 bytes em hex). |

---

## 9. Worker e Rotinas em Background

Configurações para o container `worker`, responsável por rotinas de background, verificações diárias de expiração de acessos de alunos e agendamento de backups.

| Variável | Descrição | Onde é Usada | Exemplo em Produção |
| :--- | :--- | :--- | :--- |
| `WORKER_RENEWAL_CHECK_INTERVAL_HOURS` | Intervalo em horas entre cada varredura de alunos cujo prazo de acesso está próximo de vencer (7 dias, 3 dias, etc.) para disparo de avisos. | `app/worker.py` (Padrão: `24` horas). | `24` |
| `TZ` | Fuso horário oficial dos contêineres Docker para alinhamento de relatórios e agendamentos. | Todos os contêineres. | `America/Sao_Paulo` |

---

## 10. Regras de Tamanho e Criptografia das Chaves

### ❓ O tamanho das chaves de segurança é aleatório?
**Não, o tamanho das chaves não é aleatório!** Ele segue rigorosamente os padrões criptográficos da indústria de segurança da informação (NIST e RFC 7518):

### 1. `SECRET_KEY` (Assinatura do JWT):
- **Algoritmo:** HMAC-SHA256 (`HS256`).
- **Tamanho Exigido:** Mínimo de **256 bits (32 bytes)** de entropia pura.
- **Formato:** Quando convertida para hexadecimal (`secrets.token_hex(32)`), a chave possui **exatamente 64 caracteres** (apenas caracteres de `0-9` e `a-f`).
- **Por que não pode ser menor?** Chaves com menos de 32 bytes (ex: senhas curtas de 8 a 15 caracteres) são vulneráveis a ataques de força bruta que permitem falsificar tokens de qualquer usuário da plataforma.

### 2. `SECURITY_PASSWORD_PEPPER` (Proteção de Senhas):
- **Tamanho:** **256 bits (32 bytes)** = **64 caracteres hexadecimais**.
- **Finalidade:** Adiciona entropia às senhas dos usuários antes do algoritmo Argon2/Bcrypt, protegendo contra vazamento de hash em banco de dados.

### 3. Chaves de API da Plataforma (`sk_live_...`):
- **Tamanho:** Geradas no backend com `secrets.token_hex(32)`.
- **Comprimento:** **32 bytes** (64 caracteres hex) + prefixo `sk_live_` (8 caracteres) = **exatamente 72 caracteres**.

### 💡 Como gerar chaves seguras com o tamanho exato:
Execute este comando no terminal (ou Python) para gerar chaves perfeitas de 256 bits:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Cada execução gerará uma string de **exatamente 64 caracteres**, ideal para preencher tanto a `SECRET_KEY`, quanto o `SECURITY_PASSWORD_PEPPER` e a `WEBHOOK_SECRET_KEY`.

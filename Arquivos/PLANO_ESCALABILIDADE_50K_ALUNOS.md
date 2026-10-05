# 🚀 Plano Diretor de Escalabilidade: Área de Membros para 50.000 Alunos

Este documento estabelece o **roteiro técnico completo e prático** para preparar a infraestrutura, o banco de dados, o backend e a entrega de mídias da Área de Membros para suportar uma base de **50 mil alunos** com estabilidade, alta concorrência em lançamentos e zero travamentos.

---

## 📌 Sumário Executivo

| Camada | Estado Atual (Baseline) | Meta para 50.000 Alunos | Prioridade |
| :--- | :--- | :--- | :---: |
| **Backend & Workers** | 1 réplica, 1 worker Uvicorn | 3 a 5 réplicas Swarm, 4 workers Uvicorn por réplica | **Crítica (P0)** |
| **Autenticação (Hash de Senha)** | Argon2id com 64 MB RAM por hash | Calibrar memória (16-19 MB) ou fila de autenticação | **Crítica (P0)** |
| **Banco de Dados (Conexões)** | SQLAlchemy padrão (15 conexões) | PgBouncer em transaction mode + pool 50-100 conexões | **Crítica (P0)** |
| **Streaming de Vídeos** | MP4 cru no B2 / Local | Panda Video ou Bunny Stream (HLS Adaptativo + DRM) | **Crítica (P0)** |
| **Camada de Cache** | Sem cache (100% no PostgreSQL) | Redis para vitrine, módulos, aulas e configurações | **Alta (P1)** |
| **Webhooks e Importações** | Síncrono no endpoint HTTP | Enfileiramento assíncrono via Worker / Celery / Redis | **Alta (P1)** |
| **Monitoramento & Métricas** | Logs em container simples | Prometheus + Grafana + Alertas de Saúde | **Média (P2)** |

---

## 🏗️ 1. Camada de Aplicação & Containers (Docker / Swarm)

### 1.1 Aumentar Workers do Uvicorn no Backend
Atualmente, o `Dockerfile` inicia o Uvicorn com 1 único processo de worker:
```dockerfile
# ANTES (Atual):
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
```
**Ajuste Obrigatório:** Configurar múltiplos workers concorrentes no container para processar requisições em paralelo:
```dockerfile
# DEPOIS (Recomendado):
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers", "--forwarded-allow-ips=*"]
```
*(Regra prática: `Número de Workers = (2 × vCPUs) + 1` ou 4 workers por réplica de 2 vCPUs).*

### 1.2 Dimensionamento de Réplicas no `docker-compose-producao.yml`
No Docker Swarm, o backend deve ser escalado horizontalmente com balanceamento de carga automático via Traefik:
```yaml
backend:
  image: ${BACKEND_IMAGE:-aryalvesfernandes/area-de-membros:backend-1.0.1}
  deploy:
    mode: replicated
    replicas: 4  # Escalar de 1 para 3 a 5 réplicas
    update_config:
      parallelism: 1
      delay: 10s
      order: start-first
    resources:
      limits:
        cpus: "2.0"
        memory: 4096M
      reservations:
        cpus: "1.0"
        memory: 2048M
```

---

## 🔐 2. Otimização de Autenticação (Mitigação de OOM Kill)

### 2.1 Calibração do Algoritmo Argon2id no `security.py`
Atualmente, o custo de memória está em 64 MB (`memory_cost=65536`) por validação de senha. Em um pico de lançamento, 50 alunos logando juntos demandam mais de 3 GB de RAM apenas para calcular senhas, causando queda do container por falta de memória.

**Ajuste no arquivo `backend/app/core/security.py`:**
```python
# Calibração otimizada para alta concorrência conforme RFC 9106:
ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MB por hash (segurança militar com 70% menos consumo de RAM)
    parallelism=2,
    hash_len=32,
    salt_len=16,
    type=Type.ID
)
```

---

## 🗄️ 3. Banco de Dados & Pooling de Conexões (PostgreSQL)

### 3.1 Implementar PgBouncer
O PostgreSQL tem custo alto de memória por conexão aberta (cada conexão consome de 5 a 10 MB de RAM). Com 4 réplicas de backend tendo 4 workers cada, teríamos dezenas de conexões abertas.

**Ação:** Colocar um container **PgBouncer** entre o FastAPI e o PostgreSQL:
- **Modo do PgBouncer:** `pool_mode = transaction`.
- **Efeito:** Permite que centenas de requisições web compartilhem um pool enxuto de apenas **20 a 40 conexões reais** com o banco sem enfileiramento e sem estourar o limite de conexões do PostgreSQL.

### 3.2 Configurar o SQLAlchemy Connection Pool no `database.py`
Ajustar explicitamente os parâmetros do engine no arquivo `backend/app/core/database.py`:
```python
engine_kwargs = {
    "connect_args": connect_args,
    "pool_size": 25,          # Conexões mantidas abertas por worker
    "max_overflow": 35,       # Conexões adicionais permitidas em picos
    "pool_timeout": 30,       # Timeout em segundos para obter conexão
    "pool_recycle": 1800,     # Recicla conexões a cada 30 minutos
    "pool_pre_ping": True     # Valida conexão antes de usar (evita conexões mortas)
}
```

### 3.3 Índices Críticos de Alta Concorrência
Garantir que as tabelas mais consultadas durante as aulas possuam índices adequados:
- `user_courses(user_id, course_id, expires_at)`
- `lesson_progress(user_id, lesson_id)`
- `lesson_progress(course_id, user_id)`
- `lessons(module_id, order_index)`
- `modules(course_id, order_index)`

---

## ⚡ 4. Camada de Cache em Memória (Redis)

Mais de 80% das requisições de alunos que navegam no curso são leituras repetitivas:
1. Listagem de Cursos e Vitrine (`GET /api/v1/courses`).
2. Módulos e Aulas do Curso (`GET /api/v1/courses/{id}`).
3. Tema Global da Plataforma (`GET /api/v1/courses/platform-theme`).

### 4.1 Estratégia de Cache
- **Adicionar Redis na Stack Docker:** `image: redis:7-alpine`.
- **Implementar Decorator de Cache nos Endpoints:**
  - `GET /courses/{id}` -> Salva o JSON estruturado no Redis com **TTL de 15 minutos**.
  - **Invalidação Proativa (Cache Busting):** Sempre que o administrador criar, editar ou excluir um módulo ou aula, o backend limpa a chave `cache:course:{id}` instantaneamente.
- **Resultado:** A consulta ao banco cai de 5.000 requisições/minuto para **menos de 50 requisições/minuto**, liberando o PostgreSQL para focar em gravações (conclusão de aulas, quizzes e suporte).

---

## 🎬 5. Arquitetura de Entrega de Vídeo (Streaming)

Para 50.000 alunos, **o vídeo nunca deve ser servido localmente pela VPS**.

### 5.1 Opção Recomendada: Panda Video ou Bunny Stream
* **Panda Video:** 
  * Player nativo com **DRM dinâmico (Nome + CPF flutuante do aluno na tela)**.
  * Streaming HLS adaptativo (1080p, 720p, 480p, 360p automático no 4G/Wi-Fi).
  * Sem tráfego consumido na sua VPS.
* **Bunny Stream (Melhor Custo-Benefício Internacional):**
  * Oferece DRM, CDN global rápida em São Paulo e HLS automático.
  * Custo em atacado de aproximadamente **$0,01 por GB** (~R$ 0,06 por GB).

### 5.2 Se optar por Backblaze B2 (Cenário Econômico):
* Ativar a **Cloudflare CDN** na frente do bucket do Backblaze B2 (Bandwidth Alliance para tráfego gratuito do B2 para a Cloudflare).
* Comprimir os vídeos antes do upload para taxas de bitrate otimizadas (H.264 / AAC até 1080p a 2.500 kbps).
* Estar ciente de que arquivos `.mp4` puros podem sofrer com lentidão em celulares 4G e possuem menor barreira contra downloads não autorizados.

---

## 📥 6. Processamento Assíncrono (Webhooks e Importações em Lote)

### 6.1 Importação Massiva de Planilhas CSV (`/api/v1/students/import`)
- **Problema Atual:** Processar 50 mil linhas no endpoint HTTP causa timeout em 60 segundos.
- **Solução:**
  1. O endpoint recebe a planilha, valida o cabeçalho, salva o arquivo temporário e responde imediatamente `202 Accepted` com `{"job_id": "...", "status": "processing"}`.
  2. O `worker.py` lê a planilha em background em blocos (*batches*) de 500 alunos, inserindo com `bulk_insert` e commitando a cada bloco.
  3. O administrador visualiza uma barra de progresso no frontend consultando `GET /api/v1/students/import/status/{job_id}`.

### 6.2 Webhooks de Plataformas (Kiwify, Hotmart, Eduzz)
- Em lançamentos com milhares de compras por hora, o webhook deve:
  1. Receber o payload e responder `HTTP 200 OK` em **menos de 80 milissegundos**.
  2. Inserir a mensagem numa fila Redis (`task_queue:webhooks`).
  3. O serviço worker consome a fila, cria a matrícula e dispara os e-mails transacionais (Brevo API) sem travar a API principal.

---

## 🖥️ 7. Especificação de Hardware & Infraestrutura Recomendada

Para hospedar 50 mil alunos com folga para lançamentos de grande porte:

### Cenário com 2 Servidores Dedicados / VPS (Recomendado)

#### Servidor 1: Aplicação & Web (FastAPI + Nginx + Traefik + Redis)
- **Provedor sugerido:** Hetzner, Contabo, AWS Lightsail ou OVH.
- **Configuração:**
  - 8 a 16 vCPUs.
  - 16 a 32 GB de Memória RAM.
  - 100 GB SSD NVMe.
  - Conexão de Rede de 1 Gbps.

#### Servidor 2: Banco de Dados Dedicado (PostgreSQL 16 + PgBouncer)
- **Configuração:**
  - 4 a 8 vCPUs.
  - 16 GB de Memória RAM.
  - 150 a 250 GB SSD NVMe com alta taxa de IOPS.
  - Backup diário automatizado configurado para o Backblaze B2 (já suportado pelo sistema).

---

## 📊 8. Guia Prático de Instalação do Prometheus e Grafana

Para monitorar a saúde da Área de Membros em tempo real durante lançamentos de 50.000 alunos, recomenda-se a stack padrão da indústria:
1. **Prometheus:** Coleta e armazena métricas temporais (CPU, RAM, requisições/s, erros HTTP).
2. **Grafana:** Painel web visual com gráficos dinâmicos e velocímetros.
3. **Node Exporter:** Mede a saúde física da VPS (carga de CPU, uso de disco, memória livre, tráfego de rede).
4. **cAdvisor (Google):** Mede o consumo individual de cada container Docker da Área de Membros (`backend`, `frontend`, `db`).

```
  ┌────────────────┐     ┌──────────────┐     ┌──────────────┐
  │  FastAPI App   │     │ NodeExporter │     │   cAdvisor   │
  │ (:8000/metrics)│     │    (:9100)   │     │    (:8080)   │
  └───────┬────────┘     └──────┬───────┘     └──────┬───────┘
          │                     │                    │
          └───────────────┬─────┴────────────────────┘
                          ▼ (scrape a cada 10s)
                  ┌───────────────┐
                  │  Prometheus   │
                  │    (:9090)    │
                  └───────┬───────┘
                          │ (consulta métricas)
                          ▼
                  ┌───────────────┐
                  │    Grafana    │ ◄── Painel visual do Administrador
                  │    (:3000)    │
                  └───────┬───────┘
                          │ (em caso de pico > 85%)
                          ▼
                  ┌───────────────┐
                  │ Alerta no Zap │
                  │  ou Telegram  │
                  └───────────────┘
```

---

### Passo 1: Criar o arquivo de configuração do Prometheus (`prometheus.yml`)

Na pasta `docker/prometheus/prometheus.yml` (ou no servidor em `/opt/monitoring/prometheus.yml`), crie o arquivo:

```yaml
global:
  scrape_interval: 10s      # Coleta métricas a cada 10 segundos
  evaluation_interval: 10s  # Avalia regras de alerta a cada 10 segundos

scrape_configs:
  # 1. Métricas do Próprio Servidor (VPS / Host)
  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

  # 2. Métricas dos Contêineres Docker da Área de Membros
  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]

  # 3. Métricas da Aplicação FastAPI (Tempo de resposta, endpoints, status 2xx/5xx)
  - job_name: "fastapi-backend"
    scrape_interval: 5s
    metrics_path: "/metrics"
    static_configs:
      - targets: ["area_de_membros_backend:8000"]
```

---

### Passo 2: Criar o arquivo `docker-compose-monitoring.yml`

Crie o arquivo `docker/docker-compose-monitoring.yml` para subir toda a stack de monitoramento de forma isolada e sem impactar a aplicação principal:

```yaml
version: "3.8"

services:
  # 1. Coletor Prometheus
  prometheus:
    image: prom/prometheus:v2.49.1
    container_name: monitoring_prometheus
    restart: unless-stopped
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=15d"  # Mantém histórico de 15 dias de métricas
      - "--web.enable-lifecycle"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - area_de_membros_internal
      - monitoring_net

  # 2. Painel Visual Grafana
  grafana:
    image: grafana/grafana:10.3.1
    container_name: monitoring_grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=sua_senha_segura_grafana
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"  # Acesso web em http://SEU_IP:3001
    depends_on:
      - prometheus
    networks:
      - monitoring_net

  # 3. Métricas de Hardware da VPS (CPU, RAM, Disco)
  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: monitoring_node_exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.sysfs=/host/sys"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    networks:
      - monitoring_net

  # 4. Métricas de Containers Docker (Consumo de RAM/CPU de cada container da Área de Membros)
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    container_name: monitoring_cadvisor
    restart: unless-stopped
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    devices:
      - /dev/kmsg
    networks:
      - monitoring_net

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring_net:
    driver: bridge
  area_de_membros_internal:
    external: true
```

---

### Passo 3: Ativar Métricas Nativas no FastAPI Backend

Para que o Prometheus consiga ler em tempo real a velocidade de cada rota da Área de Membros (ex: `/api/v1/courses`, `/api/v1/users/login`), basta instrumentar o FastAPI com a biblioteca oficial:

1. **Adicionar ao `backend/requirements.txt`:**
   ```text
   prometheus-fastapi-instrumentator==6.1.0
   ```

2. **Ativar no `backend/app/main.py`:**
   ```python
   from prometheus_fastapi_instrumentator import Instrumentator

   # Após criar app = FastAPI(...)
   Instrumentator().instrument(app).expose(app, endpoint="/metrics")
   ```
   *(Isso cria automaticamente a rota oculta `/metrics`, onde o Prometheus busca os números sem qualquer custo perceptível de CPU).*

---

### Passo 4: Subir a Stack de Monitoramento

No terminal do servidor, execute:
```bash
docker compose -f docker-compose-monitoring.yml up -d
```

Validar se os containers estão rodando:
```bash
docker ps --filter "name=monitoring"
```

---

### Passo 5: Configurar o Grafana em 2 Minutos

1. Acesse no navegador: `http://SEU_IP_DO_SERVIDOR:3001`
2. Faça login com usuário `admin` e a senha definida no compose.
3. Vá em **Connections > Data Sources > Add data source** e selecione **Prometheus**.
4. No campo **Prometheus server URL**, digite: `http://prometheus:9090` e clique em **Save & Test** (deve aparecer uma mensagem verde de sucesso).
5. **Importar Dashboards Prontos da Comunidade (sem precisar desenhar do zero):**
   - Vá em **Dashboards > New > Import**.
   - Digite o código `1860` (Node Exporter Full) e clique em **Load**: você terá um painel cinematográfico com uso de CPU, RAM, disco e temperatura do servidor.
   - Digite o código `14282` ou `893` (Docker cAdvisor): exibe gráficos detalhados do consumo de cada réplica da Área de Membros.

---

### 🚨 Passo 6: Configurar Alertas no Telegram / Discord

No painel do Grafana:
1. Vá em **Alerting > Contact Points > Add contact point**.
2. Selecione **Telegram** ou **Discord Webhook** e insira o Token do Bot e o ID do seu Chat.
3. Crie uma regra simples:
   - Se `Uso de Memória RAM do Backend > 85% por mais de 2 minutos` ➔ **Disparar Alerta no Telegram**.
   - Se `Taxa de Erro HTTP 5xx > 1% das requisições` ➔ **Disparar Alerta no Telegram**.

Dessa forma, a equipe é avisada em segundos se algo estiver esquentando no servidor, garantindo ação proativa antes dos 50 mil alunos notarem qualquer instabilidade.

---

## 📋 9. Checklist de Implementação por Fases

### Fase 1: Ajustes Críticos Imediatos (P0) — Prazo curto
- [ ] Ajustar parâmetros de memória do Argon2id no `security.py`.
- [ ] Aumentar Uvicorn workers no `Dockerfile` (`--workers 4`).
- [ ] Configurar explicitamente `pool_size` e `max_overflow` no `database.py`.
- [ ] Definir Panda Video ou Bunny Stream como padrão para os vídeos das aulas.
- [ ] Testar limites de concorrência com ferramenta de teste de carga (ex: Locust ou k6).

### Fase 2: Escala e Performance (P1) — Médio prazo
- [ ] Adicionar container Redis à stack de produção.
- [ ] Implementar cache dos endpoints de leitura de cursos e módulos.
- [ ] Integrar PgBouncer na frente do PostgreSQL.
- [ ] Modularizar a importação de CSV para execução assíncrona em background pelo Worker.
- [ ] Configurar fila de webhooks para processamento desacoplado.

### Fase 3: Monitoramento e Observabilidade (P2) — Longo prazo
- [ ] Subir o `docker-compose-monitoring.yml` com Prometheus, Grafana, Node Exporter e cAdvisor.
- [ ] Adicionar `prometheus-fastapi-instrumentator` no backend para monitorar rotas em tempo real.
- [ ] Importar dashboards de servidor e contêineres no Grafana.
- [ ] Configurar alertas no Telegram/Discord para falhas 5xx ou alto uso de RAM (> 85%).
- [ ] Realizar teste de estresse simulando 5.000 usuários simultâneos navegando pelas aulas.


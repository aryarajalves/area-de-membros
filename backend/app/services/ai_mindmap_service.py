"""
Serviço de Geração de Mapas Mentais Interativos com IA a partir de Transcrições de Aulas.
Gera diagramas em Mermaid.js integrados em páginas HTML autônomas com visual Dark Premium Neon.
Salva o arquivo como anexo da aula (LessonAttachment) acessível em nova aba pelos alunos.
"""
import os
import re
import json
import uuid
import asyncio
from typing import Dict, Any, Optional, List
import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.logger import logger
from app.core.config import settings
from app.models.course import Lesson, LessonTranscription, LessonAttachment, Course, Module
from app.services.ai_transcription_service import get_openai_api_key, CHAT_COMPLETIONS_ENDPOINT
from app.services.storage import upload_media_file

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ATTACHMENTS_DIR = os.path.join(BASE_DIR, "uploads", "attachments")
os.makedirs(ATTACHMENTS_DIR, exist_ok=True)


MINDMAP_SYSTEM_PROMPT = """Você é um arquiteto pedagógico especialista em síntese visual e design instrucional.
Sua missão é transformar a transcrição de uma aula em um Mapa Mental rico, didático e visual usando a sintaxe Mermaid.js.

Regras obrigatórias de formatação:
1. Comece SEMPRE com: flowchart TD ou flowchart LR
2. O nó central DEVE ser o tema/título da aula: Central(["🧠 Título Central"])
3. Crie de 4 a 6 ramos principais (pilares conceituais da aula).
4. Para cada pilar principal, adicione de 2 a 4 subnós com conceitos, exemplos ou aplicações práticas.
5. Adicione conexões entre tópicos quando houver relação de causa/efeito ou transição de ideias.
6. Use sintaxe Mermaid 100% válida:
   - Sempre coloque os textos dos nós entre aspas duplas, exemplo: id["Texto Aqui"]
   - Nunca use caracteres como parênteses ou colchetes dentro do texto sem aspas duplas.
   - IDs de nós simples: ex. T1, T2, P1_A, P2_B, etc.
7. Retorne estritamente um JSON com a seguinte estrutura:
{
  "mermaid_code": "flowchart TD\\n  ...",
  "central_theme": "Título curto",
  "summary_points": [
    {"topic": "Nome do Tópico 1", "description": "Breve explicação em 1-2 frases do conceito."},
    {"topic": "Nome do Tópico 2", "description": "Breve explicação em 1-2 frases do conceito."}
  ]
}
Não inclua crases markdown adicionais antes ou depois do JSON."""


def generate_dark_premium_html(
    course_title: str,
    module_title: str,
    lesson_title: str,
    mermaid_code: str,
    summary_points: List[Dict[str, str]]
) -> str:
    """Gera um documento HTML completo, autônomo e estilizado em Dark Premium Neon."""
    points_html = ""
    for idx, pt in enumerate(summary_points, 1):
        topic = pt.get("topic", f"Tópico {idx}")
        desc = pt.get("description", "")
        points_html += f"""
        <div class="topic-card">
          <div class="topic-badge">0{idx}</div>
          <div class="topic-content">
            <h3>{topic}</h3>
            <p>{desc}</p>
          </div>
        </div>
        """

    # Garante que o mermaid_code não tenha crases soltas
    clean_mermaid = mermaid_code.strip()
    if clean_mermaid.startswith("```"):
        clean_mermaid = re.sub(r"^```(?:mermaid)?\n?", "", clean_mermaid)
        clean_mermaid = re.sub(r"\n?```$", "", clean_mermaid)

    html_template = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧠 Mapa Mental: {lesson_title} | {course_title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    :root {{
      --bg-dark: #070b13;
      --bg-surface: #0d1527;
      --bg-card: rgba(15, 23, 42, 0.75);
      --border-color: rgba(56, 189, 248, 0.18);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-cyan: #38bdf8;
      --accent-neon: #00f2fe;
      --accent-purple: #a855f7;
      --accent-emerald: #10b981;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 20% 15%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 80% 85%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 36px 36px, 36px 36px;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }}
    header {{
      background: rgba(13, 21, 39, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }}
    .breadcrumbs {{
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }}
    .breadcrumbs span.active {{
      color: var(--accent-cyan);
      font-weight: 600;
    }}
    h1 {{
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .header-actions {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.05);
      color: #f8fafc;
    }}
    .btn:hover {{
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }}
    .btn-primary {{
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      border: none;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
    }}
    .btn-primary:hover {{
      background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
      color: #ffffff;
    }}
    .main-container {{
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      gap: 24px;
    }}
    .diagram-panel {{
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 28px;
      position: relative;
      box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6);
      overflow-x: auto;
      min-height: 540px;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .diagram-panel::before {{
      content: 'MAPA MENTAL INTERATIVO';
      position: absolute;
      top: 14px;
      left: 20px;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: var(--accent-cyan);
      opacity: 0.85;
    }}
    .controls-overlay {{
      position: absolute;
      top: 12px;
      right: 14px;
      display: flex;
      gap: 6px;
      z-index: 10;
    }}
    .icon-btn {{
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s ease;
    }}
    .icon-btn:hover {{
      background: rgba(56, 189, 248, 0.2);
      border-color: var(--accent-cyan);
      color: #ffffff;
    }}
    .mermaid-wrapper {{
      width: 100%;
      display: flex;
      justify-content: center;
      transform-origin: center top;
      transition: transform 0.2s ease;
    }}
    .topics-section {{
      background: var(--bg-surface);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
    }}
    .topics-header {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }}
    .topics-header h2 {{
      font-size: 1.05rem;
      font-weight: 700;
      color: #f8fafc;
    }}
    .topics-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }}
    .topic-card {{
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      transition: all 0.2s ease;
    }}
    .topic-card:hover {{
      border-color: rgba(56, 189, 248, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }}
    .topic-badge {{
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--accent-cyan);
      font-size: 0.72rem;
      font-weight: 800;
      border-radius: 6px;
      padding: 4px 8px;
      line-height: 1;
    }}
    .topic-content h3 {{
      font-size: 0.92rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }}
    .topic-content p {{
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.5;
    }}
    footer {{
      text-align: center;
      padding: 20px;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: auto;
    }}
    @media print {{
      body {{
        background: #ffffff !important;
        color: #0f172a !important;
      }}
      header, .controls-overlay, footer {{
        display: none !important;
      }}
      .diagram-panel, .topics-section, .topic-card {{
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
        color: #0f172a !important;
      }}
      .topic-content p {{
        color: #475569 !important;
      }}
      .topic-content h3 {{
        color: #0f172a !important;
      }}
    }}
  </style>
</head>
<body>
  <header>
    <div>
      <div class="breadcrumbs">
        <span>{course_title}</span>
        <span>•</span>
        <span>{module_title}</span>
        <span>•</span>
        <span class="active">Mapa Mental</span>
      </div>
      <h1>🧠 {lesson_title}</h1>
    </div>
    <div class="header-actions">
      <button class="btn" onclick="window.print()">
        🖨️ Imprimir / Salvar PDF
      </button>
      <button class="btn btn-primary" onclick="resetZoom()">
        ⟲ Resetar Visão
      </button>
    </div>
  </header>

  <main class="main-container">
    <div class="diagram-panel">
      <div class="controls-overlay">
        <button class="icon-btn" onclick="zoomIn()" title="Aumentar Zoom">+</button>
        <button class="icon-btn" onclick="zoomOut()" title="Diminuir Zoom">-</button>
        <button class="icon-btn" onclick="resetZoom()" title="Resetar Zoom">⟲</button>
      </div>
      <div class="mermaid-wrapper" id="mermaid-container">
        <pre class="mermaid">
{clean_mermaid}
        </pre>
      </div>
    </div>

    {f'''<section class="topics-section">
      <div class="topics-header">
        <span>📌</span>
        <h2>Guia de Tópicos e Conceitos Fundamentais</h2>
      </div>
      <div class="topics-grid">
        {points_html}
      </div>
    </section>''' if points_html.strip() else ''}
  </main>

  <footer>
    Mapa Mental interativo gerado por IA com base na transcrição oficial da aula.
  </footer>

  <script>
    mermaid.initialize({{
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {{
        darkMode: true,
        background: '#0d1527',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        lineColor: '#38bdf8',
        secondaryColor: '#334155',
        tertiaryColor: '#0f172a'
      }},
      flowchart: {{
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
      }}
    }});

    let currentScale = 1;
    function zoomIn() {{
      currentScale = Math.min(currentScale + 0.15, 2.5);
      applyZoom();
    }}
    function zoomOut() {{
      currentScale = Math.max(currentScale - 0.15, 0.4);
      applyZoom();
    }}
    function resetZoom() {{
      currentScale = 1;
      applyZoom();
    }}
    function applyZoom() {{
      const el = document.getElementById('mermaid-container');
      if (el) {{
        el.style.transform = `scale(${{currentScale}})`;
      }}
    }}
  </script>
</body>
</html>
"""
    return html_template


class AiMindmapService:
    async def request_mindmap_structure_from_ai(self, lesson_title: str, full_transcript: str) -> Dict[str, Any]:
        """Envia o texto da transcrição para a OpenAI e recebe o código Mermaid estruturado."""
        api_key = get_openai_api_key()
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        # Trunca transcrição se for excessivamente longa (limite de contexto seguro ~40k chars)
        transcript_sample = full_transcript[:35000]

        user_content = (
            f"Aula: {lesson_title}\n\n"
            f"Transcrição Integral:\n{transcript_sample}\n\n"
            f"Gere o mapa mental em Mermaid com os pilares conceituais, subtópicos e o JSON estruturado."
        )

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": MINDMAP_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 2500
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            res = await client.post(CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)
            if res.status_code != 200:
                logger.error(f"[AI Mindmap] Falha na OpenAI: {res.status_code} - {res.text}")
                msg = "Falha ao comunicar com a inteligência artificial para estruturação do mapa mental."
                try:
                    err_json = res.json()
                    err_msg = err_json.get("error", {}).get("message", res.text)
                    code = err_json.get("error", {}).get("code")
                    if code == "credit_balance_exhausted" or "no credits remaining" in err_msg.lower() or "insufficient_quota" in res.text.lower():
                        msg = "Saldo de créditos da OpenAI esgotado. Recarregue seus créditos na OpenAI (https://platform.openai.com) para gerar mapas mentais com IA."
                    else:
                        msg = f"Erro na API da OpenAI: {err_msg}"
                except Exception:
                    msg = f"Erro na API da OpenAI: {res.text[:150]}"

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=msg
                )
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return parsed

    async def generate_mindmap_for_lesson(self, lesson_id: int, db: Session) -> Dict[str, Any]:
        """Gera o mapa mental em HTML e anexa aos materiais complementares da aula."""
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Aula não encontrada.")

        transcription = db.query(LessonTranscription).filter(
            LessonTranscription.lesson_id == lesson_id
        ).first()

        if not transcription or not (transcription.full_transcript or "").strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A aula '{lesson.title}' ainda não possui transcrição de áudio. Por favor, processe a transcrição primeiro."
            )

        module = db.query(Module).filter(Module.id == lesson.module_id).first()
        course = db.query(Course).filter(Course.id == module.course_id).first() if module else None

        course_title = course.title if course else "Curso"
        module_title = module.title if module else "Módulo"
        lesson_title = lesson.title or "Aula"

        logger.info(f"[AI Mindmap] Gerando mapa mental para aula #{lesson_id} ({lesson_title})...")

        # 1. Obter estrutura da IA
        ai_data = await self.request_mindmap_structure_from_ai(lesson_title, transcription.full_transcript)
        mermaid_code = ai_data.get("mermaid_code", "flowchart TD\n  A[\"Aula\"]")
        summary_points = ai_data.get("summary_points", [])

        # 2. Compilar HTML Dark Premium Neon
        html_content = generate_dark_premium_html(
            course_title=course_title,
            module_title=module_title,
            lesson_title=lesson_title,
            mermaid_code=mermaid_code,
            summary_points=summary_points
        )

        html_bytes = html_content.encode("utf-8")
        filename = f"mapa_mental_aula_{lesson.id}_{uuid.uuid4().hex[:8]}.html"

        # 3. Armazenar arquivo (B2 ou local)
        uploaded_url = upload_media_file(
            file_bytes=html_bytes,
            filename=filename,
            content_type="text/html",
            folder="AreaDeMembros/attachments/"
        )

        final_url = uploaded_url
        if not final_url:
            local_path = os.path.join(ATTACHMENTS_DIR, filename)
            with open(local_path, "wb") as f:
                f.write(html_bytes)
            final_url = f"/api/v1/courses/attachments/{filename}"

        # 4. Criar ou atualizar anexo em lesson_attachments
        attachment_title = f"🧠 Mapa Mental - {lesson_title}"
        existing_att = db.query(LessonAttachment).filter(
            LessonAttachment.lesson_id == lesson_id,
            LessonAttachment.title.ilike("%Mapa Mental%")
        ).first()

        if existing_att:
            existing_att.title = attachment_title
            existing_att.file_url = final_url
            existing_att.file_type = "html"
            existing_att.file_size_bytes = len(html_bytes)
            existing_att.description = "Mapa mental interativo gerado por IA com base na transcrição da aula."
            target_att = existing_att
        else:
            target_att = LessonAttachment(
                lesson_id=lesson_id,
                title=attachment_title,
                description="Mapa mental interativo gerado por IA com base na transcrição da aula.",
                file_url=final_url,
                file_type="html",
                file_size_bytes=len(html_bytes)
            )
            db.add(target_att)

        db.commit()
        db.refresh(target_att)

        logger.info(f"[AI Mindmap] Sucesso ao gerar mapa mental da aula #{lesson_id}. Anexo ID #{target_att.id}")
        return {
            "success": True,
            "lesson_id": lesson_id,
            "attachment_id": target_att.id,
            "file_url": final_url,
            "title": target_att.title
        }

    async def generate_mindmaps_for_module(self, module_id: int, course_id: int, db: Session) -> Dict[str, Any]:
        """Varre todas as aulas do módulo com transcrição e gera os mapas mentais."""
        lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.order_index).all()
        if not lessons:
            return {"total_lessons": 0, "processed": 0, "skipped": 0, "results": []}

        results = []
        processed = 0
        skipped = 0

        for l in lessons:
            has_transcript = db.query(LessonTranscription).filter(
                LessonTranscription.lesson_id == l.id,
                LessonTranscription.full_transcript != None,
                LessonTranscription.full_transcript != ""
            ).first()

            if not has_transcript:
                skipped += 1
                results.append({"lesson_id": l.id, "title": l.title, "status": "skipped", "reason": "Sem transcrição"})
                continue

            try:
                res = await self.generate_mindmap_for_lesson(l.id, db)
                processed += 1
                results.append({"lesson_id": l.id, "title": l.title, "status": "success", "file_url": res["file_url"]})
            except Exception as exc:
                logger.error(f"[AI Mindmap Module] Erro na aula #{l.id}: {exc}")
                results.append({"lesson_id": l.id, "title": l.title, "status": "error", "error": str(exc)})

        return {
            "module_id": module_id,
            "total_lessons": len(lessons),
            "processed": processed,
            "skipped": skipped,
            "results": results
        }

    async def generate_mindmaps_for_course(self, course_id: int, db: Session) -> Dict[str, Any]:
        """Varre todas as aulas do curso inteiro que tenham transcrição e gera os mapas mentais."""
        modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()
        total_lessons = 0
        processed = 0
        skipped = 0
        results = []

        for mod in modules:
            mod_res = await self.generate_mindmaps_for_module(mod.id, course_id, db)
            total_lessons += mod_res["total_lessons"]
            processed += mod_res["processed"]
            skipped += mod_res["skipped"]
            results.extend(mod_res["results"])

        return {
            "course_id": course_id,
            "total_lessons": total_lessons,
            "processed": processed,
            "skipped": skipped,
            "results": results
        }


ai_mindmap_service = AiMindmapService()

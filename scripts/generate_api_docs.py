import json
from collections import defaultdict

def get_auth_level(path, method):
    # Endpoints públicos
    public_paths = [
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/invites/validate",
        "/api/v1/courses/thumbnails/",
        "/api/v1/courses/videos/",
        "/api/v1/courses/attachments/",
        "/api/v1/support/images/",
        "/health",
    ]
    for p in public_paths:
        if p in path:
            return "🌐 Público"

    # Superadmin / Manager
    superadmin_paths = [
        "/api/v1/backups",
        "/api/v1/logs",
        "/api/v1/courses/platform-theme",
        "/api/v1/courses/reports",
        "/api/v1/students/import",
        "/api/v1/integrations",
        "/api/v1/invites",
    ]
    for p in superadmin_paths:
        if p in path:
            return "👑 SuperAdmin (Manager)"

    # Ações administrativas de criação e edição estrutural
    if any(p in path for p in ["/courses", "/modules", "/lessons"]) and method in ["POST", "PUT", "DELETE"]:
        if not any(sub in path for sub in ["/notes", "/rating", "/progress", "/comments", "/reports", "/submit"]):
            return "👑 SuperAdmin (Manager)"

    return "🔑 Autenticado (Aluno / Admin)"


def main():
    with open("backend/openapi_dump.json", "r", encoding="utf-8") as f:
        paths = json.load(f)

    categories = {
        "1. Autenticação, Usuários e Convites": [],
        "2. Gestão de Cursos e Módulos": [],
        "3. Aulas, Vídeos, Conteúdo de Texto e Anexos": [],
        "4. Quizzes e Avaliações Interativas": [],
        "5. Interações do Aluno (Comentários, Avaliações, Notas e Progresso)": [],
        "6. Gestão de Alunos e Matrículas": [],
        "7. Suporte e Dúvidas da Comunidade": [],
        "8. Webhooks e Integrações Externas": [],
        "9. Backups Automatizados e S3 (Backblaze B2)": [],
        "10. Logs do Sistema e Auditoria": [],
        "11. Plataforma e Configurações Globais": [],
    }

    for path, methods in sorted(paths.items()):
        for method, info in methods.items():
            m = method.upper()
            if m not in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                continue

            summary = info.get("summary", "").replace("\n", " ").strip()
            desc = info.get("description", "").replace("\n", " ").strip()
            text = summary or desc or "Operação de API"
            auth = get_auth_level(path, m)

            # Categorização
            if path.startswith("/api/v1/auth") or path.startswith("/api/v1/users") or path.startswith("/api/v1/invites"):
                cat = "1. Autenticação, Usuários e Convites"
            elif any(k in path for k in ["/quiz", "/submit"]):
                cat = "4. Quizzes e Avaliações Interativas"
            elif any(k in path for k in ["/notes", "/rating", "/reports", "/comments", "/progress"]):
                cat = "5. Interações do Aluno (Comentários, Avaliações, Notas e Progresso)"
            elif any(k in path for k in ["/modules/", "/modules"]) and not any(k in path for k in ["/lessons"]):
                cat = "2. Gestão de Cursos e Módulos"
            elif path == "/api/v1/courses" or path == "/api/v1/courses/{course_id}":
                cat = "2. Gestão de Cursos e Módulos"
            elif any(k in path for k in ["/lessons", "/upload-video", "/upload-attachment", "/videos/", "/attachments/"]):
                cat = "3. Aulas, Vídeos, Conteúdo de Texto e Anexos"
            elif path.startswith("/api/v1/students"):
                cat = "6. Gestão de Alunos e Matrículas"
            elif path.startswith("/api/v1/support"):
                cat = "7. Suporte e Dúvidas da Comunidade"
            elif path.startswith("/api/v1/integrations"):
                cat = "8. Webhooks e Integrações Externas"
            elif path.startswith("/api/v1/backups"):
                cat = "9. Backups Automatizados e S3 (Backblaze B2)"
            elif path.startswith("/api/v1/logs"):
                cat = "10. Logs do Sistema e Auditoria"
            else:
                cat = "11. Plataforma e Configurações Globais"

            categories[cat].append((m, path, auth, text))

    lines = []
    lines.append("# 📚 Documentação Oficial de APIs da Plataforma")
    lines.append("")
    lines.append("> Mapeamento completo e atualizado de todos os endpoints REST da **Área de Membros**.")
    lines.append("")
    lines.append("## 🛡️ Legenda de Níveis de Acesso e Autorização")
    lines.append("- 🌐 **Público:** Não requer autenticação. Aberto para login, cadastro via convite e entrega de arquivos públicos.")
    lines.append("- 🔑 **Autenticado (Aluno / Admin):** Requer cabeçalho `Authorization: Bearer <token_jwt>`. Acessível por qualquer usuário logado.")
    lines.append("- 👑 **SuperAdmin (Manager):** Requer token JWT de usuário administrador (`role: superadmin`). Alunos comuns recebem `403 Forbidden`.")
    lines.append("")
    lines.append("---")
    lines.append("")

    total_rotas = 0
    for cat, items in categories.items():
        if not items:
            continue
        total_rotas += len(items)
        lines.append(f"## {cat} ({len(items)} rotas)")
        lines.append("")
        lines.append("| Método | Endpoint | Nível de Acesso | Descrição |")
        lines.append("| :--- | :--- | :--- | :--- |")
        for m, p, auth, text in items:
            badge = f"**`{m}`**"
            lines.append(f"| {badge} | `{p}` | {auth} | {text} |")
        lines.append("")

    lines.insert(4, f"**Total de endpoints catalogados:** {total_rotas} rotas.")
    lines.insert(5, "")

    with open("Arquivos/DOCUMENTACAO_APIS.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Documentação gerada com sucesso em Arquivos/DOCUMENTACAO_APIS.md com {total_rotas} rotas!")


if __name__ == "__main__":
    main()

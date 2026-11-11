#!/usr/bin/env python3
"""
Auditor de Endpoints: Documentação, Autenticação e Rate Limiting.
Varre endpoints recentes buscando ausência de:
1. Documentação (summary explícito no decorador e docstring clara)
2. Autenticação/Autorização em rotas privadas (get_current_user, require_role, etc.)
3. Rate Limiting (@limiter.limit)
"""

import os
import sys
import io

# Garante suporte a UTF-8 no Windows Console
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENDPOINTS_DIR = os.path.join(BASE_DIR, "backend", "app", "api", "v1", "endpoints")

# Módulos recentes criados/atualizados nas últimas fases
RECENT_MODULES = [
    "community_stories.py",
    "community_feed.py",
    "chat_superadmin_dms.py",
    "chat_members.py",
]

AUTH_DEPENDENCIES = [
    "get_current_user",
    "get_current_active_user",
    "require_role",
    "require_superadmin_user",
    "require_community_manager",
    "verify_api_key",
    "api_key",
]

PUBLIC_ROUTE_SUBSTRINGS = [
    "/media/",
    "/thumbnails/",
    "/videos/",
    "/attachments/",
]

def analyze_module(filename):
    fpath = os.path.join(ENDPOINTS_DIR, filename)
    if not os.path.exists(fpath):
        return []

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    endpoints = []

    for i, line in enumerate(lines):
        line_clean = line.strip()
        if line_clean.startswith(("@router.get(", "@router.post(", "@router.put(", "@router.delete(", "@router.patch(")):
            # Captura bloco do decorador até o def da função
            deco_block = []
            fn_sig_block = []
            j = i
            while j < len(lines) and not lines[j].strip().startswith(("def ", "async def ")):
                deco_block.append(lines[j].strip())
                j += 1
            if j < len(lines):
                deco_block.append(lines[j].strip())
                # Captura assinatura da função (até os dois pontos finais da assinatura)
                k = j
                while k < len(lines) and "):" not in lines[k]:
                    fn_sig_block.append(lines[k].strip())
                    k += 1
                if k < len(lines):
                    fn_sig_block.append(lines[k].strip())

            deco_text = " ".join(deco_block)
            fn_sig_text = " ".join(fn_sig_block)

            # Extrai método e rota
            method = "GET"
            for m in ["get", "post", "put", "delete", "patch"]:
                if f"@router.{m}" in deco_text.lower():
                    method = m.upper()
                    break

            route_path = "desconhecida"
            if "(" in deco_text:
                raw_path = deco_text.split("(", 1)[1].split(",")[0].strip("\"' ")
                route_path = raw_path

            # Verifica summary
            has_summary = "summary=" in deco_text

            # Verifica docstring
            has_docstring = False
            docstring_preview = ""
            if k + 1 < len(lines) and '"""' in lines[k + 1]:
                has_docstring = True
                docstring_preview = lines[k + 1].replace('"""', '').strip()

            # Verifica autenticação
            has_auth = any(auth_dep in fn_sig_text for auth_dep in AUTH_DEPENDENCIES)
            is_public = any(pub in route_path for pub in PUBLIC_ROUTE_SUBSTRINGS)

            # Verifica rate limit
            # Verifica se há @limiter.limit nas linhas acima do router ou dentro do bloco
            pre_range = lines[max(0, i - 4) : j]
            has_ratelimit = any("@limiter.limit" in l for l in pre_range)

            endpoints.append({
                "file": filename,
                "method": method,
                "path": route_path,
                "has_summary": has_summary,
                "has_docstring": has_docstring,
                "docstring_preview": docstring_preview,
                "has_auth": has_auth,
                "is_public": is_public,
                "has_ratelimit": has_ratelimit,
            })

    return endpoints

def run_audit():
    print("\n" + "=" * 80)
    print("📋 [AUDITORIA DE APIS RECENTES] Documentação, Autorização e Rate Limiting")
    print("=" * 80)

    total_endpoints = 0
    missing_summary = []
    missing_auth = []
    missing_ratelimit = []

    for mod in RECENT_MODULES:
        eps = analyze_module(mod)
        total_endpoints += len(eps)
        print(f"\n📂 Arquivo: {mod} ({len(eps)} endpoints)")
        print("-" * 80)

        for ep in eps:
            doc_str = "✅ Summary" if ep["has_summary"] else ("⚠️  Só Docstring" if ep["has_docstring"] else "❌ Sem Doc")
            auth_str = "✅ Autenticado" if ep["has_auth"] else ("🌐 Público (/media/)" if ep["is_public"] else "❌ SEM AUTORIZAÇÃO")
            limit_str = "✅ Rate Limit" if ep["has_ratelimit"] else "❌ SEM RATE LIMIT"

            if not ep["has_summary"]:
                missing_summary.append((mod, ep["method"], ep["path"]))
            if not ep["has_auth"] and not ep["is_public"]:
                missing_auth.append((mod, ep["method"], ep["path"]))
            if not ep["has_ratelimit"]:
                missing_ratelimit.append((mod, ep["method"], ep["path"]))

            print(f"[{ep['method']:<6}] {ep['path']:<42} | {doc_str:<15} | {auth_str:<18} | {limit_str}")

    print("\n" + "=" * 80)
    print(f"📊 RESUMO DO DIAGNÓSTICO:")
    print(f"   • Total de novos endpoints auditados: {total_endpoints}")
    print(f"   • Sem summary explícito no OpenAPI:  {len(missing_summary)}")
    print(f"   • Rotas privadas sem autenticação:    {len(missing_auth)}")
    print(f"   • Rotas sem rate limiting:           {len(missing_ratelimit)}")
    print("=" * 80)

    if missing_auth or missing_ratelimit or missing_summary:
        print("\n⛔ [BLOQUEIO ATIVADO] Existem pendências nos novos endpoints.")
        print("   O push para o GitHub está BLOQUEADO até que essas melhorias sejam decididas/aplicadas.\n")
        return False
    return True

if __name__ == "__main__":
    ok = run_audit()
    sys.exit(0 if ok else 1)

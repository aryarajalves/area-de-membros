"""
Serviço de Níveis de Gamificação (RPG Ladder System).
Define os 20 níveis progressivos de RPG, elos, patentes e cálculo de XP do aluno.
"""
from typing import Dict, Any, List, Optional

RPG_LEVELS: List[Dict[str, Any]] = [
    # ELO BRONZE (Níveis 1 ao 4)
    {"level": 1, "tier": "Bronze", "sub": "I", "title": "Bronze I", "badge": "🛡️ Bronze I", "min_points": 0, "color": "#cd7f32", "tier_color": "#cd7f32"},
    {"level": 2, "tier": "Bronze", "sub": "II", "title": "Bronze II", "badge": "🛡️ Bronze II", "min_points": 25, "color": "#cd7f32", "tier_color": "#cd7f32"},
    {"level": 3, "tier": "Bronze", "sub": "III", "title": "Bronze III", "badge": "🛡️ Bronze III", "min_points": 60, "color": "#cd7f32", "tier_color": "#cd7f32"},
    {"level": 4, "tier": "Bronze", "sub": "IV", "title": "Bronze IV", "badge": "🛡️ Bronze IV", "min_points": 110, "color": "#cd7f32", "tier_color": "#cd7f32"},

    # ELO PRATA (Níveis 5 ao 8)
    {"level": 5, "tier": "Prata", "sub": "I", "title": "Prata I", "badge": "⚔️ Prata I", "min_points": 180, "color": "#94a3b8", "tier_color": "#94a3b8"},
    {"level": 6, "tier": "Prata", "sub": "II", "title": "Prata II", "badge": "⚔️ Prata II", "min_points": 270, "color": "#94a3b8", "tier_color": "#94a3b8"},
    {"level": 7, "tier": "Prata", "sub": "III", "title": "Prata III", "badge": "⚔️ Prata III", "min_points": 380, "color": "#94a3b8", "tier_color": "#94a3b8"},
    {"level": 8, "tier": "Prata", "sub": "IV", "title": "Prata IV", "badge": "⚔️ Prata IV", "min_points": 510, "color": "#94a3b8", "tier_color": "#94a3b8"},

    # ELO OURO (Níveis 9 ao 12)
    {"level": 9, "tier": "Ouro", "sub": "I", "title": "Ouro I", "badge": "👑 Ouro I", "min_points": 660, "color": "#f59e0b", "tier_color": "#f59e0b"},
    {"level": 10, "tier": "Ouro", "sub": "II", "title": "Ouro II", "badge": "👑 Ouro II", "min_points": 840, "color": "#f59e0b", "tier_color": "#f59e0b"},
    {"level": 11, "tier": "Ouro", "sub": "III", "title": "Ouro III", "badge": "👑 Ouro III", "min_points": 1050, "color": "#f59e0b", "tier_color": "#f59e0b"},
    {"level": 12, "tier": "Ouro", "sub": "IV", "title": "Ouro IV", "badge": "👑 Ouro IV", "min_points": 1300, "color": "#f59e0b", "tier_color": "#f59e0b"},

    # ELO DIAMANTE (Níveis 13 ao 16)
    {"level": 13, "tier": "Diamante", "sub": "I", "title": "Diamante I", "badge": "💎 Diamante I", "min_points": 1600, "color": "#38bdf8", "tier_color": "#38bdf8"},
    {"level": 14, "tier": "Diamante", "sub": "II", "title": "Diamante II", "badge": "💎 Diamante II", "min_points": 1950, "color": "#38bdf8", "tier_color": "#38bdf8"},
    {"level": 15, "tier": "Diamante", "sub": "III", "title": "Diamante III", "badge": "💎 Diamante III", "min_points": 2350, "color": "#38bdf8", "tier_color": "#38bdf8"},
    {"level": 16, "tier": "Diamante", "sub": "IV", "title": "Diamante IV", "badge": "💎 Diamante IV", "min_points": 2800, "color": "#38bdf8", "tier_color": "#38bdf8"},

    # ELO LENDA (Níveis 17 ao 20)
    {"level": 17, "tier": "Lenda", "sub": "I", "title": "Lenda I", "badge": "🔥 Lenda I", "min_points": 3300, "color": "#a855f7", "tier_color": "#a855f7"},
    {"level": 18, "tier": "Lenda", "sub": "II", "title": "Lenda II", "badge": "🔥 Lenda II", "min_points": 3850, "color": "#a855f7", "tier_color": "#a855f7"},
    {"level": 19, "tier": "Lenda", "sub": "III", "title": "Lenda III", "badge": "🔥 Lenda III", "min_points": 4450, "color": "#ec4899", "tier_color": "#ec4899"},
    {"level": 20, "tier": "Lenda", "sub": "Suprema", "title": "Lenda Suprema", "badge": "🌟 Lenda Suprema", "min_points": 5000, "color": "#fbbf24", "tier_color": "#fbbf24"},
]


def calculate_student_level(total_points: int) -> Dict[str, Any]:
    """
    Calcula o nível RPG atual do aluno com base na pontuação acumulada.
    Retorna o nível, título, elo, badges, progresso percentual e pontos restantes.
    """
    pts = max(0, int(total_points or 0))

    current_idx = 0
    for idx, lvl in enumerate(RPG_LEVELS):
        if pts >= lvl["min_points"]:
            current_idx = idx
        else:
            break

    curr = RPG_LEVELS[current_idx]
    is_max = (current_idx == len(RPG_LEVELS) - 1)

    if is_max:
        next_min = None
        pts_to_next = 0
        progress_pct = 100
    else:
        next_lvl = RPG_LEVELS[current_idx + 1]
        next_min = next_lvl["min_points"]
        span = next_min - curr["min_points"]
        earned_in_level = pts - curr["min_points"]
        pts_to_next = max(0, next_min - pts)
        progress_pct = min(100, max(0, int((earned_in_level / span) * 100))) if span > 0 else 100

    return {
        "level": curr["level"],
        "level_title": curr["title"],
        "level_badge": curr["badge"],
        "level_tier": curr["tier"],
        "level_sub": curr["sub"],
        "level_color": curr["color"],
        "tier_color": curr["tier_color"],
        "current_level_min_points": curr["min_points"],
        "next_level_min_points": next_min,
        "points_to_next_level": pts_to_next,
        "level_progress_percent": progress_pct,
        "is_max_level": is_max,
    }


def get_all_rpg_levels() -> List[Dict[str, Any]]:
    """
    Retorna a lista completa dos 20 níveis com requisitos e detalhes para a interface.
    """
    result = []
    for idx, lvl in enumerate(RPG_LEVELS):
        next_min = RPG_LEVELS[idx + 1]["min_points"] if idx + 1 < len(RPG_LEVELS) else None
        result.append({
            **lvl,
            "next_level_min_points": next_min,
            "points_required": (next_min - lvl["min_points"]) if next_min else 0,
        })
    return result

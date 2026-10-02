import logging
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

BR_TZ = ZoneInfo("America/Sao_Paulo")

def brasilia_timetuple(*args):
    return datetime.now(BR_TZ).timetuple()

# Configuração do Logger Padrão do Sistema
logger = logging.getLogger("area_de_membros")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s")
    formatter.converter = brasilia_timetuple
    handler.setFormatter(formatter)
    logger.addHandler(handler)

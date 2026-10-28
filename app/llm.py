"""Integração com o provedor de modelo de linguagem (Groq).

Este é o único módulo que se comunica diretamente com o provedor.
Para trocar de provedor, basta alterar este arquivo.
"""

import logging

from groq import Groq

from app import config, rag
from app.prompts import montar_prompt

logger = logging.getLogger("uvicorn.error")

# Cliente reutilizado entre as requisições
_client = Groq(api_key=config.GROQ_API_KEY)

# Quantidade de perguntas recentes do aluno usadas na busca
PERGUNTAS_NA_BUSCA = 2


def _consulta_de_busca(historico: list[dict]) -> str:
    """Monta o texto da busca com as últimas perguntas do aluno.

    Usar mais de uma pergunta ajuda em mensagens curtas de continuação,
    como "e como resolvo?", que sozinhas não têm palavras úteis.
    """
    perguntas = [m["content"] for m in historico if m["role"] == "user"]
    return " ".join(perguntas[-PERGUNTAS_NA_BUSCA:])


def gerar_resposta(historico: list[dict], materia: str, modo: str) -> str:
    """Gera a resposta do tutor para o histórico recebido.

    Busca nos materiais do curso trechos relacionados à conversa e os
    inclui no prompt de sistema.

    Args:
        historico: Mensagens no formato {"role": "user" | "assistant", "content": str}.
        materia: Matéria usada para compor o prompt de sistema.
        modo: Modo de interação usado para compor o prompt de sistema.

    Returns:
        Texto da resposta gerada pelo modelo.
    """
    trechos = rag.buscar(_consulta_de_busca(historico))
    logger.info("RAG: %s", [(t.arquivo, t.pagina) for t in trechos])

    mensagens = [
        {"role": "system", "content": montar_prompt(materia, modo, trechos)}
    ] + historico

    resposta = _client.chat.completions.create(
        model=config.MODELO,
        messages=mensagens,
        temperature=config.TEMPERATURA,
    )
    return resposta.choices[0].message.content
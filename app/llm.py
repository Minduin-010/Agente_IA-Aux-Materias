"""Integração com o provedor de modelo de linguagem (Groq).

Este é o único módulo que se comunica diretamente com o provedor.
Para trocar de provedor, basta alterar este arquivo.
"""

from groq import Groq

from app import config
from app.prompts import montar_prompt

# Cliente reutilizado entre as requisições
_client = Groq(api_key=config.GROQ_API_KEY)


def gerar_resposta(historico: list[dict], materia: str, modo: str) -> str:
    """Gera a resposta do tutor para o histórico recebido.

    Args:
        historico: Mensagens no formato {"role": "user" | "assistant", "content": str}.
        materia: Matéria usada para compor o prompt de sistema.
        modo: Modo de interação usado para compor o prompt de sistema.

    Returns:
        Texto da resposta gerada pelo modelo.
    """
    mensagens = [{"role": "system", "content": montar_prompt(materia, modo)}] + historico

    resposta = _client.chat.completions.create(
        model=config.MODELO,
        messages=mensagens,
        temperature=config.TEMPERATURA,
    )
    return resposta.choices[0].message.content
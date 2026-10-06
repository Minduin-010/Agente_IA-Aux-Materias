import os
from dotenv import load_dotenv
from groq import Groq

from prompts import montar_prompt

load_dotenv()

MODELO = "openai/gpt-oss-120b"

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def gerar_resposta(historico: list[dict], materia: str, modo: str) -> str:
    """historico: lista de {"role": "user" | "assistant", "content": "..."}"""
    mensagens = [{"role": "system", "content": montar_prompt(materia, modo)}] + historico

    resposta = client.chat.completions.create(
        model=MODELO,
        messages=mensagens,
        temperature=0.6,
    )
    return resposta.choices[0].message.content
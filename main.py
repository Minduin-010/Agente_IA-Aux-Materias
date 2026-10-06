from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm import gerar_resposta
from prompts import MATERIAS, MODOS

app = FastAPI(title="Tutor IA")

# Permite que a tela (HTML) converse com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Mensagem(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class PedidoChat(BaseModel):
    materia: str = "Geral"
    modo: str = "Geral"
    historico: list[Mensagem]

@app.post("/chat")
def chat(pedido: PedidoChat):
    if pedido.materia not in MATERIAS:
        raise HTTPException(status_code=400, detail="Matéria inválida.")
    if pedido.modo not in MODOS:
        raise HTTPException(status_code=400, detail="Modo inválido.")
    if not pedido.historico:
        raise HTTPException(status_code=400, detail="Histórico vazio.")

    historico = [m.model_dump() for m in pedido.historico]

    try:
        resposta = gerar_resposta(historico, pedido.materia, pedido.modo)
    except Exception:
        raise HTTPException(status_code=502, detail="Erro ao falar com o modelo. Tente de novo.")

    return {"resposta": resposta}
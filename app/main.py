"""Ponto de entrada da API.

Cria a aplicação FastAPI, configura o CORS e expõe a rota de chat.
A lógica de geração de respostas fica em `app.llm`.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import config, rag
from app.llm import gerar_resposta
from app.prompts import MATERIAS, MODOS
from app.schemas import PedidoChat, RespostaChat

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Carrega o índice de busca dos materiais ao iniciar o servidor."""
    ignoradas = rag.carregar()
    logger.info(
        "RAG: %d trechos carregados (%d páginas ignoradas por texto quebrado)",
        rag.total_trechos(),
        ignoradas,
    )
    yield


app = FastAPI(title="Tutor IA", lifespan=lifespan)

# CORS: permite que a página (frontend) consuma a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ORIGENS_PERMITIDAS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat", response_model=RespostaChat)
def chat(pedido: PedidoChat) -> RespostaChat:
    """Recebe o histórico da conversa e devolve a resposta do tutor."""
    # Validação dos dados de entrada
    if pedido.materia not in MATERIAS:
        raise HTTPException(status_code=400, detail="Matéria inválida.")
    if pedido.modo not in MODOS:
        raise HTTPException(status_code=400, detail="Modo inválido.")
    if not pedido.historico:
        raise HTTPException(status_code=400, detail="Histórico vazio.")

    historico = [m.model_dump() for m in pedido.historico]

    # Chamada ao modelo; falhas do provedor viram erro 502 para o cliente
    try:
        resposta = gerar_resposta(historico, pedido.materia, pedido.modo)
    except Exception:
        logger.exception("Falha ao gerar resposta com o modelo")
        raise HTTPException(
            status_code=502,
            detail="Erro ao falar com o modelo. Tente de novo.",
        )

    return RespostaChat(resposta=resposta)  
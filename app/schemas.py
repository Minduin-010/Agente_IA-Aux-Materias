"""Modelos de entrada e saída da API.

Definem o formato esperado das requisições e das respostas, e são usados
pelo FastAPI para validar os dados automaticamente.
"""

from typing import Literal

from pydantic import BaseModel

from app import config


class Mensagem(BaseModel):
    """Uma mensagem do histórico da conversa.

    Apenas os papéis "user" e "assistant" são aceitos. O papel "system"
    é reservado ao prompt do tutor, definido no servidor.
    """

    role: Literal["user", "assistant"]
    content: str


class PedidoChat(BaseModel):
    """Corpo da requisição enviada à rota /chat."""

    materia: str = config.MATERIA_PADRAO
    modo: str = config.MODO_PADRAO
    historico: list[Mensagem]


class RespostaChat(BaseModel):
    """Corpo da resposta devolvida pela rota /chat."""

    resposta: str
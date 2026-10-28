"""Configurações centrais da aplicação.

Concentra variáveis de ambiente e constantes, de modo que nenhum outro
módulo precise ler o ambiente diretamente.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Credenciais do provedor de modelo
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Parâmetros do modelo
MODELO = "openai/gpt-oss-120b"
TEMPERATURA = 0.6

# Valores padrão quando o cliente não informa matéria ou modo
MATERIA_PADRAO = "Geral"
MODO_PADRAO = "Geral"

# Origens autorizadas a consumir a API (CORS)
ORIGENS_PERMITIDAS = ["*"]

# RAG (busca nos materiais do curso)
RAIZ = Path(__file__).resolve().parent.parent
PASTA_TEXTO = RAIZ / "dados" / "texto"  # Texto extraído dos PDFs
RAG_TRECHOS = 4  # Quantidade de trechos enviados ao modelo por pergunta

RAG_MAX_CARACTERES = 1500  # Tamanho máximo de cada trecho enviado ao modelo
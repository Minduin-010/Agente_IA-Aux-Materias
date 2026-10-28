"""Busca nos materiais do curso (RAG).

Carrega o texto extraído dos PDFs (dados/texto), trata cada página como um
trecho e oferece busca por palavras-chave com o algoritmo BM25.
O índice fica em memória e é montado uma vez, na inicialização.
"""

import json
import re
import unicodedata
from dataclasses import dataclass

from rank_bm25 import BM25Okapi

from app import config

# Páginas com menos caracteres que isto são ignoradas (capas, páginas em branco)
MIN_CARACTERES = 250

# Palavras muito comuns que não ajudam a diferenciar um trecho do outro
STOPWORDS = {
    "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos",
    "das", "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "sobre",
    "entre", "ao", "aos", "e", "ou", "que", "se", "como", "qual", "quais",
    "quando", "onde", "sao", "ser", "foi", "era", "mais", "menos", "mas",
    "isso", "isto", "este", "esta", "esse", "essa", "seu", "sua", "me", "te",
    "eu", "voce", "pode", "poderia", "explica", "explique", "ajuda", "ajude",
    "quero", "preciso", "fazer",
}

# Páginas em que mais que esta fração das linhas são resíduos de fórmulas
# (linhas de até 2 caracteres) são ignoradas, pois o texto saiu quebrado
MAX_FRACAO_RESIDUOS = 0.4

# Um trecho só é devolvido se a pontuação dele for pelo menos esta fração
# da pontuação do melhor resultado (evita trechos que só combinam por uma
# palavra comum)
PROPORCAO_MINIMA = 0.5


@dataclass
class Trecho:
    """Um trecho dos materiais (uma página de um PDF)."""

    materia: str
    arquivo: str
    pagina: int
    texto: str


# Estado do índice, preenchido por `carregar`
_trechos: list[Trecho] = []
_indice: BM25Okapi | None = None

def _fracao_residuos(texto: str) -> float:
    """Fração das linhas do texto bruto que são resíduos (até 2 caracteres)."""
    linhas = [l.strip() for l in texto.splitlines() if l.strip()]
    if not linhas:
        return 1.0
    return sum(1 for l in linhas if len(l) <= 2) / len(linhas)

def _limpar(texto: str) -> str:
    """Remove resíduos de fórmulas e junta as linhas em um texto corrido.

    Linhas com até 2 caracteres costumam ser pedaços de fórmulas quebradas
    na extração do PDF, então são descartadas.
    """
    linhas = [l.strip() for l in texto.splitlines()]
    linhas = [l for l in linhas if len(l) > 2]
    return re.sub(r"\s+", " ", " ".join(linhas)).strip()

# Expressões equivalentes reduzidas a um único termo. Assim, "segundo grau",
# "2º grau" e "quadrática" se encontram, e "2o" não combina com trechos sem
# relação (como "2o quadrante").
EQUIVALENCIAS = [
    (r"\b(1o|primeiro)\s+grau\b", "1ograu"),
    (r"\b(2o|segundo)\s+grau\b", "2ograu"),
    (r"\b(3o|terceiro)\s+grau\b", "3ograu"),
    (r"\bquadratic[ao]s?\b", "2ograu"),
]


def _radical(palavra: str) -> str:
    """Reduz plurais simples para que 'equações' e 'equação' se encontrem."""
    if len(palavra) > 4 and palavra.endswith("oes"):
        return palavra[:-3] + "ao"
    if len(palavra) > 3 and palavra.endswith("s"):
        return palavra[:-1]
    return palavra


def _tokenizar(texto: str) -> list[str]:
    """Converte o texto em palavras minúsculas, sem acentos e sem stopwords.

    A normalização NFKD também converte símbolos como 'º' e letras
    matemáticas (𝑎, 𝑥) em caracteres comuns. As equivalências são aplicadas
    depois dessa normalização.
    """
    decomposto = unicodedata.normalize("NFKD", texto.lower())
    texto = "".join(c for c in decomposto if unicodedata.category(c) != "Mn")

    for padrao, termo in EQUIVALENCIAS:
        texto = re.sub(padrao, termo, texto)

    palavras = re.findall(r"[a-z0-9]+", texto)
    return [_radical(p) for p in palavras if len(p) > 1 and p not in STOPWORDS]

def carregar() -> int:
    """Lê os textos extraídos e monta o índice de busca.

    Returns:
        Quantidade de páginas ignoradas por terem o texto quebrado.
    """
    global _trechos, _indice

    trechos: list[Trecho] = []
    ignoradas = 0

    for caminho in sorted(config.PASTA_TEXTO.rglob("*.json")):
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        for pagina in dados["paginas"]:
            bruto = pagina["texto"]
            texto = _limpar(bruto)
            if len(texto) < MIN_CARACTERES:
                continue
            if _fracao_residuos(bruto) > MAX_FRACAO_RESIDUOS:
                ignoradas += 1
                continue
            trechos.append(
                Trecho(dados["materia"], dados["arquivo"], pagina["pagina"], texto)
            )

    _trechos = trechos
    _indice = BM25Okapi([_tokenizar(t.texto) for t in trechos]) if trechos else None
    return ignoradas
    _indice = BM25Okapi([_tokenizar(t.texto) for t in trechos]) if trechos else None


def total_trechos() -> int:
    """Quantidade de trechos carregados."""
    return len(_trechos)


def buscar(pergunta: str, k: int = config.RAG_TRECHOS) -> list[Trecho]:
    """Retorna os trechos mais relevantes para a pergunta (até k).

    Descarta trechos com pontuação muito abaixo da do melhor resultado.
    Devolve lista vazia se não houver índice ou se nenhum trecho combinar.
    """
    if _indice is None:
        return []

    palavras = _tokenizar(pergunta)
    if not palavras:
        return []

    pontuacoes = _indice.get_scores(palavras)
    ordem = sorted(range(len(_trechos)), key=lambda i: pontuacoes[i], reverse=True)

    melhor = pontuacoes[ordem[0]] if ordem else 0
    if melhor <= 0:
        return []

    limite = melhor * PROPORCAO_MINIMA
    return [_trechos[i] for i in ordem[:k] if pontuacoes[i] >= limite]
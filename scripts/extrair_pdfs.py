"""Extrai o texto dos PDFs de dados/materiais e salva em dados/texto.

Cada PDF gera um arquivo JSON com o texto separado por página, para que
as respostas do tutor possam citar a página de origem.

Uso (a partir da raiz do projeto):
    python scripts/extrair_pdfs.py
"""

import json
from pathlib import Path

import fitz  # PyMuPDF

RAIZ = Path(__file__).resolve().parent.parent
PASTA_PDFS = RAIZ / "dados" / "materias"
PASTA_TEXTO = RAIZ / "dados" / "texto"

# Páginas com menos caracteres que isto provavelmente são imagens
MIN_CARACTERES = 50


def extrair_pdf(caminho: Path) -> list[dict]:
    """Retorna o texto de cada página do PDF."""
    paginas = []
    with fitz.open(caminho) as pdf:
        for numero, pagina in enumerate(pdf, start=1):
            paginas.append({"pagina": numero, "texto": pagina.get_text().strip()})
    return paginas


def main() -> None:
    pdfs = sorted(PASTA_PDFS.rglob("*.pdf"))
    if not pdfs:
        print(f"Nenhum PDF encontrado em {PASTA_PDFS}")
        return

    for caminho in pdfs:
        materia = caminho.parent.name

        try:
            paginas = extrair_pdf(caminho)
        except Exception as erro:
            print(f"[ERRO] {materia}/{caminho.name}: {erro}")
            continue

        pouco_texto = sum(1 for p in paginas if len(p["texto"]) < MIN_CARACTERES)

        destino = PASTA_TEXTO / materia / (caminho.stem + ".json")
        destino.parent.mkdir(parents=True, exist_ok=True)
        dados = {"materia": materia, "arquivo": caminho.name, "paginas": paginas}
        destino.write_text(
            json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        print(
            f"{materia}/{caminho.name}: {len(paginas)} páginas, "
            f"{pouco_texto} com pouco texto"
        )


if __name__ == "__main__":
    main()
"""Teste manual da busca nos materiais.

Uso (a partir da raiz do projeto):
    python -m scripts.testar_busca
"""

from app import rag

ignoradas = rag.carregar()
print(
    f"{rag.total_trechos()} trechos carregados "
    f"({ignoradas} páginas ignoradas por texto quebrado). "
    "Digite 'sair' para encerrar.\n"
)

while True:
    pergunta = input("Busca: ").strip()
    if pergunta.lower() == "sair":
        break

    resultados = rag.buscar(pergunta)
    if not resultados:
        print("  Nada encontrado.\n")
        continue

    for r in resultados:
        print(f"  [{r.materia}] {r.arquivo}, página {r.pagina}")
        print(f"    {r.texto[:200]}...")
    print()
from llm import gerar_resposta

materia = "Banco de dados"
modo = "Explicar"
historico = []

print(f"Tutor | {materia} | {modo} (digite 'sair' para encerrar)\n")

while True:
    pergunta = input("Você: ")
    if pergunta.strip().lower() == "sair":
        break
    historico.append({"role": "user", "content": pergunta})
    resposta = gerar_resposta(historico, materia, modo)
    historico.append({"role": "assistant", "content": resposta})
    print(f"\nTutor: {resposta}\n")
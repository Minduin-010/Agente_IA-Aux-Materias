# Tutor IA

Assistente de IA focado em estudos (matérias do ensino básico e do curso técnico).

## Como rodar

1. Crie e ative o ambiente virtual:
   python -m venv venv
   venv\Scripts\activate
2. Instale as dependências:
   pip install -r requirements.txt
3. Copie `.env.example` para `.env` e coloque sua chave do Groq (console.groq.com).
4. Inicie a API:
   uvicorn main:app --reload
5. Abra `frontend/index.html` no navegador.
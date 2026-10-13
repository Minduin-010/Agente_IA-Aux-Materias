/**
 * Configurações da interface.
 * Concentra constantes para que nenhum outro módulo tenha valores fixos.
 */

// Endereço do back-end
const API_URL = "http://127.0.0.1:8000";

// Chave usada para salvar o histórico no navegador
const CHAVE_HISTORICO = "tutor-ia-historico";

// Mensagem exibida no início de cada conversa
const BOAS_VINDAS =
  "Olá! Sou seu tutor de estudos. Me pergunte sobre qualquer matéria da escola ou do curso técnico.";

// Perguntas sugeridas exibidas na tela inicial
const SUGESTOES = [
  "Me explica o que é um branch no Git",
  "Quero treinar SELECT em SQL",
  "Me ajuda a entender frações",
  "Me faz um quiz de HTML e CSS",
];
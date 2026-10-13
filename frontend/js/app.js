/**
 * Fluxo principal da aplicação.
 * Controla o estado da conversa e conecta a interface (ui.js),
 * a API (api.js) e o armazenamento (storage.js).
 */

// Estado
let historico = []; // Mensagens da conversa atual
let ocupado = false; // Indica se há uma resposta em andamento

// Início da conversa

/** Exibe a saudação e as sugestões de perguntas. */
function iniciar() {
  adicionarMensagem(BOAS_VINDAS, "tutor");
  mostrarSugestoes(SUGESTOES, enviar);
}

/** Restaura a conversa salva ou, se não houver, inicia uma nova. */
function restaurar() {
  const salvo = carregarHistorico();

  if (salvo.length === 0) {
    iniciar();
    return;
  }

  historico = salvo;
  for (const m of historico) {
    adicionarMensagem(m.content, m.role === "user" ? "user" : "tutor");
  }
}

/** Descarta a conversa atual e recomeça do zero. */
function novaConversa() {
  historico = [];
  salvarHistorico(historico);
  limparMensagens();
  iniciar();
  elEntrada.focus();
}

// Envio de perguntas

/**
 * Envia a pergunta ao tutor e exibe a resposta.
 * Em caso de falha, a pergunta é removida do histórico para não ficar sem resposta.
 * @param {string} texto Pergunta do aluno.
 */
async function enviar(texto) {
  if (!texto || ocupado) return;
  ocupado = true;

  removerSugestoes();
  adicionarMensagem(texto, "user");
  historico.push({ role: "user", content: texto });
  limparEntrada();
  definirOcupado(true);

  const aguardando = mostrarDigitando();

  try {
    const resposta = await enviarChat(historico);
    mostrarResposta(aguardando, resposta);
    historico.push({ role: "assistant", content: resposta });
  } catch (erro) {
    mostrarErro(aguardando, "Ops, algo deu errado. Tente de novo.");
    historico.pop();
  } finally {
    salvarHistorico(historico);
    ocupado = false;
    definirOcupado(false);
    rolarParaOFim();
  }
}

// Eventos

/** Registra os eventos da interface. */
function registrarEventos() {
  // Envio pelo botão
  elFormulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    enviar(elEntrada.value.trim());
  });

  // Enter envia; Shift+Enter quebra linha
  elEntrada.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      elFormulario.requestSubmit();
    }
  });

  // O campo cresce conforme o texto digitado
  elEntrada.addEventListener("input", ajustarAlturaEntrada);

  elNova.addEventListener("click", novaConversa);
}

// Inicialização
registrarEventos();
restaurar();
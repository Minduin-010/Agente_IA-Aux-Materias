/**
 * Interface: criação e atualização dos elementos da página.
 * Não contém regras de negócio nem chamadas ao back-end.
 */

// Elementos fixos da página
const elMensagens = document.getElementById("mensagens");
const elFormulario = document.getElementById("formulario");
const elEntrada = document.getElementById("entrada");
const elEnviar = document.getElementById("enviar");
const elNova = document.getElementById("nova");

// Rolagem

/** Rola a área de mensagens até a última mensagem. */
function rolarParaOFim() {
  elMensagens.scrollTop = elMensagens.scrollHeight;
}

// Renderização das mensagens

/**
 * Copia um texto para a área de transferência.
 * Usa um método alternativo quando a API moderna não está disponível.
 * @param {string} texto
 * @returns {Promise<void>}
 */
function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }

  return new Promise((ok) => {
    const area = document.createElement("textarea");
    area.value = texto;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    ok();
  });
}

/**
 * Adiciona o botão "Copiar" a cada bloco de código da mensagem.
 * @param {HTMLElement} div Elemento da mensagem.
 */
function adicionarBotoesCopiar(div) {
  div.querySelectorAll("pre").forEach((pre) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn-copiar";
    botao.textContent = "Copiar";

    botao.addEventListener("click", async () => {
      const codigo = pre.querySelector("code");
      await copiarTexto(codigo ? codigo.innerText : pre.innerText);
      botao.textContent = "Copiado!";
      setTimeout(() => (botao.textContent = "Copiar"), 1500);
    });

    pre.appendChild(botao);
  });
}

/**
 * Escreve o texto na mensagem.
 * Respostas do tutor são convertidas de Markdown para HTML e higienizadas;
 * mensagens do aluno são exibidas como texto puro.
 * @param {HTMLElement} div Elemento da mensagem.
 * @param {string} texto
 */
function renderizar(div, texto) {
  if (div.classList.contains("tutor")) {
    div.innerHTML = DOMPurify.sanitize(marked.parse(texto));
    adicionarBotoesCopiar(div);
  } else {
    div.textContent = texto;
  }
}

/**
 * Adiciona uma mensagem à conversa.
 * @param {string} texto
 * @param {"user" | "tutor"} quem Autor da mensagem.
 * @returns {HTMLElement} Elemento do balão da mensagem.
 */
function adicionarMensagem(texto, quem) {
  const linha = document.createElement("div");
  linha.className = "linha " + quem;

  if (quem === "tutor") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🎓";
    linha.appendChild(avatar);
  }

  const div = document.createElement("div");
  div.className = "msg " + quem;
  renderizar(div, texto);
  linha.appendChild(div);

  elMensagens.appendChild(linha);
  rolarParaOFim();
  return div;
}

/** Limpa todas as mensagens da tela. */
function limparMensagens() {
  elMensagens.innerHTML = "";
}

// Estados da resposta do tutor

/**
 * Exibe o indicador de digitação como uma mensagem do tutor.
 * @returns {HTMLElement} Elemento a ser preenchido depois com a resposta.
 */
function mostrarDigitando() {
  const div = adicionarMensagem("", "tutor");
  div.classList.add("digitando");
  div.innerHTML = "<span></span><span></span><span></span>";
  return div;
}

/**
 * Substitui o indicador de digitação pela resposta.
 * @param {HTMLElement} div Elemento retornado por `mostrarDigitando`.
 * @param {string} texto
 */
function mostrarResposta(div, texto) {
  div.classList.remove("digitando");
  renderizar(div, texto);
}

/**
 * Substitui o indicador de digitação por uma mensagem de erro.
 * @param {HTMLElement} div Elemento retornado por `mostrarDigitando`.
 * @param {string} texto
 */
function mostrarErro(div, texto) {
  div.classList.remove("digitando");
  div.textContent = texto;
}

// Sugestões de perguntas

/**
 * Exibe botões de sugestão na conversa.
 * @param {string[]} textos Perguntas sugeridas.
 * @param {(texto: string) => void} aoClicar Chamado com o texto escolhido.
 */
function mostrarSugestoes(textos, aoClicar) {
  const caixa = document.createElement("div");
  caixa.className = "sugestoes";

  for (const texto of textos) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = texto;
    chip.addEventListener("click", () => aoClicar(texto));
    caixa.appendChild(chip);
  }

  elMensagens.appendChild(caixa);
}

/** Remove os botões de sugestão, se estiverem na tela. */
function removerSugestoes() {
  const caixa = document.querySelector(".sugestoes");
  if (caixa) caixa.remove();
}

// Campo de entrada e controles

/** Limpa o campo de entrada e restaura a altura original. */
function limparEntrada() {
  elEntrada.value = "";
  elEntrada.style.height = "auto";
}

/** Ajusta a altura do campo de entrada ao tamanho do texto. */
function ajustarAlturaEntrada() {
  elEntrada.style.height = "auto";
  elEntrada.style.height = elEntrada.scrollHeight + "px";
}

/**
 * Bloqueia ou libera os controles durante a espera pela resposta.
 * @param {boolean} ocupado
 */
function definirOcupado(ocupado) {
  elEnviar.disabled = ocupado;
  elNova.disabled = ocupado;
  elEntrada.disabled = ocupado;
  if (!ocupado) elEntrada.focus();
}
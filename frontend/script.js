const API = "http://127.0.0.1:8000";

const areaMensagens = document.getElementById("mensagens");
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const botaoEnviar = document.getElementById("enviar");
const botaoNova = document.getElementById("nova");

const SUGESTOES = [
  "Me explica o que é um branch no Git",
  "Quero treinar SELECT em SQL",
  "Me ajuda a entender frações",
  "Me faz um quiz de HTML e CSS",
];

let historico = [];

function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }
  // Plano B para contextos sem acesso à área de transferência
  return new Promise((ok) => {
    const t = document.createElement("textarea");
    t.value = texto;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
    ok();
  });
}

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

function renderizar(div, texto) {
  if (div.classList.contains("tutor")) {
    div.innerHTML = DOMPurify.sanitize(marked.parse(texto));
    adicionarBotoesCopiar(div);
  } else {
    div.textContent = texto;
  }
}

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

  areaMensagens.appendChild(linha);
  areaMensagens.scrollTop = areaMensagens.scrollHeight;
  return div;
}

function mostrarSugestoes() {
  const caixa = document.createElement("div");
  caixa.className = "sugestoes";
  for (const texto of SUGESTOES) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = texto;
    chip.addEventListener("click", () => enviar(texto));
    caixa.appendChild(chip);
  }
  areaMensagens.appendChild(caixa);
}

const CHAVE = "tutor-ia-historico";

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(historico));
  } catch (e) {}
}

function restaurar() {
  let salvo = [];
  try {
    salvo = JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch (e) {}

  salvo = Array.isArray(salvo)
    ? salvo.filter(
        (m) =>
          m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
      )
    : [];

  if (salvo.length === 0) {
    iniciar();
    return;
  }

  historico = salvo;
  for (const m of historico) {
    adicionarMensagem(m.content, m.role === "user" ? "user" : "tutor");
  }
}

function iniciar() {
  adicionarMensagem("Olá! Sou seu tutor de estudos. Me pergunte sobre qualquer matéria da escola ou do curso técnico.", "tutor");
  mostrarSugestoes();
}

function novaConversa() {
  historico = [];
  salvar();
  areaMensagens.innerHTML = "";
  iniciar();
  entrada.focus();
}

botaoNova.addEventListener("click", novaConversa);

// Enter envia; Shift+Enter quebra linha
entrada.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    formulario.requestSubmit();
  }
});

// A caixa cresce conforme o texto
entrada.addEventListener("input", () => {
  entrada.style.height = "auto";
  entrada.style.height = entrada.scrollHeight + "px";
});

async function enviar(texto) {
  if (!texto || botaoEnviar.disabled) return;

  const sugestoes = document.querySelector(".sugestoes");
  if (sugestoes) sugestoes.remove();

  adicionarMensagem(texto, "user");
  historico.push({ role: "user", content: texto });
  entrada.value = "";
  entrada.style.height = "auto";

  botaoEnviar.disabled = true;
  botaoNova.disabled = true;
  entrada.disabled = true;

  const aguardando = adicionarMensagem("", "tutor");
  aguardando.classList.add("digitando");
  aguardando.innerHTML = "<span></span><span></span><span></span>";

  try {
    const resp = await fetch(API + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historico: historico }),
    });

    if (!resp.ok) throw new Error("Erro " + resp.status);

    const dados = await resp.json();
    aguardando.classList.remove("digitando");
    renderizar(aguardando, dados.resposta);
    historico.push({ role: "assistant", content: dados.resposta });
  } catch (erro) {
    aguardando.classList.remove("digitando");
    aguardando.textContent = "Ops, algo deu errado. Tente de novo.";
    historico.pop(); // remove a pergunta que não foi respondida
  } finally {
    salvar();
    botaoEnviar.disabled = false;
    botaoNova.disabled = false;
    entrada.disabled = false;
    entrada.focus();
    areaMensagens.scrollTop = areaMensagens.scrollHeight;
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  enviar(entrada.value.trim());
});

restaurar();
const API = "http://127.0.0.1:8000";

const areaMensagens = document.getElementById("mensagens");
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const botaoEnviar = document.getElementById("enviar");

let historico = [];

function renderizar(div, texto) {
    if (div.classList.contains("tutor")) {
      div.innerHTML = DOMPurify.sanitize(marked.parse(texto));
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

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const texto = entrada.value.trim();
    if (!texto) return;

    adicionarMensagem(texto, "user");
    historico.push({ role: "user", content: texto });
    entrada.value = "";

    botaoEnviar.disabled = true;
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
        renderizar(aguardando, dados.resposta);
        historico.push({ role: "assistant", content: dados.resposta });
    } catch (erro) {
        aguardando.textContent = "Ops, algo deu errado. Tente de novo.";
        historico.pop(); // remove a pergunta que não foi respondida
    } finally {
        aguardando.classList.remove("digitando");
        botaoEnviar.disabled = false;
        entrada.disabled = false;
        entrada.focus();
        areaMensagens.scrollTop = areaMensagens.scrollHeight;
    }
});

adicionarMensagem("Olá! Sou seu tutor de estudos. Me pergunte sobre qualquer matéria da escola ou do curso técnico.", "tutor");
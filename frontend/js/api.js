/**
 * Comunicação com o back-end.
 * Único módulo que realiza requisições HTTP.
 */

/**
 * Envia o histórico da conversa e retorna a resposta do tutor.
 * @param {Array<{role: string, content: string}>} historico
 * @returns {Promise<string>} Texto da resposta.
 * @throws {Error} Se a API retornar um status diferente de sucesso.
 */
async function enviarChat(historico) {
    const resp = await fetch(API_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historico: historico }),
    });
  
    if (!resp.ok) {
      throw new Error("Erro " + resp.status);
    }
  
    const dados = await resp.json();
    return dados.resposta;
  }
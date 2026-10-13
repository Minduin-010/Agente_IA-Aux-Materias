/**
 * Persistência do histórico no navegador (localStorage).
 * Falhas de acesso ao armazenamento são ignoradas, pois a aplicação
 * funciona normalmente sem ele.
 */

/**
 * Salva o histórico da conversa.
 * @param {Array<{role: string, content: string}>} historico
 */
function salvarHistorico(historico) {
    try {
      localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
    } catch (e) {
      // Armazenamento indisponível: segue sem salvar
    }
  }
  
  /**
   * Carrega o histórico salvo, descartando entradas inválidas.
   * @returns {Array<{role: string, content: string}>} Histórico, ou lista vazia.
   */
  function carregarHistorico() {
    let salvo = [];
    try {
      salvo = JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
    } catch (e) {
      return [];
    }
  
    if (!Array.isArray(salvo)) return [];
  
    return salvo.filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    );
  }
/* Pequenos utilitários de DOM (sem framework). */

// Escapa texto para inserção segura via innerHTML
export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Cria um elemento a partir de uma string HTML (1 nó raiz)
export function html(strings, ...values) {
  const str = Array.isArray(strings)
    ? strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "")
    : String(strings);
  const tpl = document.createElement("template");
  tpl.innerHTML = str.trim();
  return tpl.content.firstElementChild;
}

// Limpa e injeta HTML num container
export function render(container, htmlString) {
  container.innerHTML = htmlString;
}

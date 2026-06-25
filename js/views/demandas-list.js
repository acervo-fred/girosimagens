/* Demandas / Pendências — tarefas de todos os projetos.
   Filtro por status, criar, editar, excluir e navegar para o projeto. */

import { store } from "../data/store.js";
import { esc } from "../ui/dom.js";
import { badgeFromLista } from "../ui/badges.js";
import { abrirNovaDemanda } from "./cadastros.js";

export async function renderDemandasLista(app) {
  const [demandas, listas] = await Promise.all([store.listDemandas(), store.getListas()]);
  let busca = "";
  let filtro = "Todas";

  const abertas = demandas.filter((d) => d.status === "Aberta" || d.status === "Em andamento").length;

  app.innerHTML = `
    <div class="page-head">
      <div><h1 class="page-title">Demandas</h1>
        <div class="page-sub">${demandas.length} no total · ${abertas} em aberto</div></div>
      <div class="toolbar"><button class="btn btn-amber" data-act="nova">+ Cadastrar demanda</button></div>
    </div>
    <div class="toolbar" style="margin-bottom:14px">
      <input class="input" id="busca" type="search" placeholder="Buscar pendência ou projeto…" />
    </div>
    <div class="filter-row" id="filtros"></div>
    <div class="list-card" id="lista"></div>
  `;

  const valores = ["Todas", ...listas.statusDemanda.map((s) => s.valor)];
  const filtros = app.querySelector("#filtros");
  filtros.innerHTML = valores.map((v) =>
    `<button class="chip ${v === "Todas" ? "active" : ""}" data-f="${esc(v)}">${esc(v)}</button>`).join("");

  const lista = app.querySelector("#lista");
  const porId = Object.fromEntries(demandas.map((d) => [d.id, d]));

  function desenhar() {
    const t = busca.trim().toLowerCase();
    const arr = demandas.filter((d) => {
      const okBusca = !t || (d.pendencia || "").toLowerCase().includes(t) || (d.projetoNome || "").toLowerCase().includes(t);
      const okFiltro = filtro === "Todas" || d.status === filtro;
      return okBusca && okFiltro;
    });
    lista.innerHTML = (arr.length
      ? `<div class="dem-header"><div class="lr-main"></div><div class="dem-col">Prioridade</div><div class="dem-col">Status</div><div style="width:56px"></div></div>`
        + arr.map((d) => row(d, listas)).join("")
      : `<div class="empty">Nenhuma demanda encontrada.</div>`);
  }
  desenhar();

  app.querySelector("#busca").addEventListener("input", (e) => { busca = e.target.value; desenhar(); });
  app.querySelector('[data-act="nova"]').addEventListener("click", () => abrirNovaDemanda());
  filtros.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    filtro = chip.dataset.f;
    filtros.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    desenhar();
  });

  lista.addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    const rowEl = e.target.closest(".list-row");
    if (ed) return abrirNovaDemanda(null, porId[ed.dataset.id]);
    if (del) {
      const d = porId[del.dataset.id];
      if (!confirm(`Excluir a pendência "${d.pendencia}"?`)) return;
      await store.removeDemanda(d.id);
      window.dispatchEvent(new CustomEvent("data-changed"));
      return;
    }
    if (rowEl) location.hash = `#/projeto/${rowEl.dataset.projeto}`;
  });
}

function row(d, listas) {
  return `<div class="list-row clickable" data-projeto="${esc(d.projetoId)}">
    <div class="lr-main">
      <div class="lr-title">${esc(d.pendencia)}</div>
      <div class="lr-sub"><strong>${esc(d.projetoNome)}</strong> · ${esc(d.responsavel || "—")}</div>
    </div>
    <div class="dem-col">${badgeFromLista(listas.prioridade, d.prioridade)}</div>
    <div class="dem-col">${badgeFromLista(listas.statusDemanda, d.status)}</div>
    <span class="lr-actions">
      <button class="icon-btn" data-edit data-id="${esc(d.id)}" title="Editar">✎</button>
      <button class="icon-btn danger" data-del data-id="${esc(d.id)}" title="Excluir">🗑</button>
    </span>
  </div>`;
}

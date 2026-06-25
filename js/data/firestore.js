/* ============================================================
   Backend Firestore — implementa a MESMA API do mockStore.
   Projeto giros-imagens, banco Firestore (NÃO o Realtime DB).
   Só inicializa Firestore; o RTDB existente não é tocado.

   Campos derivados (localizacoes, ultimaAtualizacao) continuam
   calculados no cliente, nunca gravados.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig, COLLECTIONS } from "../config/firebase-config.js";
import { listas as listasDefault } from "./mock.js";

const app = initializeApp(firebaseConfig);
const fdb = getFirestore(app);

/* ---------- helpers de leitura ---------- */
async function allDocs(coll) {
  const snap = await getDocs(collection(fdb, coll));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function docsWhere(coll, campo, valor) {
  const snap = await getDocs(query(collection(fdb, coll), where(campo, "==", valor)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------- derivação (cliente) ---------- */
function localizacoesDeProjeto(projetoId, midias) {
  return midias.filter((m) => (m.projetosArmazenados || []).includes(projetoId)).map((m) => m.nome);
}
function ultimaAtualizacao(projetoId, historico) {
  const datas = historico.filter((h) => h.projetoId === projetoId && h.data).map((h) => h.data).sort();
  return datas.length ? datas[datas.length - 1] : null;
}

export const firestoreStore = {
  /* LISTAS (doc único acervo_config/listas) */
  async getListas() {
    const ref = doc(fdb, COLLECTIONS.config, "listas");
    const snap = await getDoc(ref);
    const stored = snap.exists() ? snap.data() : {};
    // defaults garantem que categorias ainda não salvas funcionem
    return { ...structuredClone(listasDefault), ...stored };
  },
  async saveLista(chave, valores) {
    const ref = doc(fdb, COLLECTIONS.config, "listas");
    await setDoc(ref, { [chave]: valores }, { merge: true });
    return valores;
  },

  /* PROJETOS */
  async listProjetos() {
    const [projetos, midias, historico] = await Promise.all([
      allDocs(COLLECTIONS.projetos),
      allDocs(COLLECTIONS.midias),
      allDocs(COLLECTIONS.historico),
    ]);
    return projetos.map((p) => ({
      ...p,
      localizacoes: localizacoesDeProjeto(p.id, midias),
      ultimaAtualizacao: ultimaAtualizacao(p.id, historico),
    }));
  },
  async getProjeto(id) {
    const snap = await getDoc(doc(fdb, COLLECTIONS.projetos, id));
    if (!snap.exists()) return null;
    const [midias, historico] = await Promise.all([
      allDocs(COLLECTIONS.midias),
      docsWhere(COLLECTIONS.historico, "projetoId", id),
    ]);
    const p = { id: snap.id, ...snap.data() };
    return {
      ...p,
      localizacoes: localizacoesDeProjeto(id, midias),
      ultimaAtualizacao: ultimaAtualizacao(id, historico),
    };
  },

  /* MÍDIAS */
  async listMidias() {
    return allDocs(COLLECTIONS.midias);
  },
  async getMidia(id) {
    const snap = await getDoc(doc(fdb, COLLECTIONS.midias, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  async midiasDoProjeto(projetoId) {
    const snap = await getDocs(query(
      collection(fdb, COLLECTIONS.midias),
      where("projetosArmazenados", "array-contains", projetoId)
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async projetosDaMidia(midiaId) {
    const m = await this.getMidia(midiaId);
    if (!m) return [];
    const ids = m.projetosArmazenados || [];
    const projetos = await allDocs(COLLECTIONS.projetos);
    const porId = Object.fromEntries(projetos.map((p) => [p.id, p]));
    return ids.map((pid) => {
      const p = porId[pid];
      return p
        ? { id: p.id, nome: p.nome, ano: p.ano, statusProjeto: p.statusProjeto, existe: true }
        : { id: pid, nome: "(projeto removido)", ano: "", statusProjeto: null, existe: false };
    });
  },

  /* ESTRUTURA */
  async estruturaDoProjeto(projetoId) {
    const [pastas, midias] = await Promise.all([
      docsWhere(COLLECTIONS.estrutura, "projetoId", projetoId),
      allDocs(COLLECTIONS.midias),
    ]);
    const locais = localizacoesDeProjeto(projetoId, midias);
    return pastas.map((e) => ({ ...e, localizacoes: locais }));
  },

  /* HISTÓRICO */
  async historicoDoProjeto(projetoId) {
    const hist = await docsWhere(COLLECTIONS.historico, "projetoId", projetoId);
    return hist.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  },

  /* DEMANDAS */
  async demandasDoProjeto(projetoId) {
    return docsWhere(COLLECTIONS.demandas, "projetoId", projetoId);
  },
  async listDemandas() {
    const [demandas, projetos] = await Promise.all([
      allDocs(COLLECTIONS.demandas), allDocs(COLLECTIONS.projetos),
    ]);
    const nomePorId = Object.fromEntries(projetos.map((p) => [p.id, p.nome]));
    return demandas.map((d) => ({ ...d, projetoNome: nomePorId[d.projetoId] || "—" }));
  },

  /* HISTÓRICO global (com nome do projeto, recente→antigo) */
  async listHistorico() {
    const [historico, projetos] = await Promise.all([
      allDocs(COLLECTIONS.historico), allDocs(COLLECTIONS.projetos),
    ]);
    const nomePorId = Object.fromEntries(projetos.map((p) => [p.id, p.nome]));
    return historico
      .map((h) => ({ ...h, projetoNome: nomePorId[h.projetoId] || "—" }))
      .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  },

  /* ESCRITA */
  async addProjeto(d) {
    const ref = await addDoc(collection(fdb, COLLECTIONS.projetos), {
      nome: d.nome, ano: d.ano, statusProjeto: d.statusProjeto,
      atividadeAtual: d.atividadeAtual, alfred: d.alfred, lto: d.lto || [],
    });
    return { id: ref.id, ...d };
  },
  async addMidia(d) {
    const ref = await addDoc(collection(fdb, COLLECTIONS.midias), {
      nome: d.nome, tipo: d.tipo, capacidade: d.capacidade || "",
      statusMidia: d.statusMidia, projetosArmazenados: d.projetosArmazenados || [],
      conteudo: d.conteudo || "",
    });
    return { id: ref.id, ...d };
  },
  async addEstrutura(d) {
    const ref = await addDoc(collection(fdb, COLLECTIONS.estrutura), {
      projetoId: d.projetoId, caminho: d.caminho, tipoMaterial: d.tipoMaterial,
      resumo: d.resumo || "", statusPasta: d.statusPasta, arquivadoLto: d.arquivadoLto || "",
    });
    return { id: ref.id, ...d };
  },
  async addHistorico(d) {
    const ref = await addDoc(collection(fdb, COLLECTIONS.historico), {
      projetoId: d.projetoId, periodoTipo: d.periodoTipo, periodo: d.periodo,
      acao: d.acao, observacoes: d.observacoes || "", data: d.data,
    });
    return { id: ref.id, ...d };
  },
  async addDemanda(d) {
    const ref = await addDoc(collection(fdb, COLLECTIONS.demandas), {
      projetoId: d.projetoId, pendencia: d.pendencia, prioridade: d.prioridade,
      responsavel: d.responsavel, status: d.status,
    });
    return { id: ref.id, ...d };
  },

  /* ---------- EDIÇÃO ---------- */
  async updateProjeto(id, campos) { await updateDoc(doc(fdb, COLLECTIONS.projetos, id), campos); return { id, ...campos }; },
  async updateMidia(id, campos) { await updateDoc(doc(fdb, COLLECTIONS.midias, id), campos); return { id, ...campos }; },
  async updateEstrutura(id, campos) { await updateDoc(doc(fdb, COLLECTIONS.estrutura, id), campos); return { id, ...campos }; },
  async updateHistorico(id, campos) { await updateDoc(doc(fdb, COLLECTIONS.historico, id), campos); return { id, ...campos }; },
  async updateDemanda(id, campos) { await updateDoc(doc(fdb, COLLECTIONS.demandas, id), campos); return { id, ...campos }; },

  /* ---------- EXCLUSÃO ---------- */
  async removeProjeto(id) {
    // remove dependentes e tira o id das mídias
    const [estr, hist, dem, midias] = await Promise.all([
      docsWhere(COLLECTIONS.estrutura, "projetoId", id),
      docsWhere(COLLECTIONS.historico, "projetoId", id),
      docsWhere(COLLECTIONS.demandas, "projetoId", id),
      this.midiasDoProjeto(id),
    ]);
    await Promise.all([
      ...estr.map((e) => deleteDoc(doc(fdb, COLLECTIONS.estrutura, e.id))),
      ...hist.map((h) => deleteDoc(doc(fdb, COLLECTIONS.historico, h.id))),
      ...dem.map((d) => deleteDoc(doc(fdb, COLLECTIONS.demandas, d.id))),
      ...midias.map((m) => updateDoc(doc(fdb, COLLECTIONS.midias, m.id), {
        projetosArmazenados: (m.projetosArmazenados || []).filter((pid) => pid !== id),
      })),
    ]);
    await deleteDoc(doc(fdb, COLLECTIONS.projetos, id));
    return true;
  },
  async removeMidia(id) { await deleteDoc(doc(fdb, COLLECTIONS.midias, id)); return true; },
  async removeEstrutura(id) { await deleteDoc(doc(fdb, COLLECTIONS.estrutura, id)); return true; },
  async removeHistorico(id) { await deleteDoc(doc(fdb, COLLECTIONS.historico, id)); return true; },
  async removeDemanda(id) { await deleteDoc(doc(fdb, COLLECTIONS.demandas, id)); return true; },

  /* ---------- BACKUP (export / import) ---------- */
  async exportAll() {
    const [projetos, midias, estrutura, historico, demandas, listas] = await Promise.all([
      allDocs(COLLECTIONS.projetos), allDocs(COLLECTIONS.midias), allDocs(COLLECTIONS.estrutura),
      allDocs(COLLECTIONS.historico), allDocs(COLLECTIONS.demandas), this.getListas(),
    ]);
    return { projetos, midias, estrutura, historico, demandas, listas };
  },
  // Escreve usando os IDs do backup (setDoc) — referências por ID continuam válidas.
  async importAll(data) {
    const grava = async (chaveColl, itens) => {
      if (!Array.isArray(itens)) return;
      for (const item of itens) {
        const { id, ...campos } = item;
        const ref = id ? doc(fdb, chaveColl, id) : doc(collection(fdb, chaveColl));
        await setDoc(ref, campos);
      }
    };
    await grava(COLLECTIONS.projetos, data.projetos);
    await grava(COLLECTIONS.midias, data.midias);
    await grava(COLLECTIONS.estrutura, data.estrutura);
    await grava(COLLECTIONS.historico, data.historico);
    await grava(COLLECTIONS.demandas, data.demandas);
    if (data.listas) await setDoc(doc(fdb, COLLECTIONS.config, "listas"), data.listas);
  },

  /* ATIVIDADE RECENTE */
  async atividadeRecente(limite = 12) {
    const [projetos, historico, demandas] = await Promise.all([
      allDocs(COLLECTIONS.projetos),
      allDocs(COLLECTIONS.historico),
      allDocs(COLLECTIONS.demandas),
    ]);
    const nomePorId = Object.fromEntries(projetos.map((p) => [p.id, p.nome]));
    const hist = historico.map((h) => ({
      tipo: "historico", projetoId: h.projetoId, projetoNome: nomePorId[h.projetoId] || "—",
      quando: h.periodo, data: h.data || "", texto: `${h.acao} — ${h.observacoes || ""}`.trim(),
    }));
    const dem = demandas.map((d) => ({
      tipo: "demanda", projetoId: d.projetoId, projetoNome: nomePorId[d.projetoId] || "—",
      quando: d.status, data: "", texto: d.pendencia,
    }));
    return [...hist, ...dem]
      .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
      .slice(0, limite);
  },
};

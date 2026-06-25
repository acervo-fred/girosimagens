/* ============================================================
   Dados de exemplo (mock) + listas de configuração.
   Espelham o modelo de dados real. Quando plugarmos o Firestore,
   estes mesmos formatos vêm das coleções.

   Regra de ouro: cada informação nasce em UM lugar.
   - Localizações (projeto e pasta) e Última atualização NÃO são
     gravadas aqui — são derivadas (ver store.js).
   - Mídia referencia projetos por ID (projetosArmazenados).
   ============================================================ */

/* Listas editáveis (futura tela de Configurações).
   Cada item de status traz uma cor da paleta de badges:
   gray | blue | amber | green | violet | rose | teal | slate   */
export const listas = {
  statusProjeto: [
    { valor: "Não iniciado", cor: "gray" },
    { valor: "Catalogando", cor: "amber" },
    { valor: "Catalogado", cor: "blue" },
    { valor: "Arquivado", cor: "violet" },
    { valor: "Finalizado", cor: "green" },
  ],
  atividadeAtual: [
    "Sem atividade", "Catalogando", "Copiando",
    "Conferindo", "Gerando Proxy", "Gravando LTO",
  ],
  statusPasta: [
    { valor: "Pendente", cor: "gray" },
    { valor: "Em organização", cor: "amber" },
    { valor: "Organizada", cor: "green" },
    { valor: "Copiada", cor: "blue" },
  ],
  statusMidia: [
    { valor: "Ativa", cor: "green" },
    { valor: "Em uso", cor: "blue" },
    { valor: "Arquivada", cor: "violet" },
    { valor: "Com defeito", cor: "rose" },
    { valor: "Descartada", cor: "gray" },
  ],
  tipoMaterial: ["Bruto", "Áudio", "Proxy", "Entregável", "Material de arquivo", "Outro"],
  tipoMidia: ["HDD", "SSD", "NAS", "LTO", "Cartão", "Pendrive"],
  acao: ["Catalogando", "Copiando", "Conferindo", "Gerando Proxy", "Gravando LTO", "Outra"],
  prioridade: [
    { valor: "Alta", cor: "rose" },
    { valor: "Média", cor: "amber" },
    { valor: "Baixa", cor: "slate" },
  ],
  statusDemanda: [
    { valor: "Aberta", cor: "amber" },
    { valor: "Em andamento", cor: "blue" },
    { valor: "Concluída", cor: "green" },
    { valor: "Cancelada", cor: "gray" },
  ],
  responsaveis: ["Acervo", "Editor", "Externo"],
  locais: ["Studio", "NAS Principal", "Armário LTO", "Casa"],
  alfred: ["Não", "Bruto", "Proxy", "Bruto + Proxy"],
  tipoFita: ["Betacam 30", "Betacam 60", "Mini DV"],
  statusFita: [
    { valor: "Não catalogada", cor: "gray" },
    { valor: "Catalogada", cor: "blue" },
    { valor: "Aguardando digitalização", cor: "amber" },
    { valor: "Em digitalização", cor: "violet" },
    { valor: "Digitalizada", cor: "green" },
  ],
  locaisFita: ["Estante A", "Estante B", "Caixa 1", "Caixa 2"],
};

export const projetos = [
  { id: "p1", nome: "Imortais", ano: 2024, statusProjeto: "Catalogando", atividadeAtual: "Catalogando", alfred: "Bruto", lto: ["LTO-014"] },
  { id: "p2", nome: "Revolta dos Males", ano: 2023, statusProjeto: "Catalogado", atividadeAtual: "Sem atividade", alfred: "Bruto + Proxy", lto: ["LTO-009", "LTO-010"] },
  { id: "p3", nome: "Mar de Dentro", ano: 2025, statusProjeto: "Não iniciado", atividadeAtual: "Sem atividade", alfred: "Não", lto: [] },
  { id: "p4", nome: "O Último Verão", ano: 2022, statusProjeto: "Finalizado", atividadeAtual: "Sem atividade", alfred: "Bruto + Proxy", lto: ["LTO-003"] },
  { id: "p5", nome: "Cidade Cinza", ano: 2024, statusProjeto: "Arquivado", atividadeAtual: "Gravando LTO", alfred: "Proxy", lto: ["LTO-012"] },
  { id: "p6", nome: "Travessia", ano: 2025, statusProjeto: "Catalogando", atividadeAtual: "Copiando", alfred: "Não", lto: [] },
];

export const midias = [
  { id: "m1", nome: "HD_IMORTAIS_03", tipo: "HDD", capacidade: "8TB", statusMidia: "Em uso", local: "Studio",
    projetosArmazenados: ["p1", "p2", "p3"],
    conteudo: "", conteudoPorProjeto: { p1: "Brutos", p2: "Sobras não organizadas", p3: "Proxies" } },
  { id: "m2", nome: "SSD_EDIT_01", tipo: "SSD", capacidade: "2TB", statusMidia: "Ativa", local: "Studio",
    projetosArmazenados: ["p6"],
    conteudo: "", conteudoPorProjeto: { p6: "Projeto de edição" } },
  { id: "m3", nome: "NAS_PRINCIPAL", tipo: "NAS", capacidade: "48TB", statusMidia: "Ativa", local: "NAS Principal",
    projetosArmazenados: ["p1", "p4", "p5"],
    conteudo: "", conteudoPorProjeto: { p1: "Espelho do acervo ativo", p4: "Espelho do acervo ativo", p5: "Espelho do acervo ativo" } },
  { id: "m4", nome: "LTO-009", tipo: "LTO", capacidade: "6TB", statusMidia: "Arquivada", local: "Armário LTO",
    projetosArmazenados: ["p2"],
    conteudo: "", conteudoPorProjeto: { p2: "Arquivo bruto" } },
];

export const estrutura = [
  { id: "e1", projetoId: "p1", midiaId: "m1", caminho: "HD_IMORTAIS_03/BRUTO", tipoMaterial: "Bruto", resumo: "Diárias D01 até D22", statusPasta: "Em organização", arquivadoLto: "" },
  { id: "e2", projetoId: "p1", midiaId: "m1", caminho: "HD_IMORTAIS_03/AUDIO", tipoMaterial: "Áudio", resumo: "Som direto", statusPasta: "Organizada", arquivadoLto: "" },
  { id: "e3", projetoId: "p1", midiaId: "m3", caminho: "NAS_PRINCIPAL/PROXY", tipoMaterial: "Proxy", resumo: "Proxies gerados p/ edição", statusPasta: "Pendente", arquivadoLto: "" },
  { id: "e4", projetoId: "p2", midiaId: "m4", caminho: "LTO-009/BRUTO", tipoMaterial: "Bruto", resumo: "Material completo", statusPasta: "Copiada", arquivadoLto: "LTO-009" },
];

export const historico = [
  { id: "h1", projetoId: "p1", periodoTipo: "intervalo", periodo: "16–20/06/2026", acao: "Catalogando", observacoes: "Catalogação das diárias D01–D10.", data: "2026-06-20" },
  { id: "h2", projetoId: "p1", periodoTipo: "dia", periodo: "21/06/2026", acao: "Gerando Proxy", observacoes: "Início da geração de proxies.", data: "2026-06-21" },
  { id: "h3", projetoId: "p6", periodoTipo: "semana", periodo: "Semana 24", acao: "Copiando", observacoes: "Cópia dos cartões para SSD.", data: "2026-06-15" },
  { id: "h4", projetoId: "p2", periodoTipo: "mes", periodo: "Maio/2026", acao: "Gravando LTO", observacoes: "Gravação final em LTO-009.", data: "2026-05-28" },
  { id: "h5", projetoId: "p5", periodoTipo: "dia", periodo: "22/06/2026", acao: "Gravando LTO", observacoes: "Arquivamento.", data: "2026-06-22" },
];

export const fitas = [];

export const demandas = [
  { id: "d1", projetoId: "p1", pendencia: "Conferir checksums dos brutos D11–D22", prioridade: "Alta", responsavel: "Acervo", status: "Aberta" },
  { id: "d2", projetoId: "p1", pendencia: "Gerar proxies restantes", prioridade: "Média", responsavel: "Editor", status: "Em andamento" },
  { id: "d3", projetoId: "p3", pendencia: "Separar material de Mar de Dentro do HD_IMORTAIS_03", prioridade: "Alta", responsavel: "Acervo", status: "Aberta" },
  { id: "d4", projetoId: "p6", pendencia: "Backup dos cartões originais", prioridade: "Baixa", responsavel: "Acervo", status: "Concluída" },
];

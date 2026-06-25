# Projeto: Sistema de Gestão de Acervo Audiovisual — Giros Filmes

## Objetivo

Construir uma página web (HTML/CSS/JS) que substitui uma planilha Google Sheets usada para gerenciar o acervo audiovisual da Giros Filmes. **Não é um catálogo de arquivos** (já existe um MAM para isso) — é um mapa do acervo e histórico operacional: quais projetos existem, onde cada um está armazenado, o que já foi organizado, e quais tarefas estão pendentes.

## Stack técnica

- **Frontend:** HTML + CSS + JS puro (sem framework), mesma abordagem do projeto anterior da Giros (ferramenta de avaliação de acervo)
- **Backend de dados:** Firebase (Firestore) — projeto Firebase já existente: `giros-imagens`. Avaliar se este sistema deve usar uma coleção nova dentro do mesmo projeto Firebase ou um projeto Firebase separado.
- **Hospedagem:** GitHub Pages
- **Uso:** uso pessoal (um usuário só), mas acessado de múltiplos dispositivos (notebook, celular, outro PC) — por isso precisa de banco de dados online, não armazenamento local do navegador
- **Volume esperado:** pode passar de mil itens (projetos + mídias + histórico + estrutura) ao longo do tempo
- **Backup:** preciso de uma forma de exportar/backupar os dados do Firestore periodicamente (ex: para JSON), como rede de segurança equivalente ao que a planilha oferecia

## Filosofia de dados (regra principal)

Cada informação nasce em apenas um lugar. Os outros lugares apenas consultam/referenciam. Evitar redundância. Usar valores padronizados (não texto livre) sempre que possível.

## Modelo de dados

O **Projeto** é a entidade central (hub). Quatro entidades operacionais (Estrutura, Mídias, Histórico, Demandas) se relacionam com Projetos, mas Mídias também é uma segunda porta de entrada independente — ver seção "Relação Projeto ↔ Mídia" abaixo.

### 1. Projetos (cadastro mestre)

Campos:
- **Projeto** (nome, texto)
- **Ano**
- **Status do projeto** (select, valor permanente do estágio): Não iniciado · Catalogando · Catalogado · Arquivado · Finalizado
- **Atividade atual** (select, o que está sendo feito agora — conceito DIFERENTE de Status): Sem atividade · Catalogando · Copiando · Conferindo · Gerando Proxy · Gravando LTO
- **Localizações** — **automático**, não é input manual. Calculado a partir de quais Mídias têm este projeto na lista de "Projetos armazenados".
- **ALFRED** (select): Não (padrão) · Bruto · Proxy · Bruto + Proxy
- **LTO** — campo multi-valor (tags). O usuário digita e adiciona um ou mais códigos de LTO diretamente no cadastro do projeto (não vem automático de Mídias, é input direto, mesmo que LTO também seja um tipo de mídia).
- **Última atualização** — automático, calculado a partir de alterações relevantes (ex: novo histórico, nova pendência, edição do projeto).

### 2. Estrutura (pastas relevantes de cada projeto)

Não registra arquivos individuais, só pastas importantes. Pertence sempre a um Projeto.

Campos:
- **Projeto** (referencia Projetos)
- **Caminho** (ex: `/BRUTO`, `/AUDIO`)
- **Tipo de material** (select): Bruto · Áudio · Proxy · Entregável · Material de arquivo · Outro
- **Resumo** (texto livre curto, ex: "Diárias D01 até D22")
- **Status da pasta** (select): Pendente · Em organização · Organizada · Copiada
- **Localizações** — automático, mesma lógica do projeto, vem das Mídias vinculadas
- **Arquivado em LTO** (opcional, texto)

### 3. Mídias (inventário de mídias físicas)

Representa as mídias físicas em si — não os projetos. Uma mídia pode conter material de **múltiplos projetos diferentes**, inclusive projetos que não correspondem ao nome dado à mídia (ex.: um HD chamado "HD_IMORTAIS_03" pode conter também material de outros 2 projetos). Isso é uma situação real e atual do acervo, e o sistema deve deixar isso visível e fácil de consultar/corrigir ao longo do tempo.

Campos:
- **Nome** (ex: `HD_IMORTAIS_03`)
- **Tipo** (select): HDD · SSD · NAS · LTO · Cartão · Pendrive
- **Capacidade** (texto, ex: "8TB")
- **Status da mídia** (select): Ativa · Em uso · Arquivada · Com defeito · Descartada
- **Projetos armazenados** — multi-valor (tags), lista de projetos que têm material dentro desta mídia
- **Conteúdo** — texto livre, observações gerais sobre o que tem dentro (ex: "brutos de Imortais + sobras de Revolta dos Males não organizadas + proxies de Mar de Dentro")

### 4. Histórico (diário técnico cronológico)

Cada linha é uma atividade executada em algum projeto.

Campos:
- **Projeto** (referencia Projetos)
- **Período** — aceita múltiplos formatos: dia único, intervalo de datas, semana, mês (ex: "18/06/2026", "16–20/06/2026", "Semana 24", "Junho/2026"). No formulário, o tipo de período é escolhido primeiro (botões: Dia / Intervalo / Mês / Semana) e isso muda o formato esperado do campo de data.
- **Ação** (select): Catalogando · Copiando · Conferindo · Gerando Proxy · Gravando LTO · Outra
- **Observações** (texto livre)

### 5. Demandas e Pendências

Cada linha é uma tarefa.

Campos:
- **Projeto** (referencia Projetos)
- **Pendência** (texto, descrição da tarefa)
- **Prioridade** (select): Alta · Média · Baixa
- **Responsável** (select, lista editável de pessoas)
- **Status** (select): Aberta · Em andamento · Concluída · Cancelada

### 6. Listas/Referências (gerenciadas em tela de Configurações, não em código fixo)

O usuário quer **flexibilidade total** para editar todas as listas de valores ele mesmo (sem depender de programador), incluindo categorias que parecem fixas hoje. Por isso, **todas** as listas abaixo devem ser editáveis dentro do próprio sistema (tela de Configurações), não hardcoded:

- Status de projeto
- Status de estrutura (pasta)
- Status de mídia
- Tipos de material
- Tipos de mídia
- Tipos de ação
- Prioridades
- Responsáveis
- Locais
- (ALFRED também deveria ser editável aqui, mesma lógica)

## Relação Projeto ↔ Mídia (navegação bidirecional)

Esse é um ponto de design importante: existem **duas portas de entrada** que se cruzam:

- **Projeto → Mídias**: na página de um projeto, ver a lista de mídias que contêm esse projeto (vem do campo "Projetos armazenados" de cada Mídia)
- **Mídia → Projetos**: na página de uma mídia, ver a lista de projetos que ela contém (incluindo projetos "intrusos" que não correspondem ao nome da mídia)

Cada item nessas listas é clicável e leva para a página de detalhe do item relacionado (projeto ou mídia).

## Telas do sistema (já prototipadas e aprovadas em design)

1. **Home** — grade de cards de projetos (estilo galeria, poucos dados por card: nome, ano, badge de status colorida). Inclui:
   - Dois botões de atalho no topo: "Nova pendência" e "Novo histórico", que abrem modais de cadastro rápido sem precisar entrar no projeto
   - Painel "Atividade recente" — colapsado por padrão, expande ao clicar, mostra últimas pendências/históricos de todos os projetos misturados
   - Busca e filtro por status
2. **Detalhe do Projeto** — ao clicar num card, mostra tudo sobre aquele projeto numa tela só: dados mestre (status, atividade atual, ALFRED, LTO, última atualização), seção Estrutura (pastas, cada uma com seu status), seção Mídias (lista clicável das mídias que contêm o projeto), seção Histórico (cronológico), seção Pendências (com botão "+ Nova demanda")
3. **Detalhe da Mídia** — dados da mídia (tipo, capacidade, status), aviso visual quando a mídia contém mais de um projeto, lista clicável de "Projetos armazenados" (cada um na cor do respectivo projeto/status), campo de Conteúdo (observações)
4. **Dashboard** — números agregados: total de projetos, total de mídias, pendências abertas, e um indicador específico "Mídias com mistura" (quantas mídias têm mais de um projeto dentro — útil para acompanhar o progresso de reorganização do acervo). Também: gráfico de barras "Projetos por status", gráfico "Mídias por tipo", lista de pendências de prioridade alta.
5. **Modal Novo Projeto** — formulário com os campos da seção 1, exceto Localizações (automático) e Última atualização (automático)
6. **Modal Nova Mídia** — formulário com os campos da seção 3
7. **Modal Nova Estrutura (pasta)** — aberto a partir de dentro da página de um projeto específico (mostra contexto "Adicionando à estrutura de [Projeto]"), campos da seção 2 exceto Localizações (automático)
8. **Modal Novo Histórico** — formulário com os campos da seção 4, incluindo seletor de tipo de período
9. **Modal Nova Pendência** — formulário com os campos da seção 5
10. **Configurações** — tela com todas as listas editáveis da seção 6, organizadas em seções/caixas, cada uma com lista de valores (editáveis inline, ícone de lápis), botão "+ Adicionar" por categoria

## Decisões de design visual (já fechadas)

- **Estilo geral:** clima minimalista e claro (fundo claro, sem cor forte de fundo), inspirado num painel administrativo limpo
- **Cor é essencial em todo o sistema** — usada para diferenciar visualmente status, categorias e até projetos individuais (ex: na página de uma Mídia, cada projeto listado aparece com a cor correspondente ao seu próprio status/identidade)
- **Badges de status:** fundo colorido suave + texto na mesma família de cor (não apenas um ponto colorido, não apenas borda — badge com leve preenchimento), boa legibilidade
- **Cards de projeto na home:** grandes, com poucas informações (nome, ano, badge de status) — estilo galeria, não tabela densa
- **Modais:** padrão único de interação para todo cadastro/edição no sistema (não páginas separadas), incluindo a tela de Configurações
- **Avisos contextuais:** quando relevante, mostrar uma notinha discreta explicando comportamento automático (ex: "Localizações aparecem automaticamente, com base nas mídias vinculadas") — isso ajuda o usuário a entender por que um campo não está editável diretamente ali

## O que NÃO fazer

- Não recriar a aba "Referências" do Sheets como está — ela existia só por limitação da ferramenta. As listas de valores devem virar uma tela de Configurações dentro do próprio sistema, com edição direta (não uma "aba" de dados separada).
- Não tornar "Localizações" (do Projeto) ou "Última atualização" campos de input manual — são sempre calculados.
- Não tratar Mídias como dependente de Projetos — é uma entidade com sua própria página de detalhe e sua própria lista, navegável independentemente.


> desistimos do Firestore.

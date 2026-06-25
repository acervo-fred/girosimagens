# Ativar o Firestore no projeto `giros-imagens`

O projeto Firebase já existe e tem um **Realtime Database** em uso por outra
ferramenta. Vamos adicionar o **Cloud Firestore** (banco separado, mesmo
projeto). **O Realtime Database não é afetado** — são bancos independentes, e
nosso código só usa Firestore.

## Passo 1 — Criar o banco Firestore (uma vez)

1. Abra o [Console do Firebase](https://console.firebase.google.com/) e entre
   no projeto **giros-imagens**.
2. Menu lateral: **Build → Firestore Database** (não confundir com
   "Realtime Database", que é o que já existe).
3. Clique em **Criar banco de dados**.
4. **Local (location):** escolha **`southamerica-east1` (São Paulo)**.
   ⚠️ A região é **permanente**, não dá para mudar depois.
5. Modo de início: escolha **modo de teste** (vamos substituir as regras no
   passo 2 logo em seguida). Concluir.

> Isso cria o Firestore ao lado do Realtime Database. O RTDB continua intacto.

## Passo 2 — Publicar as regras de segurança

1. Em **Firestore Database → aba "Regras"**.
2. Cole o conteúdo do arquivo [`firestore.rules`](../firestore.rules) deste
   repositório (bloco "DEV").
3. **Publicar**.

> Essas regras são temporárias e liberam acesso só às coleções `acervo_*` e só
> até **30/09/2026**. Antes de inserir dados reais e sensíveis, trocaremos pelo
> bloco "COM LOGIN" (Firebase Auth) — está comentado no mesmo arquivo.

## Passo 3 — Ligar o Firestore no app

No arquivo [`js/config/firebase-config.js`](../js/config/firebase-config.js),
mude:

```js
export const USE_FIRESTORE = true;
```

(Quando `false`, o app roda com dados mock em memória e não conecta ao Firebase.)

## Passo 4 — Popular os dados iniciais

1. Abra o app, vá em **Configurações → Backup e dados** (ou a URL `#/dados`).
2. Clique em **"Popular com dados de exemplo"**. Isso grava os projetos/mídias/
   listas de exemplo no Firestore, com IDs estáveis.
3. A página recarrega lendo do Firestore. Pronto — agora os cadastros
   persistem entre dispositivos.

As coleções criadas serão: `acervo_projetos`, `acervo_midias`,
`acervo_estrutura`, `acervo_historico`, `acervo_demandas` e `acervo_config`
(documento `listas`).

## Backup periódico

Em **Configurações → Backup e dados → Exportar JSON**, baixe um arquivo de
backup de tempos em tempos. Para restaurar, use **Importar** (grava pelos
mesmos IDs, preservando as referências entre projetos e mídias).

## Pendência de segurança (importante)

Hoje o acesso está **sem login**. Antes de publicar com dados reais:
- Ativar **Firebase Auth** (e-mail/senha).
- Trocar as regras para o bloco "COM LOGIN".
- Adicionar uma tela de login simples no app.

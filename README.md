# Casamento · Luana & Paulo — Painel de planejamento

Site estático (otimizado para **GitHub Pages**) com o painel de planejamento do
casamento: visão geral, orçamento, fornecedores, tarefas (Kanban) e lista de
convidados. Os dados são **compartilhados em tempo real entre dois acessos** via
**Firebase (Firestore)** e o site é protegido por uma **senha de acesso**.

- **Sem etapa de build** — são apenas arquivos estáticos (HTML/CSS/JS). O GitHub
  Pages serve direto. React, Babel e Firebase vêm de CDN; as fontes, do Google Fonts.
- **Dois modos automáticos:**
  - **Nuvem** (Firebase configurado): login real + dados compartilhados em tempo real.
  - **Local** (Firebase ainda não configurado): funciona só neste navegador, com
    senha local — ótimo para testar antes de publicar.

---

## Estrutura

```
casamento-luana-paulo/
├── index.html                  ← página única (carrega tudo na ordem certa)
├── assets/
│   ├── firebase-config.js      ← ★ ÚNICO arquivo que você edita
│   ├── store.js                ← estado compartilhado + login (useStore / Wedding)
│   ├── styles.css              ← estilos
│   └── app/                    ← componentes React (JSX)
│       ├── data.jsx ... App.jsx, gate.jsx
├── firestore.rules            ← regras de segurança do banco (copie no Firebase)
├── .nojekyll                  ← faz o GitHub Pages servir os arquivos sem processar
└── README.md
```

---

## Passo 1 — Criar o banco gratuito no Firebase (~10 min)

1. Acesse <https://console.firebase.google.com> e clique em **Adicionar projeto**.
   Dê um nome (ex.: `casamento-lp`). Pode desativar o Google Analytics.
2. No menu lateral, **Criar > Firestore Database** → **Criar banco de dados** →
   escolha **Modo de produção** → selecione a região (ex.: `southamerica-east1`).
3. Aba **Regras** do Firestore: apague o conteúdo, cole o conteúdo do arquivo
   [`firestore.rules`](firestore.rules) deste projeto e clique em **Publicar**.
   (Isso garante que só quem tem a senha consegue ler/gravar os dados.)
4. No menu, **Criar > Authentication** → **Começar** → aba **Sign-in method** →
   ative o provedor **E-mail/senha** → **Salvar**.
5. Ainda em Authentication, aba **Users** → **Adicionar usuário**:
   - **E-mail:** `casal@luanaepaulo.casamento` (ou outro — anote, vai no passo 2)
   - **Senha:** a senha que vocês dois vão usar para entrar no site.
   - **Adicionar usuário**.  ← *Esse é o login compartilhado de vocês.*
6. Pegue a configuração do app web: ⚙ (**Configurações do projeto**) →
   aba **Geral** → role até **Seus apps** → clique no ícone **`</>` (Web)** →
   dê um apelido → **Registrar app**. Vai aparecer um objeto `firebaseConfig`
   com `apiKey`, `projectId`, etc. **Deixe essa tela aberta para o passo 2.**

## Passo 2 — Preencher `assets/firebase-config.js`

Abra `assets/firebase-config.js` e:

- Substitua o objeto `window.FIREBASE_CONFIG` pelos valores do `firebaseConfig`
  que apareceram no passo 1.6.
- Em `window.APP_LOGIN_EMAIL`, coloque o **mesmo e-mail** do usuário criado no
  passo 1.5.

Pronto — ao abrir o site, ele entra em **modo nuvem** automaticamente e a senha
passa a ser a do usuário do Firebase.

> 🔒 Os valores do `firebaseConfig` (incluindo a `apiKey`) **podem ficar
> públicos** — eles não são segredo. Quem protege os dados é a **senha** + as
> **regras do Firestore** (passo 1.3).

## Passo 3 — Publicar no GitHub Pages

Repositório **privado**, com o **Pages** servindo o site. Há um script pronto:
veja [`DEPLOY.md`](DEPLOY.md) (criado junto com o projeto) ou:

```bash
cd casamento-luana-paulo
gh auth login                      # faça login na sua conta do GitHub
gh repo create casamento-luana-paulo --private --source=. --remote=origin --push
gh api -X POST repos/{owner}/casamento-luana-paulo/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

Depois, em **Settings → Pages** do repositório, o endereço do site aparece
(algo como `https://SEU-USUARIO.github.io/casamento-luana-paulo/`). Pode levar
1–2 minutos para ficar no ar.

## Compartilhar com a outra pessoa

Basta enviar **o endereço do site** + **a senha**. As duas pessoas usam a mesma
senha; tudo que uma edita aparece para a outra (atualiza sozinho, em tempo real).

---

## Observações de segurança (importante)

- A senha é **simples, só para evitar acesso casual** — exatamente como pedido.
  No plano gratuito do GitHub, o **site publicado é público** mesmo com o
  repositório privado; por isso a senha + as regras do Firestore são o que
  realmente protegem os dados.
- O e-mail/senha do Firebase é um login de verdade: sem ele, ninguém lê nem
  grava no banco (graças às regras do passo 1.3).
- **PDFs das propostas (Fornecedores):** o conteúdo do PDF é lido para
  pré-preencher os campos, mas o **arquivo em si não é sincronizado** entre os
  dois acessos (isso exigiria o Firebase Storage). Os dados do fornecedor, sim.

## Rodar localmente (para testar antes de publicar)

Precisa de um servidor local (não funciona abrindo o arquivo direto, por causa
do carregamento dos módulos):

```bash
cd casamento-luana-paulo
python3 -m http.server 8765
# abra http://localhost:8765
```

Sem o Firebase preenchido, ele roda em **modo local** (senha padrão definida em
`firebase-config.js`, inicialmente `casamento`) e guarda os dados só neste
navegador.

## Quiser um dia otimizar ainda mais

Hoje o JSX é transpilado no navegador (Babel) — simples e sem build. Para um
carregamento ainda mais rápido, dá para migrar para um build com **Vite**
(precompila o JSX e minifica), publicado pelo GitHub Actions. Não é necessário
para uso entre duas pessoas, mas fica como evolução possível.

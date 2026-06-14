# Publicar no GitHub Pages (repositório privado)

Pré-requisito: a CLI do GitHub (`gh`) instalada. Verifique com `gh --version`.
Se não tiver: `brew install gh`.

## 1. Entrar na sua conta do GitHub

```bash
gh auth login
```

Escolha: **GitHub.com** → **HTTPS** → **Login with a web browser**.
Copie o código mostrado, abra o navegador, cole o código e autorize.

## 2. Criar o repositório privado e enviar o código

A partir da pasta do projeto:

```bash
cd ~/casamento-luana-paulo
gh repo create casamento-luana-paulo --private --source=. --remote=origin --push
```

## 3. Ligar o GitHub Pages

```bash
OWNER=$(gh api user --jq .login)
gh api -X POST "repos/$OWNER/casamento-luana-paulo/pages" \
  -f 'source[branch]=main' -f 'source[path]=/'
```

(Se o comando reclamar que o Pages já existe, ignore — já está ligado.)

## 4. Ver o endereço do site

```bash
OWNER=$(gh api user --jq .login)
gh api "repos/$OWNER/casamento-luana-paulo/pages" --jq .html_url
```

Leva 1–2 minutos para o site ficar no ar na primeira vez.

## Atualizar o site depois (quando mudar algo)

```bash
cd ~/casamento-luana-paulo
git add -A
git commit -m "ajustes"
git push
```

O GitHub Pages republica sozinho em ~1 minuto.

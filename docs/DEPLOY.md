# Guia de deploy — Hostinger Cloud + GitHub

Este projeto usa **dois passos**:

1. **GitHub Actions** builda em push para `main` e publica os arquivos prontos numa branch `production`.
2. **Hostinger Cloud (Git Auto Deploy)** puxa essa branch para o `public_html` do `despertarespiral.com`.

Você só configura uma vez. Depois é só `git push` → deploy automático.

---

## 1. Fluxo

```
push pra main
     │
     ▼
GitHub Actions (.github/workflows/deploy.yml)
     │  npm ci → npm run lint → npm run build
     ▼
Force-push do dist/ pra branch `production`
     │
     ▼
Hostinger detecta push na branch monitorada
     │  Git Auto Deploy puxa a branch
     ▼
Arquivos chegam em /public_html/
     │
     ▼
despertarespiral.com no ar
```

A branch `production` é **descartável** — sempre reflete o último build. Não edite nem faça PR contra ela.

---

## 2. Configuração no Hostinger (uma vez só)

### 2.1. Adicionar o domínio

1. No hPanel, vá em **Domains** → **Add new domain**
2. Aponte os nameservers para o Hostinger ou configure os DNS A/AAAA do registrador apontando para o IP do servidor.

### 2.2. SSL

1. **Websites** → seu site → **SSL/Security** → **Free SSL** (Let's Encrypt)
2. Aguarde provisionar (~5 min). O `.htaccess` do projeto já força HTTPS automaticamente.

### 2.3. Git Auto Deploy

1. **Websites** → `despertarespiral.com` → **Advanced** → **Git**
2. Clique em **Create repository**
3. Preencha:
   - **Repository URL**: `https://github.com/ThalesAndrades/DESPERTARESPIRALOFICIAL.git`
   - **Repository branch**: `production` ⚠️ (NÃO use `main`)
   - **Repository path**: `public_html` (ou o path do seu site, geralmente `/` ou `/public_html`)
4. Marque **Auto Deployment** = `ON`
5. **Salvar**

> Repositório privado? Adicione a chave SSH pública do Hostinger (mostrada na mesma tela) como Deploy Key no GitHub: **Settings → Deploy keys → Add deploy key**.

### 2.4. Webhook (deploy automático em push)

O hPanel mostra uma **WebHook URL** depois de salvar. Copie e:

1. No GitHub: **Settings** do repo → **Webhooks** → **Add webhook**
2. Cole a URL no campo **Payload URL**
3. **Content type**: `application/x-www-form-urlencoded`
4. **Which events**: `Just the push event`
5. Salvar

Pronto. Cada push em `main` dispara: build no Actions → push em `production` → webhook avisa Hostinger → pull → ar.

---

## 3. Primeiro deploy

```sh
git checkout main
git push origin main
```

Acompanhe em:

- **GitHub** → aba **Actions** → workflow `Deploy`
- **hPanel** → **Git** → log de deployment

Tempo total: ~2 min (1 min build + 30s push + 30s Hostinger).

---

## 4. Variáveis de ambiente

O app roda 100% no navegador (modo local — veja `README.md`). **Não há variáveis obrigatórias.**

Se um dia adicionar uma variável `VITE_*`, configure-a no workflow `.github/workflows/deploy.yml` no step `Build (produção)`:

```yaml
- name: Build (produção)
  run: npm run build
  env:
    VITE_SITE_URL: https://despertarespiral.com
    VITE_MINHA_NOVA: ${{ secrets.VITE_MINHA_NOVA }}
```

E adicione o secret em **GitHub → Settings → Secrets and variables → Actions**.

---

## 5. Rollback

Quer voltar pra uma versão anterior?

```sh
# Encontra o commit anterior em main
git log --oneline -5

# Cria um deploy "manual" usando workflow_dispatch num commit específico
# Ou simplesmente reverte em main:
git revert <hash-do-commit-ruim>
git push origin main
```

O workflow roda de novo em ~2 min e republica.

---

## 6. Troubleshooting

### Branch `production` não aparece

Provável: workflow falhou. Veja **Actions** no GitHub.

### Hostinger não puxou após push

- Confirme **Auto Deployment** = `ON` no hPanel
- Confirme branch = `production` (sem typo)
- Cheque o log em **hPanel → Git → Deploy log**
- Re-emita o webhook manualmente: hPanel mostra botão **Deploy**

### Erro 404 em rotas internas (/dashboard, /admin, etc.)

`.htaccess` não foi pra `public_html`. Confirme:

```sh
curl -I https://despertarespiral.com/dashboard
# Deve retornar 200, não 404
```

Se 404: o `.htaccess` não chegou. Verifique no FTP do Hostinger se `/public_html/.htaccess` existe. Se sim, mas ainda 404, contate o suporte e peça pra habilitar `mod_rewrite` (raro estar desligado).

### Assets quebrados (CSS, JS 404)

`base` errado no `vite.config.ts`. Confirme `base: "/"` (raiz do domínio).

### HTTPS não funciona

- SSL ainda provisionando (espere 10 min)
- DNS não propagou (use `dig despertarespiral.com` pra checar)
- Force renovação em **SSL/Security → Force HTTPS**

---

## 7. Comandos úteis

```sh
# Buildar localmente como produção
npm run build

# Servir o build pra testar
npm run preview
# → http://localhost:4173

# Ver o que vai pra produção
ls -la dist/

# Disparar deploy manualmente (sem push)
# GitHub → Actions → Deploy → Run workflow
```

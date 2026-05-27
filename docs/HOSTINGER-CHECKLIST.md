# Checklist Hostinger — colocar `despertarespiral.com` no ar

Este é o caminho rápido pra subir o site. Cada item é manual, no painel do
Hostinger (hPanel) ou no GitHub. Marque conforme for fazendo.

---

## A. Domínio + DNS

- [ ] **A.1** No hPanel: `Domains` → adicionar `despertarespiral.com`
- [ ] **A.2** Se o domínio foi registrado fora (Registro.br, GoDaddy, etc):
  - Apontar **nameservers** para os do Hostinger (mostrados no painel ao adicionar)
  - **OU** criar registros DNS A (IPv4) e AAAA (IPv6) apontando para o IP que o Hostinger informar
- [ ] **A.3** Aguardar propagação (5min–24h). Verificar com:
  ```sh
  dig despertarespiral.com +short
  ```

---

## B. SSL (HTTPS)

- [ ] **B.1** `Websites` → `despertarespiral.com` → `SSL/Security` → `Free SSL` (Let's Encrypt)
- [ ] **B.2** Aguardar status `Active` (~5 min). O `.htaccess` do projeto já força HTTPS.
- [ ] **B.3** Habilitar `Force HTTPS` se houver toggle.

---

## C. Deploy automático via Git

- [ ] **C.1** `Websites` → `despertarespiral.com` → `Advanced` → `Git`
- [ ] **C.2** `Create repository`:
  - Repository URL: `https://github.com/ThalesAndrades/DESPERTARESPIRALOFICIAL.git`
  - Branch: **`production`** ⚠️ (NÃO `main` — `production` é onde o workflow publica o build)
  - Path: `public_html`
  - Auto Deployment: **ON**
- [ ] **C.3** Se o repo for privado, copiar a **SSH public key** mostrada pelo hPanel e adicionar no GitHub:
  - `Settings` → `Deploy keys` → `Add deploy key` → cole + check "Allow read access"

---

## D. Webhook (deploy automático ao push)

- [ ] **D.1** Copiar a **Webhook URL** que o hPanel mostra após salvar o Git config
- [ ] **D.2** GitHub → repo → `Settings` → `Webhooks` → `Add webhook`:
  - Payload URL: cole a URL do hPanel
  - Content type: `application/x-www-form-urlencoded`
  - Which events: `Just the push event`
  - Active: ✓
- [ ] **D.3** Salvar e clicar `Recent Deliveries` pra confirmar que o webhook é entregue (deve ter status `200`)

---

## E. Primeiro deploy

- [ ] **E.1** Disparar o workflow:
  ```sh
  # Local
  git checkout main
  git commit --allow-empty -m "trigger: primeiro deploy"
  git push origin main
  ```
- [ ] **E.2** Acompanhar em `GitHub → Actions → Deploy` (~2 min)
- [ ] **E.3** Confirmar branch `production` criada:
  https://github.com/ThalesAndrades/DESPERTARESPIRALOFICIAL/tree/production
- [ ] **E.4** Acompanhar `hPanel → Git → Deploy log` puxando o build

---

## F. Verificação

- [ ] **F.1** `curl -I https://despertarespiral.com/` → HTTP 200 + header `Strict-Transport-Security`
- [ ] **F.2** Abrir `https://despertarespiral.com/` no navegador → landing carrega
- [ ] **F.3** `https://despertarespiral.com/login` → tela de login (SPA fallback funcionando)
- [ ] **F.4** `https://despertarespiral.com/mapa-do-poder` → ferramenta carrega
- [ ] **F.5** `https://www.despertarespiral.com/` → redireciona para raiz (sem www)
- [ ] **F.6** `http://despertarespiral.com/` → redireciona pra HTTPS

---

## G. Se algo der errado

| Sintoma | Causa provável | Onde olhar |
|---|---|---|
| DNS não resolve | Nameservers não propagaram | `dig despertarespiral.com`, aguardar |
| HTTPS quebrado | SSL ainda provisionando | hPanel → SSL/Security |
| 404 em `/dashboard` | `.htaccess` não chegou | FTP: `/public_html/.htaccess` deve existir |
| 404 nos assets (CSS/JS) | Path errado no Vite | Confirmar `base: "/"` em `vite.config.ts` |
| Hostinger não puxa | Auto Deployment off ou branch errada | hPanel → Git → settings |
| Workflow falha | Lint ou build erro | GitHub → Actions → ver log |

Detalhes em [`docs/DEPLOY.md`](DEPLOY.md).

---

## H. O que NÃO funciona ainda (e por quê)

Ao subir agora, **a plataforma roda em "modo local"** — tudo funciona no
navegador da usuária, mas:

- **Dados não persistem entre dispositivos** (cada navegador tem seu próprio
  `localStorage`)
- **Pagamentos são mockados** — gera um pedido fictício mas não cobra
- **Emails não saem** (só log no console em DEV)
- **Sem multi-usuária real** — quem acessa de outro dispositivo cria conta nova
- **Sem backup** — limpar cookies do navegador apaga tudo da usuária

Pra deixar funcional ponta-a-ponta, ver [`PLANO-DE-ACAO.md`](PLANO-DE-ACAO.md).

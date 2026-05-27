# Plano de ação — Plataforma Despertar Espiral ponta a ponta

**Estado atual** (modo local): tudo roda no navegador, dados em `localStorage`,
sem backend real. Funcional pra demo e desenvolvimento, **não** para usuárias
reais pagantes.

**Objetivo**: deixar a plataforma totalmente funcional — usuárias reais
cadastrando, pagando, acessando aulas, conversando na comunidade, em múltiplos
dispositivos, com persistência e segurança.

---

## Roadmap em fases

```
Fase 0 ─── Deploy .com no Hostinger              (em curso)
            │
Fase 1 ─── Backend real (DB + Auth)              ← decisão chave
            │
Fase 2 ─── Pagamentos                            ← provider
            │
Fase 3 ─── Email transacional
            │
Fase 4 ─── Storage de mídia (vídeo, PDF)
            │
Fase 5 ─── CRM + Automação
            │
Fase 6 ─── Analytics + SEO
            │
Fase 7 ─── LGPD + segurança
            │
Fase 8 ─── Observabilidade + qualidade
```

Cada fase é **independente o suficiente** para entrar em produção sozinha. A
ordem é a recomendada — mas dá pra reordenar conforme prioridade comercial.

---

## Fase 0 — Deploy `.com` no Hostinger (1–2h)

**Em curso.** Seguir [`HOSTINGER-CHECKLIST.md`](HOSTINGER-CHECKLIST.md).

**Entrega**: `despertarespiral.com` no ar com SSL, todas as rotas SPA
funcionando, mas ainda em modo local (sem persistência server-side).

---

## Fase 1 — Backend real: DB + Auth (4–8h)

**Decisão chave**: qual BaaS usar.

| Opção | Prós | Contras | Preço |
|---|---|---|---|
| **Supabase** ⭐ | Postgres real, RLS, Auth com OAuth, Storage, Edge Functions — toda a arquitetura já estava nesse modelo, código pode voltar facilmente | Lock-in moderado | Grátis até 500MB DB + 2 projetos |
| **Firebase** | Maduro, escala bem | Firestore é NoSQL — schema atual é relacional, precisaria reescrever | Grátis até 1GB |
| **AppWrite (self-host)** | Open source, controle total | Precisa VPS, mais manutenção | Custo do VPS |
| **PocketBase** (self-host) | Single binary, SQLite | Não escala muito, single instance | Custo do VPS |

**Recomendação**: **Supabase**. Toda a estrutura do `src/lib/local/` foi
desenhada como Supabase-compatible — voltar é só substituir o cliente.

### O que entra nesta fase

- **1.1** Provisionar projeto Supabase
- **1.2** Restaurar schema (tabelas já mapeadas em `src/lib/local/types.ts`)
- **1.3** Criar RLS policies (segurança por usuária)
- **1.4** Substituir `src/lib/local/index.ts` por `createClient(...)` real
- **1.5** Variáveis no GitHub Actions: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **1.6** Migrar usuárias seed (admin@, membro@) para o banco real
- **1.7** Habilitar provedores OAuth (Google) no painel Supabase
- **1.8** Configurar redirect URLs corretos

### Esforço: 4–8h

Já existe o `supabase/migrations/` legado no histórico do git (commits antes
da refatoração). Dá pra reaproveitar com adaptações.

### Como validar
- Cadastrar conta com email/senha real → recebe sessão JWT
- Reabrir num outro navegador → mesmo email + senha → mesma usuária
- Admin vê lista real de usuárias cadastradas

---

## Fase 2 — Pagamentos (3–6h)

**Decisão chave**: gateway brasileiro.

| Gateway | Prós | Contras |
|---|---|---|
| **Asaas** ⭐ | Brasileiro, Pix nativo, taxas baixas, API simples — era o que estava configurado | Menos famoso fora do BR |
| **Mercado Pago** | Marca conhecida, conversão alta | Taxas mais altas |
| **Stripe** | Internacional, melhor DX | Pix via terceiros, taxa alta em BR |
| **PagSeguro / PagBank** | Tradicional | API mais antiga |

**Recomendação**: **Asaas** — o código de checkout-session já estava escrito
para Asaas no histórico.

### O que entra nesta fase

- **2.1** Conta Asaas (produção + sandbox)
- **2.2** Edge Function `checkout-session`:
  - Recebe `product_id`, `email`, `payment_method` (pix/cartão/boleto)
  - Cria cliente Asaas se não existir
  - Cria cobrança via API Asaas
  - Retorna `qr_code`, `pix_copy_paste`, `payment_url`
- **2.3** Edge Function `asaas-webhook`:
  - Recebe POST do Asaas quando status muda (PENDING → CONFIRMED)
  - Atualiza tabela `orders`
  - Insere em `user_products` (libera acesso)
  - Dispara email de boas-vindas
- **2.4** Página `/obrigado` mostra status real (polling ou subscription)
- **2.5** Lógica `grant-pending-access` para emails que pagaram antes de cadastrar
- **2.6** Configurar webhooks no painel Asaas com secret de verificação

### Esforço: 3–6h

### Como validar
- Comprar produto com Pix sandbox → QR aparece → simular pagamento no sandbox → status atualiza → produto liberado no `/dashboard`
- Comprar como guest → cadastrar com mesmo email depois → acesso retroativo concedido

---

## Fase 3 — Email transacional (2–3h)

**Decisão chave**: provider.

| Provider | Prós | Contras |
|---|---|---|
| **Resend** ⭐ | DX excelente, React Email templates, free 100/dia | Novo, menos features avançadas |
| **SendGrid** | Maduro | Mais caro, DX pior |
| **Postmark** | Excelente entregabilidade transacional | Caro |
| **AWS SES** | Mais barato em escala | Setup mais chato |

**Recomendação**: **Resend** — DX moderna e templates em React.

### O que entra nesta fase

- **3.1** Conta Resend + domínio verificado (`despertarespiral.com` — SPF, DKIM, DMARC)
- **3.2** Edge Function `send-email`:
  - Recebe `to`, `slug`, `variables`
  - Renderiza template + envia via Resend
- **3.3** Templates (React Email ou HTML simples):
  - `welcome` — após cadastro
  - `acesso-liberado` — após pagamento confirmado
  - `quiz-aprovado` — quiz finalizado
  - `reset-senha` — recuperação
  - `curso-concluido` — 100% das aulas marcadas
  - `recovery-lembrete` — checkout abandonado (24h depois)
- **3.4** Substituir stub `src/lib/email.ts` por chamada ao edge function
- **3.5** Triggers: useAuth.tsx (signup), webhook Asaas (paid), QuizPlayer (passed)

### Esforço: 2–3h

### Como validar
- Cadastrar conta nova → recebe email de welcome na caixa
- Comprar → recebe acesso-liberado
- Passar quiz → recebe quiz-aprovado

---

## Fase 4 — Storage de mídia (3–5h)

Hoje upload de vídeo cria um Object URL que se perde ao recarregar.

**Opções**:

| Storage | Prós | Contras | Preço |
|---|---|---|---|
| **Supabase Storage** ⭐ | Já vem com a Fase 1, integração nativa | 1GB grátis, depois pago | $0.021/GB |
| **Bunny.net Stream** | CDN excelente, HLS automático, tracking de visualização | Conta separada | $0.005/GB egress |
| **Cloudflare R2** | Sem egress fee, S3-compatible | Sem player próprio | $0.015/GB |
| **YouTube unlisted** | Grátis, player conhecido | Branding YouTube, pode ser removido | Grátis |

**Recomendação curto prazo**: **Supabase Storage** (vem grátis com a Fase 1).
**Recomendação longo prazo (se muitos vídeos)**: migrar pra **Bunny Stream**
ou **Cloudflare Stream** quando passar de uns 50 vídeos/cursos.

### O que entra nesta fase

- **4.1** Criar buckets no Supabase: `video-content` (privado), `course-thumbs` (público), `certificates` (privado)
- **4.2** RLS policies: só usuárias com `user_products` veem vídeos
- **4.3** Admin → AdminMediaPage: upload com progress + drag-and-drop
- **4.4** LessonPage: tocar vídeo via signed URL (expiração curta, ~1h)
- **4.5** Se for HLS, adicionar `hls.js` de volta no client
- **4.6** PDFs: mesma lógica de signed URL

### Esforço: 3–5h

### Como validar
- Admin sobe vídeo → aparece em uma aula
- Usuária com acesso → vê vídeo
- Usuária sem acesso → 403 ao tentar URL direta

---

## Fase 5 — CRM + Automação (2–4h)

Pra mandar broadcasts, sequências de boas-vindas, lembretes de carrinho
abandonado, segmentar por produto comprado.

| Opção | Prós | Contras |
|---|---|---|
| **ActiveCampaign** | Maduro, segmentação rica | Caro |
| **Sequenzy** | Brasileiro, já estava integrado no original | Menos features |
| **Brevo (Sendinblue)** | Free tier generoso | Interface menos polida |
| **Caseiro (sem CRM)** | Sem custo recorrente | Manutenção ad-hoc |

**Recomendação**: começar **sem CRM** (eventos só no Supabase) e adicionar
**ActiveCampaign** ou **Brevo** quando tiver volume.

### O que entra nesta fase

- **5.1** Tabela `events` no Supabase pra log de tudo (analytics próprio)
- **5.2** `fireEventAsync` grava na tabela em vez de só logar
- **5.3** Função de export CSV pra importar no provider escolhido
- **5.4** (Opcional) Edge Function `sequenzy-event` enviando para CRM real

### Esforço: 2–4h

---

## Fase 6 — Analytics + SEO (1–3h)

Visibilidade no Google + entender como visitantes chegam e convertem.

### O que entra

- **6.1** Google Analytics 4 (script no `index.html`)
- **6.2** Meta Pixel (Facebook Ads) se for fazer tráfego pago
- **6.3** Google Search Console — verificar propriedade + enviar sitemap
- **6.4** Schema.org enriquecido em produtos (Product schema)
- **6.5** OG image dinâmica por produto (atualmente é única)
- **6.6** Sitemap dinâmico se houver muitos produtos (gerar no build)

### Esforço: 1–3h

---

## Fase 7 — LGPD + segurança (2–4h)

Obrigatório no Brasil pra cobrar de usuárias.

### O que entra

- **7.1** Banner de consentimento de cookies (próprio ou via Cookiebot)
- **7.2** Página de Privacidade revisada por advogada(o)
- **7.3** Página de Termos revisada
- **7.4** Endpoint de "exportar meus dados" (RGPD/LGPD direito)
- **7.5** Endpoint de "deletar minha conta" (esquecimento)
- **7.6** Audit log de quem acessou dados pessoais (no admin)
- **7.7** Backup automatizado do DB (Supabase faz por padrão, mas confirmar)
- **7.8** Rate limiting nos edge functions

### Esforço: 2–4h (sem contar revisão jurídica)

---

## Fase 8 — Observabilidade + qualidade (2–4h)

Saber quando algo quebra **antes** da usuária reclamar.

### O que entra

- **8.1** **Sentry** — erros do client + server, free 5k events/mês
- **8.2** **Plausible** ou **Umami** — analytics privacy-first
  (alternativa ao GA4 mais leve)
- **8.3** Uptime monitor — `UptimeRobot` (free) checando `/` a cada 5 min
- **8.4** Status page pública (opcional) — Cachet ou Statuspage
- **8.5** Resolver os ~30 testes Vitest que sobraram falhando depois da refatoração
- **8.6** Lighthouse CI no workflow — fail se performance < 80

### Esforço: 2–4h

---

## Resumo de custos mensais estimados (escala inicial)

| Item | Provider | Custo |
|---|---|---|
| Hospedagem | Hostinger Cloud | já contratado |
| Domínio | Registro.br | ~R$ 40/ano |
| Backend (DB + Auth + Storage + Functions) | Supabase Pro | $25/mês (free até MVP) |
| Pagamentos | Asaas | 1% Pix + R$ 1,49 / 3,99% cartão (variável) |
| Email transacional | Resend | $0 até 3k/mês, $20 até 50k |
| CRM | adiar pra ~R$ 100/mês quando precisar | — |
| Erros | Sentry free | $0 |
| Analytics | GA4 + Plausible self-host | $0 |
| **Total fixo MVP** | | **$25/mês + taxas variáveis de pagamento** |

---

## Sequência recomendada (curto prazo)

Se você quer **lançar pra primeiras vendas o mais rápido possível**:

1. **Fase 0** — deploy `.com` no ar (hoje)
2. **Fase 1** — Supabase com auth + DB real (essa semana)
3. **Fase 2** — Asaas com Pix funcionando (semana seguinte)
4. **Fase 3** — Email de boas-vindas + acesso liberado (mesma semana)

Com isso você **já pode vender**. As fases 4–8 são polish/escala.

---

## Decisões que preciso de você

Antes de implementar qualquer fase, confirme:

- [ ] **D.1** Vai usar Supabase ou outro BaaS? (afeta Fase 1)
- [ ] **D.2** Vai usar Asaas, Mercado Pago, ou outro gateway? (afeta Fase 2)
- [ ] **D.3** Tem conta Resend ou prefere outro provedor de email? (afeta Fase 3)
- [ ] **D.4** Vai armazenar vídeos próprios ou usar YouTube/Vimeo? (afeta Fase 4)
- [ ] **D.5** Vai investir em tráfego pago (Meta Ads, Google Ads)? (afeta Fase 6)
- [ ] **D.6** Quem revisa os termos legais? (afeta Fase 7)

Responda essas e eu começo pela Fase 1 imediatamente.

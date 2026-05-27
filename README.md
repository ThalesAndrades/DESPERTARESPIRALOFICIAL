# Despertar Espiral

Plataforma de cursos, comunidade e jornadas femininas — **modo local**, sem dependências externas. Deploy direto em `despertarespiral.com` via Hostinger Cloud + GitHub Auto Deploy.

Roda 100% no navegador: dados são persistidos em `localStorage`, autenticação e pagamentos são simulados, e o build padrão não precisa de chaves de API ou serviços de terceiros.

## Deploy

- **Produção**: `despertarespiral.com`
- **Fluxo**: push em `main` → GitHub Actions builda → publica em branch `production` → Hostinger Git Auto Deploy puxa → ar
- **Checklist Hostinger** (configuração inicial): [`docs/HOSTINGER-CHECKLIST.md`](docs/HOSTINGER-CHECKLIST.md)
- **Guia técnico de deploy**: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- **Plano de ação ponta-a-ponta**: [`docs/PLANO-DE-ACAO.md`](docs/PLANO-DE-ACAO.md)
- **Setup Supabase** (DB + Auth + Storage + Edge Functions): [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md)
- **Setup Stripe** (produtos, prices, webhook, portal): [`docs/STRIPE-SETUP.md`](docs/STRIPE-SETUP.md)
- **Setup Resend** (email transacional): [`docs/RESEND-SETUP.md`](docs/RESEND-SETUP.md)
- **Conectar Claude Code ao Supabase** (MCP): [`docs/CLAUDE-MCP-SETUP.md`](docs/CLAUDE-MCP-SETUP.md)

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Vite 5 + React 18 + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Roteamento | React Router v6 |
| Estado servidor | TanStack Query |
| Backend local | `src/lib/local/` — cliente compatível com Supabase, baseado em `localStorage` |
| Testes | Vitest + Testing Library |

## Como rodar

```sh
npm install
npm run dev          # dev server em http://localhost:5173
npm run build        # build de produção
npm run preview      # serve o build
npm run lint         # ESLint
npm run test         # Vitest (run único)
npm run test:watch   # Vitest em watch
```

## Usuárias de exemplo (seed)

| Papel | Email | Senha |
|---|---|---|
| Admin | `admin@despertarespiral.local` | `admin123` |
| Membro | `membro@despertarespiral.local` | `membro123` |

Para resetar o banco local (apagar tudo e voltar ao seed):

```js
// Console do navegador:
localStorage.clear(); location.reload();
```

Ou no código:

```ts
import { resetDB } from "@/lib/supabase";
resetDB();
```

## Estrutura

```
src/
├── App.tsx                  # Rotas (lazy)
├── main.tsx                 # Bootstrap (providers + theme)
├── index.css                # Variáveis CSS + utilitários
├── assets/                  # Imagens
├── components/
│   ├── ui/                  # shadcn/ui (não editar)
│   ├── layout/              # Layouts de área (Dashboard, Admin) + nav
│   └── features/            # Componentes de feature (Quiz)
├── constants/               # Conteúdo e seeds de UI
├── hooks/                   # useAuth, useTheme, etc.
├── lib/
│   ├── supabase.ts          # Re-export do backend local (mantém API)
│   ├── local/               # Implementação local (auth, query, storage, fns)
│   ├── analytics.ts         # Captura de UTM
│   ├── authErrors.ts        # Mapeamento de mensagens
│   ├── contentSafety.ts     # Sanitização de input
│   ├── dateUtils.ts         # Formatação de data
│   ├── email.ts             # Stub de email (no-op)
│   ├── sequenzy.ts          # Stub de CRM (no-op)
│   ├── ErrorBoundary.tsx
│   └── utils.ts             # cn() helper
├── pages/                   # Componentes de rota
│   ├── admin/               # Painel administrativo
│   └── __tests__/
├── test/                    # Setup e mocks de teste
└── types/                   # Tipos de domínio
```

## Backend local

Tudo que antes ia para Supabase, Asaas ou Sequenzy agora é tratado por `src/lib/local/`:

- **Auth** (`auth.ts`) — login com email/senha, OTP fake (qualquer código de 6 dígitos), sessão em `localStorage`
- **Query builder** (`query.ts`) — chainable, compatível com a API do Supabase (`from().select().eq().single()`)
- **Storage** (`storage.ts`) — uploads viram `Object URL`s na sessão atual
- **Edge functions** (`functions.ts`) — handlers locais para `checkout-session`, `crm-stats`, etc.
- **Seed** (`seed.ts`) — dados iniciais: 2 usuárias, 2 produtos, 9 aulas, 3 posts da comunidade

## O que não está disponível em modo local

- Google OAuth (use email/senha — admin / membro)
- Webhooks reais (Asaas, Sequenzy)
- Envio de email real (mensagens são logadas no console em DEV)
- Sync entre dispositivos (os dados ficam só no `localStorage` do navegador)

## Licença

Privado.

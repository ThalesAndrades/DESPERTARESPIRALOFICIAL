# Configurar Claude Code com MCP do Supabase

Esta config conecta o Claude Code direto ao seu projeto Supabase
(`dwblhkpodaabuuubloht`), permitindo que o assistente:

- Inspecione e altere o schema (tabelas, RLS, triggers)
- Faça deploy de Edge Functions
- Leia/escreva linhas (com sua permissão)
- Consulte docs do Supabase contextualmente
- Crie branches de DB pra testar antes de aplicar em prod

## 1. Pré-requisito

Você precisa do **Claude Code CLI instalado localmente** no seu Mac/Windows/Linux:

```sh
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | sh

# ou via npm
npm i -g @anthropic-ai/claude-code
```

## 2. Config já está no repo

O arquivo `.mcp.json` na raiz do projeto já tem o servidor MCP do Supabase configurado apontando pro projeto `dwblhkpodaabuuubloht`. Não precisa rodar `claude mcp add`.

Confirme com:

```sh
cd /caminho/pro/repositorio
cat .mcp.json
```

## 3. Autenticar (uma vez)

Em um terminal regular (não dentro de IDE):

```sh
cd /caminho/pro/repositorio
claude
# Dentro do prompt do Claude:
/mcp
```

- Selecione `supabase` na lista
- Escolha `Authenticate`
- Vai abrir o navegador → faça login no Supabase → autoriza

Depois disso, qualquer sessão do Claude Code nesse projeto tem acesso ao MCP.

## 4. (Opcional) Agent Skills do Supabase

Skills dão instruções prontas pra IA trabalhar melhor com Supabase
(migrations, queries, RLS policies):

```sh
npx skills add supabase/agent-skills
```

## 5. Verificar que funcionou

Dentro do Claude Code, peça algo como:

> "Liste as tabelas do meu Supabase"

Ou:

> "Execute esta query: select count(*) from auth.users"

Se o MCP estiver funcionando, o assistente vai usar tools `mcp__supabase__*` em vez de te pedir pra rodar manualmente.

## Sobre Claude Code on the web (browser)

Em sessões na web (`claude.ai/code`), o MCP do Supabase **não funciona automaticamente** porque:

- A autenticação OAuth precisa de browser interativo
- O ambiente web é efêmero (não persiste tokens)

Alternativas em sessões web:
- Você executa a SQL/Edge Function manualmente seguindo as instruções do assistente
- OU me passa temporariamente credenciais que faço chamadas REST (NÃO recomendado pra service_role — pode comprometer segurança)

## Segurança

O `.mcp.json` **NÃO contém tokens** — só a URL pública do MCP server.
A autenticação fica armazenada localmente no seu Claude Code (`~/.claude/`).

OK pra versionar no Git.

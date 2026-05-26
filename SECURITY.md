# Política de Segurança

## Modelo de execução

Esta aplicação roda 100% no navegador (cliente único). Não há servidor próprio,
banco de dados remoto, nem credenciais sensíveis em código.

- **Dados**: persistidos em `localStorage` do navegador da usuária. Nada é enviado para fora.
- **Autenticação local**: senhas dos seeds são apenas para uso de demonstração em ambiente local. Não use estas credenciais em produção pública.
- **Sem chaves**: não há `.env` com segredos, tokens ou chaves de API.

## Reportar vulnerabilidade

Como o projeto não expõe superfície de servidor, vulnerabilidades relevantes
seriam XSS, fuga de dados via `localStorage` ou problemas no fluxo de auth local.

Se encontrar algo, abra uma issue privada (Security Advisory) no GitHub do
repositório ou contate diretamente a pessoa mantenedora.

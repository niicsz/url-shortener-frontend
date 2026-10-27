# BiniTech • Encurtador de URLs (frontend)

SPA em **Angular 21** do encurtador de URLs. Consome a API do
[url-shortener-backend](https://github.com/niicsz/url-shortener-backend) (Spring Boot,
Cassandra, Redis, Hashids).

## Funcionalidades

- Encurta qualquer URL e mostra o link pronto para copiar ou abrir; enquanto a palavra é
  digitada, o link final aparece montado ao lado.
- **Palavra personalizada (opcional):** o usuário escolhe o trecho depois da barra
  (`/minha-promo`) no lugar do código gerado. Aceita de 3 a 50 caracteres: letras sem acento,
  números, `-` e `_`. A validação acontece no formulário e de novo na API, que recusa
  palavras reservadas e palavras já em uso (`409`).
- Lista de links recentes salva no navegador (`localStorage`).
- Painel com os links ordenados por cliques, resumo (total, com e sem cliques) e falhas
  mostradas com um traço, nunca como zero.

## Design

A interface segue o [taste-skill](https://github.com/Leonxlnx/taste-skill) no modo de telas de
app, estilo *achromatic ledger*: sem cor na interface, botão principal quase preto, o único tom
(`#1d5fbf`) só no dado principal (a palavra do link e a barra do link mais acessado), links e
números em Geist Mono, bordas de 1px em vez de sombras e estados de vazio, carregamento e erro
dentro de cada bloco.

## Stack

| Camada   | Tecnologia                                          |
|----------|-----------------------------------------------------|
| UI       | Angular 21 (standalone, signals), CSS próprio, Geist e Geist Mono |
| Servidor | nginx (arquivos estáticos + proxy de `/api`)        |
| Build    | npm, Docker multi-stage (Angular → nginx)           |

## Como rodar

Suba o backend antes (veja o README do
[url-shortener-backend](https://github.com/niicsz/url-shortener-backend)); ele responde em
`http://localhost:8080`.

### Desenvolvimento

```bash
npm install
npm start   # http://localhost:4200, proxy de /api para http://localhost:8080
```

### Docker

```bash
docker compose up --build   # http://localhost:4200
```

O nginx repassa `/api` para o endereço em `BACKEND_URL` e serve `/config.json` com o domínio
dos links curtos (`SHORT_BASE_URL`), usado no prefixo do campo e na prévia do link.
No `npm start`, o arquivo `public/config.json` faz esse papel. Por padrão é o backend rodando na
máquina host (`http://host.docker.internal:8080`); para outro endereço:

```bash
BACKEND_URL=http://minha-api:8080 docker compose up --build
```

## Estrutura

```
url-shortener-frontend/
├── src/app/
│   ├── shorten/                tela de encurtar (URL + palavra personalizada)
│   ├── stats/                  painel de cliques
│   └── shared/                 components (ícones, link curto), models e services
├── nginx/default.conf.template SPA fallback + proxy /api
├── proxy.conf.json             proxy do ng serve
├── Dockerfile                  multi-stage (Angular → nginx)
└── docker-compose.yml
```

## Configuração

| Variável      | Default                            |
|---------------|------------------------------------|
| `BACKEND_URL` | `http://host.docker.internal:8080` |
| `SHORT_BASE_URL` | `http://localhost:8080` |

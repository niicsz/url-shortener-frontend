# BiniTech • Encurtador de URLs (frontend)

SPA em **Angular 21** do encurtador de URLs. Consome a API do
[url-shortener-backend](https://github.com/niicsz/url-shortener-backend) (Spring Boot,
Cassandra, Redis, Hashids).

## Funcionalidades

- Encurta qualquer URL e mostra o link pronto para copiar ou abrir.
- **Palavra personalizada (opcional):** o usuário escolhe o trecho depois da barra
  (`/minha-promo`) no lugar do código gerado. Aceita de 3 a 50 caracteres: letras sem acento,
  números, `-` e `_`. A validação acontece no formulário e de novo na API, que recusa
  palavras reservadas e palavras já em uso (`409`).
- Lista de links recentes salva no navegador (`localStorage`).
- Painel de cliques com as estatísticas de cada link recente.

## Stack

| Camada   | Tecnologia                                          |
|----------|-----------------------------------------------------|
| UI       | Angular 21 + Angular Material (standalone, signals) |
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

O nginx repassa `/api` para o endereço em `BACKEND_URL`. Por padrão é o backend rodando na
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
│   └── shared/                 models e services (API, links recentes)
├── nginx/default.conf.template SPA fallback + proxy /api
├── proxy.conf.json             proxy do ng serve
├── Dockerfile                  multi-stage (Angular → nginx)
└── docker-compose.yml
```

## Configuração

| Variável      | Default                            |
|---------------|------------------------------------|
| `BACKEND_URL` | `http://host.docker.internal:8080` |

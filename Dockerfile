FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

FROM nginx:1.27-alpine AS runtime

ENV BACKEND_URL=http://backend:8080
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/url-shortener-frontend/browser/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1

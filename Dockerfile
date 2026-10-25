FROM node:22.23.4-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4321/api/health || exit 1

EXPOSE 4321

CMD ["nginx", "-g", "daemon off;"]

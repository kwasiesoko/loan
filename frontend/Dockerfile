# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=https://api.loan.elicitlabs.link
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

COPY --from=builder /app/dist       /usr/share/nginx/html
COPY frontend/nginx.conf            /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

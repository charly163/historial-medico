# 1. Compilación del Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-fund --no-audit
COPY frontend/ ./
RUN npm run build

# 2. Instalación de dependencias del Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache python3 make g++
COPY backend/package*.json ./
RUN npm ci --only=production --no-fund --no-audit

# 3. Imagen final de ejecución
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=8080
ENV APP_PORT=8080

COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/backend/uploads/lab-reports /app/backend/uploads/diagnostic-studies

WORKDIR /app/backend

EXPOSE 8080

CMD ["dumb-init", "node", "server.js"]

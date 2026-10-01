# Etapa 1: build del frontend
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Etapa 2: imagen final (backend + frontend estatico)
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /build/dist ../frontend/dist
RUN rm -f .env .env.local
EXPOSE 3001
CMD ["sh", "-c", "node db/migrate.js && node src/index.js"]

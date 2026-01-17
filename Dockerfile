# Dockerfile para Logistics API

# Stage 1: Builder - Instalar dependencias y construir
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm install

# Copiar archivos de configuración y código fuente
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Construir la aplicación
RUN ./node_modules/.bin/nest build

# Stage 2: Production - Imagen final optimizada
FROM node:20-alpine AS production

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el build desde la etapa builder
COPY --from=builder /app/dist ./dist

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Exponer el puerto de la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación en producción
CMD ["node", "dist/main"]

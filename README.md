# 🚀 Logistics API

Sistema de gestión logística y seguimiento de paquetes construido con NestJS, implementando arquitectura hexagonal/clean architecture.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Ejecución](#-instalación-y-ejecución)
  - [Opción 1: Con Docker (Recomendado)](#opción-1-con-docker-recomendado)
  - [Opción 2: Desarrollo Local](#opción-2-desarrollo-local)
- [API Endpoints](#-api-endpoints)
- [Arquitectura](#-arquitectura)
- [Variables de Entorno](#-variables-de-entorno)
- [Testing](#-testing)
- [Documentación](#-documentación)

## ✨ Características

- 🔐 **Autenticación JWT** con roles (ADMIN/USER)
- 📦 **Gestión de paquetes** con tracking number único
- 📍 **Sistema de tracking** con historial de ubicaciones y estados
- 👥 **Gestión de usuarios** con permisos por rol
- 🗄️ **Base de datos híbrida**: PostgreSQL (usuarios y paquetes) + MongoDB (tracking)
- 📚 **Documentación Swagger/OpenAPI** integrada
- 🏗️ **Arquitectura Hexagonal** (Clean Architecture)
- 🔒 **Guards y decoradores** personalizados para autorización
- ✅ **Validación de datos** con class-validator
- 🌱 **Seeders** para datos iniciales

## 🛠️ Tecnologías

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) v5.7
- **Base de datos SQL**: [PostgreSQL](https://www.postgresql.org/) v16
- **Base de datos NoSQL**: [MongoDB](https://www.mongodb.com/) v7.0
- **ORM SQL**: [TypeORM](https://typeorm.io/) v0.3
- **ODM NoSQL**: [Mongoose](https://mongoosejs.com/) v8
- **Autenticación**: [Passport](http://www.passportjs.org/) + JWT
- **Documentación**: [Swagger](https://swagger.io/)
- **Containerización**: [Docker](https://www.docker.com/) + Docker Compose

## 📦 Requisitos Previos

### Para ejecutar con Docker (Recomendado):
- [Docker](https://docs.docker.com/get-docker/) >= 20.x
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.x

### Para desarrollo local:
- [Node.js](https://nodejs.org/) >= 20.x
- [npm](https://www.npmjs.com/) >= 10.x
- [PostgreSQL](https://www.postgresql.org/download/) >= 16.x
- [MongoDB](https://www.mongodb.com/try/download/community) >= 7.x

## 🚀 Instalación y Ejecución

### Opción 1: Con Docker (Recomendado)

Esta es la forma más rápida y sencilla. Todo se configura automáticamente.

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd logistics-api

# 2. Levantar todos los servicios (PostgreSQL + MongoDB + API)
docker compose --env-file .env.docker up -d

# 3. Verificar que todos los servicios estén corriendo
docker compose ps
# Todos deben mostrar status "Up" y "healthy"

# 4. Ver logs de la aplicación (opcional)
docker compose logs -f app
```

**¡Listo!** La API estará disponible en:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5434 (mapeo externo)
- **MongoDB**: localhost:27019 (mapeo externo)

**Credenciales por defecto:**
- Email: `admin@logistics.com`
- Password: `admin123`
- Role: `ADMIN`

#### Comandos útiles de Docker:

```bash
# Detener servicios
docker compose down

# Detener y eliminar volúmenes (borra toda la data)
docker compose down -v

# Reiniciar un servicio específico
docker compose restart app

# Ver logs en tiempo real
docker compose logs -f

# Reconstruir la imagen después de cambios en el código
docker compose build app
docker compose --env-file .env.docker up -d
```

---

### Opción 2: Desarrollo Local

Si prefieres ejecutar la aplicación directamente en tu máquina:

#### 1. Instalar dependencias
```bash
npm install
```

#### 2. Configurar bases de datos

Asegúrate de tener PostgreSQL y MongoDB corriendo localmente.

**PostgreSQL:**
```bash
# Crear base de datos
createdb logistics_db

# O usando psql
psql -U postgres
CREATE DATABASE logistics_db;
```

**MongoDB:**
```bash
# MongoDB crea la base automáticamente al usarla
# Solo asegúrate de que el servicio esté corriendo
mongosh
```

#### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=logistics_db
DB_SYNCHRONIZE=true
DB_LOGGING=false

# MongoDB
MONGODB_URI=mongodb://localhost:27017/logistics_tracking

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d

# Application
PORT=3000
NODE_ENV=development
```

#### 4. Ejecutar la aplicación

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

La API estará disponible en http://localhost:3000

---

## 📡 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/login` | Iniciar sesión | No |

### Usuarios

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/v1/users` | Listar usuarios (paginado) | Sí | Todos |
| GET | `/api/v1/users/:id` | Obtener usuario por ID | Sí | Todos |
| POST | `/api/v1/users` | Crear nuevo usuario | Sí | ADMIN |

### Paquetes

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/v1/packages` | Listar paquetes (paginado) | Sí | USER: sus paquetes<br>ADMIN: todos |
| GET | `/api/v1/packages/:id` | Obtener paquete por ID | Sí | USER: solo suyos<br>ADMIN: todos |
| POST | `/api/v1/packages` | Crear nuevo paquete | Sí | Todos |
| PATCH | `/api/v1/packages/:id/status` | Actualizar estado del paquete | Sí | ADMIN |

### Tracking

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/v1/packages/:packageId/tracking` | Registrar evento de tracking | Sí | USER: sus paquetes<br>ADMIN: todos |
| GET | `/api/v1/packages/:packageId/tracking` | Historial de tracking | Sí | USER: sus paquetes<br>ADMIN: todos |

### Ejemplo de uso:

```bash
# 1. Login (con Docker Compose en puerto 3000)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@logistics.com","password":"admin123"}'

# Respuesta:
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "accessToken": "eyJhbGc...",
    "user": { ... }
  }
}

# 2. Usar el token en requests autenticados
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer eyJhbGc..."
```

> **Nota:** Si ejecutas la app con `npm run start:dev` (desarrollo local), usa `http://localhost:3002` en lugar de `3000` (configurando `PORT=3002` en tu archivo `.env` local).

---

## 🏗️ Arquitectura

El proyecto implementa **Arquitectura Hexagonal** (Clean Architecture):

```
src/
├── domain/                    # Capa de dominio (lógica de negocio)
│   ├── entities/             # Entidades de dominio
│   ├── value-objects/        # Objetos de valor
│   ├── ports/                # Interfaces (puertos)
│   └── errors/               # Errores de dominio
├── application/              # Capa de aplicación (casos de uso)
│   ├── use-cases/           # Casos de uso
│   ├── dto/                 # DTOs de aplicación
│   └── mappers/             # Mappers dominio ↔ dto
├── infrastructure/           # Capa de infraestructura (adaptadores)
│   ├── controllers/         # Controladores REST
│   ├── persistence/         # Repositorios (SQL/NoSQL/In-Memory)
│   ├── services/            # Servicios externos
│   ├── guards/              # Guards de autorización
│   └── filters/             # Filtros de excepciones
└── modules/                  # Módulos de NestJS
```

### Principios aplicados:
- ✅ **Separación de responsabilidades**: Cada capa tiene su propósito
- ✅ **Inversión de dependencias**: El dominio no depende de la infraestructura
- ✅ **Domain-Driven Design**: Entidades y value objects expresivos
- ✅ **Ports & Adapters**: Interfaces para desacoplar capas

---

## 🔧 Variables de Entorno

### Variables para Docker (ya configuradas en .env.docker):

El proyecto incluye un archivo `.env.docker` con los valores configurados para Docker Compose:

```yaml
DB_HOST=postgres                    # Nombre del servicio PostgreSQL
DB_PORT=5434                        # Puerto externo (sin conflicto con desarrollo local)
DB_USERNAME=produser
DB_PASSWORD=prodpass123
DB_NAME=logistics_prod
DB_SYNCHRONIZE=true                # Auto-crear tablas (solo dev/demo)
DB_LOGGING=false

MONGODB_URI=mongodb://mongodb:27019/logistics_tracking_prod

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d

PORT=3000                          # Puerto de la API en Docker
NODE_ENV=production
```

### Variables para desarrollo local:

Si quieres ejecutar sin Docker, crea un archivo `.env`:

```env
DB_HOST=localhost              # Usar localhost para desarrollo
DB_PORT=5432                   # O el puerto de tu PostgreSQL local
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=logistics_db
DB_SYNCHRONIZE=true
DB_LOGGING=false

MONGODB_URI=mongodb://localhost:27017/logistics_tracking

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

PORT=3002                         # Puerto para desarrollo local (evita conflicto con Docker)
NODE_ENV=development
```

### Archivos de configuración disponibles:

| Archivo | Propósito | Puertos | Uso |
|---------|-----------|---------|-----|
| `.env.docker` | Docker Compose | 3000, 5434, 27019 | `docker compose --env-file .env.docker up -d` |
| `.env.example` | Documentación | N/A | Referencia |
| `.env` (crear) | Desarrollo local | 3002, 5433, 27018 | `npm run start:dev` |


## 📚 Documentación

### Swagger/OpenAPI

La documentación interactiva está disponible en:

**URL con Docker**: http://localhost:3000/api/docs  
**URL desarrollo local**: http://localhost:3002/api/docs

Desde Swagger puedes:
- ✅ Ver todos los endpoints disponibles
- ✅ Probar requests directamente
- ✅ Ver modelos de datos (DTOs)
- ✅ Autenticarte con JWT Bearer token

### Cómo usar Swagger:

1. Abre http://localhost:3000/api/docs (Docker) o http://localhost:3002/api/docs (desarrollo local)
2. Haz login usando el endpoint `/api/v1/auth/login`
3. Copia el `accessToken` de la respuesta
4. Haz clic en el botón "Authorize" (arriba a la derecha)
5. Pega el token en el formato: `Bearer <tu-token>`
6. Ahora puedes probar todos los endpoints protegidos

## 🤝 Contribución

Este proyecto implementa las mejores prácticas de NestJS y Clean Architecture. Al contribuir:

1. Mantén la separación de capas (domain, application, infrastructure)
2. Usa DTOs para validación de datos
3. Implementa tests unitarios para casos de uso
4. Documenta endpoints en Swagger con decoradores

---

## 📄 Licencia

UNLICENSED - Proyecto privado

---

## 👥 Autor

**Gersson Enrique Salazar Ramirez**

Desarrollado como parte de un reto técnico de logística y seguimiento de paquetes.


## 🔗 Enlaces Útiles

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Mongoose Documentation](https://mongoosejs.com)
- [Docker Documentation](https://docs.docker.com)

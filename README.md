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
- 🌱 **Seeders automáticos** para datos iniciales (usuario admin al iniciar)
- 🧪 **Suite completa de tests**: Unitarios (10 suites) e Integración (54 tests)

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

| Método | Endpoint             | Descripción    | Autenticación |
| ------ | -------------------- | -------------- | ------------- |
| POST   | `/api/v1/auth/login` | Iniciar sesión | No            |

### Usuarios

| Método | Endpoint            | Descripción                | Autenticación | Roles |
| ------ | ------------------- | -------------------------- | ------------- | ----- |
| GET    | `/api/v1/users`     | Listar usuarios (paginado) | Sí            | Todos |
| GET    | `/api/v1/users/:id` | Obtener usuario por ID     | Sí            | Todos |
| POST   | `/api/v1/users`     | Crear nuevo usuario        | Sí            | ADMIN |

### Paquetes

| Método | Endpoint                      | Descripción                   | Autenticación | Roles                              |
| ------ | ----------------------------- | ----------------------------- | ------------- | ---------------------------------- |
| GET    | `/api/v1/packages`            | Listar paquetes (paginado)    | Sí            | USER: sus paquetes<br>ADMIN: todos |
| GET    | `/api/v1/packages/:id`        | Obtener paquete por ID        | Sí            | USER: solo suyos<br>ADMIN: todos   |
| POST   | `/api/v1/packages`            | Crear nuevo paquete           | Sí            | Todos                              |
| PATCH  | `/api/v1/packages/:id/status` | Actualizar estado del paquete | Sí            | ADMIN                              |

### Tracking

| Método | Endpoint                               | Descripción                  | Autenticación | Roles                              |
| ------ | -------------------------------------- | ---------------------------- | ------------- | ---------------------------------- |
| POST   | `/api/v1/packages/:packageId/tracking` | Registrar evento de tracking | Sí            | USER: sus paquetes<br>ADMIN: todos |
| GET    | `/api/v1/packages/:packageId/tracking` | Historial de tracking        | Sí            | USER: sus paquetes<br>ADMIN: todos |

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

El proyecto implementa **Arquitectura Hexagonal** (Clean Architecture) con organización **vertical modular** (feature-based):

```
src/
├── modules/                  # Módulos de negocio (estructura vertical)
│   ├── auth/                # Módulo de autenticación
│   │   ├── domain/          # Capa de dominio
│   │   │   ├── errors/      # Errores específicos del módulo
│   │   │   └── ports/       # Interfaces (puertos)
│   │   ├── application/     # Capa de aplicación
│   │   │   ├── use-cases/   # Casos de uso
│   │   │   └── dto/         # DTOs de aplicación
│   │   └── infrastructure/  # Capa de infraestructura
│   │       ├── controllers/ # Controladores REST
│   │       ├── dto/         # DTOs de infraestructura
│   │       └── strategies/  # Estrategias (JWT, etc.)
│   ├── packages/            # Módulo de paquetes
│   │   ├── domain/
│   │   │   ├── entities/    # Entidades de dominio
│   │   │   ├── value-objects/ # Objetos de valor
│   │   │   ├── ports/       # Interfaces de repositorio
│   │   │   └── errors/      # Errores de dominio
│   │   ├── application/
│   │   │   ├── use-cases/   # Casos de uso
│   │   │   ├── dto/         # DTOs de aplicación
│   │   │   └── mappers/     # Mappers dominio ↔ dto
│   │   └── infrastructure/
│   │       ├── controllers/ # Controladores REST
│   │       ├── persistence/ # Adaptadores de repositorio (SQL)
│   │       └── dto/         # DTOs de infraestructura
│   ├── users/               # Módulo de usuarios
│   │   ├── domain/
│   │   │   ├── entities/    # Entidades de dominio
│   │   │   ├── value-objects/ # Objetos de valor (roles, estados)
│   │   │   ├── ports/       # Interfaces de repositorio
│   │   │   └── errors/      # Errores de dominio
│   │   ├── application/
│   │   │   ├── use-cases/   # Casos de uso
│   │   │   ├── dto/         # DTOs de aplicación
│   │   │   └── mappers/     # Mappers dominio ↔ dto
│   │   └── infrastructure/
│   │       ├── controllers/ # Controladores REST
│   │       ├── persistence/ # Adaptadores de repositorio (SQL)
│   │       ├── dto/         # DTOs de infraestructura
│   │       └── seeds/       # Seeders de usuarios
│   ├── tracking/            # Módulo de tracking
│   │   ├── domain/
│   │   │   ├── entities/    # Entidades de dominio
│   │   │   ├── ports/       # Interfaces de repositorio
│   │   │   └── errors/      # Errores de dominio
│   │   ├── application/
│   │   │   ├── use-cases/   # Casos de uso
│   │   │   ├── dto/         # DTOs de aplicación
│   │   │   └── mappers/     # Mappers dominio ↔ dto
│   │   └── infrastructure/
│   │       ├── controllers/ # Controladores REST
│   │       ├── persistence/ # Adaptadores de repositorio (MongoDB)
│   │       └── dto/         # DTOs de infraestructura
│   ├── database/            # Módulo de configuración de bases de datos
│   │   └── database.module.ts  # Configuración TypeORM + Mongoose
│   └── seeds/               # Módulo de seeders
│       └── seeds.module.ts  # Orquestación de seeders
├── shared/                   # Código compartido entre módulos
│   ├── domain/              # Dominio compartido
│   │   ├── common/          # Utilidades comunes (paginación, etc.)
│   │   └── ports/           # Puertos compartidos (PasswordHasher, TokenGenerator)
│   └── infrastructure/      # Infraestructura compartida
│       ├── guards/          # Guards de autorización (JWT, Roles)
│       ├── filters/         # Filtros de excepciones (HTTP)
│       ├── interceptors/    # Interceptores (Response)
│       ├── decorators/      # Decoradores personalizados (@CurrentUser, @Roles)
│       ├── interfaces/     # Interfaces compartidas (ApiResponse)
│       └── services/        # Servicios compartidos (PasswordHasher, TokenGenerator)
├── app.module.ts            # Módulo raíz de NestJS
└── main.ts                  # Punto de entrada de la aplicación
```

### Principios aplicados:

- ✅ **Arquitectura Hexagonal**: Separación clara entre dominio, aplicación e infraestructura
- ✅ **Estructura Vertical Modular**: Cada módulo es autónomo y contiene sus propias capas
- ✅ **Separación de responsabilidades**: Cada capa tiene su propósito específico
- ✅ **Inversión de dependencias**: El dominio no depende de la infraestructura
- ✅ **Domain-Driven Design**: Entidades y value objects expresivos por módulo
- ✅ **Ports & Adapters**: Interfaces para desacoplar capas y módulos
- ✅ **Bounded Contexts**: Cada módulo representa un contexto delimitado del dominio
- ✅ **Módulo de Base de Datos Centralizado**: Configuración unificada de PostgreSQL y MongoDB
- ✅ **Sistema de Seeders**: Inicialización automática de datos de prueba al iniciar la aplicación

### Ventajas de la estructura vertical:

- 🎯 **Mejor encapsulación**: Cada módulo agrupa su lógica relacionada
- 📈 **Escalabilidad**: Fácil agregar nuevos módulos sin afectar existentes
- 🔍 **Mantenibilidad**: Código relacionado está junto, fácil de encontrar
- 🧩 **Cohesión**: Alta cohesión dentro de cada módulo
- 🔒 **Bajo acoplamiento**: Módulos independientes entre sí

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

| Archivo        | Propósito        | Puertos           | Uso                                           |
| -------------- | ---------------- | ----------------- | --------------------------------------------- |
| `.env.docker`  | Docker Compose   | 3000, 5434, 27019 | `docker compose --env-file .env.docker up -d` |
| `.env.example` | Documentación    | N/A               | Referencia                                    |
| `.env` (crear) | Desarrollo local | 3002, 5433, 27018 | `npm run start:dev`                           |

## 📚 Documentación

### Swagger/OpenAPI

La documentación interactiva está disponible en:

**URL con Docker**: http://localhost:3000/api/docs  
**URL desarrollo local**: http://localhost:3002/api/docs

Desde Swagger puedes:

- ✅ Ver todos los endpoints disponibles organizados por tags (auth, users, packages, tracking)
- ✅ Probar requests directamente desde el navegador
- ✅ Ver modelos de datos (DTOs) y esquemas de validación
- ✅ Autenticarte con JWT Bearer token (persistente entre sesiones)
- ✅ Ver ejemplos de requests y responses

### Cómo usar Swagger:

1. Abre http://localhost:3000/api/docs (Docker) o http://localhost:3002/api/docs (desarrollo local)
2. Haz login usando el endpoint `/api/v1/auth/login`
3. Copia el `accessToken` de la respuesta
4. Haz clic en el botón "Authorize" (arriba a la derecha)
5. Pega el token en el formato: `Bearer <tu-token>`
6. Ahora puedes probar todos los endpoints protegidos

## 🧪 Testing

El proyecto incluye una suite completa de tests unitarios para validar la lógica de negocio de los casos de uso.

### Estructura de Tests

Los tests están organizados siguiendo la estructura modular del proyecto:

```
test/
├── unit/                          # Tests unitarios
│   └── modules/
│       ├── users/
│       │   └── application/use-cases/
│       │       ├── create-user.use-case.spec.ts
│       │       ├── get-user.use-case.spec.ts
│       │       └── list-users.use-case.spec.ts
│       ├── auth/
│       │   └── application/use-cases/
│       │       └── login.use-case.spec.ts
│       ├── packages/
│       │   └── application/use-cases/
│       │       ├── create-package.use-case.spec.ts
│       │       ├── get-package.use-case.spec.ts
│       │       ├── list-packages.use-case.spec.ts
│       │       └── update-package-status.use-case.spec.ts
│       └── tracking/
│           └── application/use-cases/
│               ├── create-tracking.use-case.spec.ts
│               └── get-tracking-history.use-case.spec.ts
├── integration/                   # Tests de integración
│   └── modules/
│       ├── auth/
│       │   └── auth.controller.integration.spec.ts
│       ├── packages/
│       │   └── packages.controller.integration.spec.ts
│       ├── tracking/
│       │   └── tracking.controller.integration.spec.ts
│       └── users/
│           └── users.controller.integration.spec.ts
├── setup/                         # Configuración de tests
│   ├── docker-test-setup.ts      # Gestión de Docker para tests
│   ├── integration.setup.ts      # Setup de aplicación para tests
│   ├── global-setup.ts            # Setup global de Jest
│   └── global-teardown.ts         # Teardown global de Jest
└── e2e/                           # Tests end-to-end
```

### Cobertura Actual

#### ✅ Unit Tests - Use Cases (10/10)

**Módulo Users (3/3):**

- ✅ `CreateUserUseCase` - Validación de email único, hash de contraseñas, roles y estados
- ✅ `GetUserUseCase` - Obtención de usuario por ID, validación de existencia
- ✅ `ListUsersUseCase` - Listado paginado, filtros y ordenamiento

**Módulo Auth (1/1):**

- ✅ `LoginUseCase` - Autenticación, validación de credenciales, generación de tokens

**Módulo Packages (4/4):**

- ✅ `CreatePackageUseCase` - Creación de paquetes, validación de usuario, generación de tracking number
- ✅ `GetPackageUseCase` - Obtención de paquete, validación de autorización (USER/ADMIN)
- ✅ `ListPackagesUseCase` - Listado paginado con filtros por rol
- ✅ `UpdatePackageStatusUseCase` - Actualización de estado, validación de transiciones válidas

**Módulo Tracking (2/2):**

- ✅ `CreateTrackingUseCase` - Registro de eventos, validación de autorización
- ✅ `GetTrackingHistoryUseCase` - Historial de tracking, ordenamiento por fecha

**Total: 10 suites de tests unitarios** cubriendo todos los casos de uso principales.

#### ✅ Integration Tests - Controllers (54 tests)

**UsersController (20 tests):**

- ✅ POST /api/v1/users - Creación de usuarios, validaciones, autorización ADMIN
- ✅ GET /api/v1/users - Listado paginado, autorización
- ✅ GET /api/v1/users/:id - Obtención por ID, autorización

**AuthController (8 tests):**

- ✅ POST /api/v1/auth/login - Login exitoso, errores, validaciones de DTOs

**PackagesController (15 tests):**

- ✅ POST /api/v1/packages - Creación de paquetes, validaciones
- ✅ GET /api/v1/packages - Listado con filtros USER/ADMIN
- ✅ GET /api/v1/packages/:id - Obtención, autorización por propietario
- ✅ PATCH /api/v1/packages/:id/status - Actualización de estado (solo ADMIN)

**TrackingController (11 tests):**

- ✅ POST /api/v1/packages/:packageId/tracking - Creación de eventos, autorización
- ✅ GET /api/v1/packages/:packageId/tracking - Historial de tracking, autorización

**Total: 54 tests de integración** cubriendo todos los endpoints principales con autenticación JWT, autorización por roles y validación de DTOs.

### Ejecutar Tests

```bash
# Tests Unitarios
npm test                    # Ejecutar todos los tests unitarios
npm run test:watch          # Ejecutar en modo watch (desarrollo)
npm run test:cov            # Ejecutar con cobertura
npm run test:debug          # Ejecutar en modo debug

# Tests de Integración
npm run test:integration              # Ejecutar todos los tests de integración
npm run test:integration:watch        # Ejecutar en modo watch
npm run test:integration:cov          # Ejecutar con cobertura

# Gestión de Docker para tests
npm run test:docker:up      # Levantar bases de datos de test (PostgreSQL + MongoDB)
npm run test:docker:down    # Detener y eliminar bases de datos de test

# Todos los tests
npm run test:all           # Ejecutar unit + integration tests
```

> **Nota:** Los tests de integración requieren Docker. Se levantan automáticamente las bases de datos de test usando `docker-compose.test.yml`.

### Configuración de Tests

**Tests Unitarios** (`test/jest-unit.json`):

- **Framework**: Jest con TypeScript
- **Entorno**: Node.js
- **Cobertura**: Configurada para reportar métricas de código cubierto
- **Mocks**: Uso de mocks para repositorios y servicios externos

**Tests de Integración** (`test/jest-integration.json`):

- **Framework**: Jest con TypeScript
- **Entorno**: Node.js con aplicación NestJS completa
- **Bases de datos**: Docker Compose con PostgreSQL y MongoDB
- **Setup automático**: `globalSetup` y `globalTeardown` para gestión de Docker
- **Limpieza**: Limpieza automática de datos entre tests
- **Cobertura**: Endpoints HTTP, autenticación JWT, autorización, validación de DTOs

**Infraestructura de Testing:**

- ✅ `docker-compose.test.yml`: PostgreSQL y MongoDB para tests con tmpfs (mejor rendimiento)
- ✅ `test/setup/docker-test-setup.ts`: Gestión automatizada de contenedores Docker
- ✅ `test/setup/integration.setup.ts`: Setup de aplicación NestJS para tests
- ✅ `test/setup/global-setup.ts` y `global-teardown.ts`: Gestión global de Docker
- ✅ Variables de entorno específicas para testing

### Mejores Prácticas Aplicadas

**Tests Unitarios:**

- ✅ **Aislamiento**: Cada test es independiente y no depende de otros
- ✅ **Mocks**: Uso de mocks para dependencias externas (repositorios, servicios)
- ✅ **Helpers**: Funciones helper para reducir duplicación de código
- ✅ **Naming**: Nombres descriptivos que explican qué se está probando
- ✅ **Arrange-Act-Assert**: Estructura clara en cada test

**Tests de Integración:**

- ✅ **Bases de datos aisladas**: Docker Compose con bases de datos dedicadas para tests
- ✅ **Limpieza automática**: Datos limpiados entre tests para evitar interferencias
- ✅ **Setup/Teardown global**: Gestión automática de Docker antes y después de todos los tests
- ✅ **Autenticación real**: Tests con JWT tokens reales generados por el sistema
- ✅ **Cobertura completa**: Tests de éxito, errores, validaciones y autorización

## 🤝 Contribución

Este proyecto implementa las mejores prácticas de NestJS y Clean Architecture. Al contribuir:

1. **Organización modular**: Mantén la estructura vertical por módulos (domain, application, infrastructure dentro de cada módulo)
2. **Separación de capas**: Respeta la separación entre dominio, aplicación e infraestructura dentro de cada módulo
3. **DTOs**: Usa DTOs para validación de datos (application/dto para casos de uso, infrastructure/dto para controllers)
4. **Tests**: Implementa tests unitarios para casos de uso y tests de integración para controllers
5. **Documentación**: Documenta endpoints en Swagger con decoradores
6. **Ports & Adapters**: Define puertos en domain/ports e implementa adaptadores en infrastructure/persistence

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

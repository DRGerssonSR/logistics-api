# Reto Técnico de Código – API REST

## Escenario

Estás desarrollando un sistema de gestión de envíos para una empresa logística.
Debes crear un **API REST** que maneje paquetes, usuarios y seguimiento.
Este desarrollo debe contar con:

- Tests adecuados
- Estándares de respuesta
- Manejo de errores
- Buenas prácticas de diseño
- Código limpio

---

## Requerimientos No Funcionales

- La información de **usuarios y paquetes** debe estar en una base de datos **SQL**
- La información de **seguimiento** debe estar en una base de datos **NoSQL**
- El framework a utilizar es **NestJS**
- Se debe utilizar **Arquitectura Hexagonal o Arquitectura Limpia**
- La API debe estar **documentada**

---

## Backlog

- Como administrador, quiero crear nuevos usuarios para que puedan registrarse en el sistema y usar los servicios de paquetes.
- Como administrador o usuario, quiero consultar los datos de un usuario para ver su información personal y estado.
- Como usuario, quiero ver todos los paquetes que tengo registrados para poder hacer seguimiento de mis envíos.
- Como usuario, quiero registrar un nuevo paquete para que el sistema pueda gestionarlo y rastrearlo hasta la entrega.
- Como usuario o administrador, quiero consultar los datos de un paquete para conocer su estado, origen, destino y propietario.
- Como administrador o sistema automático, quiero actualizar el estado de un paquete (pendiente, en tránsito, entregado) para reflejar su progreso.
- Como usuario o sistema de logística, quiero registrar eventos de seguimiento de un paquete (ubicación y estado) para mantener un historial detallado del envío.
- Como usuario, quiero consultar el historial completo de un paquete para saber dónde ha estado y su estado actual.
- Como administrador del sistema, quiero tener un script automatizado que haga copias de seguridad automáticas de las bases de datos para proteger los datos ante fallos.
- Como desarrollador, quiero desplegar la aplicación y las bases de datos en contenedores para facilitar la instalación, pruebas y escalabilidad.
- Como usuario, quiero iniciar sesión para acceder solo a mis datos y funcionalidades permitidas.

---

## Consideraciones

- El código debe estar subido a un **repositorio público de GitHub**.
- Se debe examinar el backlog y **priorizar las historias de usuario** para generar un **MVP**.
- Indicar:

  - Historias de usuario terminadas
  - Criterios de priorización
  - Posibles mejoras

- Definir los endpoints según criterio propio.
- Los atributos y llaves principales de:

  - Usuarios
  - Paquetes
  - Seguimiento
    quedan a criterio del desarrollador.

- Documentar:

  - Instalación
  - Cómo iniciar el proyecto
  - Cómo llamar a las APIs

---

## Ejecución del proyecto

### Con Docker

```bash
docker compose up --build
```

### Sin Docker

```bash
npm install
npm run start:dev
```

---

## Documentación API

La documentación se encuentra disponible en:

```
http://localhost:3000/api
```

(Swagger)

---

## MVP

Las historias de usuario implementadas y criterios de priorización se detallan en este documento.

---

## Repositorio

Repositorio público:

```
https://github.com/usuario/nombre-repo
```

---

## Autor

Reto técnico desarrollado por:
**[Tu nombre]**

# World Tourism Solutions

Plataforma de gestión de servicios turísticos, publicaciones comerciales, reservas, mensajería en tiempo real e itinerarios personalizados.

---

## Tabla de contenidos

1. [Descripción General](#-1-descripción-general)
2. [Arquitectura y Tecnologías](#️-2-arquitectura-y-tecnologías)
3. [Modelo y Estructura de la Base de Datos](#️-3-modelo-y-estructura-de-la-base-de-datos)
4. [Funcionalidades Principales](#-4-funcionalidades-principales)
5. [Guía de Instalación y Ejecución Local](#️-5-guía-de-instalación-y-ejecución-local)
6. [Roadmap y Tareas Pendientes](#-6-roadmap-y-tareas-pendientes-todos)

---

## 📌 1. Descripción General

**World Tourism Solutions (WTS)** es una plataforma cliente-servidor orientada a centralizar la oferta turística —hospedajes, actividades, restaurantes y servicios complementarios— en un único ecosistema digital.

El proyecto resuelve la fragmentación típica del sector (información dispersa en redes sociales, WhatsApp y sitios aislados) y permite que **turistas** y **proveedores** operen en el mismo espacio:

| Capacidad | Descripción |
|-----------|-------------|
| Catálogo comercial | Publicación y descubrimiento de perfiles/servicios de proveedores |
| Reservas | Solicitud, cotización y seguimiento del estado de reservas |
| Mensajería | Chat interno cliente ↔ proveedor, soporte y asistente virtual |
| Itinerarios | Planificación personalizada de viajes con ítems vinculados a ofertas reales |
| Valoraciones | Sistema de reseñas y ratings asociados a cada perfil comercial |

> **Contexto académico:** proyecto de grado orientado a evidenciar análisis, diseño y construcción de software (UML, requerimientos y arquitectura cliente-servidor).

---

## 🏗️ 2. Arquitectura y Tecnologías

La solución se organiza como **monorepo** con separación clara entre API y cliente web.

```
Frontend (React + Vite)  →  API REST (Spring Boot)  →  SQLite
     Puerto 5173                    Puerto 8080         worldturism.db
```

### Backend — `Back_WTS`

| Tecnología | Uso |
|------------|-----|
| **Java 17** | Lenguaje de la API |
| **Spring Boot** | Framework de aplicación y servidor embebido |
| **Spring Data JPA** | Persistencia y mapeo objeto-relacional |
| **Spring Security + JWT** | Autenticación y autorización por roles |
| **SQLite** | Base de datos embebida para desarrollo (`worldturism.db`) |
| **springdoc-openapi** | Documentación interactiva (Swagger UI) |

Arquitectura interna (Clean Architecture):

```
Back_WTS/src/main/java/com/worldturism/spring/app/
├── domain/model/                 # Entidades JPA y enums
├── application/service/          # Casos de uso
├── infrastructure/
│   ├── persistence/repository/   # Repositorios Spring Data
│   ├── security/                 # JWT + filtros de seguridad
│   ├── config/                   # CORS, OpenAPI, migraciones SQLite
│   └── storage/                  # Almacenamiento de imágenes
├── presentation/
│   ├── controller/               # Controladores REST
│   └── dto/                      # Contratos de entrada/salida
└── common/                       # Manejo global de excepciones
```

### Frontend — `Front_WTS`

| Tecnología | Uso |
|------------|-----|
| **React 18** | UI declarativa |
| **TypeScript** | Tipado estático |
| **Vite 6** | Bundler y servidor de desarrollo |
| **Tailwind CSS 4** | Estilos utilitarios |
| **React Router** | Enrutamiento SPA |
| **Axios** | Cliente HTTP hacia la API |

Organización feature-first:

```
Front_WTS/src/
├── app/          # App, rutas, ProtectedRoute
├── core/         # Cliente API (Axios + JWT)
├── shared/       # Componentes reutilizables
├── features/     # auth, catalog, bookings, reviews, provider, profile, chat, admin
└── styles/       # Estilos globales
```

### Estructura del monorepo

```
world-tourism-solutions/
├── Back_WTS/                 # API Spring Boot + SQLite
│   ├── src/main/java/        # Código fuente Java
│   ├── src/main/resources/   # application.properties
│   ├── uploads/              # Imágenes subidas en local
│   ├── mvnw / mvnw.cmd       # Maven Wrapper
│   ├── pom.xml
│   └── worldturism.db        # Base SQLite (runtime)
├── Front_WTS/                # Cliente React + TypeScript + Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 🗄️ 3. Modelo y Estructura de la Base de Datos

### Esquema relacional actual (SQLite)

El dominio gira en torno a **usuarios** y **perfiles comerciales de proveedor**. Toda la oferta turística visible en catálogo vive en `provider_profiles`; el resto de tablas operativas se relacionan con ese agregado.

```
users (1) ──< (N) provider_profiles
                    │
                    ├──< (N) provider_profile_images
                    ├──< (N) bookings ── (0..1) reviews
                    ├──< (N) conversations ──< (N) messages
                    ├──< (N) reviews
                    ├──< (N) favorites
                    └──< (N) itinerary_items ──> itineraries ──> users
```

**Flujo principal de relaciones:**

| Origen | Destino | Cardinalidad | Clave foránea |
|--------|---------|--------------|---------------|
| `users` | `provider_profiles` | 1:N | `user_id` |
| `provider_profiles` | `provider_profile_images` | 1:N | `provider_profile_id` |
| `users` / `provider_profiles` | `bookings` | N:1 / N:1 | `user_id`, `provider_profile_id` |
| `users` / `provider_profiles` | `conversations` | N:1 / N:1 | `user_id`, `provider_profile_id` |
| `conversations` | `messages` | 1:N | `conversation_id` |
| `users` / `provider_profiles` | `reviews` | N:1 / N:1 | `user_id`, `provider_profile_id` |
| `users` | `itineraries` | 1:N | `user_id` |
| `itineraries` / `provider_profiles` | `itinerary_items` | 1:N / N:1 | `itinerary_id`, `provider_profile_id` |
| `users` / `provider_profiles` | `favorites` | N:1 / N:1 | `user_id`, `business_id` |

---

### Documentación del refactor arquitectónico

Se eliminó la duplicidad histórica entre “servicio turístico” y “perfil de proveedor”. La oferta comercial queda consolidada en un único agregado: **`ProviderProfile`**.

#### Eliminación de `services` y `saved_services`

| Antes | Ahora |
|-------|--------|
| Entidad/tabla `services` (`TourismService`) | **Eliminada** |
| Entidad/tabla `saved_services` (`SavedService`) | **Eliminada** |
| Datos de negocio y oferta repartidos en dos modelos | Unificados en **`ProviderProfile`** → tabla `provider_profiles` |

`ProviderProfile` concentra el nombre del negocio, descripción, categoría, ciudad, precio, estado de aprobación, rating agregado y el resto de atributos de la oferta visible en catálogo.

La migración automática `SqliteDropServicesMigration` elimina las tablas obsoletas y redirige las claves foráneas legacy hacia `provider_profiles.id`.

#### Reestructuración de claves foráneas → `provider_profile_id`

Las entidades dependientes ya no apuntan a un `service_id`. Se vinculan **exclusivamente** al perfil del proveedor:

| Tabla | Entidad | FK actual |
|-------|---------|-----------|
| `bookings` | `Booking` | `provider_profile_id` |
| `conversations` | `Conversation` | `provider_profile_id` |
| `reviews` | `Review` | `provider_profile_id` |
| `itinerary_items` | `ItineraryItem` | `provider_profile_id` |

#### Galería de imágenes

Se conserva **`ProviderProfileImage`** (`provider_profile_images`) como galería oficial: múltiples imágenes por perfil/servicio, ordenadas (`image_order`), con cascada y `orphanRemoval` desde `ProviderProfile`.

```
provider_profiles (1) ──< (N) provider_profile_images
        │
        ├──< bookings
        ├──< reviews
        ├──< conversations
        └──< itinerary_items
```

---

### Listado de entidades principales

| Tabla | Entidad JPA | Descripción |
|-------|-------------|-------------|
| `users` | `AppUser` | Cuentas del sistema (credenciales, rol, estado activo, datos de contacto) |
| `provider_profiles` | `ProviderProfile` | Perfil/negocio/oferta comercial del proveedor (núcleo del catálogo) |
| `provider_profile_images` | `ProviderProfileImage` | Galería multimedia asociada a cada perfil |
| `bookings` | `Booking` | Reservas/cotizaciones ligadas a un perfil y a un usuario |
| `conversations` | `Conversation` | Hilos de chat (cliente–proveedor, soporte o bot) |
| `messages` | `Message` | Mensajes individuales dentro de una conversación |
| `reviews` | `Review` | Valoraciones y comentarios sobre un perfil (asociables a una reserva) |
| `itineraries` | `Itinerary` | Planes de viaje creados por el usuario |
| `itinerary_items` | `ItineraryItem` | Ítems del itinerario vinculados a un `provider_profile` |
| `favorites` | `Favorite` | Perfiles marcados como favoritos por el usuario |

---

## 🚀 4. Funcionalidades Principales

### Roles de usuario

| Rol | Responsabilidad |
|-----|-----------------|
| `ADMIN` | Administración completa de usuarios, perfiles y operaciones de la plataforma |
| `USER` | Exploración del catálogo, reservas, reseñas, favoritos, chat e itinerarios |
| `PROVIDER` | Publicación y gestión de perfiles/ofertas comerciales y atención de reservas |
| `BOT` | Identidad del asistente virtual en conversaciones automatizadas |

> También existe el rol `SUPPORT` para gestión de tickets y estados de soporte, sin privilegios de administración total.

### Publicación y administración de perfiles/servicios

- Alta, edición y moderación de perfiles comerciales (`ProviderProfile`)
- Galería multimedial con múltiples imágenes ordenadas
- Estados de publicación/aprobación del servicio
- Catálogo público consultable por turistas

### Sistema de reservas y cotizaciones

- Solicitud de reserva asociada a un perfil de proveedor
- Control de estado del ciclo de vida (p. ej. pendiente, confirmada, cancelada)
- Panel del proveedor para gestionar solicitudes entrantes
- Cálculo de precio total según personas y oferta

### Módulo de chat interno

- Conversaciones cliente ↔ proveedor vinculadas a `provider_profile_id`
- Mensajes de texto (e imágenes) con estado de lectura
- Canales de soporte y asistente virtual (`BOT`)
- Historial persistente por conversación

### Planificador interactivo de itinerarios

- Creación de itinerarios con título y rango de fechas
- Inclusión de ítems ordenables vinculados a perfiles reales del catálogo
- Notas y fechas programadas por actividad

### Sistema de valoraciones y reseñas

- Calificación numérica y comentario textual
- Asociación opcional a una reserva concreta
- Actualización de rating agregado y conteo en el perfil del proveedor

---

## 🛠️ 5. Guía de Instalación y Ejecución Local

### Requisitos previos

| Herramienta | Versión recomendada |
|-------------|---------------------|
| **Java JDK** | 17+ |
| **Node.js** | 18+ |
| **npm** | Incluido con Node.js |
| **Maven** | 3.9+ (o el wrapper incluido `mvnw` / `mvnw.cmd`) |

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd world-tourism-solutions
```

### 2. Levantar el Backend (`Back_WTS`)

**Windows:**

```bash
cd Back_WTS
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
cd Back_WTS
./mvnw spring-boot:run
```

Compilación sin tests (opcional):

```bash
# Windows
.\mvnw.cmd compile -DskipTests

# Linux / macOS
./mvnw compile -DskipTests
```

| Configuración | Valor |
|---------------|-------|
| Puerto | `8080` |
| Base de datos | `Back_WTS/worldturism.db` (SQLite) |
| API base | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| CORS | `http://localhost:5173` (también `3000` / `4200`) |

### 3. Levantar el Frontend (`Front_WTS`)

En una segunda terminal:

```bash
cd Front_WTS
npm install
npm run dev
```

Build de producción (opcional):

```bash
npm run build
```

| Configuración | Valor |
|---------------|-------|
| Puerto | `5173` |
| App | http://localhost:5173 |
| API | `http://localhost:8080/api` (`src/core/api/client.ts`) |

Opcional — crear `Front_WTS/.env` para el mapa:

```env
VITE_GOOGLE_MAPS_API_KEY=tu_clave_de_google_maps
```

> Sin la clave de Maps el resto de la aplicación funciona con normalidad.

---

## 📋 6. Roadmap y Tareas Pendientes (TODOs)

| Prioridad | Tarea | Objetivo |
|-----------|-------|----------|
| Alta | **Migración SQLite → PostgreSQL** | Soporte de producción, transacciones robustas y alta concurrencia |
| Alta | **Consultas geoespaciales** | Búsqueda por coordenadas/ubicación (proximidad, mapas, filtrado territorial) |
| Media | **Pasarela de pagos en línea** | Cobro y confirmación de reservas dentro de la plataforma |
| Media | **Ampliación de pruebas** | Mayor cobertura unitaria e de integración en `Back_WTS` y `Front_WTS` |

### Detalle

1. **PostgreSQL en producción**  
   Sustituir SQLite por un motor relacional preparado para despliegues concurrentes, respaldos y escalado horizontal.

2. **Búsqueda geoespacial**  
   Incorporar latitud/longitud (o PostGIS) para consultas por radio, ordenamiento por distancia y mejor experiencia de descubrimiento.

3. **Integración de pagos**  
   Conectar una pasarela (p. ej. Stripe, PayU u otra regional) al flujo de reservas/cotizaciones.

4. **Calidad y pruebas**  
   Ampliar tests de dominio, controladores, contratos API y flujos críticos del frontend (auth, reservas, chat, itinerarios).

---

## Integrantes

- Jossuath Leandro Florez Granados
- Diego Andres Marciales Florez
- Johan Sebastian Maldonado Suarez

---

## Licencia

Proyecto académico — uso restringido al contexto del trabajo de grado y sus evaluaciones asociadas.

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
| Mensajería | Chat cliente ↔ proveedor, cola de soporte humano con asignación a asesores, y asistente virtual (FAQ + escalamiento) |
| Itinerarios | Planificación personalizada de viajes con ítems vinculados a ofertas reales |
| Valoraciones | Sistema de reseñas y ratings asociados a cada perfil comercial |

> **Contexto académico:** proyecto de grado orientado a evidenciar análisis, diseño y construcción de software (UML, requerimientos y arquitectura cliente-servidor).

---

## 🏗️ 2. Arquitectura y Tecnologías

La solución se organiza como **monorepo** con separación clara entre API y cliente web.

```
Frontend (React + Vite)  →  API REST (Spring Boot)  →  PostgreSQL + PostGIS (Supabase)
     Puerto 5173                    Puerto 8080         ddl-auto=validate
```

### Backend — `Back_WTS`

| Tecnología | Uso |
|------------|-----|
| **Java 17** | Lenguaje de la API |
| **Spring Boot** | Framework de aplicación y servidor embebido |
| **Spring Data JPA** | Persistencia y mapeo objeto-relacional |
| **Spring Security + JWT** | Autenticación y autorización por roles |
| **PostgreSQL (Supabase) + PostGIS** | Motor relacional con extensión geoespacial. Hibernate valida el esquema (`ddl-auto=validate`) y no lo altera al arrancar |
| **springdoc-openapi** | Documentación interactiva (Swagger UI) |

Arquitectura interna (Clean Architecture):

```
Back_WTS/src/main/java/com/worldturism/spring/app/
├── domain/model/                 # Entidades JPA y enums
├── application/service/          # Casos de uso
├── infrastructure/
│   ├── persistence/repository/   # Repositorios Spring Data
│   ├── security/                 # JWT + filtros de seguridad
│   ├── config/                   # CORS y OpenAPI
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
│                 # chat: pages, ChatWidget, hooks (useEphemeralChatbot), utils (conversationDisplay)
└── styles/       # Estilos globales
```

### Estructura del monorepo

```
world-tourism-solutions/
├── Back_WTS/                 # API Spring Boot + PostgreSQL
│   ├── src/main/java/        # Código fuente Java
│   ├── src/main/resources/   # application.properties (conexión a la base)
│   ├── uploads/              # Imágenes subidas en local
│   ├── mvnw / mvnw.cmd       # Maven Wrapper
│   └── pom.xml
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

El esquema vive en **PostgreSQL** (Supabase). Hibernate opera en modo `ddl-auto=validate`: contrasta el mapeo JPA con el catálogo existente y **no crea, altera ni migra** tablas al arrancar. La integridad de dominio, la geolocalización y las claves foráneas se garantizan en el motor, no en convenciones de la aplicación.

### Motor relacional y extensión geoespacial (PostGIS)

El clúster tiene habilitada la extensión **PostGIS**. Sobre ella se modela la posición de cada oferta comercial, de modo que las búsquedas por distancia puedan resolverse en el índice espacial y no con cálculos haversine en la API.

`provider_profiles` conserva las coordenadas de entrada (`latitude`, `longitude`) y una columna geográfica nativa, no escribible desde JPA:

| Columna | Tipo PostgreSQL | Origen | Rol |
|---------|-----------------|--------|-----|
| `latitude` | `DOUBLE PRECISION` | Persistida por la API | Coordenada de entrada (WGS 84) |
| `longitude` | `DOUBLE PRECISION` | Persistida por la API | Coordenada de entrada (WGS 84) |
| `location` | `geography(Point, 4326)` | **Autogenerada** a partir de `latitude` y `longitude` | Punto geográfico nativo para distancia y radio |

```
provider_profiles
    latitude  ──┐
                ├──►  location  geography(Point, 4326)   [generada, SRID 4326 / WGS 84]
    longitude ──┘              │
                               └── índice espacial GIST
                                     (distancia y búsqueda por radio)
```

- **SRID 4326** fija el sistema de referencia en WGS 84 (latitud/longitud geodésicas). El tipo `geography` calcula distancias sobre el elipsoide, en metros, sin proyección intermedia.
- La columna `location` **no es un campo de la entidad JPA**. La aplicación escribe `latitude` y `longitude`; PostgreSQL deriva el punto.
- Sobre `location` existe un **índice espacial GIST** (*Generalized Search Tree*). Ese índice es el que hace viable `ST_DWithin` / `ST_Distance` a escala de catálogo. La infraestructura de base de datos para proximidad está desplegada; la exposición REST de esa consulta sigue pendiente (ver [Roadmap](#-6-roadmap-y-tareas-pendientes-todos)).

### Integridad de dominio: tipos ENUM nativos

El catálogo define **6 tipos `ENUM` nativos de PostgreSQL**. Un valor fuera del dominio es rechazado por el motor, no solo por la capa Java. Los ejemplos de gobierno del sistema son `users.role` y `provider_profiles.status`.

| Columna | Tipo / dominio | Valores admitidos |
|---------|----------------|-------------------|
| `users.role` | ENUM nativo | `BOT`, `ADMIN`, `USER`, `PROVIDER`, `SUPPORT` |
| `provider_profiles.status` | `service_status_enum` | `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE` |
| `bookings.status` | ENUM nativo | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |
| `conversations.conversation_type` | ENUM nativo | `CLIENT_TO_PROVIDER`, `CATALOG_INQUIRY`, `HUMAN_SUPPORT`, `CLIENT_TO_SUPPORT`, `PROVIDER_TO_SUPPORT` |
| `conversations.support_status` | ENUM nativo | `UNASSIGNED`, `OPEN`, `IN_PROGRESS`, `NEEDS_HUMAN_SUPPORT`, `RESOLVED`, `CLOSED` |
| `conversations.urgency` | ENUM nativo | `LOW`, `MEDIUM`, `HIGH` |

`provider_profiles.status` se mapea en JPA con `JdbcTypeCode(NAMED_ENUM)` y `columnDefinition = service_status_enum`. El resto de columnas enumeradas persisten el literal del enum Java (`EnumType.STRING`) contra el tipo nativo correspondiente. No se usan `VARCHAR` ni *check constraints* como sustituto de estos seis dominios.

### Tipos de datos y mapeo estricto

Los tipos de la aplicación se alinean con tipos nativos de SQL, sin cadenas ni épocas numéricas como sustituto:

| Concepto | Tipo PostgreSQL | Mapeo Java | Columnas representativas |
|----------|-----------------|------------|--------------------------|
| Identificador | `BIGINT` autogenerado (`BIGSERIAL` / `GENERATED … AS IDENTITY`) | `Long` + `GenerationType.IDENTITY` | `id` de todas las tablas |
| Estampa de tiempo | `TIMESTAMPTZ` | `Instant` | `users.created_at`, `users.updated_at`, `messages.sent_at`, `bookings.created_at`, `conversations.last_message_at`, `favorites.saved_at` |
| Fecha | `DATE` | `LocalDate` | `bookings.booking_date`, `itineraries.start_date`, `itineraries.end_date`, `itinerary_items.scheduled_date` |
| Horario | `TIME` | `LocalTime` | `bookings.start_time`, `bookings.end_time` |
| Moneda / precio | `NUMERIC(10,2)` | `BigDecimal` (`precision = 10`, `scale = 2`) | `provider_profiles.price`, `bookings.total_price` |
| Punto geográfico | `geography(Point, 4326)` | No mapeado (columna generada) | `provider_profiles.location` |

`TIMESTAMPTZ` conserva la zona horaria en el almacenamiento (UTC en la práctica de la API). `NUMERIC(10,2)` evita el error de redondeo de `DOUBLE PRECISION` en importes. Los identificadores no se generan en la aplicación: los asigna PostgreSQL.

### Esquema relacional actual

El dominio gira en torno a **usuarios** y **perfiles comerciales de proveedor**. Toda la oferta turística visible en catálogo vive en `provider_profiles`; el resto de tablas operativas se relacionan con ese agregado.

```
users (1) ──< (N) provider_profiles
                    │
                    │  latitude + longitude → location geography(Point, 4326) [GIST]
                    │
                    ├──< (N) provider_profile_images
                    ├──< (N) bookings ── (0..1) reviews
                    ├──< (N) conversations ──< (N) messages
                    │         │                    ├── conversation_id → conversations(id)
                    │         │                    └── sender_id        → users(id)
                    │         └── assigned_advisor_id → users (asesor SUPPORT/ADMIN)
                    ├──< (N) reviews
                    ├──< (N) favorites
                    └──< (N) itinerary_items ──> itineraries ──> users
```

**Flujo principal de relaciones:**

| Origen | Destino | Cardinalidad | Clave foránea |
|--------|---------|--------------|---------------|
| `users` | `provider_profiles` | 1:N | `user_id` → `users(id)` |
| `provider_profiles` | `provider_profile_images` | 1:N | `provider_profile_id` → `provider_profiles(id)` |
| `users` / `provider_profiles` | `bookings` | N:1 / N:1 | `user_id` → `users(id)`, `provider_profile_id` → `provider_profiles(id)` |
| `users` / `provider_profiles` | `conversations` | N:1 / N:1 | `user_id` → `users(id)`, `provider_profile_id` → `provider_profiles(id)` |
| `users` | `conversations` (asesor) | 1:N | `assigned_advisor_id` → `users(id)` |
| `conversations` | `messages` | 1:N | `conversation_id` → `conversations(id)` |
| `users` | `messages` (emisor) | 1:N | `sender_id` → `users(id)` |
| `users` / `provider_profiles` | `reviews` | N:1 / N:1 | `user_id` → `users(id)`, `provider_profile_id` → `provider_profiles(id)` |
| `bookings` | `reviews` | 1:0..1 | `booking_id` → `bookings(id)` |
| `users` | `itineraries` | 1:N | `user_id` → `users(id)` |
| `itineraries` / `provider_profiles` | `itinerary_items` | 1:N / N:1 | `itinerary_id` → `itineraries(id)`, `provider_profile_id` → `provider_profiles(id)` |
| `users` / `provider_profiles` | `favorites` | N:1 / N:1 | `user_id` → `users(id)`, `provider_profile_id` → `provider_profiles(id)` |

---

### Documentación del refactor arquitectónico

Se eliminó la duplicidad histórica entre “servicio turístico” y “perfil de proveedor”. La oferta comercial queda consolidada en un único agregado: **`ProviderProfile`**.

#### Eliminación de `services` y `saved_services`

| Antes | Ahora |
|-------|--------|
| Entidad/tabla `services` (`TourismService`) | **Eliminada** |
| Entidad/tabla `saved_services` (`SavedService`) | **Eliminada** |
| Datos de negocio y oferta repartidos en dos modelos | Unificados en **`ProviderProfile`** → tabla `provider_profiles` |

`ProviderProfile` concentra el nombre del negocio, descripción, categoría, ciudad, precio (`NUMERIC(10,2)`), coordenadas de entrada, estado de aprobación (`service_status_enum`) y rating agregado. El punto PostGIS `location` lo deriva el motor; no forma parte del agregado escribible.

El esquema vive en PostgreSQL. Ya no hay migraciones automáticas de SQLite al arrancar: las tablas `services` y `saved_services` no forman parte del modelo, y las claves foráneas apuntan a `provider_profiles.id`.

#### Reestructuración de claves foráneas → `provider_profile_id`

Las entidades dependientes ya no apuntan a un `service_id`. Se vinculan **exclusivamente** al perfil del proveedor:

| Tabla | Entidad | FK actual |
|-------|---------|-----------|
| `bookings` | `Booking` | `provider_profile_id` |
| `conversations` | `Conversation` | `provider_profile_id` |
| `reviews` | `Review` | `provider_profile_id` |
| `itinerary_items` | `ItineraryItem` | `provider_profile_id` |
| `favorites` | `Favorite` | `provider_profile_id` (unicidad `user_id` + `provider_profile_id`) |

#### Integridad referencial

Todas las tablas operativas declaran **`FOREIGN KEY` explícitas**. No hay relaciones “lógicas” solo en JPA. El caso de mensajería queda cerrado en ambos extremos del mensaje:

| Tabla | Columna | Referencia |
|-------|---------|------------|
| `messages` | `conversation_id` | `conversations(id)` |
| `messages` | `sender_id` | `users(id)` |
| `conversations` | `user_id` | `users(id)` |
| `conversations` | `provider_profile_id` | `provider_profiles(id)` |
| `conversations` | `assigned_advisor_id` | `users(id)` |
| `bookings` | `user_id`, `provider_profile_id` | `users(id)`, `provider_profiles(id)` |
| `reviews` | `user_id`, `provider_profile_id`, `booking_id` | `users(id)`, `provider_profiles(id)`, `bookings(id)` |
| `favorites` | `user_id`, `provider_profile_id` | `users(id)`, `provider_profiles(id)` |
| `itinerary_items` | `itinerary_id`, `provider_profile_id` | `itineraries(id)`, `provider_profiles(id)` |
| `provider_profile_images` | `provider_profile_id` | `provider_profiles(id)` |
| `provider_profiles` | `user_id` | `users(id)` |
| `itineraries` | `user_id` | `users(id)` |

Restricciones de unicidad además de la PK: `favorites (user_id, provider_profile_id)`, `reviews (booking_id)` y `reviews (user_id, provider_profile_id)`.

#### Conversaciones: bot vs soporte humano

`Conversation` distingue sesiones del asistente y tickets humanos. **No existe una columna `is_bot_chat`**: la sesión del asistente se identifica por `conversation_type = CATALOG_INQUIRY` o por el subject del bot. El DTO expone `isBotChat` como derivado de esa regla.

| Campo / concepto | Descripción |
|------------------|-------------|
| Sesión bot | `CATALOG_INQUIRY` o subject del asistente; se excluye del inbox ADMIN/SUPPORT y del chat comercial |
| `assigned_advisor_id` | `FOREIGN KEY` a `users(id)`. Asesor (`SUPPORT`/`ADMIN`) dueño del ticket; `null` mientras está en cola |
| `support_status` | ENUM nativo. `UNASSIGNED` = ticket humano abierto sin asesor asignado |
| `conversation_type` | ENUM nativo: `CLIENT_TO_PROVIDER`, `CATALOG_INQUIRY`, `HUMAN_SUPPORT`, `CLIENT_TO_SUPPORT`, `PROVIDER_TO_SUPPORT` |

#### Galería de imágenes

Se conserva **`ProviderProfileImage`** (`provider_profile_images`) como galería oficial: múltiples imágenes por perfil/servicio, ordenadas (`image_order`), con cascada y `orphanRemoval` desde `ProviderProfile`.

```
provider_profiles (1) ──< (N) provider_profile_images
        │
        ├──< bookings
        ├──< reviews
        ├──< conversations
        ├──< favorites
        └──< itinerary_items
```

---

### Listado de entidades principales

| Tabla | Entidad JPA | Descripción |
|-------|-------------|-------------|
| `users` | `AppUser` | Cuentas del sistema. `role` es ENUM nativo (`BOT`, `ADMIN`, `USER`, `PROVIDER`, `SUPPORT`); estampas en `TIMESTAMPTZ` |
| `provider_profiles` | `ProviderProfile` | Oferta comercial del proveedor. Precio `NUMERIC(10,2)`, estado `service_status_enum`, punto generado `location` con índice GIST |
| `provider_profile_images` | `ProviderProfileImage` | Galería multimedia asociada a cada perfil |
| `bookings` | `Booking` | Reservas/cotizaciones: `DATE` + `TIME`, total `NUMERIC(10,2)`, estado ENUM nativo |
| `conversations` | `Conversation` | Hilos de chat (cliente–proveedor, soporte humano o bot). Tipo, estado de soporte y urgencia son ENUM nativos; `assigned_advisor_id` es FK a `users` |
| `messages` | `Message` | Mensajes del hilo. FK explícitas: `conversation_id` → `conversations(id)`, `sender_id` → `users(id)`; `sent_at` en `TIMESTAMPTZ` |
| `reviews` | `Review` | Valoraciones y comentarios sobre un perfil (asociables a una reserva) |
| `itineraries` | `Itinerary` | Planes de viaje creados por el usuario |
| `itinerary_items` | `ItineraryItem` | Ítems del itinerario vinculados a un `provider_profile` |
| `favorites` | `Favorite` | Perfiles (`provider_profile_id`) marcados como favoritos por el turista autenticado |

---

## 🚀 4. Funcionalidades Principales

### Roles de usuario

| Rol | Responsabilidad |
|-----|-----------------|
| `ADMIN` | Administración completa de usuarios, perfiles y operaciones de la plataforma |
| `USER` | Exploración del catálogo, reservas, reseñas, favoritos, chat e itinerarios |
| `PROVIDER` | Publicación y gestión de perfiles/ofertas comerciales, atención de reservas y chat con clientes |
| `SUPPORT` | Inbox de tickets humanos, asignación/reclamación y respuesta; sin administración total de la plataforma |
| `BOT` | Identidad del asistente virtual en conversaciones automatizadas |

### Publicación y administración de perfiles/servicios

- Alta, edición y moderación de perfiles comerciales (`ProviderProfile`)
- Galería multimedial con múltiples imágenes ordenadas
- Estado de aprobación gobernado por el ENUM nativo `service_status_enum`: `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`
- Coordenadas de entrada (`latitude`, `longitude`) y punto PostGIS generado (`location`) con índice GIST, listo para distancia y radio
- Catálogo público consultable por turistas (filtro por ciudad/dirección y visualización en mapa; la búsqueda por radio en API está pendiente)

### Sistema de reservas y cotizaciones

- Solicitud de reserva asociada a un perfil de proveedor (`provider_profile_id`)
- Ciclo de vida sobre el ENUM nativo `bookings.status`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED`
- Panel del proveedor para gestionar solicitudes entrantes
- Cálculo de precio total según personas y oferta

### Módulo de chat interno

- Conversaciones cliente ↔ proveedor vinculadas a `provider_profile_id`
- Mensajes de texto (e imágenes) con estado de lectura
- Inbox por rol: turista, proveedor y supervisión staff (ADMIN/SUPPORT ven cliente y negocio)
- DTO enriquecido (`ConversationResponse`): contraparte, avatares, `clientId`/`clientName` y `isBotChat`
- Historial persistente por conversación (se excluyen chats del bot del listado humano)

### Asistente virtual y soporte humano

| Canal | Comportamiento |
|-------|----------------|
| **Widget / FAQ efímero** | Chatbot de ayuda rápida en frontend (`useEphemeralChatbot`); no genera ticket hasta escalar |
| **Escalamiento** | El usuario puede “Hablar con un asesor”: abre ticket en cola (`POST /api/support/conversations/open`) |
| **Cola de soporte** | Estado inicial `UNASSIGNED`; tipo `HUMAN_SUPPORT` (también legacy `CLIENT_TO_SUPPORT` / `PROVIDER_TO_SUPPORT`) |
| **Asignación** | Asesor reclama el ticket (`PUT /api/support/conversations/{id}/assign`) → `IN_PROGRESS` + `assigned_advisor` |
| **Inbox staff** | `GET /api/support/conversations/inbox` — sin asignar o asignados al asesor autenticado |
| **Sesiones bot persistentes** | Identificadas por `conversation_type` / subject (no hay columna `is_bot_chat`); el DTO deriva `isBotChat`. No aparecen en paneles de soporte ni chats comerciales |

### Favoritos (turista)

- Solo rol `USER`, autenticado con JWT (`/api/favorites/**`)
- Objetivo del favorito: `ProviderProfile` (`provider_profile_id`)
- Aislamiento por usuario en servicio; el frontend limpia/recarga favoritos al login, registro o logout (`notifyAuthChanged`)

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
| Base de datos | PostgreSQL en Supabase (`application.properties`) |
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
| Alta | **Consultas geoespaciales** | Infraestructura de base de datos **100% desplegada** (PostGIS, `location`, índice GIST). Pendiente solo la API REST de búsqueda por radio |
| Media | **Pasarela de pagos en línea** | Cobro y confirmación de reservas dentro de la plataforma |
| Media | **Ampliación de pruebas** | Mayor cobertura unitaria e de integración en `Back_WTS` y `Front_WTS` |

### Detalle

1. **Búsqueda geoespacial**  
   La capa de persistencia ya está lista y **no es trabajo pendiente**: extensión PostGIS habilitada, columna generada `provider_profiles.location` (`geography(Point, 4326)`) e índice espacial GIST sobre `location`. Latitud y longitud se persisten y el catálogo las muestra en el mapa. Queda únicamente integrar en el backend los endpoints REST de búsqueda por radio de proximidad (y ordenación por distancia) sobre ese índice.

2. **Integración de pagos**  
   Conectar una pasarela (p. ej. Stripe, PayU u otra regional) al flujo de reservas/cotizaciones.

3. **Calidad y pruebas**  
   Ampliar tests de dominio, controladores, contratos API y flujos críticos del frontend (auth, reservas, chat, itinerarios).

---

## Integrantes

- Jossuath Leandro Florez Granados
- Diego Andres Marciales Florez
- Johan Sebastian Maldonado Suarez

---

## Licencia

Proyecto académico — uso restringido al contexto del trabajo de grado y sus evaluaciones asociadas.

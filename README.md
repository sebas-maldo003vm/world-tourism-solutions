# World Tourism Solutions

Plataforma de gestión de servicios turísticos, publicaciones comerciales, reservas, mensajería e itinerarios derivados de reservas.

---

## Tabla de contenidos

1. [Descripción general](#1-descripción-general)
2. [Arquitectura y tecnologías](#2-arquitectura-y-tecnologías)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Modelo de base de datos](#4-modelo-de-base-de-datos)
5. [API REST (endpoints)](#5-api-rest-endpoints)
6. [Funcionalidades principales](#6-funcionalidades-principales)
7. [Instalación y configuración](#7-instalación-y-configuración)
8. [Ejecución](#8-ejecución)
9. [Roadmap](#9-roadmap)
10. [Integrantes y licencia](#10-integrantes-y-licencia)

---

## 1. Descripción general

**World Tourism Solutions (WTS)** es una aplicación cliente-servidor que centraliza la oferta turística (hospedajes, actividades, restaurantes y servicios complementarios) en un solo ecosistema.

| Capacidad | Descripción |
|-----------|-------------|
| Catálogo comercial | Publicación y descubrimiento de perfiles/servicios de proveedores |
| Reservas | Solicitud, cotización y seguimiento del estado de reservas |
| Mensajería | Chat cliente ↔ proveedor, cola de soporte humano y asistente virtual |
| Itinerario | Reservas `PENDING`, `APPROVED` y `COMPLETED` agrupadas por ciudad, con calendario y filtro por día (`GET /api/bookings/itinerary?date=`) |
| Valoraciones | Reseñas y ratings asociados a cada perfil comercial |
| Analítica (proveedor) | Contadores diarios en `provider_daily_analytics` y reporte embebido de Looker Studio filtrado por proveedor |
| Recuperación de acceso | Pantalla `/update-password` que sincroniza la clave de Supabase Auth con `users.password` |

> **Contexto académico:** proyecto de grado orientado a evidenciar análisis, diseño y construcción de software (UML, requerimientos y arquitectura cliente-servidor).

---

## 2. Arquitectura y tecnologías

```
Frontend (React + Vite)  →  API REST (Spring Boot)  →  PostgreSQL + PostGIS (Supabase)
     Puerto 5173                    Puerto 8080         ddl-auto=validate
```

Las imágenes de perfil y galería se suben desde el frontend a **Supabase Storage**. El backend también puede servir archivos locales bajo `uploads/`.

El alta la hace el backend: persiste `public.users` con hash BCrypt y crea el usuario confirmado en Supabase Auth (`POST /auth/v1/admin/users`, service role). El UUID devuelto queda en `users.auth_user_id`. Si Auth falla, la transacción local se revierte; si el commit falla, el backend borra el usuario huérfano con `DELETE /auth/v1/admin/users/{uuid}`.

La recuperación de contraseña sigue en el cliente con Supabase Auth. El backend verifica el access token (`GET /auth/v1/user`, cabeceras `apikey` y `Authorization: Bearer`) y actualiza `users.password` del registro encontrado por `auth_user_id`.

### Backend — `Back_WTS`

| Tecnología | Versión / detalle | Uso |
|------------|-------------------|-----|
| **Java** | 17 | Lenguaje de la API |
| **Spring Boot** | 4.0.6 | Framework y servidor embebido |
| **Spring Data JPA** | (BOM Spring Boot) | Persistencia |
| **Spring Security + JJWT** | JJWT 0.12.6 | Autenticación JWT y roles |
| **PostgreSQL + PostGIS** | vía Supabase | BD relacional + extensión geoespacial |
| **springdoc-openapi** | 3.0.3 | Swagger UI |
| **Maven Wrapper** | `mvnw` / `mvnw.cmd` | Build y ejecución sin Maven global |

Arquitectura interna (capas):

```
Back_WTS/src/main/java/com/worldturism/spring/app/
├── domain/model/                 # Entidades JPA y enums
├── application/service/          # Casos de uso
├── infrastructure/
│   ├── persistence/repository/   # Repositorios Spring Data
│   ├── security/                 # JWT, filtros, CORS y cliente Supabase Auth
│   ├── config/                   # OpenAPI, estáticos y backfill de coordenadas
│   └── storage/                  # Almacenamiento local de imágenes
├── presentation/
│   ├── controller/               # Controladores REST
│   └── dto/                      # Contratos de entrada/salida
└── common/                       # Manejo global de excepciones
```

### Frontend — `Front_WTS`

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 18.3.1 | UI |
| **TypeScript** | ^5.8.3 | Tipado estático |
| **Vite** | 6.3.5 | Bundler y servidor de desarrollo |
| **Tailwind CSS** | 4.1.12 | Estilos utilitarios |
| **React Router** | 7.13.0 | Enrutamiento SPA |
| **Axios** | ^1.16.0 | Cliente HTTP hacia la API |
| **Leaflet + react-leaflet** | 1.9.4 / 4.2.1 | Mapas del catálogo (OpenStreetMap) |
| **@supabase/supabase-js** | ^2.116.0 | Storage y sesión de recuperación de Supabase Auth. El alta de Auth la hace el backend |
| **date-fns / react-day-picker** | 3.6.0 / 8.10.1 | Calendario del itinerario |
| **MUI / Radix UI** | varias | Componentes de interfaz |
| **Recharts** | 2.15.2 | Primitiva de gráficos en `shared/components/ui/chart.tsx` |
| **motion** | 12.23.24 | Animaciones de interfaz |

Organización feature-first:

```
Front_WTS/src/
├── app/          # App, rutas, ProtectedRoute
├── core/         # Cliente API (Axios + JWT), Supabase, storage, analítica
├── shared/       # Layout, catálogo (mapa, filtros), UI, consentimiento y feedback
├── features/     # auth, catalog, bookings, reviews, provider, profile, chat, admin, common
└── styles/       # Estilos globales
```

---

## 3. Estructura del proyecto

```
world-tourism-solutions/
├── Back_WTS/                      # API Spring Boot
│   ├── src/main/java/             # Código fuente Java
│   ├── src/main/resources/        # application.properties
│   ├── uploads/                   # Imágenes locales (no versionadas)
│   ├── mvnw / mvnw.cmd            # Maven Wrapper
│   └── pom.xml
├── Front_WTS/                     # Cliente React + TypeScript + Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env                       # Variables Vite (crear localmente)
├── .gitignore
└── README.md
```

---

## 4. Modelo de base de datos

El esquema vive en **PostgreSQL** (Supabase). Hibernate opera con `ddl-auto=validate`: contrasta el mapeo JPA con el catálogo existente y **no crea ni altera** tablas al arrancar.

### PostGIS

`provider_profiles` persiste `latitude` / `longitude`. La columna `location` (`geography(Point, 4326)`) se deriva en PostgreSQL y dispone de índice espacial GIST. La búsqueda por radio en API REST **aún no está expuesta**; el frontend filtra proximidad en cliente (Haversine) sobre las coordenadas recibidas.

### ENUMs nativos (PostgreSQL)

| Columna | Valores |
|---------|---------|
| `users.role` | `BOT`, `ADMIN`, `USER`, `PROVIDER`, `SUPPORT` |
| `provider_profiles.status` (`service_status_enum`) | `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE` |
| `bookings.status` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |
| `conversations.conversation_type` | `CLIENT_TO_PROVIDER`, `CATALOG_INQUIRY`, `HUMAN_SUPPORT`, `CLIENT_TO_SUPPORT`, `PROVIDER_TO_SUPPORT` |
| `conversations.support_status` | `UNASSIGNED`, `OPEN`, `IN_PROGRESS`, `NEEDS_HUMAN_SUPPORT`, `RESOLVED`, `CLOSED` |
| `conversations.urgency` | `LOW`, `MEDIUM`, `HIGH` |

### Analítica agregada (Looker)

La tabla **`provider_daily_analytics`** vive en PostgreSQL y Hibernate solo la valida (`ddl-auto=validate`). No hay script SQL versionado en este repositorio. El modelo JPA es `ProviderDailyAnalytics`: una fila por `provider_profile_id` + `metric_date` (restricción `uq_provider_daily_analytics_provider_date`).

| Columna | Qué cuenta | Dónde se dispara en el frontend |
|---------|------------|----------------------------------|
| `views_count` | Interés real (detalle) | Página `/booking/:id`, una vez por proveedor y pestaña (`trackDetailViewOnce`) |
| `clicks_count` | Intención (CTA / mapa) | `ServiceCard` (Ver más / Reservar) y marker del mapa |
| `searches_count` | Atribución post-búsqueda | Home autenticado: lote con debounce tras teclear en el filtro |

El backend hace `INSERT ... ON CONFLICT (provider_profile_id, metric_date) DO UPDATE` y suma solo los contadores enviados. La fecha del upsert es `CURRENT_DATE` de la base. No existe la entidad histórica `AnalyticsEvent` ni un insert por cada impresión de tarjeta.

El parámetro de Looker Studio se llama `id_proveedor`. El iframe lo aplica a las fuentes `ds1`, `ds2` y `ds3` (`?params={"ds1.id_proveedor":N,...}`).

### Relación principal

```
users (1) ──< (N) provider_profiles
                    │
                    ├──< provider_profile_images
                    ├──< bookings ── (0..1) reviews
                    ├──< conversations ──< messages
                    ├──< reviews
                    ├──< favorites
                    ├──< provider_daily_analytics
                    └──< itinerary_items ──> itineraries ──> users
```

La oferta comercial está consolidada en **`ProviderProfile`** (tabla `provider_profiles`). No existen las tablas históricas `services` / `saved_services`.

### Entidades principales

| Tabla | Entidad JPA | Descripción |
|-------|-------------|-------------|
| `users` | `AppUser` | Cuentas y roles. `id` (bigint) es la PK de dominio. `auth_user_id` (UUID, único, nullable) referencia `auth.users(id)` |
| `provider_profiles` | `ProviderProfile` | Oferta comercial del proveedor |
| `provider_profile_images` | `ProviderProfileImage` | Galería multimedia |
| `bookings` | `Booking` | Reservas / cotizaciones |
| `conversations` / `messages` | `Conversation` / `Message` | Chat y soporte |
| `reviews` | `Review` | Valoraciones |
| `itineraries` / `itinerary_items` | `Itinerary` / `ItineraryItem` | Modelo de itinerario en BD |
| `favorites` | `Favorite` | Favoritos del turista |
| `provider_daily_analytics` | `ProviderDailyAnalytics` | Contadores diarios (views/clicks/searches) |

> La pantalla `/itinerary` consume `GET /api/bookings/itinerary`. Sin `date` devuelve reservas `PENDING`, `APPROVED` y `COMPLETED` agrupadas por ciudad. Con `date=yyyy-MM-dd` limita ese día, incluido el historial. No hay CRUD de `itineraries` expuesto en la API.

---

## 5. API REST (endpoints)

Base: `http://localhost:8080/api`  
Documentación interactiva: `http://localhost:8080/swagger-ui.html`

### Autenticación — `AuthController` (`/api/auth`)

| Método | Ruta | Auth | Respuesta |
|--------|------|------|-----------|
| `POST` | `/register` | Pública | JWT. Roles permitidos en el alta: `USER`, `PROVIDER` |
| `POST` | `/login` | Pública | JWT |
| `PUT` | `/reset-password` | Pública | `204`. Cuerpo: `email`, `newPassword` (8–72), `accessToken` de Supabase Auth |
| `GET` | `/me` | JWT | Usuario del token |

`PUT /reset-password` no inicia sesión. Comprueba el access token con `GET /auth/v1/user` (`apikey` anónima y `Authorization: Bearer`) y reescribe `users.password` del usuario cuyo `auth_user_id` coincide con el `id` de esa sesión. Si falta `app.supabase.anon-key`, la operación falla.

El cambio de contraseña de una sesión ya autenticada es otro contrato: `PUT /api/users/profile/password`.

### Reservas e itinerario

| Método | Ruta | Quién |
|--------|------|-------|
| `POST` | `/api/bookings` | Usuario autenticado. Crea la reserva (`201`) |
| `GET` | `/api/bookings` | Reservas del turista autenticado |
| `GET` | `/api/bookings/itinerary` | Mismo usuario. Query opcional `date` (`yyyy-MM-dd`) |
| `GET` | `/api/provider/bookings` | `PROVIDER` o `ADMIN` |
| `POST` | `/api/provider/bookings/{bookingId}/approve` | `PROVIDER` o `ADMIN` |
| `POST` | `/api/provider/bookings/{bookingId}/reject` | `PROVIDER` o `ADMIN` |

`GET /itinerary` incluye solo `PENDING`, `APPROVED` y `COMPLETED`. `REJECTED` y `CANCELLED` no entran en el agrupado por ciudad.

### Analítica — `AnalyticsEventController`

| Método | Ruta | Auth | Efecto |
|--------|------|------|--------|
| `POST` | `/api/analytics/events` | Pública | `204`. Incrementa un contador del día |
| `POST` | `/api/analytics/events/batch` | Pública | `204`. Hasta 40 eventos; el servicio los colapsa por proveedor antes del UPSERT |

Tipos: `SEARCH`, `VIEW`, `CLICK`. La seguridad admite la llamada sin JWT. Si `localStorage` tiene token, Axios lo envía igual; el servicio no lo usa para autorizar el upsert.

### Chat y soporte

Canal vigente de mesa de ayuda: `/api/support/conversations`.

| Método | Ruta | Roles |
|--------|------|-------|
| `POST` | `/open` | `USER`, `PROVIDER`. Cuerpo `CreateSupportTicketRequest`. Estado inicial `UNASSIGNED` |
| `PUT` | `/{id}/assign` | `ADMIN`, `SUPPORT` |
| `GET` | `/inbox` | `ADMIN`, `SUPPORT` |
| `PATCH` | `/{id}/status` | `ADMIN`, `SUPPORT`. Estado y/o urgencia |
| `POST` | `/{id}/messages` | `ADMIN`, `SUPPORT`. Respuesta del staff (`201`) |

`ChatController` (`/api/chat`) cubre el asistente y la mensajería comercial:

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/message` | Asistente virtual. `USER` o `PROVIDER` |
| `GET` | `/tickets/active` | Tickets escalados por el bot (`ADMIN` / `SUPPORT`) |
| `POST` | `/tickets/{id}/reply` | Respuesta a un ticket del bot |
| `GET` | `/conversations` | Bandeja del usuario autenticado |
| `POST` | `/conversations` | Cliente inicia chat con un proveedor |
| `POST` | `/conversations/with-client` | Proveedor inicia chat con un cliente |
| `GET` | `/conversations/{conversationId}/messages` | Historial |
| `POST` | `/conversations/{conversationId}/messages` | Enviar mensaje |
| `PATCH` | `/conversations/{conversationId}/read` | Marcar leído (`204`) |

Estas cuatro rutas siguen activas y delegan en el mismo servicio que `/api/support/conversations`. El contrato preferido es el de soporte:

| Legacy | Equivalente |
|--------|-------------|
| `POST /api/chat/support` | `POST /api/support/conversations/open` |
| `GET /api/chat/support` | `GET /api/support/conversations/inbox` |
| `PATCH /api/chat/support/{id}/status` | `PATCH /api/support/conversations/{id}/status` |
| `POST /api/chat/support/{id}/messages` | `POST /api/support/conversations/{id}/messages` |

### Resto de la API

| Prefijo | Controlador | Operaciones |
|---------|-------------|-------------|
| `/api/users/profile` | `UserController` | `GET /me`, `PUT /`, `POST /picture`, `PUT /picture`, `PUT /password` |
| `/api/businesses` | `PublicBusinessController` | `GET /`, `GET /{businessId}` |
| `/api/provider/business` | `ProviderBusinessController` | `POST /`, `GET /`, `PUT /{businessId}`, `DELETE /{businessId}` |
| `/api/reviews` | `ReviewController` | `POST /`, `GET /me`, `GET /businesses/{businessId}` |
| `/api/favorites` | `FavoritesController` | `POST /{providerProfileId}`, `DELETE /{providerProfileId}`, `GET /`, `GET /{providerProfileId}/status`. Solo rol `USER` |
| `/api/admin` | `AdminController` | `GET /stats`, `GET /users`, `PUT /users/{id}`, `DELETE /users/{id}`, `GET /businesses`, `PATCH /businesses/{id}/status`, `DELETE /businesses/{id}` |

### Acceso sin JWT y por rol

Públicas: `POST /api/auth/register`, `POST /api/auth/login`, `PUT /api/auth/reset-password`, Swagger (`/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`), `GET /api/businesses` y `GET /api/businesses/**`, `POST /api/analytics/events` y `POST /api/analytics/events/batch`, `/uploads/**`, `/error`.

| Ámbito | Roles |
|--------|-------|
| `/api/provider/**` | `PROVIDER`, `ADMIN` |
| `/api/favorites/**` | `USER` |
| `GET /api/admin/**`, `PATCH /api/admin/businesses/*/status`, `PUT /api/admin/users/**` | `ADMIN`, `SUPPORT` |
| `DELETE /api/admin/**` y el resto de `/api/admin/**` | `ADMIN` |
| Apertura de soporte | `USER`, `PROVIDER` |
| Inbox, asignación, estado y respuesta de soporte | `ADMIN`, `SUPPORT` |

CORS de desarrollo: `http://localhost:5173`, `http://localhost:3000`, `http://localhost:4200`. Métodos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.

---

## 6. Funcionalidades principales

### Roles

| Rol | Responsabilidad |
|-----|-----------------|
| `ADMIN` | Administración de usuarios, perfiles y operaciones |
| `USER` | Catálogo, reservas, reseñas, favoritos, chat e itinerario |
| `PROVIDER` | Gestión de ofertas, reservas entrantes, chat y analítica |
| `SUPPORT` | Inbox de tickets humanos (sin administración total) |
| `BOT` | Identidad del asistente virtual |

### Catálogo y mapas

- Perfiles con galería, precio, categoría, ciudad y coordenadas
- Mapa con **Leaflet** (tiles OpenStreetMap)
- Filtros de proximidad en el cliente (radio en km + geolocalización del navegador)

### Reservas e itinerario

- Ciclo de vida: `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED` / `COMPLETED`
- Panel del proveedor para aprobar o rechazar
- `/itinerary` muestra un calendario (`react-day-picker`) y tres periodos en cliente: todos, activas y pasadas
- Al elegir un día, el cliente llama `GET /api/bookings/itinerary?date=yyyy-MM-dd`

### Chat y soporte

- Chat comercial cliente ↔ proveedor
- Widget FAQ efímero en frontend (`useEphemeralChatbot`)
- Escalamiento a asesor: `POST /api/support/conversations/open`
- Asignación e inbox staff: `PUT .../assign`, `GET .../inbox`
- Estado/urgencia y respuesta staff: `PATCH .../{id}/status`, `POST .../{id}/messages`
- Las rutas `/api/chat/support/**` permanecen como alias legacy del mismo servicio

### Recuperación de contraseña

1. Supabase Auth redirige a `/update-password` con el hash de recuperación (`type=recovery` y access token).
2. El cliente actualiza la clave en la sesión de Supabase.
3. Llama `PUT /api/auth/reset-password` sin JWT de la aplicación.
4. El backend localiza la cuenta por `users.auth_user_id` y actualiza el hash BCrypt.
5. Tras `204`, cierra la sesión local y vuelve al login.

### Consentimiento y encuesta

- Registro (`/register`) y reserva (`/booking/:id`) exigen dos casillas en cliente: términos y tratamiento de datos (Ley 1581 de 2012) y uso de ubicación en la sesión. Ese checklist no se persiste en la API.
- Tras una reserva o al usar el itinerario puede abrirse `FeedbackPrompt`. El enlace de la encuesta sale de `VITE_FEEDBACK_FORM_URL`. Sin esa variable el botón queda deshabilitado. Cada flujo se ofrece como máximo una vez por pestaña (`sessionStorage`).

### Storage de imágenes

- Buckets Supabase usados por el frontend: `user-avatars`, `service-gallery`
- Formatos: JPG, PNG, WEBP — máximo 5 MB por archivo (`spring.servlet.multipart.max-file-size=5MB`, request hasta 25 MB)

### Analítica de proveedor

- `/analitica` embebe un único reporte de Looker Studio filtrado por el id del proveedor autenticado.
- URL por defecto en `lookerConfig.ts`. Override: `VITE_LOOKER_REPORT_URL` (alias legacy `VITE_LOOKER_EMBED_URL`).
- Fuentes por defecto: `ds1`, `ds2`, `ds3`. Override CSV: `VITE_LOOKER_DATASOURCE_IDS`. `VITE_LOOKER_DATASOURCE_ID` queda solo por compatibilidad de una sola fuente.
- El frontend envía eventos con `trackEvent` / `trackEventBatch` y descarta los errores.

### Rutas del cliente

| Ruta | Acceso | Pantalla |
|------|--------|----------|
| `/` | Pública | Catálogo |
| `/login`, `/register` | Pública | Acceso y alta |
| `/update-password` | Pública (hash de recuperación de Supabase) | Nueva contraseña |
| `/booking/:id` | Pública | Detalle y reserva |
| `/reviews/:id` | Pública | Reseñas |
| `/home-logueado` | Autenticado | Catálogo con filtros |
| `/itinerary` | Autenticado | Calendario e itinerario |
| `/chat`, `/messages` | Autenticado | Misma pantalla de mensajería |
| `/profile`, `/edit-profile` | Autenticado | Perfil |
| `/dashboard-accesor`, `/create-service`, `/edit-service/:id`, `/booking-detail/:id`, `/analitica` | `PROVIDER` | Operación y analítica |
| `/admin` | `ADMIN`, `SUPPORT` | Panel de administración |

---

## 7. Instalación y configuración

### Requisitos previos

| Herramienta | Versión |
|-------------|---------|
| **JDK** | 17+ |
| **Node.js** | 18+ (npm incluido) |
| **Maven** | Opcional; se recomienda el wrapper incluido |

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd world-tourism-solutions
```

### 2. Configurar el backend

`application.properties` no guarda credenciales. Definir estas variables en el entorno del proceso Java antes de arrancar:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://<HOST>:5432/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=<USUARIO>
SPRING_DATASOURCE_PASSWORD=<PASSWORD>
JWT_SECRET=<SECRETO_BASE64_MIN_32_BYTES>
SUPABASE_ANON_KEY=<CLAVE_ANON_PUBLICA>
SUPABASE_SERVICE_ROLE_KEY=<CLAVE_SERVICE_ROLE>
```

`JWT_SECRET` es obligatorio y debe ser la codificación Base64 de al menos 32 bytes (por ejemplo `openssl rand -base64 32`). La aplicación no arranca si falta o es más corta.

Notas:

- La base debe existir previamente (Hibernate **no** crea el esquema).
- No versionar contraseñas, la clave JWT, la anon key ni la service role key. `app.supabase.anon-key` lee `SUPABASE_ANON_KEY`. `app.supabase.service-role-key` lee `SUPABASE_SERVICE_ROLE_KEY` y solo se usa en el servidor.
- Hibernate no altera el esquema. En una base que todavía no tenga el vínculo con Auth, aplicar `Back_WTS/src/main/resources/db/add_users_auth_user_id.sql` (columna `users.auth_user_id`, unicidad, FK opcional a `auth.users` y enlace de cuentas ya existentes por correo).
- El puerto de PostgreSQL forma parte de `SPRING_DATASOURCE_URL`.

### 3. Configurar el frontend

Crear `Front_WTS/.env`:

```env
VITE_SUPABASE_URL=https://<PROYECTO>.supabase.co
VITE_SUPABASE_ANON_KEY=<CLAVE_ANON_PUBLICA>
```

Opcionales:

```env
# Si se omite, el panel usa la URL por defecto de lookerConfig.ts
VITE_LOOKER_REPORT_URL=https://datastudio.google.com/embed/reporting/<REPORT_ID>/page/<PAGE_ID>
# Alias aceptado si VITE_LOOKER_REPORT_URL no está definida
VITE_LOOKER_EMBED_URL=
# CSV. Por defecto en código: ds1,ds2,ds3
VITE_LOOKER_DATASOURCE_IDS=ds1,ds2,ds3
# Una sola fuente. Obsoleto: preferir VITE_LOOKER_DATASOURCE_IDS
VITE_LOOKER_DATASOURCE_ID=
# Google Forms. Sin valor, el botón de la encuesta queda deshabilitado
VITE_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/<FORM_ID>/viewform
```

La URL de la API está fijada en `Front_WTS/src/core/api/client.ts`:

```ts
export const API_BASE_URL = 'http://localhost:8080/api';
```

### 4. Instalar dependencias del frontend

```bash
cd Front_WTS
npm install
```

---

## 8. Ejecución

### Desarrollo — Backend

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

Compilación rápida (opcional):

```bash
# Windows
.\mvnw.cmd compile -DskipTests

# Linux / macOS
./mvnw compile -DskipTests
```

| Recurso | URL / valor |
|---------|-------------|
| API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| CORS permitidos | `http://localhost:5173`, `3000`, `4200` |

### Desarrollo — Frontend

En otra terminal:

```bash
cd Front_WTS
npm run dev
```

| Recurso | URL |
|---------|-----|
| App | http://localhost:5173 |

### Producción — Frontend

```bash
cd Front_WTS
npm run build
```

El artefacto queda en `Front_WTS/dist/`. El backend se empaqueta con el plugin de Spring Boot (`mvnw package`) y se ejecuta el JAR generado en `Back_WTS/target/`.

---

## 9. Roadmap

| Prioridad | Tarea | Estado / objetivo |
|-----------|-------|-------------------|
| Alta | **API geoespacial** | PostGIS + `location` + GIST listos en BD. Pendiente exponer búsqueda por radio/distancia en REST |
| Media | **Pasarela de pagos** | Cobro y confirmación de reservas en plataforma |
| Media | **Cobertura de pruebas** | Ampliar unitarias e integración en backend y frontend |

---

## 10. Integrantes y licencia

### Integrantes

- Jossuath Leandro Florez Granados
- Diego Andres Marciales Florez
- Johan Sebastian Maldonado Suarez

### Licencia

Proyecto académico — uso restringido al contexto del trabajo de grado y sus evaluaciones asociadas.

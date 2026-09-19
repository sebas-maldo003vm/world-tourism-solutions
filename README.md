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
| Itinerario | Vista de reservas activas agrupadas por ciudad (`GET /api/bookings/itinerary`) |
| Valoraciones | Reseñas y ratings asociados a cada perfil comercial |
| Analítica (proveedor) | Panel con vista previa local y embeds opcionales de Looker Studio |

> **Contexto académico:** proyecto de grado orientado a evidenciar análisis, diseño y construcción de software (UML, requerimientos y arquitectura cliente-servidor).

---

## 2. Arquitectura y tecnologías

```
Frontend (React + Vite)  →  API REST (Spring Boot)  →  PostgreSQL + PostGIS (Supabase)
     Puerto 5173                    Puerto 8080         ddl-auto=validate
```

Las imágenes de perfil y galería se suben desde el frontend a **Supabase Storage**. El backend también puede servir archivos locales bajo `uploads/`.

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
│   ├── security/                 # JWT + filtros + CORS
│   ├── config/                   # OpenAPI y migraciones auxiliares
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
| **@supabase/supabase-js** | ^2.116.0 | Storage (avatares y galería) |
| **MUI / Radix UI** | varias | Componentes de interfaz |
| **Recharts / motion** | 2.15.2 / 12.x | Gráficos y animaciones |

Organización feature-first:

```
Front_WTS/src/
├── app/          # App, rutas, ProtectedRoute
├── core/         # Cliente API (Axios + JWT), Supabase, storage
├── shared/       # Layout, catálogo (mapa, filtros), UI
├── features/     # auth, catalog, bookings, reviews, provider, profile, chat, admin
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

### Relación principal

```
users (1) ──< (N) provider_profiles
                    │
                    ├──< provider_profile_images
                    ├──< bookings ── (0..1) reviews
                    ├──< conversations ──< messages
                    ├──< reviews
                    ├──< favorites
                    └──< itinerary_items ──> itineraries ──> users
```

La oferta comercial está consolidada en **`ProviderProfile`** (tabla `provider_profiles`). No existen las tablas históricas `services` / `saved_services`.

### Entidades principales

| Tabla | Entidad JPA | Descripción |
|-------|-------------|-------------|
| `users` | `AppUser` | Cuentas y roles |
| `provider_profiles` | `ProviderProfile` | Oferta comercial del proveedor |
| `provider_profile_images` | `ProviderProfileImage` | Galería multimedia |
| `bookings` | `Booking` | Reservas / cotizaciones |
| `conversations` / `messages` | `Conversation` / `Message` | Chat y soporte |
| `reviews` | `Review` | Valoraciones |
| `itineraries` / `itinerary_items` | `Itinerary` / `ItineraryItem` | Modelo de itinerario en BD |
| `favorites` | `Favorite` | Favoritos del turista |

> La pantalla de itinerario del frontend consume `GET /api/bookings/itinerary` (reservas activas agrupadas por ciudad), no un CRUD independiente de `itineraries`.

---

## 5. API REST (endpoints)

Base: `http://localhost:8080/api`  
Documentación interactiva: `http://localhost:8080/swagger-ui.html`

| Prefijo | Controlador | Operaciones principales |
|---------|-------------|-------------------------|
| `/api/auth` | `AuthController` | `POST /register`, `POST /login`, `GET /me` |
| `/api/users/profile` | `UserController` | Perfil, foto y cambio de contraseña |
| `/api/businesses` | `PublicBusinessController` | Catálogo público (`GET`, `GET /{id}`) |
| `/api/provider/business` | `ProviderBusinessController` | CRUD de negocios del proveedor |
| `/api/bookings` | `BookingController` | Crear/listar reservas; `GET /itinerary` |
| `/api/provider/bookings` | `ProviderBookingController` | Listar / aprobar / rechazar |
| `/api/reviews` | `ReviewController` | Crear y consultar reseñas |
| `/api/favorites` | `FavoritesController` | Favoritos del turista (`USER`) |
| `/api/chat` | `ChatController` | Conversaciones, mensajes, bot y soporte legacy |
| `/api/support/conversations` | `SupportController` | `POST /open`, `PUT /{id}/assign`, `GET /inbox` |
| `/api/admin` | `AdminController` | Stats, usuarios y moderación de negocios |

Rutas públicas (sin JWT): registro/login, Swagger, `GET /api/businesses/**` y recursos bajo `/uploads/**`.

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
- Itinerario = reservas activas agrupadas por ciudad

### Chat y soporte

- Chat comercial cliente ↔ proveedor
- Widget FAQ efímero en frontend (`useEphemeralChatbot`)
- Escalamiento a asesor: `POST /api/support/conversations/open`
- Asignación e inbox staff: `PUT .../assign`, `GET .../inbox`

### Storage de imágenes

- Buckets Supabase usados por el frontend: `user-avatars`, `service-gallery`
- Formatos: JPG, PNG, WEBP — máximo 5 MB

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

Editar `Back_WTS/src/main/resources/application.properties` con los datos reales del entorno:

```properties
spring.datasource.url=jdbc:postgresql://<HOST>:5432/postgres?sslmode=require
spring.datasource.username=<USUARIO>
spring.datasource.password=<PASSWORD>

spring.jpa.hibernate.ddl-auto=validate

app.jwt.secret=<SECRETO_BASE64_MIN_32_BYTES>
app.jwt.expiration-millis=86400000

app.upload-dir=uploads
app.supabase.url=https://<PROYECTO>.supabase.co
```

Notas:

- La base debe existir previamente (Hibernate **no** crea el esquema).
- No versionar contraseñas ni secretos JWT en el repositorio.

### 3. Configurar el frontend

Crear `Front_WTS/.env`:

```env
VITE_SUPABASE_URL=https://<PROYECTO>.supabase.co
VITE_SUPABASE_ANON_KEY=<CLAVE_ANON_PUBLICA>
```

Opcionales (analítica Looker Studio del proveedor):

```env
VITE_LOOKER_EMBED_URL=
VITE_LOOKER_PERFORMANCE_URL=
VITE_LOOKER_TOP_SERVICES_URL=
VITE_LOOKER_BEHAVIOR_URL=
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
| Baja | **Looker Studio** | Conectar URLs reales de embed vía variables `VITE_LOOKER_*` |

---

## 10. Integrantes y licencia

### Integrantes

- Jossuath Leandro Florez Granados
- Diego Andres Marciales Florez
- Johan Sebastian Maldonado Suarez

### Licencia

Proyecto académico — uso restringido al contexto del trabajo de grado y sus evaluaciones asociadas.

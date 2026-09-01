# World Tourism Solutions

Plataforma web de planificación turística desarrollada como **proyecto de grado**.

## Descripción del proyecto

World Tourism Solutions es una plataforma web orientada a facilitar la planificación de viajes turísticos mediante la centralización de información sobre hospedajes, actividades, restaurantes y servicios turísticos.

La idea surge debido a que actualmente los turistas deben consultar múltiples plataformas para organizar un viaje, lo que genera desorden, pérdida de tiempo y dificultad para encontrar información confiable.

El objetivo del proyecto es ofrecer una solución centralizada que permita a los usuarios explorar servicios turísticos, realizar reservas, comunicarse con proveedores y administrar contenido desde una interfaz moderna y responsiva.

---

## Tecnologías utilizadas

### Frontend (`Front_WTS`)

| Categoría | Tecnología |
|-----------|------------|
| Lenguaje | TypeScript |
| Framework UI | React 18 |
| Build tool | Vite 6 |
| Enrutamiento | React Router DOM 7 |
| HTTP | Axios |
| Estilos | Tailwind CSS 4 |
| Componentes UI | Radix UI, Material UI (MUI), Lucide React |
| Formularios | React Hook Form |
| Fechas | date-fns, react-day-picker |
| Gráficos / carrusel | Recharts, Embla Carousel, react-slick |
| Animaciones | Motion |
| Notificaciones | Sonner |

### Backend (`Back_WTS`)

| Categoría | Tecnología |
|-----------|------------|
| Lenguaje | Java 17 |
| Framework | Spring Boot 4 |
| Persistencia | Spring Data JPA + Hibernate |
| Base de datos | SQLite |
| Seguridad | Spring Security + JWT (jjwt) |
| Validación | Jakarta Validation |
| Documentación API | SpringDoc OpenAPI (Swagger UI) |
| Build | Maven |

---

## Arquitectura

El proyecto sigue una arquitectura cliente-servidor en monorepo con **Clean Architecture** en el backend y **Feature-first** en el frontend.

```
Frontend (React + Vite)  →  API REST (Spring Boot)  →  Base de datos (SQLite)
     Puerto 5173                    Puerto 8080              worldturism.db
```

```
world-tourism-solutions/
├── Front_WTS/          # Frontend React + TypeScript + Vite
└── Back_WTS/           # Backend Spring Boot + SQLite
```

### Backend — Clean Architecture

```
Back_WTS/src/main/java/com/worldturism/spring/app/
├── AppApplication.java
├── domain/model/                 # Entidades JPA y enums de dominio
│   ├── AppUser, ProviderProfile, TourService, Booking, Review
│   ├── Favorite, SavedService
│   ├── Conversation, Message       # Chat y tickets de soporte
│   └── ConversationType, SupportStatus, SupportUrgency
├── application/service/            # Casos de uso y lógica de negocio
│   ├── AuthService, BookingService, SupportChatService
│   ├── FavoriteService, ReviewService, AdminUserService...
│   └── ...
├── infrastructure/
│   ├── persistence/repository/     # JpaRepository (Spring Data)
│   ├── security/                   # JWT + Spring Security
│   ├── config/                     # CORS, OpenAPI, migraciones SQLite
│   └── storage/                    # Almacenamiento de imágenes
├── presentation/
│   ├── controller/                 # Controladores REST
│   └── dto/                        # Records Request/Response
└── common/                         # ApiExceptionHandler global
```

### Frontend — Feature-first

```
Front_WTS/src/
├── app/                            # Bootstrap y enrutamiento
├── core/
│   ├── api/client.ts               # Axios + interceptor JWT
│   └── mocks/mockData.ts           # Datos legacy (módulos sin API)
├── shared/components/              # UI reutilizable (layout, catalog, ui)
└── features/                       # Módulos por dominio
    ├── auth/pages/
    ├── catalog/pages/ + hooks/ + services/
    ├── bookings/pages/
    ├── reviews/pages/
    ├── provider/pages/
    ├── profile/pages/
    ├── chat/
    │   ├── pages/Chat.tsx
    │   ├── services/chatApi.ts
    │   └── utils/contactProvider.ts
    └── admin/pages/ + services/
```

---

## Roles del sistema

| Rol | Descripción en UI | Redirección tras login |
|-----|-------------------|------------------------|
| **USER** (Turista) | Explora servicios, reserva, chatea, reseña e itinerario | `/home-logueado` |
| **PROVIDER** (Asesor) | Crea y gestiona negocios, aprueba/rechaza reservas, chatea | `/dashboard-accesor` |
| **ADMIN** (Super Admin) | Administración avanzada y soporte al cliente | `/admin` |

---

## Módulos completados y funcionales

| Módulo | Backend | Frontend | Descripción |
|--------|---------|----------|-------------|
| **Autenticación** | ✅ | ✅ | Registro, login, JWT, redirección por rol |
| **Catálogo / Búsqueda** | ✅ | ✅ | Listado público de negocios con filtros |
| **Favoritos** | ✅ | ✅ | Guardar/eliminar negocios favoritos (`useFavorites`) |
| **Reservas** | ✅ | ✅ | Crear reserva, itinerario, aprobación por asesor |
| **Reseñas** | ✅ | ✅ | Publicar y consultar reseñas de negocios |
| **Panel Asesor** | ✅ | ✅ | CRUD de negocios, gestión de reservas |
| **Panel Admin** | ✅ | ✅ | Usuarios, negocios, servicios, estadísticas |
| **Comunicación / Soporte** | ✅ | ✅ | Chat cliente↔proveedor, tickets de soporte, panel admin |

### Sistema de Comunicación e Intercomunicación

El módulo de chat modela tres tipos de conversación:

| Tipo | Participantes | Uso |
|------|---------------|-----|
| `CLIENT_TO_PROVIDER` | Turista ↔ Asesor | Contacto directo desde tarjetas de servicio o reservas |
| `CLIENT_TO_SUPPORT` | Turista ↔ Admin | Tickets de soporte creados por usuarios |
| `PROVIDER_TO_SUPPORT` | Asesor ↔ Admin | Tickets de soporte creados por proveedores |

**Entidades JPA:**

- `conversations` — Hilo de conversación o ticket de soporte (tipo, estado, urgencia, participantes)
- `messages` — Mensajes individuales (remitente, contenido, fecha, estado de lectura)

**Flujo frontend:**

1. El turista pulsa **Contactar** en un servicio → `chatApi.startConversation()` → redirección a `/chat?conversation={id}`
2. En `/chat`, el usuario ve conversaciones activas, envía mensajes y crea tickets de soporte
3. Polling cada 5 segundos para actualizar mensajes
4. El admin gestiona tickets en `/admin` (pestaña Soporte) y responde desde `/chat`

---

## Rutas del frontend

| Ruta | Página | Integración con API |
|------|--------|---------------------|
| `/` | Home (público) | ✅ `GET /businesses` |
| `/login` | Login | ✅ `POST /auth/login` |
| `/register` | Registro | ✅ `POST /auth/register` |
| `/home-logueado` | Home usuario logueado + mapa | ✅ `GET /businesses` |
| `/map` | Mapa de servicios | ⚠️ Datos mock |
| `/itinerary` | Itinerario | ✅ `GET /bookings/itinerary` |
| `/booking/:id` | Detalle y reserva | ✅ API completa |
| `/booking-detail/:id` | Detalle de reserva (asesor) | ❌ Datos mock |
| `/reviews/:id` | Reseñas | ✅ `GET/POST /reviews` |
| `/chat` | Chat / mensajería / soporte | ✅ `GET/POST /chat/**` |
| `/profile` | Perfil de usuario | ✅ Reservas + favoritos reales |
| `/edit-profile` | Editar perfil | ❌ Solo localStorage |
| `/dashboard-accesor` | Panel del asesor | ✅ API completa |
| `/create-service` | Crear servicio/negocio | ✅ `POST /provider/business` |
| `/edit-service/:id` | Editar servicio/negocio | ✅ `GET/PUT /provider/business/:id` |
| `/admin` | Panel de administración | ✅ `GET/PATCH/DELETE /admin/**` + soporte |

---

## Endpoints de la API

Base URL: `http://localhost:8080/api`

### Autenticación — `/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/register` | Público | Registro (USER o PROVIDER) |
| POST | `/login` | Público | Login, retorna JWT |
| GET | `/me` | JWT | Usuario actual |

### Negocios públicos — `/businesses`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Público | Listar negocios aprobados |
| GET | `/{businessId}` | Público | Detalle de negocio |

### Servicios — `/services`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Público | Listar servicios turísticos |
| POST | `/{serviceId}/acquire` | JWT | Adquirir servicio |
| GET | `/acquired` | JWT | Servicios adquiridos del usuario |

### Reservas — `/bookings`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | JWT (USER) | Crear reserva |
| GET | `/` | JWT (USER) | Mis reservas |
| GET | `/itinerary` | JWT (USER) | Reservas agrupadas por ciudad |

### Reseñas — `/reviews`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | JWT | Crear reseña |
| GET | `/me` | JWT | Mis reseñas |
| GET | `/businesses/{businessId}` | Público | Reseñas de un negocio |

### Favoritos — `/favorites`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | JWT | Listar favoritos del usuario |
| POST | `/{businessId}` | JWT | Agregar negocio a favoritos |
| DELETE | `/{businessId}` | JWT | Quitar de favoritos |
| GET | `/{businessId}/status` | JWT | Verificar si es favorito |

### Chat y Soporte — `/chat`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/conversations` | JWT | Listar conversaciones del usuario |
| POST | `/conversations` | JWT (USER) | Iniciar conversación con proveedor |
| GET | `/conversations/{id}/messages` | JWT (participante) | Historial de mensajes |
| POST | `/conversations/{id}/messages` | JWT (participante) | Enviar mensaje |
| PATCH | `/conversations/{id}/read` | JWT (participante) | Marcar mensajes como leídos |
| POST | `/support` | JWT (USER/PROVIDER) | Crear ticket de soporte |
| GET | `/support` | JWT (ADMIN) | Listar todos los tickets |
| PATCH | `/support/{id}/status` | JWT (ADMIN) | Actualizar estado del ticket |
| POST | `/support/{id}/messages` | JWT (ADMIN) | Responder ticket (cambia OPEN → IN_PROGRESS) |

### Proveedor — negocios — `/provider/business`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | PROVIDER | Crear negocio (multipart + imágenes) |
| GET | `/` | PROVIDER | Mis negocios |
| PUT | `/{businessId}` | PROVIDER | Actualizar negocio |
| DELETE | `/{businessId}` | PROVIDER | Eliminar negocio |

### Proveedor — servicios — `/provider/services`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | PROVIDER | Crear TourService |
| GET | `/` | PROVIDER | Mis TourServices |

### Proveedor — reservas — `/provider/bookings`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | PROVIDER | Reservas de mis negocios |
| POST | `/{bookingId}/approve` | PROVIDER | Aprobar reserva |
| POST | `/{bookingId}/reject` | PROVIDER | Rechazar reserva |

### Administración — `/admin`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/stats` | ADMIN | Estadísticas del panel |
| GET | `/users` | ADMIN | Listar usuarios |
| PUT | `/users/{id}` | ADMIN | Actualizar usuario |
| DELETE | `/users/{id}` | ADMIN | Eliminar usuario |
| GET | `/businesses` | ADMIN | Listar negocios |
| PATCH | `/businesses/{id}/status` | ADMIN | Cambiar estado de negocio |
| DELETE | `/businesses/{id}` | ADMIN | Eliminar negocio |
| GET | `/services` | ADMIN | Listar servicios |
| PATCH | `/services/{id}/status` | ADMIN | Cambiar estado de servicio |
| DELETE | `/services/{id}` | ADMIN | Eliminar servicio |

### Otros

| Ruta | Descripción |
|------|-------------|
| `/uploads/**` | Archivos subidos (imágenes) |
| `/swagger-ui.html` | Documentación interactiva Swagger |
| `/v3/api-docs` | Especificación OpenAPI |

---

## Base de datos (SQLite / JPA)

### Configuración

El backend usa **SQLite** con el archivo `Back_WTS/worldturism.db`. Hibernate actualiza el esquema automáticamente (`spring.jpa.hibernate.ddl-auto=update`).

```properties
# Back_WTS/src/main/resources/application.properties
spring.datasource.url=jdbc:sqlite:worldturism.db
spring.datasource.driver-class-name=org.sqlite.JDBC
spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
app.jwt.secret=<clave-base64>
app.jwt.expiration-millis=86400000
```

Migraciones manuales adicionales para SQLite se ejecutan al arrancar (`SqliteBookingProviderMigration`, `SqliteProviderProfileMigration`, `SqliteReviewBusinessMigration`).

### Tablas principales

| Tabla | Entidad JPA | Descripción |
|-------|-------------|-------------|
| `users` | `AppUser` | Usuarios (turista, asesor, admin) |
| `provider_profiles` | `ProviderProfile` | Negocios de los asesores |
| `services` | `TourService` | Servicios turísticos |
| `bookings` | `Booking` | Reservas de usuarios |
| `reviews` | `Review` | Reseñas de negocios |
| `favorites` | `Favorite` | Negocios favoritos por usuario |
| `saved_services` | `SavedService` | Servicios adquiridos |
| `conversations` | `Conversation` | Hilos de chat y tickets de soporte |
| `messages` | `Message` | Mensajes de chat |
| `itineraries` / `itinerary_items` | `Itinerary` / `ItineraryItem` | Itinerarios *(entidades creadas, no usadas aún)* |

### Enums de comunicación

| Enum | Valores |
|------|---------|
| `ConversationType` | `CLIENT_TO_PROVIDER`, `CLIENT_TO_SUPPORT`, `PROVIDER_TO_SUPPORT` |
| `SupportStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `SupportUrgency` | `LOW`, `MEDIUM`, `HIGH` |

---

## Instalación y ejecución

### Prerrequisitos

- **Node.js** 18 o superior
- **Java** 17
- **Maven** (o usar el wrapper incluido `mvnw`)

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd world-tourism-solutions
```

### 2. Ejecutar el backend

```bash
cd Back_WTS
.\mvnw.cmd spring-boot:run
```

En Linux/macOS:

```bash
cd Back_WTS
./mvnw spring-boot:run
```

| Configuración | Valor |
|---------------|-------|
| Puerto | `8080` |
| Base de datos | `worldturism.db` (SQLite, en carpeta `Back_WTS`) |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| API docs | http://localhost:8080/v3/api-docs |
| CORS permitido | `http://localhost:5173`, `3000`, `4200` |

### 3. Ejecutar el frontend

En otra terminal:

```bash
cd Front_WTS
npm install
npm run dev
```

| Configuración | Valor |
|---------------|-------|
| Puerto | `5173` (Vite) |
| URL de la app | http://localhost:5173 |
| API backend | `http://localhost:8080/api` (en `src/core/api/client.ts`) |

### 4. Verificar compilación

```bash
# Backend
cd Back_WTS
.\mvnw.cmd compile -DskipTests

# Frontend
cd Front_WTS
npm run build
```

### 5. Variables de entorno (frontend)

Crear un archivo `.env` en `Front_WTS/` con:

```env
VITE_GOOGLE_MAPS_API_KEY=tu_clave_de_google_maps
```

> Esta variable es necesaria para que el mapa funcione en `/home-logueado`. Sin ella, el resto de la aplicación sigue operando con normalidad.

---

## Estado del proyecto: pendientes

| Módulo | Estado | Detalle |
|--------|--------|---------|
| Página de mapa independiente | Mock | `MapPage.tsx` usa datos mock |
| Detalle de reserva (asesor) | Mock | `BookingDetail.tsx` |
| Editar perfil | Parcial | Solo actualiza `localStorage` |
| Servicios adquiridos | Backend listo | Frontend no integrado |
| Itinerarios personalizados | Entidades creadas | Itinerario se deriva de reservas |
| Protección de rutas | Pendiente | Sin `ProtectedRoute` centralizado |
| WebSocket / tiempo real | Pendiente | Chat usa polling (5 s) |

---

## Integrantes

- Jossuath Leandro Florez Granados
- Diego Andres Marciales Florez
- Johan Sebastian Maldonado Suarez

---

## Observaciones

Este proyecto corresponde a un **proyecto de grado** desarrollado para evidenciar el proceso de análisis, diseño y construcción de software utilizando UML, levantamiento de requerimientos y arquitectura cliente-servidor.

El sistema cuenta con un MVP funcional que integra frontend y backend para autenticación, exploración de negocios, reservas, reseñas, favoritos, gestión del asesor, panel de administración y sistema de comunicación/soporte entre clientes, proveedores y administradores.

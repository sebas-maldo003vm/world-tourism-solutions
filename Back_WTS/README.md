# World Tourism Solutions

Plataforma web de planificación turística desarrollada como **proyecto de grado**.

## Descripción del proyecto

World Tourism Solutions es una plataforma web orientada a facilitar la planificación de viajes turísticos mediante la centralización de información sobre hospedajes, actividades, restaurantes y servicios turísticos.

La idea surge debido a que actualmente los turistas deben consultar múltiples plataformas para organizar un viaje, lo que genera desorden, pérdida de tiempo y dificultad para encontrar información confiable.

El objetivo del proyecto es ofrecer una solución centralizada que permita a los usuarios explorar servicios turísticos, realizar reservas y administrar contenido desde una interfaz moderna y responsiva.

---

## Problema identificado

Actualmente, las personas que desean viajar enfrentan problemas como:

- Información turística dispersa en múltiples plataformas.
- Dificultad para encontrar servicios confiables.
- Mala organización de actividades y reservas.
- Procesos manuales de contacto con proveedores.
- Baja visibilidad digital para pequeños prestadores de servicios turísticos.

---

## Proceso de ideación

La propuesta surgió a partir del análisis de cómo los usuarios organizan actualmente sus viajes.

Se identificó que:

- Muchos turistas utilizan redes sociales, recomendaciones y diferentes páginas para encontrar información.
- Los proveedores turísticos dependen principalmente de WhatsApp o redes sociales para promocionar sus servicios.
- No existe una solución sencilla que centralice servicios turísticos y reservas en un solo lugar.

A partir de estas necesidades se planteó desarrollar una plataforma web turística enfocada inicialmente en un MVP funcional.

---

## Objetivos del MVP

El MVP busca validar:

- Registro e inicio de sesión de usuarios.
- Gestión de roles.
- Visualización de servicios turísticos.
- Gestión básica de reservas.
- Administración de servicios turísticos por parte de asesores.

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

### Herramientas

- Git / GitHub
- Jira (control de tareas)

---

## Arquitectura

El proyecto sigue una arquitectura cliente-servidor en monorepo:

```
Frontend (React + Vite)  →  API REST (Spring Boot)  →  Base de datos (SQLite)
     Puerto 5173                    Puerto 8080              worldturism.db
```

```
world-tourism-solutions/
├── Front_WTS/          # Frontend React + TypeScript + Vite
└── Back_WTS/           # Backend Spring Boot + SQLite
```

---

## Roles del sistema

| Rol | Descripción en UI | Redirección tras login |
|-----|-------------------|------------------------|
| **USER** (Turista) | Explora servicios, reserva, reseña e itinerario | `/home-logueado` |
| **PROVIDER** (Asesor) | Crea y gestiona negocios, aprueba/rechaza reservas | `/dashboard-accesor` |
| **ADMIN** (Super Admin) | Administración avanzada del sistema | `/admin` |

### Usuario Turista

Puede:

- Registrarse e iniciar sesión.
- Visualizar servicios turísticos.
- Filtrar servicios.
- Realizar reservas.
- Ver itinerario según reservas.
- Hacer reseñas.
- Editar perfil *(parcial — ver sección de estado)*.

### Asesor (Proveedor)

Puede:

- Iniciar sesión.
- Crear, editar y eliminar negocios/servicios.
- Visualizar reservas de sus negocios.
- Aprobar o rechazar reservas.
- Editar perfil *(parcial — ver sección de estado)*.

### Super Admin

Rol planteado para administración avanzada del sistema *(no implementado en backend)*.

---

## Rutas del frontend

| Ruta | Página | Integración con API |
|------|--------|---------------------|
| `/` | Home (público) | ✅ `GET /businesses` |
| `/login` | Login | ✅ `POST /auth/login` |
| `/register` | Registro | ✅ `POST /auth/register` |
| `/home-logueado` | Home usuario logueado + mapa | ✅ `GET /businesses` |
| `/map` | Mapa de servicios | ❌ Datos mock |
| `/itinerary` | Itinerario | ✅ `GET /bookings/itinerary` |
| `/booking/:id` | Detalle y reserva | ✅ API completa |
| `/booking-detail/:id` | Detalle de reserva (asesor) | ❌ Datos mock |
| `/reviews/:id` | Reseñas | ✅ `GET/POST /reviews` |
| `/chat` | Chat / mensajería | ❌ Datos mock |
| `/profile` | Perfil de usuario | ⚠️ Reservas reales; servicios guardados mock |
| `/edit-profile` | Editar perfil | ❌ Solo localStorage |
| `/dashboard-accesor` | Panel del asesor | ✅ API completa |
| `/create-service` | Crear servicio/negocio | ✅ `POST /provider/business` |
| `/edit-service/:id` | Editar servicio/negocio | ✅ `GET/PUT /provider/business/:id` |
| `/admin` | Panel de administración | ❌ Datos mock |

---

## Endpoints del backend

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
| GET | `/` | Público | Listar negocios de proveedores |
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

### Otros

| Ruta | Descripción |
|------|-------------|
| `/uploads/**` | Archivos subidos (imágenes) |
| `/swagger-ui.html` | Documentación interactiva Swagger |
| `/v3/api-docs` | Especificación OpenAPI |

> **Nota:** La ruta `/api/admin/**` está protegida en seguridad, pero no existe un controlador de administración implementado.

---

## Estado del proyecto: qué funciona y qué no

### ✅ Funcionalidades operativas (integradas con API)

| Módulo | Detalle |
|--------|---------|
| **Autenticación** | Registro, login, JWT, redirección por rol |
| **Exploración de negocios** | Home público y home logueado con datos reales del backend |
| **Reservas (turista)** | Crear reserva, ver mis reservas, itinerario por ciudad |
| **Reseñas** | Ver y publicar reseñas de negocios |
| **Panel del asesor** | Listar negocios, ver reservas, aprobar/rechazar |
| **CRUD de negocios (asesor)** | Crear, editar y eliminar negocios con carga de imágenes |
| **Mapa (home logueado)** | Google Maps con negocios reales (requiere API key) |
| **Subida de imágenes** | Multipart al backend, servidas desde `/uploads/**` |
| **Documentación API** | Swagger UI disponible en `http://localhost:8080/swagger-ui.html` |

### ❌ Funcionalidades no implementadas o con datos mock

| Módulo | Archivo(s) | Problema |
|--------|------------|----------|
| **Panel de administración** | `AdminDashboard.tsx` | UI con datos mock; no hay API `/api/admin` |
| **Chat / mensajería** | `Chat.tsx` | Datos mock; existen entidades `Conversation`/`Message` en BD sin API |
| **Página de mapa** | `MapPage.tsx` | Usa `mockData`; componente `MapView` comentado |
| **Detalle de reserva (asesor)** | `BookingDetail.tsx` | Usa `mockBookings` |
| **Servicios guardados en perfil** | `Profile.tsx` | Reservas reales, pero servicios guardados son mock |
| **Editar perfil** | `EditProfile.tsx` | Solo actualiza `localStorage`; no hay `PUT /api/users` |
| **Tickets de soporte** | `mockData.ts`, `AdminDashboard.tsx` | Sin modelo ni API en backend |
| **Servicios adquiridos** | Backend disponible | Frontend no llama a `/services/{id}/acquire` ni `/services/acquired` |
| **TourService CRUD** | Backend `/provider/services` | Frontend gestiona `ProviderProfile` (negocios), no `TourService` |
| **Itinerarios personalizados** | Entidades `Itinerary`/`ItineraryItem` | Existen en BD pero no se usan; itinerario se deriva de reservas |
| **Búsqueda en header** | `Header.tsx` | Input de búsqueda sin funcionalidad |
| **Protección de rutas** | `routes.tsx` | No hay `ProtectedRoute`; cualquier usuario puede navegar a cualquier ruta |

### ⚠️ Problemas conocidos / pendientes

| Problema | Detalle |
|----------|---------|
| Campo `nit` vs `taxId` | El formulario de servicio envía `nit`; el backend espera `taxId` |
| Doble modelo de servicios | Backend tiene `ProviderProfile` (negocio) y `TourService`; frontend solo usa negocios |
| Categorías inconsistentes | Mock usa etiquetas en español; backend usa enum (`RESTAURANTE`, `ACTIVIDAD`, etc.) |
| URL de API hardcodeada | `api.ts` apunta a `http://localhost:8080/api` sin variable de entorno |
| Sin guards de ruta | Páginas verifican token de forma individual, no de forma centralizada |

---

## Requerimientos funcionales

- Registro de usuarios.
- Inicio de sesión.
- Gestión de roles.
- Visualización de servicios turísticos.
- Filtro de servicios.
- Creación de reservas.
- Gestión de reservas.
- CRUD de servicios turísticos.
- Edición de perfil.
- Sistema de reseñas.
- Itinerario basado en reservas.

## Requerimientos no funcionales

- Diseño responsivo.
- Interfaz intuitiva.
- Navegación sencilla.
- Tiempo de respuesta rápido.
- Arquitectura escalable.

---

## Estructura del proyecto

### Frontend (`Front_WTS`)

```bash
Front_WTS/
├── public/
│   └── imagen/              # Imágenes estáticas
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx       # Definición de rutas
│   │   ├── pages/           # 17 páginas
│   │   ├── components/      # Layout, Header, MapView, FilterBar, ui/*
│   │   └── Services/
│   │       ├── api.ts       # Cliente Axios + interceptores JWT
│   │       └── mockData.ts  # Datos de prueba (módulos sin API)
│   └── styles/              # Tailwind, tema, fuentes
├── package.json
├── vite.config.ts
└── .env                     # VITE_GOOGLE_MAPS_API_KEY
```

### Backend (`Back_WTS`)

```bash
Back_WTS/
├── src/main/java/com/worldturism/spring/app/
│   ├── AppApplication.java
│   ├── controller/          # 9 controladores REST
│   ├── model/               # Entidades JPA
│   ├── repository/          # 6 repositorios
│   ├── service/             # Lógica de negocio
│   ├── security/            # JWT + SecurityConfig
│   ├── config/              # CORS, OpenAPI, migraciones SQLite
│   └── view/dto/            # DTOs de request/response
├── src/main/resources/
│   └── application.properties
├── worldturism.db           # Base de datos SQLite
├── pom.xml
└── mvnw / mvnw.cmd
```

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
| API backend | `http://localhost:8080/api` (hardcodeada en `src/app/Services/api.ts`) |

### 4. Variables de entorno (frontend)

Crear un archivo `.env` en `Front_WTS/` con:

```env
VITE_GOOGLE_MAPS_API_KEY=tu_clave_de_google_maps
```

> Esta variable es necesaria para que el mapa funcione en `/home-logueado`. Sin ella, el resto de la aplicación sigue operando con normalidad.

### 5. Build de producción (frontend)

```bash
cd Front_WTS
npm run build
```

---

## Base de datos

El backend usa **SQLite** con el archivo `Back_WTS/worldturism.db`. Hibernate actualiza el esquema automáticamente (`ddl-auto=update`).

### Entidades principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema (turista, asesor, admin) |
| `provider_profiles` | Perfiles de negocio de los asesores |
| `services` | Servicios turísticos (TourService) |
| `bookings` | Reservas de usuarios |
| `reviews` | Reseñas de negocios |
| `saved_services` | Servicios guardados por usuario |
| `itineraries` / `itinerary_items` | Itinerarios *(entidades creadas, no usadas aún)* |
| `conversations` / `messages` | Chat *(entidades creadas, sin API)* |

---

## Integrantes

- Jossuath Leandro Florez Granados
- Diego Andres Marciales Florez
- Johan Sebastian Maldonado Suarez

---

## Observaciones

Este proyecto corresponde a un **proyecto de grado** desarrollado para evidenciar el proceso de análisis, diseño y construcción de software utilizando UML, levantamiento de requerimientos y arquitectura cliente-servidor.

El sistema cuenta con un MVP funcional que integra frontend y backend para las funcionalidades principales (autenticación, exploración de negocios, reservas, reseñas y gestión del asesor). Módulos como administración, chat, edición de perfil y mapa independiente permanecen pendientes de integración completa con la API.

# Impuestos Vehiculares

cambio desde casa

Portal de consulta y pago de impuestos vehiculares municipales. Los ciudadanos pueden consultar el estado de sus obligaciones por placa y procesar pagos en línea. Incluye panel de administración protegido con JWT para gestionar vehículos, vigencias y carga masiva de datos vía CSV.

**Deploy:** https://impuestos-vehiculos.onrender.com
            https://impuestos-vehiculos-mdqi132d1-edwardrzls-projects.vercel.app

---

## Tech Stack

| Capa | Tecnologías |
|------|-------------|
| Backend | Node.js, Express 4, TypeScript, better-sqlite3 |
| Auth | jsonwebtoken, bcryptjs |
| Frontend | React 18, Vite, TypeScript, TailwindCSS 3, React Router v6 |
| Extras | jsPDF, Lucide React, Multer |

---

## Estructura del proyecto

```
impuestos-vehiculos/
├── backend/
│   ├── src/
│   │   ├── server.ts                   # Entry point: Express + middlewares + routers
│   │   ├── db.ts                       # Conexión SQLite y DDL
│   │   ├── seed.ts                     # Datos de prueba (exporta runSeed())
│   │   ├── config.ts                   # Variables de entorno centralizadas
│   │   ├── types.ts
│   │   ├── errors.ts                   # Clases de error HTTP
│   │   ├── routes/
│   │   │   ├── vehiculos.ts
│   │   │   ├── pagos.ts
│   │   │   ├── auth.ts
│   │   │   └── admin.ts                # Todas las rutas admin pasan por authMiddleware
│   │   ├── controllers/
│   │   │   ├── vehiculoController.ts
│   │   │   ├── pagoController.ts
│   │   │   ├── authController.ts
│   │   │   ├── adminPanelController.ts
│   │   │   ├── csvController.ts
│   │   │   └── vigenciaController.ts
│   │   ├── repositories/
│   │   ├── services/
│   │   └── middleware/
│   │       └── authMiddleware.ts
│   ├── prisma.db                       # SQLite (no versionado)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── api/
    │   │   └── client.ts               # Capa HTTP centralizada (usa BASE_URL / VITE_API_URL)
    │   ├── auth/
    │   │   └── session.ts              # Persistencia del JWT en sessionStorage
    │   ├── components/
    │   │   ├── admin/                  # StatsCards, TablaVehiculos, FiltrosVehiculos,
    │   │   │                           # DetalleVehiculo, CargaCSV, CrearVigencias
    │   │   ├── BuscadorPlaca.tsx
    │   │   ├── VigenciaRow.tsx
    │   │   ├── BarraPago.tsx
    │   │   ├── ModalComprobante.tsx
    │   │   ├── ModalPasarela.tsx
    │   │   ├── Header.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── hooks/
    │   │   └── useVehiculo.ts
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── VehicleDetail.tsx
    │   │   ├── Admin.tsx
    │   │   └── Login.tsx
    │   ├── types.ts
    │   └── utils/
    │       └── format.ts
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## Setup local

**Prerequisitos:** Node.js 18+, npm 9+

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Completar JWT_SECRET
npm run dev            # http://localhost:3001
```

La base de datos SQLite se crea automáticamente en `backend/prisma.db` al primer arranque. Para poblar con datos de prueba:

```bash
npm run seed
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

En desarrollo el proxy de Vite redirige `/api/*` → `http://localhost:3001`. No se requiere configurar `VITE_API_URL`.

---

## Variables de entorno

### Backend — `backend/.env`

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `JWT_SECRET` | Sí | Clave de firma JWT. Mínimo 32 caracteres. |
| `PORT` | No | Puerto del servidor. Default: `3001`. |

### Frontend — variables de build

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_API_URL` | Solo en producción | URL base del backend. Ej: `https://impuestos-vehiculos.onrender.com`. En desarrollo se omite. |

---

## API Endpoints

### Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Healthcheck |
| `GET` | `/api/vehiculos/:placa` | Vehículo + vigencias + resumen de deuda |
| `POST` | `/api/pagos` | Registra pago de una o varias vigencias |
| `GET` | `/api/pagos/:referencia` | Consulta pago por referencia |
| `POST` | `/api/auth/login` | Autenticación admin. Devuelve `{ token }`. |

### Admin — requieren `Authorization: Bearer <token>`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/me` | Verifica sesión activa |
| `GET` | `/api/admin/stats` | Contadores globales del panel |
| `GET` | `/api/admin/vehiculos` | Lista paginada con filtros: `marca`, `clase`, `modelo`, `tipo_servicio`, `estado_pago`, `pagina` |
| `GET` | `/api/admin/vehiculos/:placa` | Detalle: datos + vigencias + historial de pagos |
| `POST` | `/api/admin/csv/vehiculos` | Carga masiva `multipart/form-data` (campo `archivo`) |
| `GET` | `/api/admin/vigencias/anio-siguiente` | Próximo año disponible para generar vigencias |
| `POST` | `/api/admin/vigencias/generar-anual` | Genera vigencias anuales para todos los vehículos |

---

## Scripts

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo watch (tsx) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Corre el build compilado |
| `npm run seed` | Inserta datos de prueba |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Preview del build |

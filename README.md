# Prisma Impuestos — Portal de impuestos vehiculares

Proyecto educativo full-stack para consultar y pagar impuestos vehiculares por placa.

**Stack:**
- **Backend:** Node.js + Express + SQLite, todo en TypeScript.
- **Frontend:** React + Vite + TailwindCSS + React Router, en TypeScript.

---

## 📁 Estructura del proyecto

```
prisma-impuestos/
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma.db                
│   └── src/
│       ├── server.ts            ← entrada: configura Express y monta routers
│       ├── db.ts                ← conexión a SQLite + creación de tablas
│       ├── seed.ts              ← script de datos de prueba
│       ├── types.ts             ← interfaces TS compartidas
│       └── routes/
│           ├── vehiculos.ts     ← GET /api/vehiculos/:placa
│           └── pagos.ts         ← POST /api/pagos, GET /api/pagos/:ref
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts           ← configuración Vite + proxy /api
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx             ← entrada de React
        ├── App.tsx              ← define las rutas
        ├── index.css            ← estilos globales con Tailwind
        ├── types.ts             ← tipos espejo del backend
        ├── api/
        │   └── client.ts        ← funciones que llaman a la API
        ├── components/
        │   ├── Header.tsx
        │   ├── BuscadorPlaca.tsx
        │   ├── VigenciaRow.tsx
        │   ├── BarraPago.tsx
        │   └── ModalComprobante.tsx
        ├── hooks/
        │   └── useVehiculo.ts   ← custom hook para cargar un vehículo
        ├── pages/
        │   ├── Home.tsx
        │   └── VehicleDetail.tsx
        └── utils/
            └── format.ts        ← formateo de moneda y fechas
```

---

## 📡 Endpoints del backend

| Método | Ruta                          | Descripción                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/api/health`                 | Healthcheck                              |
| GET    | `/api/vehiculos/:placa`       | Vehículo + vigencias + resumen           |
| POST   | `/api/pagos`                  | Procesa pago de una o varias vigencias   |
| GET    | `/api/pagos/:referencia`      | Consulta un pago por su referencia       |

---

## 📚 Orden recomendado de lectura del código

Para que entiendas el proyecto entero, te recomiendo leerlo así:

### Backend (1º)

1. `backend/package.json` → qué librerías usa.
2. `backend/tsconfig.json` → configuración TypeScript.
3. `backend/src/types.ts` → interfaces compartidas.
4. `backend/src/db.ts` → estructura de las 3 tablas.
5. `backend/src/seed.ts` → datos de prueba.
6. `backend/src/server.ts` → punto de entrada.
7. `backend/src/routes/vehiculos.ts` → endpoint de consulta.
8. `backend/src/routes/pagos.ts` → endpoint de pago con transacción.

### Frontend (2º)

9. `frontend/package.json`, `tsconfig.json`, `vite.config.ts`.
10. `frontend/tailwind.config.js` → paleta de colores personalizada.
11. `frontend/index.html` → bare-bones, solo el div `root`.
12. `frontend/src/main.tsx` → arranque de React con BrowserRouter.
13. `frontend/src/App.tsx` → definición de rutas.
14. `frontend/src/types.ts` → tipos espejo del backend.
15. `frontend/src/api/client.ts` → capa de comunicación con la API.
16. `frontend/src/utils/format.ts` → helpers de formato.
17. `frontend/src/hooks/useVehiculo.ts` → custom hook (encapsulación).
18. `frontend/src/components/*.tsx` → componentes individuales.
19. `frontend/src/pages/Home.tsx` → página simple.
20. `frontend/src/pages/VehicleDetail.tsx` → la más completa.


---

## 🔮 Hacia dónde puede crecer

- **Login admin**: agregar autenticación con JWT y un panel restringido.
- **Carga masiva CSV**: endpoint admin que permita cargar vehículos en masa.
- **Generación de PDF**: comprobantes descargables.
- **Búsqueda y filtros**: listar todos los vehículos, filtrar por estado.
- **Dashboard**: estadísticas y gráficas de recaudo.
- **Otros servicios**: si decides volver a la idea original, agregar agua, luz, gas.
- **Migración a PostgreSQL**: cuando estés cómodo, vale la pena.

---

## 💡 Notas finales

Este proyecto está pensado como **base sólida** sobre la cual seguir creciendo.

- Cada archivo está comentado en español para que sirva como material de estudio.
- La separación en `routes/`, `components/`, `hooks/`, `api/`, `utils/` es la convención de proyectos reales.
- TypeScript está usado de forma estricta para que aprendas a leer y escribir tipos.
- Las decisiones de diseño favorecen la legibilidad sobre la elegancia. Cuando quieras optimizar después, ya tendrás contexto para hacerlo bien.

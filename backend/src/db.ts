import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'prisma.db');

const db = new Database(dbPath);

// SQLite desactiva FK por defecto.
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS vehiculos (
    placa TEXT PRIMARY KEY,
    clase TEXT NOT NULL,
    marca TEXT NOT NULL,
    linea TEXT NOT NULL,
    modelo INTEGER NOT NULL,
    tipo_servicio TEXT NOT NULL,
    capacidad TEXT,
    avaluo INTEGER NOT NULL,
    propietario TEXT NOT NULL,
    documento_propietario TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vigencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placa TEXT NOT NULL,
    anio INTEGER NOT NULL,
    valor INTEGER NOT NULL,
    descuento INTEGER DEFAULT 0,
    estado TEXT NOT NULL CHECK(estado IN ('pagado', 'pendiente')),
    fecha_pago TEXT,
    fecha_vencimiento TEXT,
    FOREIGN KEY (placa) REFERENCES vehiculos(placa),
    UNIQUE(placa, anio)
  );

  CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referencia TEXT UNIQUE NOT NULL,
    placa TEXT NOT NULL,
    vigencias_pagadas TEXT NOT NULL,
    monto_total INTEGER NOT NULL,
    metodo_pago TEXT NOT NULL,
    fecha_pago TEXT NOT NULL,
    estado TEXT DEFAULT 'completado',
    FOREIGN KEY (placa) REFERENCES vehiculos(placa)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ciudadanos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    documento TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    foto_documento_path TEXT,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS solicitudes_traspaso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ciudadano_id INTEGER NOT NULL,
    placa TEXT NOT NULL,
    foto_path TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE_REVISION_ADMIN'
      CHECK(estado IN ('PENDIENTE_REVISION_ADMIN', 'APROBADO', 'RECHAZADO')),
    comentario_admin TEXT,
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL,
    FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos(id),
    FOREIGN KEY (placa) REFERENCES vehiculos(placa)
  );

  -- Registro de cada validación IA ejecutada (aprobada o rechazada): es la
  -- base del límite de 5 intentos por usuario+placa en 24 h.
  CREATE TABLE IF NOT EXISTS intentos_validacion_traspaso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ciudadano_id INTEGER NOT NULL,
    placa TEXT NOT NULL,
    fecha TEXT NOT NULL,
    resultado TEXT NOT NULL CHECK(resultado IN ('aprobado', 'rechazado')),
    razon_rechazo TEXT,
    FOREIGN KEY (ciudadano_id) REFERENCES ciudadanos(id)
  );
`);

export default db;

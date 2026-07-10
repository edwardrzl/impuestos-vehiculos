import db from './db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runSeed(): void {

console.log('🌱 Limpiando datos previos...');

// Orden inverso a las dependencias FK: primero las tablas hijas,
// después las tablas a las que referencian.
db.exec(`
  DELETE FROM intentos_validacion_traspaso;
  DELETE FROM solicitudes_traspaso;
  DELETE FROM pagos;
  DELETE FROM vigencias;
  DELETE FROM ciudadanos;
  DELETE FROM vehiculos;
  DELETE FROM admins;
`);

// Reinicia los contadores AUTOINCREMENT para que los IDs empiecen en 1.
try {
  db.exec('DELETE FROM sqlite_sequence');
} catch {
  // En una BD recién creada sqlite_sequence aún no existe.
}

// Las fotos subidas (documentos y traspasos) quedan huérfanas al borrar
// ciudadanos y solicitudes: se eliminan también del disco.
const uploadsBase = path.join(__dirname, '..', 'uploads');
for (const sub of ['documentos', 'traspasos']) {
  const dir = path.join(uploadsBase, sub);
  if (!fs.existsSync(dir)) continue;
  for (const archivo of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, archivo));
  }
}

console.log('📥 Insertando vehículos...');

interface VehiculoSeed {
  placa: string;
  clase: string;
  marca: string;
  linea: string;
  modelo: number;
  tipo_servicio: string;
  capacidad: string;
  avaluo: number;
  propietario: string;
  documento_propietario: string;
}

const vehiculos: VehiculoSeed[] = [
  {
    placa: 'SLY29E',
    clase: 'MOTOCICLETA',
    marca: 'BAJAJ',
    linea: 'PULSAR 200 NS',
    modelo: 2019,
    tipo_servicio: 'PARTICULAR',
    capacidad: 'PASAJEROS /2/200',
    avaluo: 5690000,
    propietario: 'JUAN PEREZ GOMEZ',
    documento_propietario: '1098765432',
  },
  {
    placa: 'ABC123',
    clase: 'AUTOMOVIL',
    marca: 'CHEVROLET',
    linea: 'SPARK GT',
    modelo: 2020,
    tipo_servicio: 'PARTICULAR',
    capacidad: 'PASAJEROS /5/1200',
    avaluo: 32500000,
    propietario: 'MARIA RODRIGUEZ LOPEZ',
    documento_propietario: '63456789',
  },
  {
    placa: 'XYZ789',
    clase: 'CAMIONETA',
    marca: 'TOYOTA',
    linea: 'HILUX 4X4',
    modelo: 2022,
    tipo_servicio: 'PARTICULAR',
    capacidad: 'PASAJEROS /5/2400',
    avaluo: 145000000,
    propietario: 'CARLOS ANDRES MEJIA',
    documento_propietario: '79123456',
  },
  {
    placa: 'QGJ95G',
    clase: 'MOTOCICLETA',
    marca: 'BAJAJ',
    linea: 'PULSAR 200 NS',
    modelo: 2024,
    tipo_servicio: 'PARTICULAR',
    capacidad: 'PASAJEROS /2/150',
    avaluo: 8900000,
    propietario: 'EDWARD STIVEN RODRIGUEZ',
    documento_propietario: '1099734202',
  },
  {
    placa: 'WXY456',
    clase: 'AUTOMOVIL',
    marca: 'RENAULT',
    linea: 'LOGAN',
    modelo: 2021,
    tipo_servicio: 'PARTICULAR',
    capacidad: 'PASAJEROS /5/1600',
    avaluo: 42000000,
    propietario: 'PEDRO RAMIREZ TORRES',
    documento_propietario: '80123456',
  },
  {
    placa: 'MOT001',
    clase: 'MOTOCICLETA',
    marca: 'YAMAHA',
    linea: 'FZ 2.0',
    modelo: 2023,
    tipo_servicio: 'PARTICULAR',
    capacidad: 'PASAJEROS /2/150',
    avaluo: 9800000,
    propietario: 'LAURA GONZALEZ DIAZ',
    documento_propietario: '52987654',
  },
];

const insertVehiculo = db.prepare(`
  INSERT INTO vehiculos
    (placa, clase, marca, linea, modelo, tipo_servicio, capacidad, avaluo, propietario, documento_propietario)
  VALUES
    (@placa, @clase, @marca, @linea, @modelo, @tipo_servicio, @capacidad, @avaluo, @propietario, @documento_propietario)
`);

for (const v of vehiculos) {
  insertVehiculo.run(v);
  console.log(`  ✓ ${v.placa} - ${v.marca} ${v.linea}`);
}

console.log('📥 Insertando vigencias...');

type VigenciaSeed = [string, number, number, 'pagado' | 'pendiente', string | null];

const vigenciasData: VigenciaSeed[] = [
  ['SLY29E', 2020, 297139, 'pagado', '2020-06-10'],
  ['SLY29E', 2021, 98478,  'pagado', '2021-04-30'],
  ['SLY29E', 2022, 97106,  'pagado', '2022-05-15'],
  ['SLY29E', 2023, 103254, 'pagado', '2023-04-20'],
  ['SLY29E', 2024, 110223, 'pagado', '2024-05-10'],
  ['SLY29E', 2025, 121688, 'pagado', '2025-04-25'],

  ['ABC123', 2023, 458000, 'pagado', '2023-05-10'],
  ['ABC123', 2024, 487000, 'pagado', '2024-04-15'],
  ['ABC123', 2025, 512000, 'pagado', '2025-05-20'],

  ['XYZ789', 2023, 2180000, 'pagado',   '2023-05-15'],
  ['XYZ789', 2024, 2315000, 'pendiente', null],
  ['XYZ789', 2025, 2456000, 'pendiente', null],

  ['MOT001', 2024, 145000, 'pagado', '2024-04-30'],
  ['MOT001', 2025, 158000, 'pagado', '2025-05-10'],

  ['WXY456', 2024, 612000, 'pagado',   '2024-04-20'],
  ['WXY456', 2025, 648000, 'pendiente', null],
];

const insertVigencia = db.prepare(`
  INSERT INTO vigencias (placa, anio, valor, estado, fecha_pago, fecha_vencimiento)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const [placa, anio, valor, estado, fecha_pago] of vigenciasData) {
  const fecha_vencimiento = estado === 'pendiente' ? `${anio}-06-30` : null;
  insertVigencia.run(placa, anio, valor, estado, fecha_pago, fecha_vencimiento);
}

console.log(`  ✓ ${vigenciasData.length} vigencias insertadas`);

console.log('📥 Insertando administrador...');

const passwordHash = bcrypt.hashSync('Admin123*', 10);

// INSERT OR IGNORE: idempotente si el admin ya existe.
db.prepare(
  'INSERT OR IGNORE INTO admins (usuario, password_hash) VALUES (?, ?)'
).run('admin', passwordHash);

console.log('  ✓ admin / Admin123*');

console.log('');
console.log('🎉 Seed completado exitosamente');
console.log('');
console.log('Placas de prueba:');
console.log('  • SLY29E - Moto con deuda 2026 ($85.000)');
console.log('  • ABC123 - Carro completamente al día');
console.log('  • XYZ789 - Camioneta con 3 vigencias pendientes');
console.log('  • MOT001 - Moto con deuda 2026 ($172.000)');
console.log('  • WXY456 - Carro con deudas 2025 y 2026');
console.log('');
console.log('Credenciales de admin:');
console.log('  • usuario: admin');
console.log('  • contraseña: Admin123*');
console.log('');
}

// Permite correr directamente: npm run seed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed();
}

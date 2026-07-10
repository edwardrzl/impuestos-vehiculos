import db from '../db.js';

const insertarStmt = db.prepare(`
  INSERT INTO intentos_validacion_traspaso (ciudadano_id, placa, fecha, resultado, razon_rechazo)
  VALUES (@ciudadano_id, @placa, @fecha, @resultado, @razon_rechazo)
`);

const contarDesdeStmt = db.prepare(`
  SELECT COUNT(*) AS total
  FROM intentos_validacion_traspaso
  WHERE ciudadano_id = ? AND placa = ? AND fecha > ?
`);

const ultimoAprobadoStmt = db.prepare(`
  SELECT MAX(fecha) AS fecha
  FROM intentos_validacion_traspaso
  WHERE ciudadano_id = ? AND placa = ? AND resultado = 'aprobado'
`);

export function registrarIntento(datos: {
  ciudadano_id: number;
  placa: string;
  resultado: 'aprobado' | 'rechazado';
  razon_rechazo: string | null;
}): void {
  insertarStmt.run({ ...datos, fecha: new Date().toISOString() });
}

/**
 * Intentos que cuentan contra el límite: los de las últimas 24 h, sin contar
 * los anteriores al último aprobado (completar una solicitud resetea el contador).
 */
export function contarIntentosVigentes(ciudadano_id: number, placa: string): number {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const ultimoAprobado = ultimoAprobadoStmt.get(ciudadano_id, placa) as { fecha: string | null };
  const corte =
    ultimoAprobado.fecha && ultimoAprobado.fecha > hace24h ? ultimoAprobado.fecha : hace24h;

  const { total } = contarDesdeStmt.get(ciudadano_id, placa, corte) as { total: number };
  return total;
}

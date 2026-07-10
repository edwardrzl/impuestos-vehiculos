import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dos niveles arriba desde src/middleware/ llega a backend/uploads/
const uploadsBase = path.join(__dirname, '../../uploads');

function crearAlmacenamiento(subcarpeta: string) {
  return multer.diskStorage({
    destination: path.join(uploadsBase, subcarpeta),
    filename(_req, file, cb) {
      // Timestamp como prefijo para que dos archivos con el mismo nombre original no se sobreescriban.
      const nombre = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      cb(null, nombre);
    },
  });
}

const soloImagenes: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPEG o PNG'));
  }
};

const LIMITE_5MB = 5 * 1024 * 1024;

export const uploadDocumento = multer({
  storage: crearAlmacenamiento('documentos'),
  fileFilter: soloImagenes,
  limits: { fileSize: LIMITE_5MB },
});

// La foto del traspaso va a memoria (no a disco): el nombre final necesita el
// userId autenticado y la placa (que multer no conoce al escribir el archivo),
// y el buffer se envía a Gemini sin re-leer del disco.
const soloImagenesTraspaso: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPEG, PNG o WEBP'));
  }
};

export const uploadTarjetaTraspaso = multer({
  storage: multer.memoryStorage(),
  fileFilter: soloImagenesTraspaso,
  limits: { fileSize: 8 * 1024 * 1024 },
});

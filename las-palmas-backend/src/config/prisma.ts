import { Prisma, PrismaClient } from '@prisma/client';
import { env } from './env';

// SQLite admite un solo escritor a la vez. Con varias conexiones en el pool,
// dos transacciones simultáneas (p. ej. dos PCs abriendo mesas al mismo tiempo)
// pueden chocar con "database is locked". Con una sola conexión, Prisma pone las
// operaciones en cola y las ejecuta en orden: nunca hay dos escrituras a la vez.
// Para tres equipos en una LAN, el costo de rendimiento es despreciable.
// Se agrega aquí (y no en .env) para que la garantía no dependa de que alguien
// edite bien la URL.
function conConexionUnica(url: string): string {
  if (url.includes('connection_limit=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`;
}

// Cliente único de Prisma para toda la app.
export const prisma = new PrismaClient({ datasourceUrl: conConexionUnica(env.databaseUrl) });

// Tipo común para funciones de repositorio: aceptan el cliente normal o el
// cliente de una transacción interactiva (prisma.$transaction(async (tx) => ...)).
export type Db = PrismaClient | Prisma.TransactionClient;

// Opciones para todas las transacciones interactivas del proyecto.
export const OPCIONES_TRANSACCION = { maxWait: 5000, timeout: 10000 } as const;

// SQLite en modo WAL (Write-Ahead Logging): los lectores no se bloquean
// mientras hay una escritura en curso, y las transacciones se recuperan
// de forma consistente si el proceso se corta a mitad de una operación
// (requisito de persistencia ante apagones, HU-49).
//
// Nota: PRAGMA devuelve una fila con el modo resultante, así que hay que
// leerlo con $queryRawUnsafe — $executeRawUnsafe falla en SQLite apenas
// el comando devuelve datos.
export const walListo = prisma
  .$queryRawUnsafe<Array<{ journal_mode: string }>>('PRAGMA journal_mode = WAL;')
  .then((resultado) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`SQLite journal_mode = ${resultado[0]?.journal_mode ?? 'desconocido'}`);
    }
  })
  .catch((error) => {
    console.error('No se pudo activar journal_mode=WAL en SQLite:', error);
  });

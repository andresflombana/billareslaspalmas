import { PrismaClient } from '@prisma/client';

// Cliente único de Prisma para toda la app (evita agotar conexiones
// en desarrollo cuando ts-node-dev recarga el módulo).
export const prisma = new PrismaClient();

// SQLite en modo WAL (Write-Ahead Logging): los lectores no se bloquean
// mientras hay una escritura en curso, y las transacciones se recuperan
// de forma consistente si el proceso se corta a mitad de una operación
// (requisito de persistencia ante apagones, HU-49). Sin esto, SQLite usa
// por defecto un modo más simple que basta para desarrollo pero no es
// el recomendado para el PC de Billar operando todo el día.
//
// Nota: PRAGMA devuelve una fila con el modo resultante, así que hay que
// leerlo con $queryRawUnsafe — $executeRawUnsafe falla en SQLite apenas
// el comando devuelve datos.
prisma
  .$queryRawUnsafe<Array<{ journal_mode: string }>>('PRAGMA journal_mode = WAL;')
  .then((resultado) => {
    console.log(`SQLite journal_mode = ${resultado[0]?.journal_mode ?? 'desconocido'}`);
  })
  .catch((error) => {
    console.error('No se pudo activar journal_mode=WAL en SQLite:', error);
  });

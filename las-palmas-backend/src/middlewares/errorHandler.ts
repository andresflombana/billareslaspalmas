import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/http';

function esJsonMalFormado(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: unknown }).type === 'entity.parse.failed';
}

// Manejador de errores centralizado. Cualquier `next(error)` termina aquí.
// Responde siempre `{ error, code }`: `error` se muestra al usuario, `code` es estable.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (esJsonMalFormado(err)) {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido', code: 'JSON_INVALIDO' });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor', code: 'DUPLICADO' });
  }
  // Error no previsto: se registra completo en la consola del servidor, pero al
  // cliente solo le llega un mensaje genérico (no se filtran detalles internos).
  console.error(err);
  res.status(500).json({ error: 'Error inesperado en el servidor', code: 'ERROR_INTERNO' });
}

// Cualquier ruta que no exista responde JSON (no el HTML por defecto de Express).
export function rutaNoEncontrada(_req: Request, res: Response) {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'RUTA_NO_ENCONTRADA' });
}

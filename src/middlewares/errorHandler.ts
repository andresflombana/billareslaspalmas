import { Request, Response, NextFunction } from 'express';

// Manejador de errores centralizado. Cualquier `next(error)` termina aquí.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Error inesperado';
  res.status(500).json({ error: message });
}

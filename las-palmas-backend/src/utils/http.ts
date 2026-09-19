import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Error de negocio con código HTTP. Los servicios lanzan HttpError y el
 * errorHandler central lo traduce a `{ error, code }` con el status indicado.
 * `code` es estable (el frontend puede decidir por él); `message` es para mostrar.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const solicitudInvalida = (mensaje: string, code = 'SOLICITUD_INVALIDA') => new HttpError(400, mensaje, code);
export const noAutenticado = (mensaje = 'No autenticado', code = 'NO_AUTENTICADO') => new HttpError(401, mensaje, code);
export const noEncontrado = (mensaje: string, code = 'NO_ENCONTRADO') => new HttpError(404, mensaje, code);
export const conflicto = (mensaje: string, code: string) => new HttpError(409, mensaje, code);

/**
 * Express 4 no captura rechazos de promesas: sin esto, un `throw` dentro de un
 * controlador async dejaría la petición colgada. Envuelve y reenvía a next().
 */
export function asyncHandler<R extends Request = Request>(
  fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req as R, res, next).catch(next);
  };
}

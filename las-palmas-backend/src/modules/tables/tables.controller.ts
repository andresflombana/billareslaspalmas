import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Rol } from '../../constants/enums';
import { HttpError } from '../../utils/http';
import { usuarioDe } from '../../utils/request';
import { comoCuerpo, parsearId } from '../../utils/validation';
import * as mesas from './tables.service';

const idMesa = (req: AuthRequest) => parsearId(req.params.id, 'identificador de mesa');

// HU-06. `?incluirInactivas=true` (mesas dadas de baja) solo para Configuración → Administrador.
export async function listar(req: AuthRequest, res: Response) {
  const incluirInactivas = req.query.incluirInactivas === 'true';
  if (incluirInactivas && usuarioDe(req).rol !== Rol.ADMINISTRADOR) {
    throw new HttpError(403, 'No tienes permiso para esta acción', 'SIN_PERMISO');
  }
  res.json(await mesas.listar({ incluirInactivas }));
}

export async function obtener(req: AuthRequest, res: Response) {
  res.json(await mesas.obtener(idMesa(req)));
}

export async function crear(req: AuthRequest, res: Response) {
  res.status(201).json(await mesas.crear(usuarioDe(req).sub, comoCuerpo(req.body)));
}

export async function editar(req: AuthRequest, res: Response) {
  res.json(await mesas.editar(usuarioDe(req).sub, idMesa(req), comoCuerpo(req.body)));
}

// HU-07
export async function abrir(req: AuthRequest, res: Response) {
  res.json(await mesas.abrir(usuarioDe(req).sub, idMesa(req)));
}

export async function anularApertura(req: AuthRequest, res: Response) {
  res.json(await mesas.anularApertura(usuarioDe(req).sub, idMesa(req), comoCuerpo(req.body)));
}

// HU-08
export async function cambiarEstado(req: AuthRequest, res: Response) {
  res.json(await mesas.cambiarEstado(usuarioDe(req).sub, idMesa(req), comoCuerpo(req.body)));
}

export async function cambiarActivacion(req: AuthRequest, res: Response) {
  res.json(await mesas.cambiarActivacion(usuarioDe(req).sub, idMesa(req), comoCuerpo(req.body)));
}

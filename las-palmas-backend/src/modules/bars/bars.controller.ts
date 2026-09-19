import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { usuarioDe } from '../../utils/request';
import { comoCuerpo, parsearId } from '../../utils/validation';
import * as barras from './bars.service';

const idBarra = (req: AuthRequest) => parsearId(req.params.id, 'identificador de barra');
const idCuenta = (req: AuthRequest) => parsearId(req.params.id, 'identificador de cuenta');

export async function listar(_req: AuthRequest, res: Response) {
  res.json(await barras.listar());
}

// HU-16
export async function abrir(req: AuthRequest, res: Response) {
  res.json(await barras.abrir(usuarioDe(req).sub, idBarra(req)));
}

export async function cerrar(req: AuthRequest, res: Response) {
  res.json(await barras.cerrar(usuarioDe(req).sub, idBarra(req)));
}

// HU-17
export async function abrirCuenta(req: AuthRequest, res: Response) {
  res.status(201).json(await barras.abrirCuenta(usuarioDe(req).sub, idBarra(req), comoCuerpo(req.body)));
}

export async function cancelarCuenta(req: AuthRequest, res: Response) {
  res.json(await barras.cancelarCuenta(usuarioDe(req).sub, idCuenta(req)));
}

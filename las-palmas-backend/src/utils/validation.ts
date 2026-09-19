import { solicitudInvalida } from './http';

// Validación de entrada sin dependencias externas. Cada función lanza un
// HttpError 400 con un mensaje en lenguaje del negocio (RNF-01).

export type Cuerpo = Record<string, unknown>;

/** Normaliza el body: cualquier cosa que no sea un objeto plano se trata como `{}`. */
export function comoCuerpo(valor: unknown): Cuerpo {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return {};
  return valor as Cuerpo;
}

/** Recorta y colapsa espacios internos: "  Mesa   3 " → "Mesa 3". */
export function limpiarTexto(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ');
}

/** Forma canónica para comparar nombres sin importar mayúsculas, tildes ni espacios. */
export function normalizarParaComparar(texto: string): string {
  return limpiarTexto(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function parsearId(crudo: string | undefined, que = 'identificador'): number {
  if (!crudo || !/^\d+$/.test(crudo)) throw solicitudInvalida(`El ${que} no es válido`, 'ID_INVALIDO');
  const n = Number(crudo);
  if (!Number.isSafeInteger(n) || n <= 0) throw solicitudInvalida(`El ${que} no es válido`, 'ID_INVALIDO');
  return n;
}

interface OpcionesTexto {
  min?: number;
  max: number;
}

export function textoObligatorio(cuerpo: Cuerpo, campo: string, etiqueta: string, { min = 1, max }: OpcionesTexto): string {
  const valor = cuerpo[campo];
  if (typeof valor !== 'string' || limpiarTexto(valor).length === 0) {
    throw solicitudInvalida(`${etiqueta} es obligatorio`, 'CAMPO_OBLIGATORIO');
  }
  const texto = limpiarTexto(valor);
  if (texto.length < min) throw solicitudInvalida(`${etiqueta} debe tener al menos ${min} caracteres`, 'TEXTO_MUY_CORTO');
  if (texto.length > max) throw solicitudInvalida(`${etiqueta} no puede superar ${max} caracteres`, 'TEXTO_MUY_LARGO');
  return texto;
}

/** Texto opcional: ausente, null o vacío → null. */
export function textoOpcional(cuerpo: Cuerpo, campo: string, etiqueta: string, { max }: { max: number }): string | null {
  const valor = cuerpo[campo];
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') throw solicitudInvalida(`${etiqueta} debe ser texto`, 'TIPO_INVALIDO');
  const texto = limpiarTexto(valor);
  if (texto.length === 0) return null;
  if (texto.length > max) throw solicitudInvalida(`${etiqueta} no puede superar ${max} caracteres`, 'TEXTO_MUY_LARGO');
  return texto;
}

interface OpcionesEntero {
  min: number;
  max: number;
}

export function enteroObligatorio(cuerpo: Cuerpo, campo: string, etiqueta: string, rango: OpcionesEntero): number {
  const valor = cuerpo[campo];
  if (valor === undefined || valor === null || valor === '') {
    throw solicitudInvalida(`${etiqueta} es obligatorio`, 'CAMPO_OBLIGATORIO');
  }
  return validarEntero(valor, etiqueta, rango);
}

/** Entero opcional: ausente, null o "" → null. */
export function enteroOpcional(cuerpo: Cuerpo, campo: string, etiqueta: string, rango: OpcionesEntero): number | null {
  const valor = cuerpo[campo];
  if (valor === undefined || valor === null || valor === '') return null;
  return validarEntero(valor, etiqueta, rango);
}

function validarEntero(valor: unknown, etiqueta: string, { min, max }: OpcionesEntero): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor)) {
    throw solicitudInvalida(`${etiqueta} debe ser un número entero`, 'TIPO_INVALIDO');
  }
  if (valor < min || valor > max) {
    throw solicitudInvalida(`${etiqueta} debe estar entre ${min} y ${max}`, 'FUERA_DE_RANGO');
  }
  return valor;
}

export function booleanoObligatorio(cuerpo: Cuerpo, campo: string, etiqueta: string): boolean {
  const valor = cuerpo[campo];
  if (typeof valor !== 'boolean') throw solicitudInvalida(`${etiqueta} debe ser verdadero o falso`, 'TIPO_INVALIDO');
  return valor;
}

export function unoDe<T extends string>(cuerpo: Cuerpo, campo: string, etiqueta: string, permitidos: readonly T[]): T {
  const valor = cuerpo[campo];
  if (typeof valor !== 'string' || !(permitidos as readonly string[]).includes(valor)) {
    throw solicitudInvalida(`${etiqueta} no es válido. Valores permitidos: ${permitidos.join(', ')}`, 'VALOR_NO_PERMITIDO');
  }
  return valor as T;
}

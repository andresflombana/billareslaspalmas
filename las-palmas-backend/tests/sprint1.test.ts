import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { api, tokens, prepararEntorno, cerrarEntorno, idMesa, idBarra, agregarConsumoDirecto, prisma } from './helpers';

// Pruebas automáticas de Sprint 1 — Mesas y Barra. Se corren con `npm test`.
// Cada bloque indica la historia de usuario (o regla) que verifica.

describe('Sprint 1 — API de Mesas y Barra', () => {
  before(prepararEntorno);
  after(cerrarEntorno);

  // ------------------------------------------------------------------ sesión
  describe('HU-01 — sesión y /auth/me', () => {
    it('login correcto devuelve token y rol', async () => {
      const r = await api('POST', '/auth/login', { cuerpo: { email: 'operador@prueba.com', password: 'operador-prueba' } });
      assert.equal(r.status, 200);
      assert.equal(r.body.usuario.rol, 'OPERADOR');
      assert.ok(typeof r.body.token === 'string' && r.body.token.length > 20);
    });

    it('el correo no distingue mayúsculas ni espacios', async () => {
      const r = await api('POST', '/auth/login', { cuerpo: { email: '  ADMIN@prueba.com ', password: 'admin-prueba' } });
      assert.equal(r.status, 200);
      assert.equal(r.body.usuario.rol, 'ADMINISTRADOR');
    });

    it('credenciales inválidas → 401 con mensaje genérico', async () => {
      const r = await api('POST', '/auth/login', { cuerpo: { email: 'operador@prueba.com', password: 'mala' } });
      assert.equal(r.status, 401);
      assert.equal(r.body.error, 'Correo o contraseña incorrectos');
    });

    it('usuario desactivado no puede iniciar sesión → 403', async () => {
      const r = await api('POST', '/auth/login', { cuerpo: { email: 'inactivo@prueba.com', password: 'operador-prueba' } });
      assert.equal(r.status, 403);
    });

    it('GET /auth/me devuelve el usuario de la sesión (restaurar al refrescar)', async () => {
      const r = await api('GET', '/auth/me', { token: tokens.operador });
      assert.equal(r.status, 200);
      assert.equal(r.body.usuario.email, 'operador@prueba.com');
      assert.equal(r.body.usuario.rol, 'OPERADOR');
    });

    it('GET /auth/me con un usuario que fue desactivado después → 401', async () => {
      await prisma.usuario.update({ where: { email: 'luego@prueba.com' }, data: { activo: false } });
      const r = await api('GET', '/auth/me', { token: tokens.inactivoLuego });
      assert.equal(r.status, 401);
    });

    it('sin token o con token falso → 401', async () => {
      assert.equal((await api('GET', '/tables')).status, 401);
      assert.equal((await api('GET', '/tables', { token: 'no-es-un-token' })).status, 401);
      assert.equal((await api('GET', '/bars')).status, 401);
    });
  });

  // ------------------------------------------------------------------ HU-06
  describe('HU-06 — cuadrícula de mesas', () => {
    it('lista las mesas activas con estado, zona, tarifa y sin sesión', async () => {
      const r = await api('GET', '/tables', { token: tokens.operador });
      assert.equal(r.status, 200);
      assert.equal(r.body.length, 6);
      const m1 = r.body[0];
      assert.equal(m1.nombre, 'Mesa 1');
      assert.equal(m1.estado, 'LIBRE');
      assert.equal(m1.zona, 'Salón principal');
      assert.equal(m1.tarifaPorMinuto, 134);
      assert.equal(m1.activa, true);
      assert.equal(m1.sesion, null);
      assert.equal(m1.startedAt, null);
    });

    it('responde con el header Date (hora del servidor, base para el cronómetro de Sprint 2)', async () => {
      const r = await api('GET', '/tables', { token: tokens.operador });
      assert.ok(r.headers.get('date'));
    });

    it('GET /tables/:id: 404 si no existe, 400 si el id no es válido', async () => {
      assert.equal((await api('GET', '/tables/99999', { token: tokens.operador })).status, 404);
      const r = await api('GET', '/tables/abc', { token: tokens.operador });
      assert.equal(r.status, 400);
      assert.equal(r.body.code, 'ID_INVALIDO');
    });
  });

  // ------------------------------------------------------------------ HU-07
  describe('HU-07 — abrir mesa', () => {
    it('el Operador abre una mesa: OCUPADA, startedAt del servidor, venta con tarifa congelada y auditoría', async () => {
      const id = await idMesa('Mesa 1');
      const antes = Date.now();
      const r = await api('POST', `/tables/${id}/open`, { token: tokens.operador });
      const despues = Date.now();
      assert.equal(r.status, 200);
      assert.equal(r.body.estado, 'OCUPADA');
      const startedAt = new Date(r.body.startedAt).getTime();
      assert.ok(startedAt >= antes - 1000 && startedAt <= despues + 1000, 'startedAt debe ser "ahora" (el tiempo inicia en 0)');
      assert.equal(r.body.sesion.tarifaAplicada, 134);
      assert.equal(r.body.sesion.abiertaPor.nombre, 'Operador Prueba');

      const ventas = await prisma.venta.findMany({ where: { mesaId: id } });
      assert.equal(ventas.length, 1);
      assert.equal(ventas[0].estado, 'ABIERTA');
      assert.equal(ventas[0].origen, 'MESA');
      assert.equal(ventas[0].puntoVenta, 'BILLAR');
      assert.equal(ventas[0].tarifaPorMinutoAplicada, 134);
      assert.equal(ventas[0].fechaApertura.getTime(), startedAt);

      const auditoria = await prisma.auditLog.findFirst({ where: { entidad: 'Mesa', entidadId: id, accion: 'MESA_ABIERTA' } });
      assert.ok(auditoria, 'debe quedar registro de auditoría');
    });

    it('abrir una mesa ya ocupada → 409 MESA_OCUPADA y no crea otra venta', async () => {
      const id = await idMesa('Mesa 1');
      const r = await api('POST', `/tables/${id}/open`, { token: tokens.admin });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'MESA_OCUPADA');
      assert.equal(await prisma.venta.count({ where: { mesaId: id } }), 1);
    });

    it('dos equipos abren la misma mesa a la vez: exactamente uno gana', async () => {
      const id = await idMesa('Mesa 2');
      const [a, b] = await Promise.all([
        api('POST', `/tables/${id}/open`, { token: tokens.operador }),
        api('POST', `/tables/${id}/open`, { token: tokens.admin }),
      ]);
      assert.deepEqual([a.status, b.status].sort(), [200, 409]);
      assert.equal(await prisma.venta.count({ where: { mesaId: id, estado: 'ABIERTA' } }), 1);
    });

    it('la tarifa queda congelada: editar la tarifa de una mesa en juego no cambia su sesión', async () => {
      const id = await idMesa('Mesa 2');
      const r = await api('PUT', `/tables/${id}`, {
        token: tokens.admin,
        cuerpo: { nombre: 'Mesa 2', zona: 'Salón principal', tarifaPorMinuto: 200 },
      });
      assert.equal(r.status, 200);
      assert.equal(r.body.tarifaPorMinuto, 200);
      assert.equal(r.body.sesion.tarifaAplicada, 134);
      const venta = await prisma.venta.findFirstOrThrow({ where: { mesaId: id, estado: 'ABIERTA' } });
      assert.equal(venta.tarifaPorMinutoAplicada, 134);
    });

    it('abrir una mesa inexistente → 404', async () => {
      assert.equal((await api('POST', '/tables/99999/open', { token: tokens.operador })).status, 404);
    });
  });

  // ------------------------------------------------------------------ HU-08
  describe('HU-08 — fuera de servicio y reactivar (solo Administrador)', () => {
    it('el Operador no puede cambiar el estado → 403', async () => {
      const id = await idMesa('Mesa 3');
      const r = await api('PATCH', `/tables/${id}/status`, { token: tokens.operador, cuerpo: { estado: 'FUERA_SERVICIO', motivo: 'Paño roto' } });
      assert.equal(r.status, 403);
    });

    it('poner fuera de servicio exige motivo', async () => {
      const id = await idMesa('Mesa 3');
      const r = await api('PATCH', `/tables/${id}/status`, { token: tokens.admin, cuerpo: { estado: 'FUERA_SERVICIO' } });
      assert.equal(r.status, 400);
    });

    it('solo se aceptan LIBRE y FUERA_SERVICIO como estado manual', async () => {
      const id = await idMesa('Mesa 3');
      for (const estado of ['OCUPADA', 'RESERVADA', 'ROTA']) {
        const r = await api('PATCH', `/tables/${id}/status`, { token: tokens.admin, cuerpo: { estado, motivo: 'x x x' } });
        assert.equal(r.status, 400, `estado ${estado}`);
        assert.equal(r.body.code, 'VALOR_NO_PERMITIDO');
      }
    });

    it('el Admin la pone fuera de servicio con motivo; el motivo se ve en la lista', async () => {
      const id = await idMesa('Mesa 3');
      const r = await api('PATCH', `/tables/${id}/status`, { token: tokens.admin, cuerpo: { estado: 'FUERA_SERVICIO', motivo: 'Paño roto' } });
      assert.equal(r.status, 200);
      assert.equal(r.body.estado, 'FUERA_SERVICIO');
      assert.equal(r.body.motivoFueraServicio, 'Paño roto');
      const lista = await api('GET', '/tables', { token: tokens.operador });
      assert.equal(lista.body.find((m: any) => m.id === id).motivoFueraServicio, 'Paño roto');
    });

    it('una mesa fuera de servicio no se puede abrir → 409', async () => {
      const id = await idMesa('Mesa 3');
      const r = await api('POST', `/tables/${id}/open`, { token: tokens.operador });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'MESA_FUERA_SERVICIO');
    });

    it('el Admin la reactiva: vuelve a LIBRE (HU-08) y queda auditado', async () => {
      const id = await idMesa('Mesa 3');
      const r = await api('PATCH', `/tables/${id}/status`, { token: tokens.admin, cuerpo: { estado: 'LIBRE' } });
      assert.equal(r.status, 200);
      assert.equal(r.body.estado, 'LIBRE');
      assert.equal(r.body.motivoFueraServicio, null);
      assert.ok(await prisma.auditLog.findFirst({ where: { entidadId: id, accion: 'MESA_REACTIVADA' } }));
      const otraVez = await api('PATCH', `/tables/${id}/status`, { token: tokens.admin, cuerpo: { estado: 'LIBRE' } });
      assert.equal(otraVez.status, 409);
      assert.equal(otraVez.body.code, 'MESA_YA_DISPONIBLE');
    });

    it('una mesa en juego no se puede poner fuera de servicio → 409', async () => {
      const id = await idMesa('Mesa 1');
      const r = await api('PATCH', `/tables/${id}/status`, { token: tokens.admin, cuerpo: { estado: 'FUERA_SERVICIO', motivo: 'Prueba' } });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'MESA_OCUPADA');
    });
  });

  // ------------------------------------------------------------------ Anular apertura
  describe('Anular apertura (solo Administrador, con motivo, auditada)', () => {
    it('el Operador no puede anular → 403', async () => {
      const id = await idMesa('Mesa 1');
      const r = await api('POST', `/tables/${id}/cancel-opening`, { token: tokens.operador, cuerpo: { motivo: 'Se abrió por error' } });
      assert.equal(r.status, 403);
    });

    it('sin motivo → 400', async () => {
      const id = await idMesa('Mesa 1');
      assert.equal((await api('POST', `/tables/${id}/cancel-opening`, { token: tokens.admin, cuerpo: {} })).status, 400);
    });

    it('el Admin anula: mesa LIBRE, venta ANULADA y auditoría con el motivo', async () => {
      const id = await idMesa('Mesa 1');
      const venta = await prisma.venta.findFirstOrThrow({ where: { mesaId: id, estado: 'ABIERTA' } });
      const r = await api('POST', `/tables/${id}/cancel-opening`, { token: tokens.admin, cuerpo: { motivo: 'Se abrió la mesa equivocada' } });
      assert.equal(r.status, 200);
      assert.equal(r.body.estado, 'LIBRE');
      assert.equal(r.body.startedAt, null);
      assert.equal(r.body.sesion, null);
      const anulada = await prisma.venta.findUniqueOrThrow({ where: { id: venta.id } });
      assert.equal(anulada.estado, 'ANULADA');
      assert.ok(anulada.fechaCierre);
      const log = await prisma.auditLog.findFirstOrThrow({ where: { entidadId: id, accion: 'MESA_APERTURA_ANULADA' } });
      assert.equal(JSON.parse(log.detalle!).motivo, 'Se abrió la mesa equivocada');
    });

    it('anular una mesa que no está en juego → 409', async () => {
      const id = await idMesa('Mesa 1');
      const r = await api('POST', `/tables/${id}/cancel-opening`, { token: tokens.admin, cuerpo: { motivo: 'Otra vez' } });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'MESA_NO_OCUPADA');
    });

    it('con consumos no se anula, y el ROLLBACK deja todo como estaba', async () => {
      const id = await idMesa('Mesa 4');
      await api('POST', `/tables/${id}/open`, { token: tokens.operador });
      const venta = await prisma.venta.findFirstOrThrow({ where: { mesaId: id, estado: 'ABIERTA' } });
      await agregarConsumoDirecto(venta.id);
      const r = await api('POST', `/tables/${id}/cancel-opening`, { token: tokens.admin, cuerpo: { motivo: 'Intento' } });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'MESA_CON_CONSUMOS');
      const mesa = await prisma.mesa.findUniqueOrThrow({ where: { id } });
      assert.equal(mesa.estado, 'OCUPADA');
      assert.ok(mesa.startedAt);
      assert.equal((await prisma.venta.findUniqueOrThrow({ where: { id: venta.id } })).estado, 'ABIERTA');
    });
  });

  // ------------------------------------------------------------------ CRUD
  describe('CRUD de mesas (Administrador)', () => {
    it('el Operador no puede crear, editar ni ver las dadas de baja → 403', async () => {
      const id = await idMesa('Mesa 5');
      assert.equal((await api('POST', '/tables', { token: tokens.operador, cuerpo: { nombre: 'X', zona: 'Y' } })).status, 403);
      assert.equal(
        (await api('PUT', `/tables/${id}`, { token: tokens.operador, cuerpo: { nombre: 'X', zona: 'Y', tarifaPorMinuto: 1 } })).status,
        403,
      );
      assert.equal((await api('PATCH', `/tables/${id}/active`, { token: tokens.operador, cuerpo: { activa: false } })).status, 403);
      assert.equal((await api('GET', '/tables?incluirInactivas=true', { token: tokens.operador })).status, 403);
    });

    it('crear sin tarifa usa la tarifa por defecto del negocio; orden natural (Mesa 10 después de Mesa 6)', async () => {
      const r = await api('POST', '/tables', { token: tokens.admin, cuerpo: { nombre: '  Mesa   10 ', zona: 'Salón principal' } });
      assert.equal(r.status, 201);
      assert.equal(r.body.nombre, 'Mesa 10');
      assert.equal(r.body.tarifaPorMinuto, 134);
      assert.equal(r.body.estado, 'LIBRE');
      const lista = await api('GET', '/tables', { token: tokens.operador });
      const nombres = lista.body.map((m: any) => m.nombre);
      assert.deepEqual(nombres, ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 10']);
      assert.ok(await prisma.auditLog.findFirst({ where: { entidadId: r.body.id, accion: 'MESA_CREADA' } }));
    });

    it('nombre duplicado (sin importar mayúsculas ni tildes) → 409', async () => {
      const r = await api('POST', '/tables', { token: tokens.admin, cuerpo: { nombre: 'MESA 1', zona: 'Terraza' } });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'NOMBRE_DUPLICADO');
    });

    it('validaciones: nombre vacío, tarifa negativa o como texto → 400; JSON roto → 400', async () => {
      assert.equal((await api('POST', '/tables', { token: tokens.admin, cuerpo: { nombre: '   ', zona: 'A' } })).status, 400);
      assert.equal((await api('POST', '/tables', { token: tokens.admin, cuerpo: { nombre: 'Z1', zona: 'A', tarifaPorMinuto: -5 } })).status, 400);
      assert.equal((await api('POST', '/tables', { token: tokens.admin, cuerpo: { nombre: 'Z1', zona: 'A', tarifaPorMinuto: '134' } })).status, 400);
      assert.equal((await api('POST', '/tables', { token: tokens.admin, cuerpo: { nombre: 'x'.repeat(41), zona: 'A' } })).status, 400);
      const roto = await api('POST', '/tables', { token: tokens.admin, cuerpoCrudo: '{"nombre": ' });
      assert.equal(roto.status, 400);
      assert.equal(roto.body.code, 'JSON_INVALIDO');
    });

    it('editar nombre y zona queda auditado con antes/después', async () => {
      const id = await idMesa('Mesa 6');
      const r = await api('PUT', `/tables/${id}`, { token: tokens.admin, cuerpo: { nombre: 'Mesa 6', zona: 'Terraza', tarifaPorMinuto: 134 } });
      assert.equal(r.status, 200);
      assert.equal(r.body.zona, 'Terraza');
      const log = await prisma.auditLog.findFirstOrThrow({ where: { entidadId: id, accion: 'MESA_EDITADA' } });
      const detalle = JSON.parse(log.detalle!);
      assert.equal(detalle.antes.zona, 'Salón principal');
      assert.equal(detalle.despues.zona, 'Terraza');
    });

    it('dar de baja: no si está en juego; sí si está libre; desaparece de /billar y no se puede abrir', async () => {
      const ocupada = await idMesa('Mesa 2');
      const noSe = await api('PATCH', `/tables/${ocupada}/active`, { token: tokens.admin, cuerpo: { activa: false } });
      assert.equal(noSe.status, 409);
      assert.equal(noSe.body.code, 'MESA_OCUPADA');

      const id = await idMesa('Mesa 5');
      const r = await api('PATCH', `/tables/${id}/active`, { token: tokens.admin, cuerpo: { activa: false, motivo: 'Se vendió' } });
      assert.equal(r.status, 200);
      assert.equal(r.body.activa, false);
      const lista = await api('GET', '/tables', { token: tokens.operador });
      assert.ok(!lista.body.some((m: any) => m.id === id));
      const todas = await api('GET', '/tables?incluirInactivas=true', { token: tokens.admin });
      assert.ok(todas.body.some((m: any) => m.id === id && m.activa === false));
      const abrir = await api('POST', `/tables/${id}/open`, { token: tokens.operador });
      assert.equal(abrir.status, 409);
      assert.equal(abrir.body.code, 'MESA_INACTIVA');
      const estado = await api('PATCH', `/tables/${id}/status`, { token: tokens.admin, cuerpo: { estado: 'FUERA_SERVICIO', motivo: 'xxx' } });
      assert.equal(estado.body.code, 'MESA_INACTIVA');
      const otra = await api('PATCH', `/tables/${id}/active`, { token: tokens.admin, cuerpo: { activa: false } });
      assert.equal(otra.body.code, 'MESA_YA_INACTIVA');
    });

    it('dar de alta la vuelve a mostrar; su historial se conserva', async () => {
      const id = await idMesa('Mesa 5');
      const r = await api('PATCH', `/tables/${id}/active`, { token: tokens.admin, cuerpo: { activa: true } });
      assert.equal(r.status, 200);
      assert.equal(r.body.activa, true);
      const lista = await api('GET', '/tables', { token: tokens.operador });
      assert.ok(lista.body.some((m: any) => m.id === id));
      assert.equal(await prisma.auditLog.count({ where: { entidadId: id, entidad: 'Mesa' } }), 2);
    });
  });

  // ------------------------------------------------------------------ HU-16
  describe('HU-16 — abrir y cerrar cada barra de forma independiente', () => {
    it('ambas barras empiezan cerradas', async () => {
      const r = await api('GET', '/bars', { token: tokens.operador });
      assert.equal(r.status, 200);
      assert.deepEqual(
        r.body.map((b: any) => [b.nombre, b.estado]),
        [
          ['Barra 1', 'CERRADA'],
          ['Barra 2', 'CERRADA'],
        ],
      );
    });

    it('el Operador abre Barra 1 y Barra 2 sigue cerrada', async () => {
      const r = await api('POST', `/bars/${await idBarra('Barra 1')}/open`, { token: tokens.operador });
      assert.equal(r.status, 200);
      assert.equal(r.body.estado, 'ABIERTA');
      const lista = await api('GET', '/bars', { token: tokens.operador });
      assert.equal(lista.body.find((b: any) => b.nombre === 'Barra 2').estado, 'CERRADA');
    });

    it('abrir y cerrar Barra 2 no afecta a Barra 1', async () => {
      const b2 = await idBarra('Barra 2');
      assert.equal((await api('POST', `/bars/${b2}/open`, { token: tokens.operador })).status, 200);
      assert.equal((await api('POST', `/bars/${b2}/close`, { token: tokens.operador })).status, 200);
      const lista = await api('GET', '/bars', { token: tokens.operador });
      assert.equal(lista.body.find((b: any) => b.nombre === 'Barra 1').estado, 'ABIERTA');
      assert.equal(lista.body.find((b: any) => b.nombre === 'Barra 2').estado, 'CERRADA');
    });

    it('abrir una barra abierta o cerrar una cerrada → 409; barra inexistente → 404', async () => {
      const r1 = await api('POST', `/bars/${await idBarra('Barra 1')}/open`, { token: tokens.operador });
      assert.equal(r1.body.code, 'BARRA_YA_ABIERTA');
      const r2 = await api('POST', `/bars/${await idBarra('Barra 2')}/close`, { token: tokens.operador });
      assert.equal(r2.body.code, 'BARRA_YA_CERRADA');
      assert.equal((await api('POST', '/bars/999/open', { token: tokens.operador })).status, 404);
    });
  });

  // ------------------------------------------------------------------ HU-17
  describe('HU-17 — varias cuentas simultáneas en una barra', () => {
    it('no se crean cuentas en una barra cerrada → 409', async () => {
      const r = await api('POST', `/bars/${await idBarra('Barra 2')}/accounts`, { token: tokens.operador, cuerpo: {} });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'BARRA_CERRADA');
    });

    it('tres cuentas abiertas a la vez en Barra 1: todas se crean, cada una con su venta', async () => {
      const b1 = await idBarra('Barra 1');
      const respuestas = await Promise.all([1, 2, 3].map(() => api('POST', `/bars/${b1}/accounts`, { token: tokens.operador, cuerpo: {} })));
      assert.deepEqual(respuestas.map((r) => r.status), [201, 201, 201]);
      const etiquetas = respuestas.map((r) => r.body.etiqueta).sort();
      assert.deepEqual(etiquetas, ['Cuenta 1', 'Cuenta 2', 'Cuenta 3']);
      for (const r of respuestas) {
        const venta = await prisma.venta.findUniqueOrThrow({ where: { id: r.body.ventaId } });
        assert.equal(venta.origen, 'BARRA');
        assert.equal(venta.puntoVenta, 'BILLAR');
        assert.equal(venta.estado, 'ABIERTA');
        assert.equal(venta.cuentaBarraId, r.body.id);
      }
    });

    it('cuenta con nombre libre; repetir el nombre en la misma barra → 409', async () => {
      const b1 = await idBarra('Barra 1');
      const r = await api('POST', `/bars/${b1}/accounts`, { token: tokens.operador, cuerpo: { etiqueta: 'Señor de gorra' } });
      assert.equal(r.status, 201);
      assert.equal(r.body.etiqueta, 'Señor de gorra');
      assert.equal(r.body.abiertaPor.nombre, 'Operador Prueba');
      const dup = await api('POST', `/bars/${b1}/accounts`, { token: tokens.operador, cuerpo: { etiqueta: 'senor de GORRA' } });
      assert.equal(dup.status, 409);
      assert.equal(dup.body.code, 'CUENTA_DUPLICADA');
    });

    it('GET /bars muestra las 4 cuentas abiertas de Barra 1, en orden de apertura', async () => {
      const r = await api('GET', '/bars', { token: tokens.operador });
      const b1 = r.body.find((b: any) => b.nombre === 'Barra 1');
      assert.equal(b1.cuentas.length, 4);
      assert.equal(b1.cuentas[3].etiqueta, 'Señor de gorra');
      assert.equal(r.body.find((b: any) => b.nombre === 'Barra 2').cuentas.length, 0);
    });

    it('no se puede cerrar una barra con cuentas abiertas → 409', async () => {
      const r = await api('POST', `/bars/${await idBarra('Barra 1')}/close`, { token: tokens.operador });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'BARRA_CON_CUENTAS_ABIERTAS');
    });

    it('una cuenta con consumos no se cancela, y el ROLLBACK la deja abierta', async () => {
      const barra = (await api('GET', '/bars', { token: tokens.operador })).body.find((b: any) => b.nombre === 'Barra 1');
      const cuenta = barra.cuentas[0];
      await agregarConsumoDirecto(cuenta.ventaId);
      const r = await api('POST', `/bar-accounts/${cuenta.id}/cancel`, { token: tokens.operador });
      assert.equal(r.status, 409);
      assert.equal(r.body.code, 'CUENTA_CON_CONSUMOS');
      assert.equal((await prisma.cuentaBarra.findUniqueOrThrow({ where: { id: cuenta.id } })).estado, 'ABIERTA');
      // Se limpia el consumo simulado para poder seguir con las pruebas.
      await prisma.itemVenta.deleteMany({ where: { ventaId: cuenta.ventaId } });
    });

    it('cancelar cuentas vacías: CERRADA + venta ANULADA; cancelar dos veces → 409; luego se puede cerrar la barra', async () => {
      const barra = (await api('GET', '/bars', { token: tokens.operador })).body.find((b: any) => b.nombre === 'Barra 1');
      for (const cuenta of barra.cuentas) {
        const r = await api('POST', `/bar-accounts/${cuenta.id}/cancel`, { token: tokens.operador });
        assert.equal(r.status, 200);
        assert.equal(r.body.estado, 'CERRADA');
        assert.ok(r.body.cerradaEn);
        assert.equal((await prisma.venta.findUniqueOrThrow({ where: { id: cuenta.ventaId } })).estado, 'ANULADA');
      }
      const otraVez = await api('POST', `/bar-accounts/${barra.cuentas[0].id}/cancel`, { token: tokens.operador });
      assert.equal(otraVez.body.code, 'CUENTA_YA_CERRADA');
      const cerrar = await api('POST', `/bars/${barra.id}/close`, { token: tokens.operador });
      assert.equal(cerrar.status, 200);
      assert.equal(cerrar.body.estado, 'CERRADA');
    });

    it('al reabrir, la numeración automática vuelve a empezar en "Cuenta 1"', async () => {
      const b1 = await idBarra('Barra 1');
      await api('POST', `/bars/${b1}/open`, { token: tokens.operador });
      const r = await api('POST', `/bars/${b1}/accounts`, { token: tokens.operador, cuerpo: {} });
      assert.equal(r.body.etiqueta, 'Cuenta 1');
    });
  });

  // ------------------------------------------------------------------ varios
  describe('Rutas desconocidas', () => {
    it('responden 404 en JSON', async () => {
      const r = await api('GET', '/no-existe', { token: tokens.admin });
      assert.equal(r.status, 404);
      assert.equal(r.body.code, 'RUTA_NO_ENCONTRADA');
    });
  });
});

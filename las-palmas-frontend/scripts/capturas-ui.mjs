// Prueba de humo de la interfaz + capturas de pantalla (Sprint 1).
// Uso: con el sistema corriendo (iniciar-las-palmas.cmd o `npm run dev` en
// backend y frontend), ejecuta `npm run capturas`.
//
// Recorre las pantallas de Billar como Operador y como Administrador en
// Microsoft Edge / Google Chrome sin ventana (1366×768, la resolución típica de
// un PC de punto de venta), verifica los criterios de aceptación que se pueden
// comprobar desde la pantalla y guarda capturas en ./capturas/. Al final deja
// la base de desarrollo como estaba (anula aperturas, cancela cuentas, cierra
// barras y reactiva mesas que haya tocado).
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(raiz, 'capturas');
const BASE = process.env.LP_URL || 'http://localhost:5173';
const VIEWPORT = { width: 1366, height: 768 };
const USUARIOS = {
  operador: { email: 'operador@laspalmas.com', password: 'operadorlaspalmas' },
  admin: { email: 'admin@laspalmas.com', password: 'adminlaspalmas' },
};

const resultados = [];
function verificar(condicion, descripcion) {
  resultados.push({ ok: Boolean(condicion), descripcion });
  console.log(`${condicion ? '✓' : '✗'} ${descripcion}`);
}

async function lanzarNavegador() {
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  for (const opciones of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
    try {
      return await chromium.launch({ ...opciones, headless: true, args });
    } catch {
      // se intenta el siguiente navegador
    }
  }
  throw new Error('No se encontró Microsoft Edge ni Google Chrome instalados.');
}

async function nuevaSesion(navegador, rol) {
  const contexto = await navegador.newContext({ viewport: VIEWPORT, locale: 'es-CO', timezoneId: 'America/Bogota' });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) errores.push(m.text());
  });
  await pagina.goto(`${BASE}/login`);
  await pagina.fill('input[type="email"]', USUARIOS[rol].email);
  await pagina.fill('input[type="password"]', USUARIOS[rol].password);
  await pagina.click('button:has-text("Ingresar")');
  await pagina.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
  return { contexto, pagina, errores };
}

const captura = (pagina, nombre) => pagina.screenshot({ path: path.join(salida, `${nombre}.png`) });
const tarjeta = (pagina, nombre) => pagina.locator(`article[aria-label="${nombre}"]`);
const tarjetaBarra = (pagina, nombre) => pagina.locator('section[aria-label="Barra"] .card-sticker', { hasText: nombre }).first();

async function api(pagina, metodo, ruta, cuerpo) {
  return pagina.evaluate(
    async ({ metodo, ruta, cuerpo }) => {
      const token = JSON.parse(localStorage.getItem('lp_sesion') || '{}').token;
      const r = await fetch(`/api${ruta}`, {
        method: metodo,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      return { status: r.status, body: await r.json().catch(() => null) };
    },
    { metodo, ruta, cuerpo },
  );
}

function mesaFicticia(id, estado = 'LIBRE') {
  return {
    id: 9000 + id,
    nombre: `Mesa ${id}`,
    zona: 'Salón principal',
    estado,
    tarifaPorMinuto: 134,
    activa: true,
    startedAt: estado === 'OCUPADA' ? new Date().toISOString() : null,
    observaciones: null,
    sesion: estado === 'OCUPADA' ? { ventaId: 1, tarifaAplicada: 134, abiertaPor: { id: 2, nombre: 'Operador' } } : null,
    motivoFueraServicio: estado === 'FUERA_SERVICIO' ? 'Paño roto' : null,
    updatedAt: new Date().toISOString(),
  };
}

/** Deja mesas y barras en su estado base: todo libre, sin cuentas, barras cerradas. */
async function limpiar(pagina) {
  const mesas = (await api(pagina, 'GET', '/tables')).body ?? [];
  for (const m of mesas) {
    if (m.estado === 'OCUPADA') await api(pagina, 'POST', `/tables/${m.id}/cancel-opening`, { motivo: 'Limpieza de la prueba de humo' });
    if (m.estado === 'FUERA_SERVICIO') await api(pagina, 'PATCH', `/tables/${m.id}/status`, { estado: 'LIBRE' });
  }
  const barras = (await api(pagina, 'GET', '/bars')).body ?? [];
  for (const b of barras) {
    for (const c of b.cuentas) await api(pagina, 'POST', `/bar-accounts/${c.id}/cancel`);
    if (b.estado === 'ABIERTA') await api(pagina, 'POST', `/bars/${b.id}/close`);
  }
}

await mkdir(salida, { recursive: true });
const navegador = await lanzarNavegador();
let falloGeneral = null;
let admin;
try {
  // La prueba parte siempre del mismo estado (por si una ejecución anterior se cortó).
  admin = await nuevaSesion(navegador, 'admin');
  await limpiar(admin.pagina);
  // ------------------------------------------------------------ Operador
  const op = await nuevaSesion(navegador, 'operador');
  const p = op.pagina;
  verificar(p.url().endsWith('/billar'), 'HU-01/HU-03: el Operador entra directo a /billar');
  await p.waitForSelector('article');
  await p.waitForTimeout(800);
  await captura(p, '01-billar-operador');

  const sinScroll = await p.evaluate(() => {
    const m = document.querySelector('main main');
    return m ? m.scrollHeight <= m.clientHeight + 1 : false;
  });
  verificar(sinScroll, 'HU-06: 8 mesas caben en 1366×768 sin scroll');
  verificar((await p.locator('canvas').count()) === 0, 'La cuadrícula no monta contextos WebGL');
  const imgOk = await p.evaluate(() => [...document.querySelectorAll('article img')].every((i) => i.complete && i.naturalWidth > 0));
  verificar(imgOk, 'Las ilustraciones WebP cargan en todas las tarjetas');
  const altoImg = await p.evaluate(() => document.querySelector('article img')?.getBoundingClientRect().height ?? 0);
  verificar(altoImg >= 90, `Ilustración con alto útil en la tarjeta (${Math.round(altoImg)} px)`);
  verificar(!(await p.getByText('Acciones de administrador').count()), 'El Operador no ve acciones de administrador');
  const menu = await p.locator('aside nav button').allInnerTexts();
  verificar(menu.length === 3, `HU-03: el menú del Operador tiene 3 módulos (${menu.join(', ')})`);

  // HU-07: abrir mesa con un clic
  await tarjeta(p, 'Mesa 1').getByRole('button', { name: 'Abrir mesa' }).click();
  await tarjeta(p, 'Mesa 1').getByText('En juego').waitFor({ timeout: 10_000 });
  verificar(true, 'HU-07: "Abrir mesa" con un clic la pasa a En juego');
  const dato = await tarjeta(p, 'Mesa 1').innerText();
  verificar(/Desde/.test(dato) && /Operador/.test(dato), 'La tarjeta ocupada muestra la hora de apertura y quién la abrió');
  await p.waitForTimeout(600);
  await captura(p, '02-mesa-abierta');

  // Persistencia de sesión al refrescar
  await p.reload();
  await p.waitForSelector('article');
  verificar(p.url().endsWith('/billar'), 'HU-01: refrescar la página no cierra la sesión');
  verificar(await tarjeta(p, 'Mesa 1').getByText('En juego').isVisible(), 'Tras refrescar, Mesa 1 sigue En juego (dato del servidor)');

  // Detalle con escena 3D viva
  await tarjeta(p, 'Mesa 1').getByRole('button', { name: 'Ver detalle' }).click();
  await p.waitForURL(/\/billar\/\d+$/);
  await p.waitForSelector('canvas', { timeout: 15_000 });
  await p.waitForTimeout(2500);
  verificar((await p.locator('canvas').count()) === 1, 'El detalle monta una sola escena 3D (React Three Fiber)');
  verificar(!(await p.getByText('Acciones de administrador').count()), 'Detalle: el Operador no ve anular/fuera de servicio');
  await captura(p, '03-detalle-ocupada-operador');

  // HU-03: ruta administrativa redirige
  await p.goto(`${BASE}/configuracion`);
  await p.waitForURL(/\/billar$/);
  verificar(true, 'HU-03: /configuracion como Operador redirige a /billar');

  // HU-16 / HU-17: barras y cuentas
  await p.waitForSelector('section[aria-label="Barra"] .card-sticker');
  await tarjetaBarra(p, 'Barra 1').getByRole('button', { name: 'Abrir barra' }).click();
  await tarjetaBarra(p, 'Barra 1').getByRole('button', { name: '+ Nueva cuenta' }).waitFor();
  verificar(await tarjetaBarra(p, 'Barra 2').getByRole('button', { name: 'Abrir barra' }).isVisible(), 'HU-16: abrir Barra 1 no abre Barra 2');
  for (const etiqueta of ['Señor de gorra', '']) {
    await tarjetaBarra(p, 'Barra 1').getByRole('button', { name: '+ Nueva cuenta' }).click();
    const dialogo = p.getByRole('dialog');
    await dialogo.waitFor();
    if (etiqueta) await dialogo.locator('input').fill(etiqueta);
    if (etiqueta) await p.waitForTimeout(300);
    if (etiqueta) await captura(p, '04-nueva-cuenta');
    await dialogo.getByRole('button', { name: 'Abrir cuenta' }).click();
    await dialogo.waitFor({ state: 'detached' });
  }
  await tarjetaBarra(p, 'Barra 1').locator('li', { hasText: 'Cuenta 1' }).waitFor();
  const cuentas = await tarjetaBarra(p, 'Barra 1').locator('li').count();
  verificar(cuentas === 2, `HU-17: Barra 1 tiene 2 cuentas simultáneas (${cuentas})`);
  const cerrarDeshabilitado = await tarjetaBarra(p, 'Barra 1').getByRole('button', { name: 'Cerrar barra' }).isDisabled();
  verificar(cerrarDeshabilitado, 'No se puede cerrar una barra con cuentas abiertas');
  await p.waitForTimeout(500);
  await captura(p, '05-barra-con-cuentas');

  // ------------------------------------------------------------ Administrador
  const a = admin.pagina;
  await a.goto(`${BASE}/`);
  await a.waitForURL((url) => url.pathname !== '/');
  verificar(a.url().endsWith('/panel'), 'HU-01: el Administrador entra al Panel');
  await a.goto(`${BASE}/billar`);
  await a.waitForSelector('article');

  // Fuera de servicio (Mesa 2) y reactivar (HU-08)
  await tarjeta(a, 'Mesa 2').getByRole('button', { name: 'Ver Mesa 2' }).click();
  await a.waitForURL(/\/billar\/\d+$/);
  await a.getByRole('button', { name: 'Poner fuera de servicio' }).click();
  const dlg = a.getByRole('dialog');
  await dlg.waitFor();
  await dlg.locator('textarea').fill('Paño roto en la esquina');
  await a.waitForTimeout(300);
  await captura(a, '06-fuera-de-servicio-modal');
  await dlg.getByRole('button', { name: 'Poner fuera de servicio' }).click();
  await dlg.waitFor({ state: 'detached' });
  await a.getByText('No disponible').first().waitFor();
  await a.waitForTimeout(1500);
  await captura(a, '07-detalle-fuera-de-servicio');
  await a.goto(`${BASE}/billar`);
  await tarjeta(a, 'Mesa 2').getByText('No disponible').waitFor();
  verificar(await tarjeta(a, 'Mesa 2').getByRole('button', { name: 'Reactivar' }).isVisible(), 'HU-08: el Administrador ve "Reactivar"');
  await a.waitForTimeout(600);
  await captura(a, '08-billar-admin');

  // El Operador ve la mesa fuera de servicio, sin "Reactivar"
  await p.goto(`${BASE}/billar`);
  await tarjeta(p, 'Mesa 2').getByText('No disponible').waitFor({ timeout: 20_000 });
  verificar(!(await tarjeta(p, 'Mesa 2').getByRole('button', { name: 'Reactivar' }).count()), 'HU-08: el Operador no ve "Reactivar"');
  verificar((await tarjeta(p, 'Mesa 2').innerText()).includes('Paño roto'), 'El Operador ve el motivo de fuera de servicio');
  await captura(p, '09-billar-operador-fuera-de-servicio');

  await tarjeta(a, 'Mesa 2').getByRole('button', { name: 'Reactivar' }).click();
  await tarjeta(a, 'Mesa 2').getByRole('button', { name: 'Abrir mesa' }).waitFor();
  verificar(true, 'HU-08: reactivar la deja Disponible');

  // Anular apertura de Mesa 1 (solo Administrador, con motivo)
  await tarjeta(a, 'Mesa 1').getByRole('button', { name: 'Ver detalle' }).click();
  await a.waitForURL(/\/billar\/\d+$/);
  await a.waitForSelector('canvas');
  await a.waitForTimeout(1500);
  await captura(a, '10-detalle-ocupada-admin');
  await a.getByRole('button', { name: 'Anular apertura' }).click();
  const dlg2 = a.getByRole('dialog');
  await dlg2.waitFor();
  const confirmar = dlg2.getByRole('button', { name: 'Anular apertura' });
  verificar(await confirmar.isDisabled(), 'Anular apertura exige motivo (botón deshabilitado sin motivo)');
  await dlg2.locator('textarea').fill('Prueba de humo: se abrió por error');
  await a.waitForTimeout(400);
  await captura(a, '11-anular-apertura-modal');
  await confirmar.click();
  await dlg2.waitFor({ state: 'detached' });
  await a.getByRole('button', { name: 'Abrir mesa' }).waitFor();
  verificar(true, 'Anular apertura deja la mesa Disponible');

  // Configuración → Mesas (CRUD)
  await a.goto(`${BASE}/configuracion`);
  await a.locator('main main').getByRole('button', { name: 'Mesas', exact: true }).click();
  await a.getByText('Mesas del billar').waitFor();
  await a.waitForTimeout(400);
  await captura(a, '12-configuracion-mesas');
  await a.getByRole('button', { name: '+ Agregar mesa' }).click();
  await a.getByRole('dialog').waitFor();
  await a.waitForTimeout(300);
  await captura(a, '13-nueva-mesa-modal');
  await a.keyboard.press('Escape');

  // Legibilidad con 4, 10 (límite de HU-06) y 20 mesas (datos simulados solo en el navegador: no toca la base)
  for (const cantidad of [4, 10, 20]) {
    await a.route('**/api/tables', (ruta) =>
      ruta.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          Array.from({ length: cantidad }, (_, i) => mesaFicticia(i + 1, i % 3 === 1 ? 'OCUPADA' : i % 7 === 5 ? 'FUERA_SERVICIO' : 'LIBRE')),
        ),
      }),
    );
    await a.goto(`${BASE}/billar`);
    await a.waitForSelector('article');
    await a.waitForTimeout(800);
    await captura(a, `14-billar-${cantidad}-mesas`);
    const n = await a.locator('article').count();
    verificar(n === cantidad, `Vista legible con ${cantidad} mesas (${n} tarjetas)`);
    if (cantidad <= 10) {
      const sinScrollN = await a.evaluate(() => {
        const cuadricula = document.querySelector('section[aria-label] .grid')?.parentElement;
        const m = document.querySelector('main main');
        return Boolean(m && cuadricula) && m.scrollHeight <= m.clientHeight + 1 && cuadricula.scrollHeight <= cuadricula.clientHeight + 1;
      });
      verificar(sinScrollN, `HU-06: ${cantidad} mesas caben en 1366×768 sin scroll`);
    }
    await a.unroute('**/api/tables');
  }

  const errores = [...op.errores, ...admin.errores];
  verificar(errores.length === 0, `Sin errores de JavaScript en consola${errores.length ? `: ${errores.join(' | ')}` : ''}`);

  await op.contexto.close();
} catch (e) {
  falloGeneral = e;
} finally {
  // Dejar la base de desarrollo como estaba.
  if (admin) await limpiar(admin.pagina).catch(() => {});
  await admin?.contexto.close().catch(() => {});
  await navegador.close();
}

const fallidas = resultados.filter((r) => !r.ok).length;
if (falloGeneral) console.error(`\n✗ La prueba se detuvo: ${falloGeneral instanceof Error ? falloGeneral.message : falloGeneral}`);
console.log(`\n${resultados.length - fallidas}/${resultados.length} verificaciones correctas. Capturas en: ${salida}`);
process.exit(falloGeneral || fallidas ? 1 : 0);

// Genera public/mesas/mesa-{libre,ocupada,fuera-servicio}.webp a partir del
// modelo 3D paramétrico (src/features/billar/modelo/). Uso: npm run export:mesas
//
// 1. Levanta un servidor de Vite temporal (solo en este PC, puerto libre).
// 2. Abre exportar-mesas.html en Microsoft Edge o Google Chrome sin ventana
//    (playwright-core usa el navegador ya instalado: no descarga ninguno).
// 3. La página renderiza las tres variantes y devuelve las WebP; aquí se guardan.
//
// Solo hace falta correrlo si cambia el modelo 3D: las WebP ya vienen generadas.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'public', 'mesas');
const ARCHIVOS = {
  libre: 'mesa-libre.webp',
  ocupada: 'mesa-ocupada.webp',
  fuera_servicio: 'mesa-fuera-servicio.webp',
};

async function lanzarNavegador() {
  // WebGL por software (SwiftShader): funciona igual con o sin tarjeta de video
  // y da siempre el mismo resultado.
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const errores = [];
  for (const opciones of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
    try {
      return await chromium.launch({ ...opciones, headless: true, args });
    } catch (e) {
      errores.push(`- ${opciones.channel ?? 'Chromium de Playwright'}: ${String(e.message).split('\n')[0]}`);
    }
  }
  throw new Error(`No se encontró Microsoft Edge ni Google Chrome instalados.\n${errores.join('\n')}`);
}

const servidor = await createServer({
  root: raiz,
  configFile: path.join(raiz, 'vite.config.ts'),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 5199, strictPort: false },
});
await servidor.listen();
const base = servidor.resolvedUrls?.local[0] ?? 'http://127.0.0.1:5199/';

let navegador;
let fallo = false;
try {
  navegador = await lanzarNavegador();
  const pagina = await navegador.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  pagina.on('pageerror', (e) => console.error('[página]', e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error') console.error('[consola]', m.text());
  });
  await pagina.goto(new URL('exportar-mesas.html', base).href);
  await pagina.waitForFunction(() => window.__mesasListas === true, null, { timeout: 120_000 });
  const imagenes = await pagina.evaluate(() => window.__exportarMesas());

  await mkdir(destino, { recursive: true });
  for (const [estado, archivo] of Object.entries(ARCHIVOS)) {
    const dataUrl = imagenes[estado];
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/webp;base64,')) {
      throw new Error(`La captura de "${estado}" no salió en formato WebP`);
    }
    const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    await writeFile(path.join(destino, archivo), bytes);
    console.log(`✓ public/mesas/${archivo} (${Math.round(bytes.length / 1024)} KB)`);
  }
} catch (e) {
  fallo = true;
  console.error(`\n✗ No se pudieron exportar las ilustraciones:\n${e instanceof Error ? e.message : e}`);
} finally {
  await navegador?.close();
  await servidor.close();
}
process.exit(fallo ? 1 : 0);

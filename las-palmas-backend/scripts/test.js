// Pruebas automáticas del backend (Sprint 1 en adelante). Uso: npm test
//
// 1. Borra y recrea una base SQLite de PRUEBA (prisma/test.db), separada de la
//    de desarrollo (prisma/dev.db): correr las pruebas nunca toca tus datos.
// 2. Le aplica todas las migraciones (igual que en producción).
// 3. Corre tests/sprint1.test.ts contra la API real en un puerto libre.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const env = { ...process.env, DATABASE_URL: 'file:./test.db', NODE_ENV: 'test' };

for (const sufijo of ['', '-wal', '-shm', '-journal']) {
  const archivo = path.join(raiz, 'prisma', `test.db${sufijo}`);
  if (fs.existsSync(archivo)) fs.rmSync(archivo);
}

function correr(args, titulo) {
  const r = spawnSync(process.execPath, args, { cwd: raiz, env, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n✗ Falló: ${titulo}`);
    process.exit(r.status ?? 1);
  }
}

const prismaCli = path.join(raiz, 'node_modules', 'prisma', 'build', 'index.js');
correr([prismaCli, 'migrate', 'deploy'], 'aplicar migraciones a la base de prueba');
correr(['--require', 'ts-node/register/transpile-only', path.join('tests', 'sprint1.test.ts')], 'pruebas automáticas');

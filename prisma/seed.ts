import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';

const prisma = new PrismaClient();

// Seed mínimo de Sprint 0: solo lo necesario para probar HU-01 (login) y
// tener las barras/configuración base. La carga real de datos del negocio
// (productos, mesas reales, usuarios reales) es HU-54, en Sprint 12.
async function main() {
  const adminPassword = await hashPassword('adminlaspalmas');
  const operadorPassword = await hashPassword('operadorlaspalmas');

  await prisma.usuario.upsert({
    where: { email: 'admin@laspalmas.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@laspalmas.com',
      passwordHash: adminPassword,
      rol: 'ADMINISTRADOR',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'operador@laspalmas.com' },
    update: {},
    create: {
      nombre: 'Operador',
      email: 'operador@laspalmas.com',
      passwordHash: operadorPassword,
      rol: 'OPERADOR',
    },
  });

  await prisma.barra.upsert({
    where: { nombre: 'Barra 1' },
    update: {},
    create: { nombre: 'Barra 1' },
  });

  await prisma.barra.upsert({
    where: { nombre: 'Barra 2' },
    update: {},
    create: { nombre: 'Barra 2' },
  });

  await prisma.configuracionNegocio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreNegocio: 'Billares y Licores Las Palmas',
      tarifaPorMinutoDefault: 134,
    },
  });

  console.log('Seed completado: usuarios base, 2 barras y configuración inicial.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

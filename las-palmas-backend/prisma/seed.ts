import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';
import { EstadoMesa, Rol } from '../src/constants/enums';

const prisma = new PrismaClient();

const TARIFA_POR_MINUTO_DEFAULT = 134; // RN-02: $134 COP por minuto

// Seed de desarrollo. La carga real de datos del negocio (productos, mesas
// reales, usuarios reales) es HU-54, en Sprint 12. Todo es upsert: correrlo
// varias veces no duplica nada ni pisa cambios hechos desde la aplicación.
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
      rol: Rol.ADMINISTRADOR,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'operador@laspalmas.com' },
    update: {},
    create: {
      nombre: 'Operador',
      email: 'operador@laspalmas.com',
      passwordHash: operadorPassword,
      rol: Rol.OPERADOR,
    },
  });

  await prisma.barra.upsert({ where: { nombre: 'Barra 1' }, update: {}, create: { nombre: 'Barra 1' } });
  await prisma.barra.upsert({ where: { nombre: 'Barra 2' }, update: {}, create: { nombre: 'Barra 2' } });

  const config = await prisma.configuracionNegocio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreNegocio: 'Billares y Licores Las Palmas',
      tarifaPorMinutoDefault: TARIFA_POR_MINUTO_DEFAULT,
    },
  });

  // Sprint 1: 8 mesas de desarrollo (como el prototipo Rack & Score) para poder
  // probar /billar. Las mesas reales se crean desde Configuración → Mesas o con HU-54.
  for (let n = 1; n <= 8; n += 1) {
    await prisma.mesa.upsert({
      where: { nombre: `Mesa ${n}` },
      update: {},
      create: {
        nombre: `Mesa ${n}`,
        zona: 'Salón principal',
        estado: EstadoMesa.LIBRE,
        tarifaPorMinuto: config.tarifaPorMinutoDefault,
      },
    });
  }

  console.log('Seed completado: usuarios base, 2 barras, configuración inicial y 8 mesas de desarrollo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

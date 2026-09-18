-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mesas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'LIBRE',
    "tarifaPorMinuto" INTEGER NOT NULL,
    "startedAt" DATETIME,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "barras" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CERRADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cuentas_barra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "barraId" INTEGER NOT NULL,
    "etiqueta" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "abiertaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradaEn" DATETIME,
    "observaciones" TEXT,
    CONSTRAINT "cuentas_barra_barraId_fkey" FOREIGN KEY ("barraId") REFERENCES "barras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "productos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precioInterno" INTEGER NOT NULL,
    "precioExterno" INTEGER NOT NULL,
    "costo" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "codigoBarras" TEXT,
    "imagenUrl" TEXT,
    "colorToken" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "ventaId" INTEGER,
    "obsequioId" INTEGER,
    "usuarioId" INTEGER,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimientos_inventario_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_inventario_obsequioId_fkey" FOREIGN KEY ("obsequioId") REFERENCES "obsequios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "origen" TEXT NOT NULL,
    "puntoVenta" TEXT NOT NULL,
    "mesaId" INTEGER,
    "cuentaBarraId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "tarifaPorMinutoAplicada" INTEGER,
    "subtotalProductos" INTEGER NOT NULL DEFAULT 0,
    "subtotalTiempo" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "formaPago" TEXT,
    "fechaApertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ventas_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ventas_cuentaBarraId_fkey" FOREIGN KEY ("cuentaBarraId") REFERENCES "cuentas_barra" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ventas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items_venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ventaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "precioEditado" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "items_venta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "items_venta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "obsequios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "observacion" TEXT,
    "origen" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "obsequios_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "obsequios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cajas_punto_venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "puntoVenta" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CERRADA',
    "baseApertura" INTEGER NOT NULL DEFAULT 0,
    "fechaApertura" DATETIME,
    "fechaCierre" DATETIME,
    "totalContado" INTEGER,
    "diferencia" INTEGER,
    "usuarioAperturaId" INTEGER,
    "usuarioCierreId" INTEGER,
    CONSTRAINT "cajas_punto_venta_usuarioAperturaId_fkey" FOREIGN KEY ("usuarioAperturaId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cajas_punto_venta_usuarioCierreId_fkey" FOREIGN KEY ("usuarioCierreId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cajaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "ventaId" INTEGER,
    "gastoId" INTEGER,
    "hora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_caja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas_punto_venta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimientos_caja_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_caja_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "gastos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "observaciones" TEXT,
    CONSTRAINT "gastos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracion_negocio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nombreNegocio" TEXT NOT NULL,
    "tarifaPorMinutoDefault" INTEGER NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_nombre_key" ON "mesas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "barras_nombre_key" ON "barras"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigoBarras_key" ON "productos"("codigoBarras");

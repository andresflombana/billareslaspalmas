import express from 'express';
import cors from 'cors';
import { authRouter } from './modules/auth/auth.routes';
import { tablesRouter } from './modules/tables/tables.routes';
import { barsRouter, barAccountsRouter } from './modules/bars/bars.routes';
import { errorHandler, rutaNoEncontrada } from './middlewares/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter); //                    Sprint 0 — HU-01 (+ /auth/me en Sprint 1)
app.use('/tables', tablesRouter); //                Sprint 1 — Mesas (HU-06, HU-07, HU-08, CRUD)
app.use('/bars', barsRouter); //                    Sprint 1 — Barra (HU-16, HU-17)
app.use('/bar-accounts', barAccountsRouter); //     Sprint 1 — Cuentas de barra

// Módulos de los siguientes sprints, todos protegidos con requireAuth (y requireRole donde aplique):
//
// app.use('/table-items', ...);       // Sprint 3 — Pedidos y consumo
// app.use('/products', ...);          // Sprint 4 — Catálogo e inventario
// app.use('/sales', ...);             // Sprint 5 — Ventas
// app.use('/gifts', ...);             // Sprint 6 — Obsequios
// app.use('/cash-registers', ...);    // Sprint 7 — Caja
// app.use('/reports', ...);           // Sprint 8 — Reportes
// app.use('/users', ...);             // Sprint 9 — Usuarios (solo ADMINISTRADOR)

app.use(rutaNoEncontrada);
app.use(errorHandler);

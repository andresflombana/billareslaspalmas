import express from 'express';
import cors from 'cors';
import { authRouter } from './modules/auth/auth.routes';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);

// A partir de aquí se conectan los módulos de los siguientes sprints,
// todos protegidos con requireAuth (y requireRole donde aplique):
//
// app.use('/tables', requireAuth, tablesRouter);          // Sprint 1 — Mesas y Barra
// app.use('/products', requireAuth, productsRouter);      // Sprint 4 — Catálogo e inventario
// app.use('/sales', requireAuth, salesRouter);             // Sprint 5 — Ventas
// app.use('/gifts', requireAuth, giftsRouter);             // Sprint 6 — Obsequios
// app.use('/cash-registers', requireAuth, cashRouter);     // Sprint 7 — Caja
// app.use('/reports', requireAuth, reportsRouter);         // Sprint 8 — Reportes
// app.use('/users', requireAuth, requireRole('ADMINISTRADOR'), usersRouter); // Sprint 9

app.use(errorHandler);

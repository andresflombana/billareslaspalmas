# Las Palmas — Sprint 1 (Mesas y Barra)

Dos proyectos en esta carpeta:

- `las-palmas-backend/` — API (Node + Express + Prisma + SQLite). Ver su `README.md`.
- `las-palmas-frontend/` — aplicación web (React + Vite). Ver su `README.md`.

Atajos para Windows (doble clic; solo trabajan dentro de esta carpeta):

| Archivo | Qué hace |
|---|---|
| `verificar-sprint1.cmd` | Primera vez / verificación completa: instala dependencias, aplica migraciones, carga el seed, verifica tipos, compila, corre las 47 pruebas del backend, regenera las WebP de las mesas y compila el frontend. Deja un `.log` por paso y `verificacion\resumen.txt` (todos los pasos deben quedar en `0`). |
| `iniciar-las-palmas.cmd` | Arranca el sistema: abre una ventana con la API (`:4000`) y otra con el frontend (`http://localhost:5173`). Para detenerlo, cierra esas dos ventanas. |
| `capturas-ui.cmd` | Con el sistema corriendo: prueba de humo de la interfaz (30 verificaciones) y capturas en `las-palmas-frontend\capturas`. Resultado en `verificacion\f12-capturas.log`. |

Ambos proyectos ya traen su `.env` listo: no hay nada que editar.
El estado del proyecto, las decisiones y el checklist del sprint están en `ESTADO_PROYECTO.md`.

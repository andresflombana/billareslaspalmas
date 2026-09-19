@echo off
rem ==========================================================================
rem  Las Palmas - arranca el sistema en modo desarrollo en este PC:
rem    - backend  (API)       http://localhost:4000
rem    - frontend (pantallas) http://localhost:5173
rem  Cada uno abre su propia ventana. Para detenerlos, cierra esas ventanas.
rem  (Requiere haber corrido antes npm install, migraciones y seed: ver README.)
rem ==========================================================================
set "RAIZ=%~dp0"
if not exist "%RAIZ%las-palmas-backend\.env" copy "%RAIZ%las-palmas-backend\.env.example" "%RAIZ%las-palmas-backend\.env" >nul
if not exist "%RAIZ%las-palmas-frontend\.env" copy "%RAIZ%las-palmas-frontend\.env.example" "%RAIZ%las-palmas-frontend\.env" >nul
start "Las Palmas - backend (API :4000)" /d "%RAIZ%las-palmas-backend" cmd /k npm run dev
start "Las Palmas - frontend (:5173)" /d "%RAIZ%las-palmas-frontend" cmd /k npm run dev

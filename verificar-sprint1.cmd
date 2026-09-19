@echo off
rem ==========================================================================
rem  Las Palmas - Sprint 1: instalacion y verificacion completa.
rem  Solo trabaja dentro de esta carpeta (SPRINT 1). Deja los resultados en
rem  la carpeta "verificacion" (un .log por paso y un resumen.txt).
rem ==========================================================================
setlocal
chcp 65001 >nul
set "RAIZ=%~dp0"
set "LOGS=%RAIZ%verificacion"
if not exist "%LOGS%" mkdir "%LOGS%"
set "RESUMEN=%LOGS%\resumen.txt"

echo Verificacion Sprint 1 - %date% %time% > "%RESUMEN%"
for /f "delims=" %%v in ('node -v') do echo node %%v >> "%RESUMEN%"
for /f "delims=" %%v in ('npm -v') do echo npm %%v >> "%RESUMEN%"

echo.
echo === BACKEND ===
cd /d "%RAIZ%las-palmas-backend"
if not exist ".env" copy ".env.example" ".env" >nul

echo [1/11] npm install (backend)...
call npm install > "%LOGS%\b01-npm-install.log" 2>&1
echo b01-npm-install: %errorlevel% >> "%RESUMEN%"

echo [2/11] migraciones...
call npx prisma migrate deploy > "%LOGS%\b02-migrate-deploy.log" 2>&1
echo b02-migrate-deploy: %errorlevel% >> "%RESUMEN%"

echo [3/11] base de datos igual al schema...
call npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code > "%LOGS%\b03-migrate-diff.log" 2>&1
echo b03-migrate-diff: %errorlevel% >> "%RESUMEN%"

echo [4/11] seed...
call npx prisma db seed > "%LOGS%\b04-seed.log" 2>&1
echo b04-seed: %errorlevel% >> "%RESUMEN%"

echo [5/11] typecheck (backend + pruebas)...
call npm run typecheck > "%LOGS%\b05-typecheck.log" 2>&1
echo b05-typecheck: %errorlevel% >> "%RESUMEN%"

echo [6/11] build (backend)...
call npm run build > "%LOGS%\b06-build.log" 2>&1
echo b06-build: %errorlevel% >> "%RESUMEN%"

echo [7/11] pruebas automaticas (backend)...
call npm test > "%LOGS%\b07-test.log" 2>&1
echo b07-test: %errorlevel% >> "%RESUMEN%"

echo.
echo === FRONTEND ===
cd /d "%RAIZ%las-palmas-frontend"
if not exist ".env" copy ".env.example" ".env" >nul

echo [8/11] npm install (frontend)...
call npm install > "%LOGS%\f08-npm-install.log" 2>&1
echo f08-npm-install: %errorlevel% >> "%RESUMEN%"

echo [9/11] typecheck (frontend)...
call npm run typecheck > "%LOGS%\f09-typecheck.log" 2>&1
echo f09-typecheck: %errorlevel% >> "%RESUMEN%"

echo [10/11] exportar ilustraciones WebP de las mesas...
call npm run export:mesas > "%LOGS%\f10-export-mesas.log" 2>&1
echo f10-export-mesas: %errorlevel% >> "%RESUMEN%"

echo [11/11] build (frontend)...
call npm run build > "%LOGS%\f11-build.log" 2>&1
echo f11-build: %errorlevel% >> "%RESUMEN%"

echo FIN %date% %time% >> "%RESUMEN%"
echo.
echo Listo. Resultados en: %LOGS%
type "%RESUMEN%"
endlocal

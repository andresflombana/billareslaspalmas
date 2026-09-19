@echo off
rem Prueba de humo de la interfaz + capturas (requiere el sistema corriendo).
chcp 65001 >nul
set "RAIZ=%~dp0"
if not exist "%RAIZ%verificacion" mkdir "%RAIZ%verificacion"
cd /d "%RAIZ%las-palmas-frontend"
call npm run capturas > "%RAIZ%verificacion\f12-capturas.log" 2>&1
echo f12-capturas: %errorlevel% >> "%RAIZ%verificacion\resumen.txt"

@echo off
rem Re-verificacion del frontend (typecheck + build + prueba de humo con capturas).
chcp 65001 >nul
set "RAIZ=%~dp0..\"
set "LOGS=%~dp0"
cd /d "%RAIZ%las-palmas-frontend"
call npm run typecheck > "%LOGS%r1-typecheck.log" 2>&1
echo r1-typecheck: %errorlevel% > "%LOGS%resumen-frontend.txt"
call npm run build > "%LOGS%r2-build.log" 2>&1
echo r2-build: %errorlevel% >> "%LOGS%resumen-frontend.txt"
call npm run capturas > "%LOGS%r3-capturas.log" 2>&1
echo r3-capturas: %errorlevel% >> "%LOGS%resumen-frontend.txt"
echo FIN >> "%LOGS%resumen-frontend.txt"

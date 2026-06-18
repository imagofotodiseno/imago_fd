@echo off
REM Script para instalar dependencias e iniciar servidor
REM Ejecución: run-development.bat

echo.
echo ===================================
echo CRM IMAGO - Instalación y Setup
echo ===================================
echo.

REM Ir a carpeta backend
echo [1/4] Instalando dependencias del backend...
cd src-backend
call npm install
if errorlevel 1 (
    echo Error instalando backend
    exit /b 1
)

REM Inicializar base de datos
echo.
echo [2/4] Inicializando base de datos...
call npm run init-db
if errorlevel 1 (
    echo Error inicializando base de datos
    exit /b 1
)

REM Ir a carpeta frontend
echo.
echo [3/4] Instalando dependencias del frontend...
cd ..\src-frontend
call npm install
if errorlevel 1 (
    echo Error instalando frontend
    exit /b 1
)

echo.
echo [4/4] Setup completado!
echo.
echo ===================================
echo Para iniciar desarrollo:
echo ===================================
echo Terminal 1 (Backend):
echo   cd src-backend
echo   npm run dev
echo.
echo Terminal 2 (Frontend):
echo   cd src-frontend
echo   npm run dev
echo.
echo Frontend disponible en: http://localhost:5173
echo Backend disponible en: http://localhost:3001
echo.
pause

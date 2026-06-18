#!/bin/bash

# Script para instalar dependencias e iniciar servidor
# Ejecución: bash run-development.sh

echo ""
echo "==================================="
echo "CRM IMAGO - Instalación y Setup"
echo "==================================="
echo ""

# Ir a carpeta backend
echo "[1/4] Instalando dependencias del backend..."
cd src-backend
npm install
if [ $? -ne 0 ]; then
    echo "Error instalando backend"
    exit 1
fi

# Inicializar base de datos
echo ""
echo "[2/4] Inicializando base de datos..."
npm run init-db
if [ $? -ne 0 ]; then
    echo "Error inicializando base de datos"
    exit 1
fi

# Ir a carpeta frontend
echo ""
echo "[3/4] Instalando dependencias del frontend..."
cd ../src-frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error instalando frontend"
    exit 1
fi

echo ""
echo "[4/4] Setup completado!"
echo ""
echo "==================================="
echo "Para iniciar desarrollo:"
echo "==================================="
echo "Terminal 1 (Backend):"
echo "  cd src-backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd src-frontend"
echo "  npm run dev"
echo ""
echo "Frontend disponible en: http://localhost:5173"
echo "Backend disponible en: http://localhost:3001"
echo ""

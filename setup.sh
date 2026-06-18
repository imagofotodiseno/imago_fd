#!/usr/bin/env bash
set -e

echo "Instalando dependencias de la raíz..."
npm install

echo "Instalando dependencias del backend..."
cd src-backend
npm install

echo "Inicializando base de datos SQLite..."
npm run init-db

echo "Instalando dependencias del frontend..."
cd ../src-frontend
npm install

cat <<'EOF'
Listo.
Arrancar backend: cd src-backend && npm run dev
Arrancar frontend: cd src-frontend && npm run dev
EOF

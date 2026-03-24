#!/bin/bash

echo "🚀 Iniciando sistema completo..."

# GETH
gnome-terminal -- bash -c "
echo '=== GETH NODE ===';
cd $(pwd);
./start_geth.sh;
exec bash
"

# Esperar un poco para que geth levante
sleep 6

# BACKEND
gnome-terminal -- bash -c "
echo '=== BACKEND ===';
cd $(pwd);
source venv/bin/activate;
python app.py;
exec bash
"

# FRONTEND
gnome-terminal -- bash -c "
echo '=== FRONTEND ===';
cd $(pwd)/sibive-frontend;
npm run dev;
exec bash
"

echo "✅ Sistema iniciado:"
echo "- Geth (8545)"
echo "- Backend (5000)"
echo "- Frontend (3000)"
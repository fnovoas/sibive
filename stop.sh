#!/bin/bash

echo "Deteniendo todos los servicios..."

# Flask
fuser -k 5000/tcp

# Next.js
fuser -k 3000/tcp

# Geth
fuser -k 8545/tcp

# Extra (por si acaso)
pkill -f geth

echo "Todo detenido."
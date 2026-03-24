#!/bin/sh

echo "Inicializando genesis..."

geth --datadir /geth/data init /geth/genesis.json

echo "Iniciando geth..."

exec geth \
  --datadir /geth/data \
  --networkid 23422 \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.corsdomain "*" \
  --http.vhosts "*" \
  --http.api admin,eth,net,web3,clique,personal,miner \
  --unlock 0xe56826bf376b8df2d82119efbdbbbe70e031cca9 \
  --password /geth/password.txt \
  --allow-insecure-unlock \
  --miner.etherbase 0xe56826bf376b8df2d82119efbdbbbe70e031cca9 \
  --nodiscover
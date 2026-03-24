FROM ethereum/client-go:v1.13.15
# Nótese que no estamos usando la versión más reciente de Geth
# Todo nos ha funcionado únicamente con esta.

WORKDIR /geth

# Copiar archivos (genesis.json, data, etc.)
COPY . .

RUN chmod +x start_geth_node.sh

ENTRYPOINT ["./start_geth_node.sh"]

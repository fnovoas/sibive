# **Sistema Blockchain para Inspección de Vehículos (SiBIVe)**

Laboratorio de blockchain de Ciberseguridad (2026-1) por fnovoas.  
Este proyecto implementa una DApp para el registro y seguimiento de inspecciones vehiculares utilizando una blockchain privada basada en Ethereum (Geth).  

Incluye:

* Smart contract en Solidity.
* Nodo Ethereum privado (Geth).
* Backend en Flask (Web3.py).
* Frontend en Next.js.
* Contenedores Docker.

La dirección de la cuenta de prueba a usar actualmente es `0xe56826bf376b8df2d82119efbdbbbe70e031cca9`, y su clave es `b8f4e975d61ca406d2f04cbc709f822a7328cd59b3d2e8389a2e7d11428aefdf`, la cual conocemos gracias al script `extract_key.py`.

## Arquitectura

Frontend (Next.js) → Backend (Flask) → Blockchain (Geth)

## Ejecución rápida (DApp)
Tener listo Remix y MetaMask. Clonar el repositorio a local y pararse en la carpeta.  

```bash
docker-compose up --build
```

* Frontend: http://localhost:3000
* Backend: http://localhost:5000

En otra terminal:  
```bash
sudo docker exec -it sibive_geth_1 geth attach /geth/data/geth.ipc
```

```bash
miner.start()
```

Y ya podemos usar la aplicación. Para terminar:  

```bash
exit
```

## Configuración Blockchain (manual)

### 1. Iniciar nodo Geth

```bash
./start_geth.sh
```

En consola:  
Ingresar la contraseña `123`.  

```javascript
miner.start()
```
Para que empiece a minar continuamente y dejarlo así.  
También podemos verificar que la cuenta tenga saldo con `eth.getBalance("DIRECCIÓN_DE_CUENTA")`, e ingresar repetidamente `eth.blockNumber` para verificar que la cantidad de bloques minados está aumentando constantemente después de haber empezado la minería.  

### 2. Importar cuenta en MetaMask

* Abrir MetaMask (usé la extensión para Firefox en Ubuntu).  
* Importar cuenta pegando su respectivo private key en texto plano. Para obtener la private key de una cuenta dada, usa el script `extract_key.py`.  
* Configurar red (agregar red presonalizada):

```
RPC URL: http://127.0.0.1:8545
Chain ID: 12345
Symbol: ETH
```

### 3. Desplegar contrato (Remix)

* Abrir https://remix.ethereum.org  
* Crear ahí el contrato `VehicleInspection.sol` (pegar el contenido del que está aquí).  
* Compilar contrato (ver que la versión del compilador corresponda con la del contrato (0.8.0)).  
* En Deploy & run transactions, en Environment seleccionar:  
  → Injected Provider (MetaMask)
* Deploy

### 4. Copiar datos del contrato

Actualizar manualmente estos archivos:

* `sibive-backend/contract.py`: en Remix, Deployed Contracts (1), copiamos la dirección del contrato desplegado y la pegamos en la línea donde está la variable `contract_address`.  
* `abi.json`: en Remix, Solidity compiler, Compilation Details, copiamos ABI y lo pegamos todo en este archivo.

> En una red privada local de laboratorio con Geth es aceptable tener la dirección del contrato y el ABI “quemados” en el código fuente, porque no representan información sensible ni implican riesgos de seguridad reales. Son datos públicos por naturaleza en la blockchain: cualquier participante de la red puede consultarlos sin restricciones. El entorno es controlado y efímero (se reinicia con frecuencia, no está expuesto a internet y no maneja valor económico real), por lo que no existe un incentivo para ataques.  

## Flujo de uso

1. Registrar vehículo.  
2. Registrar inspección.  
3. Consultar historial de inspecciones.  

## Notas

* Es necesario que Geth esté minando (haber ejecutado `miner.start()`) para procesar transacciones, si no, las transacciones quedan en `pending...`.
* MetaMask puede requerir reinicio si no detecta el balance (los 1000 ETH que asignamos desde el `genesis.json`). Puede hacer falta eliminar y volver a crear la cuenta y la red en MetaMask varias veces.  
* Se excluye el directorio `geth-node/data/` mediante .dockerignore para evitar problemas de permisos y reducir el tamaño del contexto de construcción, ya que este contiene datos persistentes de la blockchain que no deben formar parte de la imagen.  

## Posibles mejoras futuras

* Automatizar despliegue del contrato (sin Remix).
* Reemplazar MetaMask por gestión interna de claves.
* Integrar Hardhat o Truffle.
* Dashboard visual avanzado.
import os
import json
import time
from web3 import Web3
from web3.middleware import geth_poa_middleware
from logger import logger

GETH_URL = os.environ.get("GETH_URL", "http://geth:8545")
CONTRACT_INFO_PATH = os.environ.get("CONTRACT_INFO_PATH", "contract_info.json")
PRIVATE_KEY = "0xb8f4e975d61ca406d2f04cbc709f822a7328cd59b3d2e8389a2e7d11428aefdf"


def _connect():
    w3 = Web3(Web3.HTTPProvider(GETH_URL))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    return w3


def _wait_for_geth(w3, timeout=120):
    deadline = time.time() + timeout

    while time.time() < deadline:
        if w3.is_connected():
            return
        time.sleep(2)

    raise RuntimeError("No se pudo conectar a Geth")


def _wait_for_mining(w3, timeout=120):
    start_block = w3.eth.block_number
    deadline = time.time() + timeout

    while time.time() < deadline:
        if w3.eth.block_number > start_block:
            return
        time.sleep(1)

    raise RuntimeError(
        "Geth no está minando. Ejecuta 'make mine' antes de iniciar el backend."
    )


def _contract_is_deployed(w3, address):
    if not address:
        return False

    code = w3.eth.get_code(Web3.to_checksum_address(address))
    return code not in (b"", b"0x", "0x")


def _estimate_gas(w3, tx_params, fallback):
    try:
        gas = w3.eth.estimate_gas(tx_params)
        return int(gas * 1.3)
    except Exception as e:
        logger.warning("No se pudo estimar gas (%s). Usando %s.", e, fallback)
        return fallback


def deploy_contract():
    w3 = _connect()
    logger.info("Esperando a que Geth esté disponible...")
    _wait_for_geth(w3)
    logger.info("Conectado a Geth.")

    if os.path.exists(CONTRACT_INFO_PATH):
        with open(CONTRACT_INFO_PATH) as f:
            info = json.load(f)

        if _contract_is_deployed(w3, info.get("address")):
            logger.info(
                "Contrato existente encontrado en %s. Omitiendo despliegue.",
                info["address"],
            )
            return info["address"]

        logger.warning(
            "contract_info.json existe pero el contrato no está en la cadena. "
            "Desplegando uno nuevo..."
        )

    logger.info("Esperando a que Geth empiece a minar...")
    _wait_for_mining(w3)

    account = w3.eth.account.from_key(PRIVATE_KEY)

    logger.info("Cargando VehicleInspection precompilado...")
    with open("bytecode.txt", "r") as f:
        bytecode = f.read().strip()

    with open("abi.json", "r") as f:
        abi = json.load(f)

    VehicleInspection = w3.eth.contract(abi=abi, bytecode=bytecode)

    deploy_tx = VehicleInspection.constructor().build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 8000000,
        "gasPrice": w3.eth.gas_price,
        "chainId": 12345,
    })
    deploy_tx["gas"] = _estimate_gas(w3, deploy_tx, fallback=8000000)

    signed_tx = w3.eth.account.sign_transaction(deploy_tx, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

    logger.info("Transacción enviada: %s. Esperando confirmación...", tx_hash.hex())
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

    if tx_receipt.status != 1:
        raise RuntimeError(
            "El despliegue del contrato falló "
            f"(hash: {tx_hash.hex()}, gas usado: {tx_receipt.gasUsed})"
        )

    contract_address = tx_receipt.contractAddress
    logger.info("Contrato desplegado en: %s", contract_address)

    os.makedirs(os.path.dirname(CONTRACT_INFO_PATH) or ".", exist_ok=True)
    with open(CONTRACT_INFO_PATH, "w") as f:
        json.dump({
            "address": contract_address,
            "abi": abi,
        }, f)

    logger.info("Guardado %s.", CONTRACT_INFO_PATH)
    return contract_address


if __name__ == "__main__":
    deploy_contract()

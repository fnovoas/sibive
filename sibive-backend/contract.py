from web3 import Web3
from web3.middleware import geth_poa_middleware
import json
import os
import threading
import time
from logger import logger

CONTRACT_INFO_PATH = os.environ.get("CONTRACT_INFO_PATH", "contract_info.json")
GETH_URL = os.environ.get("GETH_URL", "http://geth:8545")
PRIVATE_KEY = "0xb8f4e975d61ca406d2f04cbc709f822a7328cd59b3d2e8389a2e7d11428aefdf"

w3 = Web3(Web3.HTTPProvider(GETH_URL))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

if not w3.is_connected():
    raise Exception("No se pudo conectar a Geth")

if not os.path.exists(CONTRACT_INFO_PATH):
    raise Exception(
        f"No se encontró {CONTRACT_INFO_PATH}. "
        "Asegúrate de que el contrato esté desplegado."
    )

with open(CONTRACT_INFO_PATH) as f:
    info = json.load(f)

contract = w3.eth.contract(address=info["address"], abi=info["abi"])
account = w3.eth.account.from_key(PRIVATE_KEY)

_tx_lock = threading.Lock()


class ContractError(Exception):
    pass


def _wait_for_mining(timeout=120):
    start_block = w3.eth.block_number
    deadline = time.time() + timeout

    while time.time() < deadline:
        if w3.eth.block_number > start_block:
            return
        time.sleep(1)

    raise ContractError(
        "Geth no está minando. Ejecute 'make mine' antes de usar la aplicación."
    )


def _next_nonce():
    return w3.eth.get_transaction_count(account.address, "pending")


def _contract_error_from_message(message):
    text = str(message)

    if "Vehiculo ya existe" in text:
        return ContractError("El vehículo ya está registrado en la blockchain.")
    if "Vehiculo no existe" in text:
        return ContractError("El vehículo no está registrado. Regístrelo primero.")
    if "Formato invalido" in text:
        return ContractError("Placa inválida. Use el formato AAA000.")
    if "Opacidad no registrada para gasolina" in text:
        return ContractError("Vehículo de gasolina: no se registra opacidad.")
    if "CO no registrado para diésel" in text:
        return ContractError("Vehículo diésel: no se registra CO.")
    if "HC no registrado para diésel" in text:
        return ContractError("Vehículo diésel: no se registra HC.")
    if "CO invalido" in text:
        return ContractError("CO inválido. Rango permitido: 0-1000.")
    if "HC invalido" in text:
        return ContractError("HC inválido. Rango permitido: 0-2000.")
    if "Opacidad invalida" in text:
        return ContractError("Opacidad inválida. Rango permitido: 0-10000.")
    if "nonce too low" in text:
        return ContractError(
            "Conflicto de nonce en la blockchain. Espere unos segundos e intente de nuevo."
        )

    return None


def _raise_if_contract_error(exc):
    parsed = _contract_error_from_message(exc)
    if parsed:
        raise parsed


def _estimate_gas(tx_params, fallback):
    try:
        gas = w3.eth.estimate_gas(tx_params)
        return int(gas * 1.3)
    except Exception as e:
        _raise_if_contract_error(e)
        logger.warning("No se pudo estimar gas (%s). Usando %s.", e, fallback)
        return fallback


def _send_transaction(tx):
    with _tx_lock:
        _wait_for_mining()

        tx["nonce"] = _next_nonce()
        tx["gas"] = _estimate_gas(tx, fallback=500000)

        try:
            signed_tx = w3.eth.account.sign_transaction(
                tx, private_key=PRIVATE_KEY
            )
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        except ValueError as e:
            _raise_if_contract_error(e)
            raise

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        if receipt.status != 1:
            raise ContractError(
                f"La transacción falló on-chain (hash: {tx_hash.hex()})"
            )

        return receipt


def _build_tx(function_call):
    return function_call.build_transaction({
        "from": account.address,
        "gasPrice": w3.eth.gas_price,
        "chainId": 12345,
    })


def register_vehicle(plate, vtype):
    tx = _build_tx(contract.functions.registerVehicle(plate, int(vtype)))
    return _send_transaction(tx)


VEHICLE_GASOLINE = 0
VEHICLE_DIESEL = 1

VEHICLE_TYPE_LABELS = {
    VEHICLE_GASOLINE: "gasolina",
    VEHICLE_DIESEL: "diesel",
}


def get_vehicle_type(plate):
    try:
        return int(contract.functions.getVehicleType(plate).call())
    except Exception as e:
        _raise_if_contract_error(e)
        raise ContractError(
            "No se pudo consultar el tipo de vehículo."
        ) from e


def get_vehicle_type_info(plate):
    vtype = get_vehicle_type(plate)
    label = VEHICLE_TYPE_LABELS.get(vtype)

    if label is None:
        raise ContractError("Tipo de vehículo no válido en la blockchain.")

    if vtype == VEHICLE_GASOLINE:
        fields = ["co", "hc"]
    else:
        fields = ["opacity"]

    return {
        "type": vtype,
        "label": label,
        "fields": fields,
    }


def _normalize_inspection_values(plate, co, hc, opacity):
    vtype = get_vehicle_type(plate)
    co = int(co)
    hc = int(hc)
    opacity = int(opacity)

    if vtype == VEHICLE_GASOLINE:
        if opacity != 0:
            raise ContractError(
                "Vehículo de gasolina: no se registra opacidad (use 0)."
            )
        if not (0 <= co <= 1000):
            raise ContractError("CO inválido. Rango permitido: 0-1000.")
        if not (0 <= hc <= 2000):
            raise ContractError("HC inválido. Rango permitido: 0-2000.")
    elif vtype == VEHICLE_DIESEL:
        if co != 0:
            raise ContractError("Vehículo diésel: no se registra CO (use 0).")
        if hc != 0:
            raise ContractError("Vehículo diésel: no se registra HC (use 0).")
        if not (0 <= opacity <= 10000):
            raise ContractError("Opacidad inválida. Rango permitido: 0-10000.")
    else:
        raise ContractError("Tipo de vehículo no válido.")

    return co, hc, opacity


def add_inspection(plate, co, hc, opacity):
    co, hc, opacity = _normalize_inspection_values(plate, co, hc, opacity)

    tx = _build_tx(
        contract.functions.addInspection(
            plate,
            int(time.time()),
            co,
            hc,
            opacity,
        )
    )
    return _send_transaction(tx)


def _format_inspection(plate, data):
    approved = data[4]
    return {
        "plate": plate,
        "date": data[0],
        "co": data[1],
        "hc": data[2],
        "opacity": data[3],
        "approved": approved,
        "isContaminant": not approved,
    }


def get_inspections(plate):
    try:
        count = contract.functions.getInspectionCount(plate).call()
    except Exception as e:
        _raise_if_contract_error(e)
        raise ContractError(
            "Placa inválida o no consultable. Use el formato AAA000."
        ) from e

    result = []

    for i in range(count):
        data = contract.functions.getInspection(plate, i).call()
        result.append(_format_inspection(plate, data))

    return result


def get_all_inspections():
    result = []
    vehicle_count = contract.functions.getRegisteredVehicleCount().call()

    for i in range(vehicle_count):
        plate = contract.functions.getRegisteredPlate(i).call()
        result.extend(get_inspections(plate))

    result.sort(key=lambda row: row["date"], reverse=True)
    return result

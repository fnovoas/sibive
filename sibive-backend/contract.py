from web3 import Web3
from web3.middleware import geth_poa_middleware
import json
import time

# Conexión a Geth
w3 = Web3(Web3.HTTPProvider("http://geth:8545"))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

# Verificar conexión
if not w3.is_connected():
    raise Exception("No se pudo conectar a Geth")

# Verificar cuentas disponibles
if not w3.eth.accounts:
    raise Exception("No hay cuentas disponibles en Geth")

# Dirección del contrato desplegado (obtenida de Remix tras desplegar)
contract_address = "0x532619a74aCedB1228c8591b54769878404E7458"

# Cargar ABI
with open("abi.json") as f:
    abi = json.load(f)

# Instancia del contrato
contract = w3.eth.contract(address=contract_address, abi=abi)

# Cuenta principal
account = w3.eth.accounts[0]


# =========================
# Funciones del contrato
def register_vehicle(plate, vtype):
    try:
        tx = contract.functions.registerVehicle(
            plate,
            vtype
        ).transact({'from': account})

        receipt = w3.eth.wait_for_transaction_receipt(tx)
        return receipt

    except Exception as e:
        print("Error en register_vehicle:", e)
        return None


def add_inspection(plate, co, hc, opacity):
    try:
        tx = contract.functions.addInspection(
            plate,
            int(time.time()),
            co,
            hc,
            opacity
        ).transact({'from': account})

        receipt = w3.eth.wait_for_transaction_receipt(tx)
        return receipt

    except Exception as e:
        print("Error en add_inspection:", e)
        return None


def get_inspections(plate):
    result = []

    try:
        count = contract.functions.getInspectionCount(plate).call()
        print("COUNT:", count)
    except Exception as e:
        print("Error count:", e)
        return []

    for i in range(count):
        try:
            data = contract.functions.getInspection(plate, i).call()

            result.append({
                "date": data[0],
                "co": data[1],
                "hc": data[2],
                "opacity": data[3],
                "isContaminant": data[4]
            })

        except Exception as e:
            print(f"Error en índice {i}:", e)
            break  # IMPORTANTE: evita cascada de errores

    return result
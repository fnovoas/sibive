#!/usr/bin/env python3
import json
import sys

data = json.load(sys.stdin)
contract = data["contracts"]["VehicleInspection.sol:VehicleInspection"]

with open("sibive-backend/bytecode.txt", "w") as f:
    f.write(contract["bin"])

abi = contract["abi"]
if isinstance(abi, str):
    abi = json.loads(abi)

with open("sibive-backend/abi.json", "w") as f:
    json.dump(abi, f, indent=2)

print("Bytecode y ABI guardados en sibive-backend/")

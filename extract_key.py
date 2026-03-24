from web3.auto import w3
import json, binascii

with open("geth-node/data/keystore/UTC--2026-03-14T00-44-46.273452934Z--e56826bf376b8df2d82119efbdbbbe70e031cca9") as f:
    encrypted_key = f.read()

password = input("Password: ")

private_key = w3.eth.account.decrypt(encrypted_key, password)

print("Private key:", binascii.hexlify(private_key).decode())

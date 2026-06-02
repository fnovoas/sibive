from contract import w3


def _get_block_signer(block_number):
    """
    En redes Clique (PoA), el campo miner del header suele ser 0x0.
    El firmante real del bloque se obtiene vía clique_getSigner.
    """
    if block_number == 0:
        return w3.to_checksum_address("0x" + "0" * 40)

    try:
        signer = w3.manager.request_blocking(
            "clique_getSigner", [hex(block_number)]
        )
        return w3.to_checksum_address(signer)
    except Exception:
        block = w3.eth.get_block(block_number, full_transactions=False)
        return w3.to_checksum_address(block.miner)


def get_blocks(limit=None):
    """
    Devuelve bloques de la cadena local, del más reciente al más antiguo.
    limit: cantidad máxima de bloques (None = todos).
    """
    latest = w3.eth.block_number

    if limit is not None:
        limit = max(1, int(limit))
        first = max(0, latest - limit + 1)
    else:
        first = 0

    blocks = []

    for number in range(latest, first - 1, -1):
        block = w3.eth.get_block(number, full_transactions=False)
        blocks.append({
            "number": block.number,
            "hash": block.hash.hex(),
            "parentHash": block.parentHash.hex(),
            "timestamp": block.timestamp,
            "miner": _get_block_signer(block.number),
            "transactionCount": len(block.transactions),
            "gasUsed": block.gasUsed,
            "gasLimit": block.gasLimit,
        })

    return {
        "latest": latest,
        "count": len(blocks),
        "blocks": blocks,
    }

from contract import w3


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
            "miner": block.miner,
            "transactionCount": len(block.transactions),
            "gasUsed": block.gasUsed,
            "gasLimit": block.gasLimit,
        })

    return {
        "latest": latest,
        "count": len(blocks),
        "blocks": blocks,
    }

.PHONY: up down build clean restart mine stop-mine logs logs-backend logs-frontend frontend-install compile-contract

SOLC_BUILD = .build/VehicleInspection.sol

# Recompilar bytecode/abi compatible con Geth (EVM Paris, sin PUSH0).
# --via-ir evita "Stack too deep" en el contrato actual.
# El preprocesado genera una copia ASCII sin NatSpec (solc 0.8.19 no acepta ñ en strings).
$(SOLC_BUILD):
	@mkdir -p .build
	@python3 -c 'import re, pathlib; \
	src = pathlib.Path("VehicleInspection.sol").read_text(); \
	src = re.sub(r"/\*.*?\*/", "", src, flags=re.S); \
	src = re.sub( \
		r"\"([^\"]*[^\x00-\x7f][^\"]*)\"", \
		lambda m: "\"" + m.group(1).encode("ascii", "replace").decode() + "\"", \
		src, \
	); \
	pathlib.Path("$(SOLC_BUILD)").write_text(src)'

compile-contract: $(SOLC_BUILD)
	docker run --rm -v "$(CURDIR):/src" -w /src/.build ethereum/solc:0.8.19 \
		--optimize --via-ir --evm-version paris --combined-json abi,bin VehicleInspection.sol \
		| python3 scripts/extract_solc.py

up:
	docker-compose up -d

build:
	docker-compose up --build -d

frontend-install:
	cd sibive-frontend && npm install --ignore-scripts

down:
	docker-compose down

clean:
	docker-compose down -v
	-rm -rf geth-node/data/geth
	rm -f sibive-backend/runtime/contract_info.json
	rm -f sibive-backend/runtime/app.log
	@if [ -d geth-node/data/geth ]; then \
		echo "AVISO: no se pudo borrar geth-node/data/geth (permisos). Ejecuta: sudo rm -rf geth-node/data/geth"; \
	fi

restart:
	sudo make clean
	make build

mine:
	docker-compose exec -T geth geth attach --exec 'miner.start()' /geth/data/geth.ipc

stop-mine:
	docker-compose exec -T geth geth attach --exec 'miner.stop()' /geth/data/geth.ipc

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

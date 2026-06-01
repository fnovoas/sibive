.PHONY: up down build clean restart mine stop-mine logs logs-backend logs-frontend frontend-install compile-contract

# Recompilar bytecode/abi compatible con Geth (EVM Paris, sin PUSH0)
compile-contract:
	docker run --rm -v "$(CURDIR):/src" -w /src ethereum/solc:0.8.19 \
		--optimize --evm-version paris --combined-json abi,bin VehicleInspection.sol \
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
	docker-compose restart

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

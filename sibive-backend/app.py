from flask import Flask
from flask_cors import CORS
from deploy import deploy_contract
from logger import logger

logger.info("Inicializando aplicación. Verificando despliegue del contrato...")
deploy_contract()

from routes import register_routes

app = Flask(__name__)
CORS(app, origins="*")

register_routes(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

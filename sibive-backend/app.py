from flask import Flask
from routes import register_routes
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*")

# Registrar rutas
register_routes(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

    
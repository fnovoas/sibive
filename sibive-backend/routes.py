from flask import app, request, jsonify
from contract import register_vehicle, add_inspection, get_inspections

def register_routes(app):

    @app.route('/vehicle', methods=['POST'])
    def create_vehicle():
        data = request.json

        plate = data['plate'].strip().upper()

        register_vehicle(
            plate,
            data['type']
        )

        return jsonify({"message": "Vehículo registrado"})


    @app.route('/inspection', methods=['POST'])
    def create_inspection():
        data = request.json

        plate = data['plate'].strip().upper()

        add_inspection(
            plate,
            data['co'],
            data['hc'],
            data['opacity']
        )

        return jsonify({"message": "Inspección registrada"})


    @app.route('/vehicle/<plate>', methods=['GET'])
    def get_vehicle(plate):
        plate = plate.strip().upper()

        try:
            inspections = get_inspections(plate)
            return jsonify(inspections)
        except Exception as e:
            print("ERROR BACKEND:", e)
            return jsonify({"error": str(e)}), 500


    @app.route('/')
    def home():
        return "API SIBIVE funcionando"
    

from flask import request, jsonify
from contract import (
    register_vehicle,
    add_inspection,
    get_inspections,
    get_all_inspections,
    get_vehicle_type_info,
    get_vehicle_summary,
    ContractError,
)
from blockchain import get_blocks
from logger import logger

INSPECTION_FIELDS = [
    "coRalenti",
    "coCrucero",
    "hcRalenti",
    "hcCrucero",
    "co2Total",
    "o2Total",
    "opacity",
    "tempMotor",
    "rpmRalenti",
    "rpmCrucero",
    "emiteHumoContinuo",
    "fugaEscape",
    "faltaTapon",
]


def register_routes(app):

    @app.route("/vehicle", methods=["POST"])
    def create_vehicle():
        data = request.json or {}
        plate = data.get("plate", "").strip().upper()
        vtype = data.get("type")
        model_year = data.get("modelYear", data.get("model_year"))

        if vtype is None:
            return jsonify({"error": "Falta el tipo de vehículo"}), 400
        if model_year is None:
            return jsonify({"error": "Falta el año modelo"}), 400

        try:
            register_vehicle(plate, vtype, model_year)
            return jsonify({"message": "Vehículo registrado"})
        except ContractError as e:
            logger.error("Error al registrar vehículo (%s): %s", plate, e)
            return jsonify({"error": str(e)}), 400
        except ValueError as e:
            logger.error("Error de red/blockchain al registrar vehículo (%s): %s", plate, e)
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("Error inesperado al registrar vehículo (%s)", plate)
            return jsonify({"error": str(e)}), 500

    @app.route("/inspection", methods=["POST"])
    def create_inspection():
        data = request.json or {}
        plate = data.get("plate", "").strip().upper()

        missing = [field for field in INSPECTION_FIELDS if field not in data]
        if missing:
            return jsonify({
                "error": f"Faltan campos: {', '.join(missing)}"
            }), 400

        try:
            add_inspection(plate, {field: data[field] for field in INSPECTION_FIELDS})
            return jsonify({"message": "Inspección registrada"})
        except ContractError as e:
            logger.error("Error al registrar inspección (%s): %s", plate, e)
            return jsonify({"error": str(e)}), 400
        except ValueError as e:
            logger.error("Error de red/blockchain al registrar inspección (%s): %s", plate, e)
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("Error inesperado al registrar inspección (%s)", plate)
            return jsonify({"error": str(e)}), 500

    @app.route("/inspections", methods=["GET"])
    def list_all_inspections():
        try:
            return jsonify(get_all_inspections())
        except ContractError as e:
            logger.error("Error al listar inspecciones: %s", e)
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("Error inesperado al listar inspecciones")
            return jsonify({"error": str(e)}), 500

    @app.route("/vehicle/<plate>/info", methods=["GET"])
    def vehicle_info(plate):
        plate = plate.strip().upper()

        try:
            return jsonify(get_vehicle_summary(plate))
        except ContractError as e:
            logger.error("Error al consultar vehículo (%s): %s", plate, e)
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("Error inesperado al consultar vehículo (%s)", plate)
            return jsonify({"error": str(e)}), 500

    @app.route("/vehicle/<plate>/type", methods=["GET"])
    def vehicle_type(plate):
        plate = plate.strip().upper()

        try:
            return jsonify(get_vehicle_type_info(plate))
        except ContractError as e:
            logger.error("Error al consultar tipo (%s): %s", plate, e)
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("Error inesperado al consultar tipo (%s)", plate)
            return jsonify({"error": str(e)}), 500

    @app.route("/vehicle/<plate>", methods=["GET"])
    def get_vehicle(plate):
        plate = plate.strip().upper()

        try:
            inspections = get_inspections(plate)
            return jsonify(inspections)
        except ContractError as e:
            logger.error("Error al consultar vehículo (%s): %s", plate, e)
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("Error inesperado al consultar vehículo (%s)", plate)
            return jsonify({"error": str(e)}), 500

    @app.route("/blocks", methods=["GET"])
    def list_blocks():
        limit = request.args.get("limit", type=int)

        try:
            return jsonify(get_blocks(limit=limit))
        except Exception as e:
            logger.exception("Error al consultar la cadena de bloques")
            return jsonify({"error": str(e)}), 500

    @app.route("/")
    def home():
        return "API SIBIVE funcionando"

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VehicleInspection {

    enum VehicleType { Gasoline, Diesel }

    struct Inspection {
        uint date;
        uint co;          // CO en porcentaje * 100 (ej: 0.5% → 50)
        uint hc;          // ppm
        uint opacity;     // % * 100
        bool approved;
    }

    struct Vehicle {
        string plate;
        VehicleType vType;
        Inspection[] inspections;
    }

    // usar hash como key
    mapping(bytes32 => Vehicle) private vehicles;
    string[] private registeredPlates;

    // =========================
    // UTILIDADES
    // =========================

    function toUpper(string memory str) internal pure returns (string memory) {
        bytes memory b = bytes(str);
        for (uint i = 0; i < b.length; i++) {
            if (b[i] >= 0x61 && b[i] <= 0x7A) {
                b[i] = bytes1(uint8(b[i]) - 32);
            }
        }
        return string(b);
    }

    function toKey(string memory plate) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(toUpper(plate)));
    }

    function isValidPlate(string memory plate) internal pure returns (bool) {
        bytes memory b = bytes(plate);
        if (b.length != 6) return false;

        // AAA
        for (uint i = 0; i < 3; i++) {
            if (!(b[i] >= 0x41 && b[i] <= 0x5A)) return false;
        }

        // 000
        for (uint i = 3; i < 6; i++) {
            if (!(b[i] >= 0x30 && b[i] <= 0x39)) return false;
        }

        return true;
    }

    function isApproved(
        VehicleType _vType,
        uint _co,
        uint _hc,
        uint _opacity
    ) internal pure returns (bool) {

        if (_vType == VehicleType.Gasoline) {
            return _co <= 50 && _hc <= 200;
        }

        if (_vType == VehicleType.Diesel) {
            return _opacity <= 4500;
        }

        return false;
    }

    // =========================
    // FUNCIONES PRINCIPALES
    // =========================

    function registerVehicle(string memory _plate, VehicleType _vType) public {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);

        // Evitar sobrescribir vehículo existente
        require(bytes(vehicles[key].plate).length == 0, "Vehiculo ya existe");

        vehicles[key].plate = normalizedPlate;
        vehicles[key].vType = _vType;
        registeredPlates.push(normalizedPlate);
    }

    function addInspection(
        string memory _plate,
        uint _date,
        uint _co,
        uint _hc,
        uint _opacity
    ) public {

        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);
        Vehicle storage vehicle = vehicles[key];

        require(bytes(vehicle.plate).length != 0, "Vehiculo no existe");

        if (vehicle.vType == VehicleType.Gasoline) {
            require(_opacity == 0, "Opacidad no registrada para gasolina");
            require(_co <= 1000, "CO invalido");
            require(_hc <= 2000, "HC invalido");
        } else {
            require(_co == 0, "CO no registrado para diesel");
            require(_hc == 0, "HC no registrado para diesel");
            require(_opacity <= 10000, "Opacidad invalida");
        }

        bool approved = isApproved(vehicle.vType, _co, _hc, _opacity);

        vehicle.inspections.push(
            Inspection(_date, _co, _hc, _opacity, approved)
        );
    }

    function getRegisteredVehicleCount() public view returns (uint) {
        return registeredPlates.length;
    }

    function getRegisteredPlate(uint index) public view returns (string memory) {
        require(index < registeredPlates.length, "Indice fuera de rango");
        return registeredPlates[index];
    }

    function getVehicleType(string memory _plate) public view returns (VehicleType) {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);
        require(bytes(vehicles[key].plate).length != 0, "Vehiculo no existe");

        return vehicles[key].vType;
    }

    function getInspectionCount(string memory _plate) public view returns (uint) {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);

        return vehicles[key].inspections.length;
    }

    function getInspection(string memory _plate, uint index)
        public view returns (uint, uint, uint, uint, bool)
    {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);

        require(index < vehicles[key].inspections.length, "Indice fuera de rango");

        Inspection memory i = vehicles[key].inspections[index];

        return (i.date, i.co, i.hc, i.opacity, i.approved);
    }
}

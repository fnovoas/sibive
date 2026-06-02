// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VehicleInspection {

    // =========================================================
    // TIPOS Y ESTRUCTURAS
    // =========================================================

    enum VehicleType { Gasoline, Diesel }

    
    struct Inspection {
        uint date;

        // --- Gases (gasolina) ---
        uint coRalenti;       // CO en ralentí,  % * 100
        uint coCrucero;       // CO en crucero,  % * 100
        uint hcRalenti;       // HC en ralentí,  ppm
        uint hcCrucero;       // HC en crucero,  ppm

        // --- Dilución y validez de muestra ---
        uint co2Total;        // CO₂ total,       % * 100
        uint o2Total;         // O₂ total,        % * 100

        // --- Opacidad (diésel) ---
        uint opacity;         // Opacidad,        % * 100

        // --- Condiciones de prueba ---
        uint tempMotor;       // Temperatura motor, °C
        uint rpmRalenti;      // RPM en ralentí
        uint rpmCrucero;      // RPM en crucero

        // --- Defectos de rechazo directo ---
        bool emiteHumoContinuo;   // Humo visible > 10 s
        bool fugaEscape;          // Fuga en sistema de escape
        bool faltaTapon;          // Falta tapón aceite/combustible o filtro de aire

        bool approved;            // Resultado final
    }

    struct Vehicle {
        string plate;
        VehicleType vType;
        uint modelYear;           // Año modelo (ej: 2015)
        Inspection[] inspections;
    }

    mapping(bytes32 => Vehicle) private vehicles;
    string[] private registeredPlates;


    // =========================================================
    // UTILIDADES INTERNAS
    // =========================================================

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
        for (uint i = 0; i < 3; i++) {
            if (!(b[i] >= 0x41 && b[i] <= 0x5A)) return false;
        }
        for (uint i = 3; i < 6; i++) {
            if (!(b[i] >= 0x30 && b[i] <= 0x39)) return false;
        }
        return true;
    }

    // =========================================================
    // LÓGICA DE APROBACIÓN
    // =========================================================

    
    function isApproved(
        VehicleType    _vType,
        uint           _modelYear,
        uint           _coRalenti,
        uint           _coCrucero,
        uint           _hcRalenti,
        uint           _hcCrucero,
        uint           _co2Total,
        uint           _o2Total,
        uint           _opacity,
        uint           _tempMotor,
        uint           _rpmRalenti,
        uint           _rpmCrucero,
        bool           _emiteHumoContinuo,
        bool           _fugaEscape,
        bool           _faltaTapon
    ) internal pure returns (bool) {

        // ----------------------------------------------------------
        // 1. RECHAZO DIRECTO — defectos visuales / físicos
        // ----------------------------------------------------------
        if (_emiteHumoContinuo) return false;
        if (_fugaEscape)        return false;
        if (_faltaTapon)        return false;

        // ----------------------------------------------------------
        // 2. BLOQUEO DE PRUEBA — condiciones de medición inválidas
        //    tempMotor < 60°C  →  prueba inválida
        //    rpmRalenti fuera de [400, 1100]
        //    rpmCrucero fuera de [2200, 2800]
        // ----------------------------------------------------------
        if (_tempMotor < 60)                               return false;
        if (_rpmRalenti < 400  || _rpmRalenti > 1100)     return false;
        if (_rpmCrucero < 2200 || _rpmCrucero > 2800)     return false;

        // ----------------------------------------------------------
        // 3. CRITERIO DE DILUCIÓN — detecta fugas de aire / muestra falsa
        //    O₂ > 5 %   →  exceso de oxígeno, escape roto
        //    CO + CO₂ < 700 (= 7.00 %)  →  muestra diluida
        //    (umbral simplificado: 7 % para todos los modelos)
        // ----------------------------------------------------------
        if (_o2Total > 500)                           return false;
        if ((_coRalenti + _co2Total) < 700)           return false;

        // ----------------------------------------------------------
        // 4. LÍMITES DE GASES Y OPACIDAD según año modelo
        // ----------------------------------------------------------

        if (_vType == VehicleType.Gasoline) {

            uint coLimit;   // % * 100
            uint hcLimit;   // ppm

            if (_modelYear >= 2010) {
                coLimit = 100;   // 1.0 %
                hcLimit = 200;
            } else if (_modelYear >= 1997) {
                coLimit = 350;   // 3.5 %
                hcLimit = 400;
            } else {
                coLimit = 500;   // 5.0 %
                hcLimit = 800;
            }

            if (_coRalenti > coLimit) return false;
            if (_coCrucero > coLimit) return false;
            if (_hcRalenti > hcLimit) return false;
            if (_hcCrucero > hcLimit) return false;

        } else {
            // Diésel — opacidad según año modelo
            uint opLimit;   // % * 100

            if (_modelYear >= 2010) {
                opLimit = 2000;   // 20 %  (Euro IV / V)
            } else if (_modelYear >= 2000) {
                opLimit = 3500;   // 35 %
            } else {
                opLimit = 6000;   // 60 %
            }

            if (_opacity > opLimit) return false;
        }

        return true;
    }


    // =========================================================
    // FUNCIONES PRINCIPALES
    // =========================================================

    
    function registerVehicle(
        string memory _plate,
        VehicleType   _vType,
        uint          _modelYear
    ) public {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");
        require(_modelYear >= 1899 && _modelYear <= 2030, "A?o modelo invalido");

        bytes32 key = toKey(normalizedPlate);
        require(bytes(vehicles[key].plate).length == 0, "Vehiculo ya existe");

        vehicles[key].plate     = normalizedPlate;
        vehicles[key].vType     = _vType;
        vehicles[key].modelYear = _modelYear;
        registeredPlates.push(normalizedPlate);
    }

    
    function addInspection(
        string memory _plate,
        uint _date,
        uint _coRalenti,
        uint _coCrucero,
        uint _hcRalenti,
        uint _hcCrucero,
        uint _co2Total,
        uint _o2Total,
        uint _opacity,
        uint _tempMotor,
        uint _rpmRalenti,
        uint _rpmCrucero,
        bool _emiteHumoContinuo,
        bool _fugaEscape,
        bool _faltaTapon
    ) public {

        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);
        Vehicle storage vehicle = vehicles[key];
        require(bytes(vehicle.plate).length != 0, "Vehiculo no existe");

        // --- Validaciones de rango de sensor ---
        require(_co2Total  <= 2000, "CO2 invalido");      // max 20.00 %
        require(_o2Total   <= 2500, "O2 invalido");       // max 25.00 %
        require(_tempMotor <= 120,  "Temperatura invalida");
        require(_rpmRalenti <= 8000, "RPM ralenti invalido");
        require(_rpmCrucero <= 8000, "RPM crucero invalido");

        if (vehicle.vType == VehicleType.Gasoline) {
            require(_opacity   == 0,   "Opacidad no aplica para gasolina");
            require(_coRalenti <= 1000, "CO ralenti invalido");
            require(_coCrucero <= 1000, "CO crucero invalido");
            require(_hcRalenti <= 2000, "HC ralenti invalido");
            require(_hcCrucero <= 2000, "HC crucero invalido");
        } else {
            require(_coRalenti == 0 && _coCrucero == 0, "CO no aplica para diesel");
            require(_hcRalenti == 0 && _hcCrucero == 0, "HC no aplica para diesel");
            require(_opacity   <= 10000, "Opacidad invalida");
        }

        bool approved = isApproved(
            vehicle.vType,
            vehicle.modelYear,
            _coRalenti,
            _coCrucero,
            _hcRalenti,
            _hcCrucero,
            _co2Total,
            _o2Total,
            _opacity,
            _tempMotor,
            _rpmRalenti,
            _rpmCrucero,
            _emiteHumoContinuo,
            _fugaEscape,
            _faltaTapon
        );

        Inspection memory insp;
        insp.date               = _date;
        insp.coRalenti          = _coRalenti;
        insp.coCrucero          = _coCrucero;
        insp.hcRalenti          = _hcRalenti;
        insp.hcCrucero          = _hcCrucero;
        insp.co2Total           = _co2Total;
        insp.o2Total            = _o2Total;
        insp.opacity            = _opacity;
        insp.tempMotor          = _tempMotor;
        insp.rpmRalenti         = _rpmRalenti;
        insp.rpmCrucero         = _rpmCrucero;
        insp.emiteHumoContinuo  = _emiteHumoContinuo;
        insp.fugaEscape         = _fugaEscape;
        insp.faltaTapon         = _faltaTapon;
        insp.approved           = approved;

        vehicle.inspections.push(insp);
    }


    // =========================================================
    // FUNCIONES DE CONSULTA
    // =========================================================

    function getRegisteredVehicleCount() public view returns (uint) {
        return registeredPlates.length;
    }

    function getRegisteredPlate(uint index) public view returns (string memory) {
        require(index < registeredPlates.length, "Indice fuera de rango");
        return registeredPlates[index];
    }

    function getVehicleInfo(string memory _plate)
        public view
        returns (string memory plate, VehicleType vType, uint modelYear)
    {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);
        Vehicle storage v = vehicles[key];
        require(bytes(v.plate).length != 0, "Vehiculo no existe");

        return (v.plate, v.vType, v.modelYear);
    }

    function getInspectionCount(string memory _plate) public view returns (uint) {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");
        return vehicles[toKey(normalizedPlate)].inspections.length;
    }

    
    function getInspection(string memory _plate, uint index)
        public view
        returns (
            uint  date,
            uint  coRalenti,
            uint  coCrucero,
            uint  hcRalenti,
            uint  hcCrucero,
            uint  co2Total,
            uint  o2Total,
            uint  opacity,
            uint  tempMotor,
            uint  rpmRalenti,
            uint  rpmCrucero,
            bool  emiteHumoContinuo,
            bool  fugaEscape,
            bool  faltaTapon,
            bool  approved
        )
    {
        string memory normalizedPlate = toUpper(_plate);
        require(isValidPlate(normalizedPlate), "Formato invalido");

        bytes32 key = toKey(normalizedPlate);
        require(index < vehicles[key].inspections.length, "Indice fuera de rango");

        Inspection memory i = vehicles[key].inspections[index];

        return (
            i.date,
            i.coRalenti,
            i.coCrucero,
            i.hcRalenti,
            i.hcCrucero,
            i.co2Total,
            i.o2Total,
            i.opacity,
            i.tempMotor,
            i.rpmRalenti,
            i.rpmCrucero,
            i.emiteHumoContinuo,
            i.fugaEscape,
            i.faltaTapon,
            i.approved
        );
    }
}
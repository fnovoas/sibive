"use client";

import { useState } from "react";
import API from "../lib/api";

export default function Register() {

  const [plate, setPlate] = useState("");
  const [type, setType] = useState(0);

  const submit = async () => {

    // Regex: 3 letras + 3 números
    const plateRegex = /^[a-zA-Z]{3}[0-9]{3}$/;

    if (!plateRegex.test(plate)) {
      alert("La placa debe tener el formato aaa000 (3 letras y 3 números)");
      return;
    }

    try {
      await API.post("/vehicle", {
        plate: plate.toUpperCase(), // opcional: normalizar
        type: Number(type)
      });

      alert("Vehículo registrado");

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al registrar");
    }
  };

  return (
    <div>
      <h1>Registrar Vehículo</h1>

      <input
        placeholder="Placa (AAA000)"
        value={plate}
        onChange={(e) => setPlate(e.target.value)}
      />

      <input
        placeholder="Tipo (0,1,2...)"
        value={type}
        onChange={(e) => setType(e.target.value)}
      />

      <button onClick={submit}>Registrar</button>
    </div>
  );
}
"use client";

import { useState } from "react";
import API from "../lib/api";

export default function Inspection() {

  const [plate, setPlate] = useState("");
  const [co, setCo] = useState("");
  const [hc, setHc] = useState("");
  const [opacity, setOpacity] = useState("");

  const submit = async () => {
    const plateRegex = /^[a-zA-Z]{3}[0-9]{3}$/;

    if (!plateRegex.test(plate)) {
      alert("La placa debe tener el formato AAA000 (3 letras y 3 números)");
      return;
    }

    try {
      await API.post("/inspection", {
        plate: plate.trim().toUpperCase(),
        co: Number(co),
        hc: Number(hc),
        opacity: Number(opacity)
      });

      alert("Inspección registrada");

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al registrar inspección");
    }
  };

  return (
    <div>
      <h1>Registrar Inspección</h1>

      <input placeholder="Placa" onChange={e => setPlate(e.target.value)} />
      <input placeholder="CO" onChange={e => setCo(e.target.value)} />
      <input placeholder="HC" onChange={e => setHc(e.target.value)} />
      <input placeholder="Opacidad" onChange={e => setOpacity(e.target.value)} />

      <button onClick={submit}>Registrar</button>
    </div>
  );
}
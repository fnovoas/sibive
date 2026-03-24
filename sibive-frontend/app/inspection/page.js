"use client";

import { useState } from "react";
import API from "../lib/api";

export default function Inspection() {

  const [plate, setPlate] = useState("");
  const [co, setCo] = useState("");
  const [hc, setHc] = useState("");
  const [opacity, setOpacity] = useState("");

  const submit = async () => {
    try {
      await API.post("/inspection", {
        plate,
        co: Number(co),
        hc: Number(hc),
        opacity: Number(opacity)
      });

      alert("Inspección registrada");

    } catch (err) {
      console.error(err);
      alert("Error");
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
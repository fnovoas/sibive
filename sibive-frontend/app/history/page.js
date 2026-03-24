"use client";

import { useState } from "react";
import API from "../lib/api";

export default function History() {
  const [plate, setPlate] = useState("");
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const cleanPlate = plate.trim().toUpperCase();

      const res = await API.get(`/vehicle/${cleanPlate}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error al consultar");
    }
  };

  return (
    <div>
      <h1>Historial</h1>

      <input
        placeholder="Placa"
        value={plate}
        onChange={(e) => setPlate(e.target.value.toUpperCase())}
      />

      <button onClick={fetchData}>Consultar</button>
      <p>Total inspecciones: {data.length}</p>

      {data.length === 0 ? (
        <p>No hay inspecciones registradas</p>
      ) : (
        <ul>
          {data.map((item, i) => (
            <li key={i}>
              Fecha: {new Date(item.date * 1000).toLocaleString()} |
              CO: {item.co} |
              HC: {item.hc} |
              Opacidad: {item.opacity} |
              Contaminante: {item.isContaminant ? "Sí" : "No"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
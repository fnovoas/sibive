"use client";

import { useState } from "react";
import API from "@/lib/api";
import { PLATE_REGEX } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";

export default function RegisterPage() {
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setMessage(null);
    setError(null);

    if (!PLATE_REGEX.test(plate)) {
      setError("La placa debe tener el formato AAA000 (3 letras y 3 números).");
      return;
    }

    setSubmitting(true);

    try {
      await API.post("/vehicle", {
        plate: plate.toUpperCase(),
        type: Number(type),
      });
      setMessage("Vehículo registrado correctamente.");
      setPlate("");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al registrar el vehículo."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Registrar vehículo"
        description="Registre un vehículo en la blockchain con placa válida y tipo de combustible."
      />

      <Card className="max-w-lg space-y-5">
        <Input
          label="Placa"
          placeholder="AAA000"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
        />

        <Select
          label="Tipo de combustible"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="0">Gasolina</option>
          <option value="1">Diésel</option>
        </Select>

        {error && <Alert variant="error">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Registrando…" : "Registrar vehículo"}
        </Button>
      </Card>
    </>
  );
}

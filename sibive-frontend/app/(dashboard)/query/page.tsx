"use client";

import { useState } from "react";
import API from "@/lib/api";
import { PLATE_REGEX } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import type { VehicleSummary } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

function fuelLabel(label: string): string {
  return label === "diesel" ? "Diésel" : "Gasolina";
}

export default function QueryVehiclePage() {
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<VehicleSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const consult = async () => {
    setError(null);
    setResult(null);

    const normalizedPlate = plate.trim().toUpperCase();

    if (!PLATE_REGEX.test(normalizedPlate)) {
      setError("La placa debe tener el formato AAA000 (3 letras y 3 números).");
      return;
    }

    setLoading(true);

    try {
      const res = await API.get<VehicleSummary>(
        `/vehicle/${normalizedPlate}/info`
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al consultar el vehículo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Consultar vehículo"
        description="Consulte el tipo de combustible y el año modelo de un vehículo registrado."
      />

      <Card className="max-w-lg space-y-5">
        <Input
          label="Placa"
          placeholder="AAA000"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
        />

        {error && <Alert variant="error">{error}</Alert>}

        {result && (
          <Alert variant="success">
            <p>
              Placa <strong>{result.plate}</strong>
            </p>
            <p className="mt-1">
              Tipo de combustible:{" "}
              <strong>{fuelLabel(result.label)}</strong>
            </p>
            <p className="mt-1">
              Año modelo: <strong>{result.modelYear}</strong>
            </p>
          </Alert>
        )}

        <Button onClick={consult} disabled={loading}>
          {loading ? "Consultando…" : "Consultar vehículo"}
        </Button>
      </Card>
    </>
  );
}

"use client";

import { useState } from "react";
import API from "@/lib/api";
import { PLATE_REGEX } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import type { VehicleTypeInfo } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

function clampDigits(value: string, max: number): string {
  if (value === "") return "";
  const normalized = value.replace(/\D/g, "");
  if (normalized === "") return "";
  const numeric = Number(normalized);
  return String(numeric > max ? max : numeric);
}

export default function InspectionPage() {
  const [plate, setPlate] = useState("");
  const [co, setCo] = useState("");
  const [hc, setHc] = useState("");
  const [opacity, setOpacity] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState<VehicleTypeInfo | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadVehicleType = async (normalizedPlate: string) => {
    if (!PLATE_REGEX.test(normalizedPlate)) {
      setVehicleInfo(null);
      setTypeError(null);
      return;
    }

    setLoadingType(true);
    setTypeError(null);
    setVehicleInfo(null);

    try {
      const res = await API.get<VehicleTypeInfo>(
        `/vehicle/${normalizedPlate}/type`
      );
      setVehicleInfo(res.data);
    } catch (err) {
      setVehicleInfo(null);
      setTypeError(
        getApiErrorMessage(
          err,
          "No se pudo obtener el tipo de vehículo para esta placa."
        )
      );
    } finally {
      setLoadingType(false);
    }
  };

  const handlePlateChange = (value: string) => {
    const normalized = value.toUpperCase();
    setPlate(normalized);
    setCo("");
    setHc("");
    setOpacity("");
    setMessage(null);
    setError(null);

    if (PLATE_REGEX.test(normalized)) {
      void loadVehicleType(normalized);
    } else {
      setVehicleInfo(null);
      setTypeError(null);
    }
  };

  const isGasoline = vehicleInfo?.type === 0;
  const isDiesel = vehicleInfo?.type === 1;

  const submit = async () => {
    setMessage(null);
    setError(null);

    const normalizedPlate = plate.trim().toUpperCase();

    if (!PLATE_REGEX.test(normalizedPlate)) {
      setError("La placa debe tener el formato AAA000 (3 letras y 3 números).");
      return;
    }

    if (!vehicleInfo) {
      setError(typeError ?? "Ingrese una placa registrada.");
      return;
    }

    if (isGasoline && (co === "" || hc === "")) {
      setError("Ingrese los valores de CO y HC.");
      return;
    }

    if (isDiesel && opacity === "") {
      setError("Ingrese el valor de opacidad.");
      return;
    }

    setSubmitting(true);

    try {
      await API.post("/inspection", {
        plate: normalizedPlate,
        co: isGasoline ? Number(co) : 0,
        hc: isGasoline ? Number(hc) : 0,
        opacity: isDiesel ? Number(opacity) : 0,
      });
      setMessage("Inspección registrada correctamente.");
      setCo("");
      setHc("");
      setOpacity("");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al registrar la inspección."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Registrar inspección"
        description={
          <>
            Gasolina: registre solo niveles de monóxido de carbono (CO) e hidrocarburos (HC).
            <br />
            Diésel: registre solo opacidad.
            <br />
            La placa debe estar registrada.
          </>
        }
      />

      <Card className="max-w-lg space-y-5">
        <Input
          label="Placa"
          placeholder="AAA000"
          value={plate}
          className="uppercase"
          onChange={(e) => handlePlateChange(e.target.value)}
        />

        {loadingType && <Alert>Consultando tipo de vehículo…</Alert>}
        {typeError && <Alert variant="error">{typeError}</Alert>}
        {vehicleInfo && (
          <Alert variant="success">
            Vehículo de <strong>{vehicleInfo.label === "diesel" ? "diésel" : vehicleInfo.label}</strong>
          </Alert>
        )}

        {isGasoline && (
          <>
            <Input
              label="CO (0-1000)"
              inputMode="numeric"
              value={co}
              onChange={(e) => setCo(clampDigits(e.target.value, 1000))}
            />
            <Input
              label="HC (0-2000)"
              inputMode="numeric"
              value={hc}
              onChange={(e) => setHc(clampDigits(e.target.value, 2000))}
            />
          </>
        )}

        {isDiesel && (
          <Input
            label="Opacidad (0-10000)"
            inputMode="numeric"
            value={opacity}
            onChange={(e) => setOpacity(clampDigits(e.target.value, 10000))}
          />
        )}

        {error && <Alert variant="error">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <Button
          onClick={submit}
          disabled={!vehicleInfo || loadingType || submitting}
        >
          {submitting ? "Registrando…" : "Registrar inspección"}
        </Button>
      </Card>
    </>
  );
}

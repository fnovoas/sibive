"use client";

import { useState, type ReactNode } from "react";
import API from "@/lib/api";
import { PLATE_REGEX } from "@/lib/constants";
import {
  clampDigits,
  clampPercentage,
  parsePercentToStored,
} from "@/lib/inspectionFormat";
import { getApiErrorMessage } from "@/lib/errors";
import type { VehicleTypeInfo } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

type InspectionForm = {
  coRalenti: string;
  coCrucero: string;
  hcRalenti: string;
  hcCrucero: string;
  co2Total: string;
  o2Total: string;
  opacity: string;
  tempMotor: string;
  rpmRalenti: string;
  rpmCrucero: string;
  emiteHumoContinuo: boolean;
  fugaEscape: boolean;
  faltaTapon: boolean;
};

const EMPTY_FORM: InspectionForm = {
  coRalenti: "",
  coCrucero: "",
  hcRalenti: "",
  hcCrucero: "",
  co2Total: "",
  o2Total: "",
  opacity: "",
  tempMotor: "",
  rpmRalenti: "",
  rpmCrucero: "",
  emiteHumoContinuo: false,
  fugaEscape: false,
  faltaTapon: false,
};

const SAMPLE_GASOLINE_FORM: InspectionForm = {
  coRalenti: "0,50",
  coCrucero: "0,60",
  hcRalenti: "80",
  hcCrucero: "95",
  co2Total: "13,50",
  o2Total: "1,20",
  opacity: "",
  tempMotor: "90",
  rpmRalenti: "800",
  rpmCrucero: "2500",
  emiteHumoContinuo: false,
  fugaEscape: false,
  faltaTapon: false,
};

const SAMPLE_DIESEL_FORM: InspectionForm = {
  coRalenti: "",
  coCrucero: "",
  hcRalenti: "",
  hcCrucero: "",
  co2Total: "11,00",
  o2Total: "2,00",
  opacity: "12,00",
  tempMotor: "85",
  rpmRalenti: "750",
  rpmCrucero: "2400",
  emiteHumoContinuo: false,
  fugaEscape: false,
  faltaTapon: false,
};

const MAX_GASOLINE_FORM: InspectionForm = {
  coRalenti: "10,00",
  coCrucero: "10,00",
  hcRalenti: "2000",
  hcCrucero: "2000",
  co2Total: "20,00",
  o2Total: "25,00",
  opacity: "",
  tempMotor: "120",
  rpmRalenti: "8000",
  rpmCrucero: "8000",
  emiteHumoContinuo: false,
  fugaEscape: false,
  faltaTapon: false,
};

const MAX_DIESEL_FORM: InspectionForm = {
  coRalenti: "",
  coCrucero: "",
  hcRalenti: "",
  hcCrucero: "",
  co2Total: "20,00",
  o2Total: "25,00",
  opacity: "100,00",
  tempMotor: "120",
  rpmRalenti: "8000",
  rpmCrucero: "8000",
  emiteHumoContinuo: false,
  fugaEscape: false,
  faltaTapon: false,
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="border-b border-border pb-1 text-sm font-medium text-foreground">
      {children}
    </p>
  );
}

function FieldWithUnit({
  label,
  unit,
  value,
  onChange,
  inputMode = "decimal",
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <div className="flex items-center">
        <input
          inputMode={inputMode}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="ml-2 shrink-0 text-sm text-foreground">{unit}</span>
      </div>
    </label>
  );
}

function DefectCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 rounded border-border"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-foreground">{label}</span>
    </label>
  );
}

export default function InspectionPage() {
  const [plate, setPlate] = useState("");
  const [form, setForm] = useState<InspectionForm>(EMPTY_FORM);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleTypeInfo | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof InspectionForm>(
    key: K,
    value: InspectionForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
    setForm(EMPTY_FORM);
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

  const fillSampleValues = () => {
    if (!vehicleInfo) return;

    setForm(vehicleInfo.type === 0 ? SAMPLE_GASOLINE_FORM : SAMPLE_DIESEL_FORM);
    setMessage(null);
    setError(null);
  };

  const fillMaxValues = () => {
    if (!vehicleInfo) return;

    setForm(vehicleInfo.type === 0 ? MAX_GASOLINE_FORM : MAX_DIESEL_FORM);
    setMessage(null);
    setError(null);
  };

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setMessage(null);
    setError(null);
  };

  const validateForm = (): string | null => {
    const requiredCommon = [
      ["co2Total", "CO₂ total"],
      ["o2Total", "O₂ total"],
      ["tempMotor", "temperatura de motor"],
      ["rpmRalenti", "RPM en ralentí"],
      ["rpmCrucero", "RPM en crucero"],
    ] as const;

    for (const [key, label] of requiredCommon) {
      if (form[key] === "") {
        return `Ingrese ${label}.`;
      }
    }

    if (isGasoline) {
      const requiredGas = [
        ["coRalenti", "CO en ralentí"],
        ["coCrucero", "CO en crucero"],
        ["hcRalenti", "HC en ralentí"],
        ["hcCrucero", "HC en crucero"],
      ] as const;

      for (const [key, label] of requiredGas) {
        if (form[key] === "") {
          return `Ingrese ${label}.`;
        }
      }
    }

    if (isDiesel && form.opacity === "") {
      return "Ingrese el valor de opacidad.";
    }

    return null;
  };

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

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await API.post("/inspection", {
        plate: normalizedPlate,
        coRalenti: isGasoline ? parsePercentToStored(form.coRalenti) : 0,
        coCrucero: isGasoline ? parsePercentToStored(form.coCrucero) : 0,
        hcRalenti: isGasoline ? Number(form.hcRalenti) : 0,
        hcCrucero: isGasoline ? Number(form.hcCrucero) : 0,
        co2Total: parsePercentToStored(form.co2Total),
        o2Total: parsePercentToStored(form.o2Total),
        opacity: isDiesel ? parsePercentToStored(form.opacity) : 0,
        tempMotor: Number(form.tempMotor),
        rpmRalenti: Number(form.rpmRalenti),
        rpmCrucero: Number(form.rpmCrucero),
        emiteHumoContinuo: form.emiteHumoContinuo,
        fugaEscape: form.fugaEscape,
        faltaTapon: form.faltaTapon,
      });
      setMessage("Inspección registrada correctamente.");
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al registrar la inspección."));
    } finally {
      setSubmitting(false);
    }
  };

  const fuelLabel =
    vehicleInfo?.label === "diesel" ? "diésel" : vehicleInfo?.label;

  return (
    <>
      <PageHeader
        title="Registrar inspección"
        description={
          <>
            Registre gases, dilución, condiciones de prueba y defectos visuales.
            <br />
            La placa debe estar registrada previamente.
          </>
        }
      />

      <Card className="max-w-2xl space-y-5">
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
            Vehículo de <strong>{fuelLabel}</strong>, año modelo{" "}
            <strong>{vehicleInfo.modelYear}</strong>
          </Alert>
        )}

        {vehicleInfo && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={fillSampleValues}>
                Rellenar con valores normales
              </Button>
              <Button variant="secondary" onClick={fillMaxValues}>
                Rellenar con valores máximos
              </Button>
              <Button variant="ghost" onClick={clearForm}>
                Limpiar formulario
              </Button>
            </div>

            {isGasoline && (
              <div className="space-y-4">
                <SectionTitle>Gases (gasolina)</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWithUnit
                    label="CO en ralentí"
                    unit="%"
                    value={form.coRalenti}
                    onChange={(v) =>
                      setField("coRalenti", clampPercentage(v, 10, 2))
                    }
                  />
                  <FieldWithUnit
                    label="CO en crucero"
                    unit="%"
                    value={form.coCrucero}
                    onChange={(v) =>
                      setField("coCrucero", clampPercentage(v, 10, 2))
                    }
                  />
                  <FieldWithUnit
                    label="HC en ralentí"
                    unit="ppm"
                    value={form.hcRalenti}
                    inputMode="numeric"
                    onChange={(v) =>
                      setField("hcRalenti", clampDigits(v, 2000))
                    }
                  />
                  <FieldWithUnit
                    label="HC en crucero"
                    unit="ppm"
                    value={form.hcCrucero}
                    inputMode="numeric"
                    onChange={(v) =>
                      setField("hcCrucero", clampDigits(v, 2000))
                    }
                  />
                </div>
              </div>
            )}

            {isDiesel && (
              <div className="space-y-4">
                <SectionTitle>Opacidad (diésel)</SectionTitle>
                <FieldWithUnit
                  label="Opacidad"
                  unit="%"
                  value={form.opacity}
                  onChange={(v) =>
                    setField("opacity", clampPercentage(v, 100, 2))
                  }
                />
              </div>
            )}

            <div className="space-y-4">
              <SectionTitle>Dilución y validez de muestra</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWithUnit
                  label="CO₂ total"
                  unit="%"
                  value={form.co2Total}
                  onChange={(v) =>
                    setField("co2Total", clampPercentage(v, 20, 2))
                  }
                />
                <FieldWithUnit
                  label="O₂ total"
                  unit="%"
                  value={form.o2Total}
                  onChange={(v) => setField("o2Total", clampPercentage(v, 25, 2))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle>Condiciones de prueba</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldWithUnit
                  label="Temperatura motor"
                  unit="°C"
                  value={form.tempMotor}
                  inputMode="numeric"
                  onChange={(v) => setField("tempMotor", clampDigits(v, 120))}
                />
                <FieldWithUnit
                  label="RPM en ralentí"
                  unit="rpm"
                  value={form.rpmRalenti}
                  inputMode="numeric"
                  onChange={(v) => setField("rpmRalenti", clampDigits(v, 8000))}
                />
                <FieldWithUnit
                  label="RPM en crucero"
                  unit="rpm"
                  value={form.rpmCrucero}
                  inputMode="numeric"
                  onChange={(v) => setField("rpmCrucero", clampDigits(v, 8000))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>Defectos de rechazo directo</SectionTitle>
              <div className="space-y-2">
                <DefectCheckbox
                  label="Emite humo continuo visible (> 10 s)"
                  checked={form.emiteHumoContinuo}
                  onChange={(v) => setField("emiteHumoContinuo", v)}
                />
                <DefectCheckbox
                  label="Fuga en el sistema de escape"
                  checked={form.fugaEscape}
                  onChange={(v) => setField("fugaEscape", v)}
                />
                <DefectCheckbox
                  label="Falta tapón de aceite/combustible o filtro de aire"
                  checked={form.faltaTapon}
                  onChange={(v) => setField("faltaTapon", v)}
                />
              </div>
            </div>
          </>
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

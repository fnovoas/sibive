"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import {
  defectLabels,
  formatCelsius,
  formatPercentStored,
  formatPpm,
  formatRpm,
  isDieselInspection,
} from "@/lib/inspectionFormat";
import type { Inspection } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

type ContaminantFilter = "all" | "yes" | "no";

const CONTAMINANT_FILTERS: { value: ContaminantFilter; label: string }[] = [
  { value: "all", label: "Ver todas" },
  { value: "yes", label: "Contaminante: Sí" },
  { value: "no", label: "Contaminante: No" },
];

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function InspectionCard({ item }: { item: Inspection }) {
  const diesel = isDieselInspection(item);
  const defects = defectLabels(item);

  return (
    <Card className="text-sm leading-relaxed">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-brand">{item.plate}</span>
        <span className="text-muted">
          {new Date(item.date * 1000).toLocaleString()}
        </span>
        <span className="text-xs text-muted">
          {diesel ? "Diésel" : "Gasolina"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {!diesel && (
          <>
            <Metric
              label="CO ralentí"
              value={formatPercentStored(item.coRalenti)}
            />
            <Metric
              label="CO crucero"
              value={formatPercentStored(item.coCrucero)}
            />
            <Metric label="HC ralentí" value={formatPpm(item.hcRalenti)} />
            <Metric label="HC crucero" value={formatPpm(item.hcCrucero)} />
          </>
        )}

        {diesel && (
          <Metric
            label="Opacidad"
            value={formatPercentStored(item.opacity)}
          />
        )}

        <Metric label="CO₂ total" value={formatPercentStored(item.co2Total)} />
        <Metric label="O₂ total" value={formatPercentStored(item.o2Total)} />
        <Metric label="Temp. motor" value={formatCelsius(item.tempMotor)} />
        <Metric label="RPM ralentí" value={formatRpm(item.rpmRalenti)} />
        <Metric label="RPM crucero" value={formatRpm(item.rpmCrucero)} />
        <Metric
          label="Contaminante"
          value={item.isContaminant ? "Sí" : "No"}
        />
      </dl>

      {defects.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Defectos: {defects.join(" · ")}
        </p>
      )}
    </Card>
  );
}

export default function HistoryPage() {
  const [plate, setPlate] = useState("");
  const [allData, setAllData] = useState<Inspection[]>([]);
  const [baseRows, setBaseRows] = useState<Inspection[]>([]);
  const [contaminantFilter, setContaminantFilter] =
    useState<ContaminantFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleRows = useMemo(() => {
    if (contaminantFilter === "yes") {
      return baseRows.filter((row) => row.isContaminant);
    }
    if (contaminantFilter === "no") {
      return baseRows.filter((row) => !row.isContaminant);
    }
    return baseRows;
  }, [baseRows, contaminantFilter]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await API.get<Inspection[]>("/inspections");
      const rows = [...res.data].sort((a, b) => b.date - a.date);
      setAllData(rows);
      setBaseRows(rows);
      setContaminantFilter("all");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al cargar el historial."));
      setAllData([]);
      setBaseRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const fetchByPlate = async () => {
    const cleanPlate = plate.trim().toUpperCase();

    if (!cleanPlate) {
      setBaseRows(allData);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await API.get<Inspection[]>(`/vehicle/${cleanPlate}`);
      const rows = res.data
        .map((item) => ({ ...item, plate: item.plate || cleanPlate }))
        .sort((a, b) => b.date - a.date);
      setBaseRows(rows);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al consultar."));
      setBaseRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDisabled = loading || baseRows.length === 0;

  return (
    <>
      <PageHeader
        title="Historial"
        description="Todas las inspecciones por defecto. Filtre por placa para ver un vehículo."
      />

      <Card className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Placa"
              placeholder="AAA000"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchByPlate} disabled={loading}>
              Consultar
            </Button>
            <Button variant="ghost" onClick={loadAll} disabled={loading}>
              Actualizar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Filtrar por contaminante
          </p>
          <div className="flex flex-wrap gap-2">
            {CONTAMINANT_FILTERS.map((option) => (
              <Button
                key={option.value}
                variant={
                  contaminantFilter === option.value ? "primary" : "secondary"
                }
                onClick={() => setContaminantFilter(option.value)}
                disabled={filterDisabled}
                aria-pressed={contaminantFilter === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {loading && <Alert>Cargando…</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <p className="text-sm text-muted">
          Total inspecciones: <strong>{visibleRows.length}</strong>
          {contaminantFilter !== "all" && baseRows.length > 0 && (
            <> (de {baseRows.length} en la consulta actual)</>
          )}
        </p>
      </Card>

      {visibleRows.length === 0 && !loading ? (
        <Alert>
          {contaminantFilter === "all"
            ? "No hay inspecciones registradas."
            : "No hay inspecciones con ese filtro de contaminante."}
        </Alert>
      ) : (
        <ul className="space-y-3">
          {visibleRows.map((item, i) => (
            <li key={`${item.plate}-${item.date}-${i}`}>
              <InspectionCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

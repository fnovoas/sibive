"use client";

import { useCallback, useEffect, useState } from "react";
import API from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import type { Inspection } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

export default function HistoryPage() {
  const [plate, setPlate] = useState("");
  const [allData, setAllData] = useState<Inspection[]>([]);
  const [displayData, setDisplayData] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await API.get<Inspection[]>("/inspections");
      const rows = [...res.data].sort((a, b) => b.date - a.date);
      setAllData(rows);
      setDisplayData(rows);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al cargar el historial."));
      setAllData([]);
      setDisplayData([]);
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
      setDisplayData(allData);
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
      setDisplayData(rows);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al consultar."));
      setDisplayData([]);
    } finally {
      setLoading(false);
    }
  };

  const showAll = () => {
    setPlate("");
    setDisplayData(allData);
    setError(null);
  };

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
            <Button variant="secondary" onClick={showAll} disabled={loading}>
              Ver todas
            </Button>
            <Button variant="ghost" onClick={loadAll} disabled={loading}>
              Actualizar
            </Button>
          </div>
        </div>

        {loading && <Alert>Cargando…</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <p className="text-sm text-muted">
          Total inspecciones: <strong>{displayData.length}</strong>
        </p>
      </Card>

      {displayData.length === 0 && !loading ? (
        <Alert>No hay inspecciones registradas.</Alert>
      ) : (
        <ul className="space-y-3">
          {displayData.map((item, i) => (
            <li key={`${item.plate}-${item.date}-${i}`}>
              <Card className="text-sm leading-relaxed">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-semibold text-brand">{item.plate}</span>
                  <span className="text-muted">
                    {new Date(item.date * 1000).toLocaleString()}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted">CO</dt>
                    <dd className="font-medium">{item.co}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">HC</dt>
                    <dd className="font-medium">{item.hc}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Opacidad</dt>
                    <dd className="font-medium">{item.opacity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Contaminante</dt>
                    <dd className="font-medium">
                      {item.isContaminant ? "Sí" : "No"}
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

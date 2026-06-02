"use client";

import { useCallback, useEffect, useState } from "react";
import API from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import type { BlocksResponse } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function BlocksPage() {
  const [data, setData] = useState<BlocksResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterTxOnly, setFilterTxOnly] = useState(false);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await API.get<BlocksResponse>("/blocks");
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(
        getApiErrorMessage(err, "Error al cargar la cadena de bloques.")
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBlocks();
  }, [fetchBlocks]);

  const visibleBlocks =
    data?.blocks.filter(
      (block) => !filterTxOnly || block.transactionCount > 0
    ) ?? [];

  return (
    <>
      <PageHeader
        title="Cadena de bloques"
        description="Bloques de la red local Geth, del más reciente al más antiguo."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={fetchBlocks} disabled={loading}>
          {loading ? "Cargando…" : "Actualizar"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setFilterTxOnly((current) => !current)}
          disabled={loading || !data}
        >
          {filterTxOnly ? "Ver todos" : "Ver bloques con transacciones"}
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {data && (
        <>
          <p className="mb-4 text-sm text-muted">
            Altura actual: <strong>{data.latest}</strong> — mostrando{" "}
            <strong>{visibleBlocks.length}</strong>{" "}
            {visibleBlocks.length === 1 ? "bloque" : "bloques"}
            {filterTxOnly && (
              <>
                {" "}
                (con transacciones, de {data.count} en total)
              </>
            )}
          </p>

          {visibleBlocks.length === 0 ? (
            <Alert>
              {filterTxOnly
                ? "No hay bloques con transacciones."
                : "No hay bloques en la cadena."}
            </Alert>
          ) : (
            <ol className="space-y-3">
              {visibleBlocks.map((block) => (
                <li key={block.hash}>
                  <Card className="text-sm">
                    <p className="font-semibold text-brand">
                      Bloque #{block.number}
                    </p>
                    <p className="mt-2 break-all text-xs text-muted">
                      {block.hash}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-muted">Fecha</dt>
                        <dd>
                          {new Date(block.timestamp * 1000).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Transacciones</dt>
                        <dd>{block.transactionCount}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Gas</dt>
                        <dd>
                          {block.gasUsed.toLocaleString()} /{" "}
                          {block.gasLimit.toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 break-all text-xs text-muted">
                      Firmante: {block.miner}
                    </p>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAlertasMetricas } from "./hooks/useAlertasMetricas";
import AlertaCard from "./components/AlertaCard";

type RangeType = "90d" | "180d" | "year" | "prevYear" | "all";

export default function AlertasPage() {
  const [range, setRange] = useState<RangeType>("year");
  const router = useRouter();

  const { data, loading } = useAlertasMetricas(range);

  const ranges = [
    { label: "90D", value: "90d" },
    { label: "180D", value: "180d" },
    { label: "Este año", value: "year" },
    { label: "Año anterior", value: "prevYear" },
    { label: "Todo", value: "all" },
  ];

  if (loading || !data) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-400 hover:text-white"
      >
        ← Volver
      </button>

      <h1 className="text-xl font-semibold">
        Alertas de métricas
      </h1>

      {/* FILTROS */}
      <div className="flex gap-2 flex-wrap">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value as RangeType)}
            className={`px-3 py-1 rounded text-sm ${
              range === r.value
                ? "bg-blue-600"
                : "bg-slate-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 gap-4">
        <AlertaCard
          titulo="Trámites"
          positiva={data.tramites.positiva}
          negativa={data.tramites.negativa}
          onClick={() => router.push("/metricas/tramites")}
        />

        <AlertaCard
          titulo="Brokers"
          positiva={data.brokers.positiva}
          negativa={data.brokers.negativa}
          onClick={() => router.push("/metricas/brokers")}
        />

        <AlertaCard
          titulo="Clientes"
          positiva={data.clientes.positiva}
          negativa={data.clientes.negativa}
          onClick={() => router.push("/metricas/clientes")}
        />

        <AlertaCard
          titulo="Tiempos"
          positiva={data.tiempos.positiva}
          negativa={data.tiempos.negativa}
          onClick={() => router.push("/metricas/tiempos")}
        />
      </div>
    </div>
  );
}
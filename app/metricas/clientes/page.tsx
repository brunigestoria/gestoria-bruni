"use client";

import { useState } from "react";
import { useClientes } from "./hook/useClientes";
import { useRouter } from "next/navigation";

type RangeType = "180d" | "90d" | "year" | "prevYear" | "all";

export default function ClientesPage() {
  const [range, setRange] = useState<RangeType>("year");
  const [sortBy, setSortBy] = useState<"ingresos" | "tramites">("ingresos");
  const [page, setPage] = useState(1);
const pageSize = 30; // podés hacerlo 50 si querés

  const { data, loading } = useClientes(range);
  const router = useRouter();

  const ranges: { label: string; value: RangeType }[] = [
    { label: "90D", value: "90d" },
    { label: "180D", value: "180d" },
    { label: "Este año", value: "year" },
    { label: "Año anterior", value: "prevYear" },
    { label: "Todo", value: "all" },
  ];

  if (loading) return <div className="p-6">Cargando...</div>;

  // 🔥 SORT
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "tramites") return b.tramites - a.tramites;
    return b.ingresos - a.ingresos;
  });
  // PAGINACION
  const totalPages = Math.ceil(sortedData.length / pageSize);

const paginatedData = sortedData.slice(
  (page - 1) * pageSize,
  page * pageSize
);

  // 🔥 KPIs
  const totalIngresos = data.reduce((acc, c) => acc + (c.ingresos || 0), 0);
  const totalTramites = data.reduce((acc, c) => acc + (c.tramites || 0), 0);

  const ticketPromedio =
    totalTramites > 0 ? totalIngresos / totalTramites : 0;

  const topCliente =
    sortedData.length > 0 ? sortedData[0] : null;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-400 hover:text-white"
      >
        ← Volver
      </button>

      <h1 className="text-xl font-semibold">Clientes</h1>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Ingresos" value={totalIngresos} />
        <Card title="Trámites" value={totalTramites} isMoney={false} />
        <Card title="Ticket promedio" value={ticketPromedio} />
        <Card
          title="Top cliente"
          value={topCliente?.cliente_nombre ?? "-"}
          isMoney={false}
        />
      </div>

      {/* ORDEN + FILTROS */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        {/* IZQUIERDA */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("ingresos")}
            className={`px-3 py-1 rounded ${
              sortBy === "ingresos" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            Ingresos
          </button>

          <button
            onClick={() => setSortBy("tramites")}
            className={`px-3 py-1 rounded ${
              sortBy === "tramites" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            Trámites
          </button>
        </div>

        {/* DERECHA */}
        <div className="flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 rounded text-sm ${
                range === r.value ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-slate-800 rounded-xl p-4">
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="text-left">Cliente</th>
              <th className="text-right">Trámites</th>
              <th className="text-right">Ingresos</th>
              <th className="text-right">Ganancia</th>
              <th className="text-right">Ticket</th>
              <th className="text-right">ICC</th>
              <th className="text-right">%</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((c, i) => (
              <tr key={c.cliente_id} className="border-t border-slate-700">
                <td className={i === 0 ? "text-yellow-400 font-bold" : ""}>
                  {i === 0 && "🥇 "} {c.cliente_nombre}
                </td>

                <td className="text-right tabular-nums">
                  {c.tramites ?? 0}
                </td>

                <td className="text-right text-green-400 tabular-nums">
                  ${(c.ingresos ?? 0).toLocaleString()}
                </td>

                <td className="text-right tabular-nums">
                  ${(c.ingresos ?? 0).toLocaleString()}
                </td>

                <td className="text-right tabular-nums">
                  ${(c.ticket ?? 0).toLocaleString()}
                </td>

                <td
                  className={`text-right tabular-nums ${
                    (c.icc ?? 0) >= 70
                      ? "text-green-400"
                      : (c.icc ?? 0) >= 40
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {(c.icc ?? 0).toFixed(1)}
                </td>

                <td className="text-right tabular-nums">
                  {(c.participacion ?? 0).toFixed(1)}%
                </td>
              </tr>
            ))}
           
          </tbody>
        </table>

        {/* BOTONES DE PAGINACION */}
         <div className="flex justify-between items-center mt-4">
  <button
    onClick={() => setPage((p) => Math.max(p - 1, 1))}
    className="px-3 py-1 bg-slate-700 rounded"
  >
    ← Anterior
  </button>

  <span className="text-sm text-gray-400">
    Página {page} de {totalPages}
  </span>

  <button
    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
    className="px-3 py-1 bg-slate-700 rounded"
  >
    Siguiente →
  </button>
</div>
      </div>
    </div>
  );
}

// CARD
function Card({
  title,
  value,
  isMoney = true,
}: {
  title: string;
  value: number | string;
  isMoney?: boolean;
}) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-xl font-bold">
        {typeof value === "number"
          ? isMoney
            ? `$${value.toLocaleString()}`
            : value.toLocaleString()
          : value}
      </p>
    </div>
  );
}
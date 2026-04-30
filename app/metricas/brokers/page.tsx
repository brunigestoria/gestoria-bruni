"use client";

import { useBrokers } from "@/app/metricas/brokers/hook/useBrokers";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartPoint = {
  mes: string;
  tramites: number;
};

type BrokerRow = {
  fecha_tramite: string;
  tramite_id: number;
};

type BrokerMetric = {
  broker_id: string;
  broker_nombre: string;
  ingresos: number;
  tramites: number;
  ticket: number;
  participacion: number;
  icc: number;
  crecimiento: number;
};

type RangeType = "90d" | "180d" | "year" | "prevYear" | "all";

export default function BrokersPage() {
  const [range, setRange] = useState<RangeType>("year");
  const [sortBy, setSortBy] = useState<"ingresos" | "tramites">("ingresos");
  const router = useRouter();

  const [selectedBroker, setSelectedBroker] =
    useState<BrokerMetric | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);


  const [page, setPage] = useState(1);
  const pageSize = 30;

  const { data, loading } = useBrokers(range);

  // grafico del broker seleccionado
  useEffect(() => {
  if (!selectedBroker) return;

  async function loadChart() {
    const brokerId = selectedBroker!.broker_id;

    const { data } = await supabase
      .from("vista_brokers_dashboard")
      .select("fecha_tramite, tramite_id")
      .eq("broker_id", brokerId);

    if (!data) return;

    const map: Record<string, number> = {};

    data.forEach((r: BrokerRow) => {
      const mes = new Date(r.fecha_tramite)
        .toISOString()
        .slice(0, 7);

      map[mes] = (map[mes] || 0) + 1;
    });

    const result: ChartPoint[] = Object.entries(map).map(
      ([mes, tramites]) => ({
        mes,
        tramites,
      })
    );

    result.sort((a, b) => a.mes.localeCompare(b.mes));

    setChartData(result);
  }

  loadChart();
}, [selectedBroker]);

  // cerrar modal con ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedBroker(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (loading) return <div className="p-6">Cargando...</div>;

  // SORT
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

  // KPIs
  const totalIngresos = data.reduce((acc, b) => acc + (b.ingresos || 0), 0);
  const totalTramites = data.reduce((acc, b) => acc + (b.tramites || 0), 0);

  const ticketPromedio =
    totalTramites > 0 ? totalIngresos / totalTramites : 0;

  const topBroker = sortedData.length > 0 ? sortedData[0] : null;

  const ranges: { label: string; value: RangeType }[] = [
    { label: "90D", value: "90d" },
    { label: "180D", value: "180d" },
    { label: "Este año", value: "year" },
    { label: "Año anterior", value: "prevYear" },
    { label: "Todo", value: "all" },
  ];

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-400 hover:text-white"
      >
        ← Volver
      </button>

      <h1 className="text-xl font-semibold">Brokers</h1>

      {/* FILTROS */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSortBy("ingresos");
              setPage(1);
            }}
            className={`px-3 py-1 rounded ${
              sortBy === "ingresos" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            Ingresos
          </button>

          <button
            onClick={() => {
              setSortBy("tramites");
              setPage(1);
            }}
            className={`px-3 py-1 rounded ${
              sortBy === "tramites" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            Trámites
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRange(r.value);
                setPage(1);
              }}
              className={`px-3 py-1 rounded text-sm ${
                range === r.value ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Ingresos" value={totalIngresos} />
        <Card title="Trámites" value={totalTramites} isMoney={false} />
        <Card title="Ticket promedio" value={ticketPromedio} />
        <Card
          title="Top broker"
          value={topBroker?.broker_nombre ?? "-"}
          isMoney={false}
        />
      </div>

      {/* TABLA */}
      <div className="bg-slate-800 rounded-xl p-4">
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="text-left">Broker</th>
              <th className="text-right">Trámites</th>
              <th className="text-right">Ingresos</th>
              <th className="text-right">Ganancia</th>
              <th className="text-right">Ticket</th>
              <th className="text-right">ICC</th>
              <th className="text-right">%</th>
              <th className="text-right">Growth</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((b, i) => (
              <tr
                key={b.broker_id}
                onClick={() => setSelectedBroker(b)}
                className="border-t border-slate-700 cursor-pointer hover:bg-slate-700/40"
              >
                <td className={i < 3 ? "text-yellow-300 font-semibold" : ""}>
                  {i === 0 && "🥇 "}
                  {i === 1 && "🥈 "}
                  {i === 2 && "🥉 "}
                  {b.broker_nombre}
                </td>

                <td className="text-right">{b.tramites}</td>

                <td className="text-right text-green-400">
                  ${b.ingresos.toLocaleString()}
                </td>

                <td className="text-right">
                  ${b.ingresos.toLocaleString()}
                </td>

                <td className="text-right">
                  ${b.ticket.toLocaleString()}
                </td>

                <td
                  className={`text-right ${
                    b.icc >= 70
                      ? "text-green-400"
                      : b.icc >= 40
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {b.icc.toFixed(1)}
                </td>

                <td className="text-right">
                  {b.participacion.toFixed(1)}%
                </td>

                <td
                  className={`text-right ${
                    b.crecimiento > 0
                      ? "text-green-400"
                      : b.crecimiento < 0
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {b.crecimiento > 0 && "▲ "}
                  {b.crecimiento < 0 && "▼ "}
                  {b.crecimiento.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MODAL */}
        {selectedBroker && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setSelectedBroker(null)}
          >
            <div
              className="bg-slate-800 p-6 rounded-xl w-150"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4">
                {selectedBroker.broker_nombre}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>Trámites: {selectedBroker.tramites}</div>
                <div>
                  Ingresos: ${selectedBroker.ingresos.toLocaleString()}
                </div>
                <div>
                  Ticket: ${selectedBroker.ticket.toLocaleString()}
                </div>
                <div>
                  Growth: {selectedBroker.crecimiento.toFixed(1)}%
                </div>
              </div>

              <div className="h-60">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={chartData}>
      <XAxis
  dataKey="mes"
  tickFormatter={(m) => m.slice(5)} // muestra solo MM
/>
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="tramites" />
    </LineChart>
  </ResponsiveContainer>
</div>

              <button
                onClick={() => setSelectedBroker(null)}
                className="mt-4 px-4 py-2 bg-red-600 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* PAGINACION */}
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
            onClick={() =>
              setPage((p) => Math.min(p + 1, totalPages))
            }
            className="px-3 py-1 bg-slate-700 rounded"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

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
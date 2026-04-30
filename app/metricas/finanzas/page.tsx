"use client";

import { useFinanzas } from "@/app/metricas/finanzas/hook/useFinanzas";
import { useRouter } from "next/navigation";
import FlujoCajaChart from "./components/FlujoCajaChart";


export default function FinanzasPage() {
  const { data, loading } = useFinanzas();
  const router = useRouter();

  if (loading) return <div>Cargando métricas...</div>;

  const { kpis, evolucion, proyeccion } = data!;

  return (
    <div className="p-6 space-y-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Volver
        </button>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="Ingresos" value={kpis.ingresos} />
        <Card title="Costos" value={kpis.costos} />
        <Card title="Ganancia" value={kpis.ganancia} />
        <Card title="Margen" value={`${kpis.margen.toFixed(1)}%`} />
        <Card title="A cobrar" value={kpis.saldoPendiente} />
      </div>

      {/* Evolución */}
      <div className="bg-slate-800 rounded-xl p-4">
  <table className="w-full text-sm">
    <thead className="text-gray-400">
      <tr>
        <th className="text-left">Mes</th>
        <th>Ingresos</th>
        <th>Costos</th>
        <th>Ganancia</th>
      </tr>
    </thead>
    <tbody>
      {evolucion.map((m) => (
        <tr key={m.mes} className="border-t border-slate-700">
          <td>{m.mes}</td>
          <td className="text-green-400">
            ${m.ingresos.toLocaleString()}
          </td>
          <td className="text-red-400">
            ${m.costos.toLocaleString()}
          </td>
          <td className="font-semibold">
            ${m.ganancia.toLocaleString()}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* Proyección */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Proyección</h2>
        {proyeccion.length === 0 ? (
  <div className="text-gray-400">No hay proyecciones</div>
) : (
  <div className="bg-slate-800 rounded-xl p-4">
    {proyeccion.map((p) => (
      <div key={p.mes} className="flex justify-between">
        <span>{p.mes}</span>
        <span className="text-blue-400">
          ${p.ingresos.toLocaleString()}
        </span>

      </div>
    ))}
   
  </div>
)}
      </div>
      {/* GRÁFICO DE FLUJO DE CAJA */ }
     <FlujoCajaChart data={evolucion} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-md">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-1">
        {typeof value === "number"
          ? `$${value.toLocaleString()}`
          : value}
      </p>
    </div>
  );
}
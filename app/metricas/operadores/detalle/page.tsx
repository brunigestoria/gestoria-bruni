"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

type Row = {
  operador_id: string;
  nombre: string;
  cantidad_tramites: number;
  tiempo_principal: number;
  tiempo_observado?: number;
};
type Rol = "Comercial" | "Tecnico" | "Repartidor";

/* ================= PAGE ================= */

export default function MetricasOperadoresPage() {
  const router = useRouter();

  const [rol, setRol] = useState<Rol>("Comercial");
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  

  /* ================= LOAD ================= */

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);

      let tabla = "";

      if (rol === "Comercial") tabla = "vista_metricas_operador_comercial";
      if (rol === "Tecnico") tabla = "vista_metricas_operador_tecnico";
      if (rol === "Repartidor") tabla = "vista_metricas_repartidor";

      const { data } = await supabase.from(tabla).select("*");

      setData((data as Row[]) || []);
      setLoading(false);
    };

    cargar();
  }, [rol]);

  /* ================= CALCULOS ================= */

  const promedio =
    data.length > 0
      ? data.reduce((acc, d) => acc + (d.tiempo_principal || 0), 0) / data.length
      : 0;

  const mejor = [...data].sort((a, b) => a.tiempo_principal - b.tiempo_principal)[0];
  const peor = [...data].sort((a, b) => b.tiempo_principal - a.tiempo_principal)[0];

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Volver
        </button>

        <h1 className="text-xl font-semibold">Métricas de Operadores</h1>
      </div>

      {/* TABS */}

<div className="flex gap-2">
  {(["Comercial", "Tecnico", "Repartidor"] as Rol[]).map((r) => (
    <button
      key={r}
      onClick={() => setRol(r)}
      className={`px-3 py-1 rounded ${
        rol === r ? "bg-blue-600" : "bg-gray-700"
      }`}
    >
      {r}
    </button>
  ))}
</div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card titulo="Promedio" valor={`${promedio.toFixed(1)} días`} />
        <Card titulo="Mejor" valor={mejor ? `${mejor.nombre}` : "-"} />
        <Card titulo="Peor" valor={peor ? `${peor.nombre}` : "-"} />
        <Card titulo="Trámites" valor={data.reduce((a, b) => a + (b.cantidad_tramites || 0), 0)} />
      </div>

      {/* TABLA */}
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="bg-gray-800 rounded overflow-hidden">
          <div className="grid grid-cols-5 p-3 text-sm text-gray-400 border-b border-gray-700">
            <div>Operador</div>
            <div>Trámites</div>
            <div>Tiempo</div>
            <div>Obs</div>
            <div>Ranking</div>
          </div>

          {data
            .sort((a, b) => a.tiempo_principal - b.tiempo_principal)
            .map((d, i) => (
              <div
                key={d.operador_id}
                className="grid grid-cols-5 p-3 border-b border-gray-700 text-sm hover:bg-gray-700"
              >
                <div>{d.nombre}</div>
                <div>{d.cantidad_tramites}</div>
                <div className={getColor(d.tiempo_principal, promedio)}>
  {(d.tiempo_principal || 0).toFixed(1)} días
</div>
                <div>{d.tiempo_observado || 0}</div>
                <div>#{i + 1}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTES ================= */

function getColor(valor: number, promedio: number) {
  if (!promedio) return "";

  const ratio = valor / promedio;

  if (ratio > 1.4) return "text-red-500";
  if (ratio > 1.1) return "text-red-300";
  if (ratio > 0.9) return "text-yellow-400";
  if (ratio > 0.7) return "text-green-300";
  return "text-green-500";
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="bg-gray-800 p-4 rounded">
      <p className="text-sm text-gray-400">{titulo}</p>
      <p className="text-lg font-semibold">{valor}</p>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

type Row = {
  operador_id: string;
  nombre: string;

  tramites_comercial?: number;
  tiempo_comercial?: number;
  obs_comercial?: number;

  tramites_tecnico?: number;
  tiempo_tecnico?: number;
  obs_tecnico?: number;

  tramites_reparto?: number;
  tiempo_reparto?: number;
};

type OperadorItem = {
  nombre: string;
  promedio: number;
  diff: number;
};

type RolData = {
  promedioRol: number;
  arriba: OperadorItem[];
  abajo: OperadorItem[];
  mejores: OperadorItem[];
  peores: OperadorItem[];
};

/* ================= HELPERS ================= */

function getColor(diff: number) {
  if (diff > 30) return "text-red-500";
  if (diff > 10) return "text-orange-400";
  if (diff > -10) return "text-yellow-400";
  if (diff > -30) return "text-green-400";
  return "text-green-600";
}

/* ================= PAGE ================= */

export default function DashboardOperadores() {
  const router = useRouter();

  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("vista_metricas_operadores_full_v2")
      .select("*");

    setData((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await cargar();
    };
    init();
  }, []);

  if (loading) return <div className="p-6">Cargando métricas...</div>;

  /* ================= TRANSFORM ================= */

  function procesarRol(
    keyTramites: keyof Row,
    keyTiempo: keyof Row
  ) {
    const lista = data
      .map((o) => {
        const tramites = Number(o[keyTramites] || 0);
        const tiempo = Number(o[keyTiempo] || 0);

        const promedio = tramites ? tiempo / tramites : 0;

        return {
          nombre: o.nombre,
          tramites,
          promedio,
        };
      })
      .filter((o) => o.tramites > 0);

    const promedioRol =
      lista.reduce((acc, o) => acc + o.promedio, 0) /
      (lista.length || 1);

    const enriched = lista.map((o) => {
      const diff =
        promedioRol > 0
          ? ((o.promedio - promedioRol) / promedioRol) * 100
          : 0;

      return {
        ...o,
        diff,
      };
    });

    return {
      promedioRol,
      arriba: enriched.filter((o) => o.promedio < promedioRol),
      abajo: enriched.filter((o) => o.promedio >= promedioRol),
      mejores: [...enriched].sort((a, b) => a.promedio - b.promedio).slice(0, 3),
      peores: [...enriched].sort((a, b) => b.promedio - a.promedio).slice(0, 3),
    };
  }

  const comercial = procesarRol("tramites_comercial", "tiempo_comercial");
  const tecnico = procesarRol("tramites_tecnico", "tiempo_tecnico");
  const reparto = procesarRol("tramites_reparto", "tiempo_reparto");

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-semibold">
          Dashboard Operadores
        </h1>
      </div>

      <Bloque titulo="Comercial" data={comercial} />
      <Bloque titulo="Técnico" data={tecnico} />
      <Bloque titulo="Reparto" data={reparto} />

      <div>
        <button
          onClick={() => router.push("/metricas/operadores/detalle")}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
        >
          Ver detalle completo
        </button>
      </div>

    </div>
  );
}

/* ================= BLOQUE ================= */

function Bloque({
  titulo,
  data,
}: {
  titulo: string;
  data: RolData;
}) {
  return (
    <div className="bg-gray-800 p-4 rounded space-y-4">

      <h2 className="text-lg font-semibold">{titulo}</h2>

      <div className="grid md:grid-cols-3 gap-4">

        {/* ARRIBA */}
        <div>
          <p className="text-sm text-green-400">
            ↑ Encima del promedio ({data.arriba.length})
          </p>

          {data.mejores.map((o, i) => (
            <div key={i} className="text-sm flex justify-between">
              <span>#{i + 1} {o.nombre}</span>
              <span className={getColor(o.diff)}>
                {o.promedio.toFixed(1)} días
              </span>
            </div>
          ))}
        </div>

        {/* PROMEDIO */}
        <div className="text-center">
          <p className="text-sm text-gray-400">Promedio</p>
          <p className="text-xl font-semibold">
            {data.promedioRol.toFixed(1)} días
          </p>
        </div>

        {/* ABAJO */}
        <div>
          <p className="text-sm text-red-400">
            ↓ Debajo del promedio ({data.abajo.length})
          </p>

          {data.peores.map((o, i) => (
            <div key={i} className="text-sm flex justify-between">
              <span>#{i + 1} {o.nombre}</span>
              <span className={getColor(o.diff)}>
                {o.promedio.toFixed(1)} días
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
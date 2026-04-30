"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

/* ================= TYPES ================= */

type Tramite = {
  id: string;
  created_at: string;
  estado?: string;
  fecha_finalizacion?: string;
};

/* ================= COMPONENT ================= */

export default function MetricasTramitesPage() {
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const hoy = new Date();
  const mesActualNum = hoy.getMonth();
  const anioActual = hoy.getFullYear();

  /* ================= HELPERS ================= */

  function esMismoMes(fecha: string, mes: number, anio: number) {
    const f = new Date(fecha);
    return f.getMonth() === mes && f.getFullYear() === anio;
  }

  /* ================= DATA ================= */

  useEffect(() => {
    async function cargar() {
      setLoading(true);

      const { data } = await supabase
        .from("tramites")
        .select("id, created_at, estado, fecha_finalizacion");

      setTramites(data || []);
      setLoading(false);
    }

    cargar();
  }, []);

  /* ================= CALCULOS ================= */

  const mesActual = tramites.filter((t) =>
    esMismoMes(t.created_at, mesActualNum, anioActual)
  );

  const mesAnterior = new Date(anioActual, mesActualNum - 1);
  const mesAnteriorData = tramites.filter((t) =>
    esMismoMes(t.created_at, mesAnterior.getMonth(), mesAnterior.getFullYear())
  );

  const mismoMesAnioAnterior = tramites.filter((t) =>
    esMismoMes(t.created_at, mesActualNum, anioActual - 1)
  );

  const iniciados = mesActual.length;

  const finalizados = mesActual.filter(
    (t) => t.estado === "finalizado"
  ).length;

  const variacionMensual =
    mesAnteriorData.length === 0
      ? 0
      : ((iniciados - mesAnteriorData.length) / mesAnteriorData.length) * 100;

  const proyeccion = Math.round(
    (iniciados / hoy.getDate()) *
      new Date(anioActual, mesActualNum + 1, 0).getDate()
  );

  /* 🔹 tasa finalización */
  const tasaFinalizacion =
    iniciados === 0 ? 0 : Math.round((finalizados / iniciados) * 100);

  /* 🔹 tiempo promedio */
  const tiempos = mesActual
    .filter((t) => t.estado === "finalizado" && t.fecha_finalizacion)
    .map((t) => {
      const inicio = new Date(t.created_at).getTime();
      const fin = new Date(t.fecha_finalizacion!).getTime();
      return (fin - inicio) / (1000 * 60 * 60 * 24);
    });

  const tiempoPromedio =
    tiempos.length === 0
      ? 0
      : Math.round(
          tiempos.reduce((a, b) => a + b, 0) / tiempos.length
        );

  /* 🔹 evolución mensual */
  const ultimosMeses = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);

    const mes = d.getMonth();
    const anio = d.getFullYear();

    const cantidad = tramites.filter((t) =>
      esMismoMes(t.created_at, mes, anio)
    ).length;

    return {
      label: `${mes + 1}/${anio.toString().slice(-2)}`,
      cantidad,
    };
  }).reverse();

  /* ================= UI ================= */

  if (loading) return <div className="p-6">Cargando métricas...</div>;

  const max = Math.max(...ultimosMeses.map((m) => m.cantidad), 1);
  const porAnio: Record<number, number> = {};

tramites.forEach((t) => {
  const anio = new Date(t.created_at).getFullYear();
  porAnio[anio] = (porAnio[anio] || 0) + 1;
});

const datosAnuales = Object.entries(porAnio)
  .map(([anio, cantidad]) => ({
    anio,
    cantidad,
  }))
  .sort((a, b) => Number(a.anio) - Number(b.anio));


  return (
    <div className="p-6 space-y-6">

         <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Volver
        </button>

      <h1 className="text-2xl font-semibold">Métricas de Trámites</h1>

      {/* KPI PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card titulo="Trámites (mes)" valor={iniciados} />

        <Card
          titulo="Mes anterior"
          valor={mesAnteriorData.length}
          extra={`${variacionMensual.toFixed(1)}%`}
        />

        <Card
          titulo="Mismo mes año anterior"
          valor={mismoMesAnioAnterior.length}
        />

        <Card titulo="Proyección" valor={proyeccion} />
      </div>

      {/* KPI SECUNDARIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card titulo="Iniciados" valor={iniciados} />
        <Card titulo="Finalizados" valor={finalizados} />
      </div>

      {/* KPI AVANZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          titulo="Tasa de finalización"
          valor={tasaFinalizacion}
          sufijo="%"
        />

        <Card
          titulo="Tiempo promedio"
          valor={tiempoPromedio}
          sufijo=" días"
        />
      </div>

      {/* GRÁFICO MENSUAL */}
<div className="bg-gray-800 p-4 rounded">
  <p className="text-sm text-gray-400 mb-4">
    Evolución mensual (últimos 12 meses)
  </p>

  <div className="relative h-40">
    <svg className="w-full h-full">
      {(() => {
        const max = Math.max(...ultimosMeses.map(m => m.cantidad), 1);

        const puntos = ultimosMeses.map((m, i) => {
          const x = (i / (ultimosMeses.length - 1)) * 100;
          const y = 100 - (m.cantidad / max) * 100;
          return `${x},${y}`;
        }).join(" ");

        return (
          <>
            {/* línea */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={puntos}
              vectorEffect="non-scaling-stroke"
            />

            {/* puntos */}
            {ultimosMeses.map((m, i) => {
  const x = (i / (ultimosMeses.length - 1)) * 100;
  const y = 100 - (m.cantidad / max) * 100;

  return (
    <g key={i}>
      {/* punto */}
      <circle
        cx={`${x}%`}
        cy={`${y}%`}
        r="4"
        fill="#3b82f6"
      />

      {/* área hover */}
      <rect
        x={`calc(${x}% - 10px)`}
        y={`calc(${y}% - 10px)`}
        width="20"
        height="20"
        fill="transparent"
      >
        <title>{`${m.label}: ${m.cantidad} trámites`}</title>
      </rect>
    </g>
  );
})}
          </>
        );
      })()}
    </svg>

    {/* labels */}
    <div className="flex justify-between text-xs text-gray-400 mt-2">
      {ultimosMeses.map((m, i) => (
        <span key={i}>{m.label}</span>
      ))}
    </div>
  </div>
</div>

{/** GRÁFICO ANUAL */}
<div className="bg-gray-800 p-4 rounded">
  <p className="text-sm text-gray-400 mb-4">
    Comparativa anual
  </p>

  {(() => {
    const max = Math.max(...datosAnuales.map(d => d.cantidad), 1);

    return (
      <div className="flex items-end gap-4 h-40">
        {datosAnuales.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1">

            <div
              className="w-full bg-green-500 rounded-t"
              style={{
                height: `${(d.cantidad / max) * 100}%`,
                minHeight: "6px",
              }}
              title={`${d.anio}: ${d.cantidad} trámites`}
            />

            <p className="text-xs mt-2 text-gray-400">
              {d.anio}
            </p>
          </div>
        ))}
      </div>
    );
  })()}
</div>
    </div>
  );
}

/* ================= CARD ================= */

function Card({
  titulo,
  valor,
  extra,
  sufijo,
}: {
  titulo: string;
  valor: number;
  extra?: string;
  sufijo?: string;
}) {
  return (
    <div className="bg-gray-800 p-4 rounded">
      <p className="text-sm text-gray-400">{titulo}</p>

      <p className="text-xl font-semibold">
        {valor}
        {sufijo}
      </p>

      {extra && (
        <p className="text-xs text-gray-500 mt-1">{extra}</p>
      )}
    </div>
  );
}
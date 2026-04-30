"use client";

import { useRouter } from "next/navigation";

/* ================= CONFIG ================= */

const secciones = [
  {
    titulo: "Finanzas",
    descripcion: "Ingresos, costos, ganancias y evolución",
    ruta: "/metricas/finanzas",
  },
  {
    titulo: "Trámites",
    descripcion: "Volumen, evolución y proyecciones",
    ruta: "/metricas/tramites",
  },
  {
    titulo: "Operativo",
    descripcion: "Tiempos por dependencia y rendimiento",
    ruta: "/metricas/operativo",
  },
  {
    titulo: "Operadores",
    descripcion: "Desempeño individual y productividad",
    ruta: "/metricas/operadores",
  },
  {
    titulo: "Brokers",
    descripcion: "Rendimiento, volumen y calidad",
    ruta: "/metricas/brokers",
  },
  {
    titulo: "Alertas",
    descripcion: "Riesgos, demoras y pendientes críticos",
    ruta: "/metricas/alertas",
  },
  {
    titulo: "Clientes",
    descripcion: "Comportamiento y valor por cliente",
    ruta: "/metricas/clientes",
  },
];

/* ================= COMPONENT ================= */

export default function MetricasPage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Métricas</h1>
        <p className="text-sm text-gray-400">
          Análisis y control del negocio
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {secciones.map((s) => (
          <Card
            key={s.titulo}
            titulo={s.titulo}
            descripcion={s.descripcion}
            onClick={() => router.push(s.ruta)}
          />
        ))}
      </div>
    </div>
  );
}

/* ================= CARD ================= */

function Card({
  titulo,
  descripcion,
  onClick,
}: {
  titulo: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="
        bg-gray-800
        p-5
        rounded
        cursor-pointer
        hover:bg-gray-700
        transition
        border border-transparent
        hover:border-gray-600
      "
    >
      <h2 className="text-lg font-medium">{titulo}</h2>
      <p className="text-sm text-gray-400 mt-1">
        {descripcion}
      </p>
    </div>
  );
}
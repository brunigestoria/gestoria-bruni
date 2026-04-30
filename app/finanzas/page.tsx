"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type TramiteFinanzas = {
  tramite_id: string;
  total_final: number;
  created_at: string;
};

type Pago = {
  id: string;
  tramite_id: string;
  monto: number;
  fecha: string;
  es_promesa: boolean;
  cumplido: boolean;
  anulado: boolean;
  medio_pago?: string;
};

type Precio = {
  id: string;
  precio_base: number;
  activo: boolean;
};

const MESES = [
  "Todos",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function FinanzasPage() {
  const [mes, setMes] = useState(0);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);

  const [tramites, setTramites] = useState<TramiteFinanzas[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);

  const [loading, setLoading] = useState(true);

  // 🔥 CARGAR DATOS
  async function cargar() {
    setLoading(true);

    const { data: tramitesData } = await supabase
      .from("tramite_finanzas")
      .select("tramite_id, total_final, created_at");

    const { data: pagosData } = await supabase
      .from("pagos_cliente")
      .select("*");

    const { data: preciosData } = await supabase
      .from("tabla_precios")
      .select("id, precio_base, activo")
      .eq("activo", true);

    setTramites(tramitesData || []);
    setPagos(pagosData || []);
    setPrecios(preciosData || []);

    // 🔥 años dinámicos
    const anios = Array.from(
      new Set(
        (tramitesData || []).map((t) =>
          new Date(t.created_at).getFullYear()
        )
      )
    ).sort((a, b) => b - a);

    setAniosDisponibles(anios);

    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, [mes, anio]);

  // 🔥 filtro periodo
  function esPeriodo(fecha: string) {
    const f = new Date(fecha);

    if (mes === 0) {
      return f.getFullYear() === anio;
    }

    return (
      f.getMonth() === mes - 1 &&
      f.getFullYear() === anio
    );
  }


  // 🔹 TRÁMITES
  const tramitesMes = tramites.filter((t) =>
    esPeriodo(t.created_at)
  );

  const idsMes = tramitesMes.map((t) => t.tramite_id);

  const facturado = tramitesMes.reduce(
    (acc, t) => acc + (t.total_final || 0),
    0
  );

  // 🔹 COBRADO
  const cobrado = pagos
    .filter((p) => !p.es_promesa && !p.anulado)
    .filter((p) => esPeriodo(p.fecha))
    .reduce((acc, p) => acc + (p.monto || 0), 0);

  const cobradoMes = pagos
    .filter((p) => idsMes.includes(p.tramite_id))
    .filter((p) => !p.es_promesa && !p.anulado)
    .reduce((acc, p) => acc + (p.monto || 0), 0);

  // 🔹 COSTOS (simplificado)
  const costos = precios.reduce(
    (acc, p) => acc + (p.precio_base || 0),
    0
  );

  // 🔹 RESULTADOS
  const gananciaReal = cobrado - costos;
  const gananciaEstimada = facturado - costos;
  const saldo = facturado - cobradoMes;

  // 🔹 PROMESAS
  const promesas = pagos.filter(
    (p) => p.es_promesa && !p.anulado
  );

  const promesasCumplidas = promesas
    .filter((p) => p.cumplido)
    .reduce((acc, p) => acc + p.monto, 0);

  const promesasCumplidasCant = promesas.filter(
    (p) => p.cumplido
  ).length;

  const promesasIncumplidas = promesas
    .filter((p) => !p.cumplido)
    .reduce((acc, p) => acc + p.monto, 0);

  const promesasIncumplidasCant = promesas.filter(
    (p) => !p.cumplido
  ).length;

  // 🔹 MEDIOS DE PAGO
  const medios: Record<string, number> = {};

  pagos
    .filter((p) => !p.es_promesa && !p.anulado)
    .filter((p) => esPeriodo(p.fecha))
    .forEach((p) => {
      let medio = p.medio_pago?.toLowerCase() || "efectivo";

      if (medio === "sin definir") medio = "efectivo";

      medios[medio] = (medios[medio] || 0) + p.monto;
    });

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-xl font-semibold">Finanzas</h1>

      {/* 🔹 FILTROS */}
      <div className="flex gap-2">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="bg-gray-800 px-2 py-1 rounded"
        >
          {MESES.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="bg-gray-800 px-2 py-1 rounded"
        >
          {aniosDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* 🔷 BLOQUE PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  <Card title="Facturado" value={facturado} className="md:col-span-2 text-lg" />
  <div /> {/* espacio vacío para mantener layout */}

  <Card title="Cobrado" value={cobrado} green />
  <Card title="Ganancia Real" value={gananciaReal} highlight />

  <Card title="Costos" value={costos} red />
  <Card title="Ganancia Estimada" value={gananciaEstimada} />

 <Card 
  title="Saldo" 
  value={saldo} 
  red 
  className="md:col-span-2 border border-red-500/30"
/>
  <div /> {/* espacio vacío */}

</div>

      {/* 🟡 PROMESAS */}
      <div className="bg-gray-900 p-4 rounded space-y-4">
        <h3 className="text-sm text-gray-400">PROMESAS</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            title="Cumplidas"
            value={promesasCumplidas}
            extra={`${promesasCumplidasCant} casos`}
            green
          />
          <Card
            title="Incumplidas"
            value={promesasIncumplidas}
            extra={`${promesasIncumplidasCant} casos`}
            red
          />
        </div>
      </div>

      {/* 💳 MEDIOS DE PAGO */}
      <div className="bg-gray-900 p-4 rounded space-y-4">
        <h3 className="text-sm text-gray-400">MEDIOS DE PAGO</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Efectivo" value={medios["efectivo"] || 0} />
          <Card title="Transferencia" value={medios["transferencia"] || 0} />
          <Card title="Pago electrónico" value={medios["pago electronico"] || 0} />
        </div>
      </div>

    </div>
  );
}

// 🔹 CARD
function Card({
  title,
  value,
  extra,
  green,
  red,
  highlight,
}: {
  title: string;
  value: number;
  extra?: string;
  green?: boolean;
  red?: boolean;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className="bg-gray-800 p-4 rounded space-y-1">
      <p className="text-xs text-gray-400">{title}</p>

      <p
        className={`text-lg font-semibold
        ${green ? "text-green-400" : ""}
        ${red ? "text-red-400" : ""}
        ${highlight ? "text-blue-400 text-xl" : ""}
      `}
      >
        ${value.toLocaleString()}
      </p>

      {extra && (
        <p className="text-xs text-gray-500">{extra}</p>
      )}
    </div>
  );
}
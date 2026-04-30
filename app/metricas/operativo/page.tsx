"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

type Row = {
  dependencia: string;
  cantidad: number;
  dias_total?: number;
  dias_prefectura?: number;
  dias_hasta_presentado?: number;
};

type TotalRow = {
  dependencia: string;
  dias_total: number;
  cantidad: number;
};

type PrefecturaRow = {
  dependencia: string;
  dias_prefectura: number;
};

type PresentadoRow = {
  dependencia: string;
  dias_hasta_presentado: number;
};

type VolumenRow = {
  dependencia: string;
  cantidad_tramites: number;
};


/* ================= COMPONENT ================= */

export default function MetricasOperativasPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
    const router = useRouter();
    const peor = data[0]?.dependencia;
    const [sortBy, setSortBy] = useState<keyof Row>("dias_total");
const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function cargar() {
      setLoading(true);

      /* 🔹 TOTAL */
      const { data: total } = await supabase
        .from("vista_metricas_dependencia_total")
        .select("*");

      /* 🔹 PREFECTURA */
      const { data: prefectura } = await supabase
        .from("vista_metricas_dependencia_prefectura")
        .select("*");

      /* 🔹 PRESENTADO */
      const { data: presentado } = await supabase
        .from("vista_metricas_dependencia_presentado")
        .select("*");

      /* 🔹 VOLUMEN */
      const { data: volumen } = await supabase
        .from("vista_metricas_dependencia_volumen")
        .select("*");

      /* 🔥 MERGE DE TODO */
      const map = new Map<string, Row>();

     (total || []).forEach((t: TotalRow) => {
  map.set(t.dependencia, {
    dependencia: t.dependencia,
    cantidad: t.cantidad,
    dias_total: Number(t.dias_total),
  });
});

(prefectura || []).forEach((p: PrefecturaRow) => {
  const item = map.get(p.dependencia);
  if (item) {
    item.dias_prefectura = Number(p.dias_prefectura);
  }
});

(presentado || []).forEach((p: PresentadoRow) => {
  const item = map.get(p.dependencia);
  if (item) {
    item.dias_hasta_presentado = Number(p.dias_hasta_presentado);
  }
});

(volumen || []).forEach((v: VolumenRow) => {
  const item = map.get(v.dependencia);
  if (item) {
    item.cantidad = v.cantidad_tramites;
  }
});

      (volumen || []).forEach((v: VolumenRow) => {
        const item = map.get(v.dependencia);
        if (item) {
          item.cantidad = v.cantidad_tramites;
        }
      });

      const resultado = Array.from(map.values()).sort(
        (a, b) => (b.dias_total || 0) - (a.dias_total || 0)
      );


      setData(resultado);
      setLoading(false);
    }

    cargar();
  }, []);

  function handleSort(col: keyof Row) {
  if (sortBy === col) {
    setOrder(order === "asc" ? "desc" : "asc");
  } else {
    setSortBy(col);
    setOrder("desc");
  }
}

function ordenar(data: Row[]) {
  return [...data].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;

    if (typeof aVal === "string") {
      return order === "asc"
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }

    return order === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });
}

  if (loading) return <div className="p-6">Cargando métricas...</div>;
  const dataOrdenada = ordenar(data);

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
    <div className="flex items-center justify-between">
  <button
    onClick={() => router.back()}
    className="text-sm text-gray-400 hover:text-white"
  >
    ← Volver
  </button>

  <h1 className="text-2xl font-semibold">
    Métricas Operativas
  </h1>
</div>

      {/* TABLA */}
      <div className="bg-gray-900 rounded overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-800 text-gray-400">
  <tr>
    <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("dependencia")}>
      Dependencia {sortBy === "dependencia" && (order === "asc" ? "↑" : "↓")}
    </th>

    <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("dias_total")}>
      Total (días) {sortBy === "dias_total" && (order === "asc" ? "↑" : "↓")}
    </th>

    <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("dias_prefectura")}>
      Días en Prefectura {sortBy === "dias_prefectura" && (order === "asc" ? "↑" : "↓")}
    </th>

    <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("dias_hasta_presentado")}>
      Preparación {sortBy === "dias_hasta_presentado" && (order === "asc" ? "↑" : "↓")}
    </th>

    <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("cantidad")}>
      Volumen {sortBy === "cantidad" && (order === "asc" ? "↑" : "↓")}
    </th>
  </tr>
</thead>


          <tbody>
            {dataOrdenada.map((d) => (
              <tr
                key={d.dependencia}
                className="border-t border-gray-800 hover:bg-gray-800/50"
              >
                <td className="p-3">{d.dependencia}</td>
className={`border-t border-gray-800 ${
  d.dependencia === peor ? "bg-red-900/20" : ""
}`}
                <td className={`p-3 ${colorTiempo(d.dias_total)}`}>
                  {format(d.dias_total)}
                </td>

                <td className="p-3 text-gray-300">
                  {format(d.dias_prefectura)}
                </td>

                <td className="p-3 text-gray-300">
                  {format(d.dias_hasta_presentado)}
                </td>

                <td className="p-3 text-gray-300">
                  {d.cantidad || 0}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */


function format(v?: number) {
  if (!v && v !== 0) return "-";
  return `${Math.round(v)} días`;
}

function colorTiempo(v?: number) {
  if (!v && v !== 0) return "";

  if (v > 40) return "text-red-400";
  if (v > 25) return "text-yellow-400";

  return "text-green-400";
}
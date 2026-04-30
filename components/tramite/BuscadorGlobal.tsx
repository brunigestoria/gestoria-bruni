"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ResultadoBusqueda = {
  tipo: string;
  ref_id: string;
  titulo: string;
  subtitulo: string;
  score: number;
};

export default function BuscadorGlobal({
  onSelect,
}: {
  onSelect: (id: string, tipo: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // 🔥 DEBOUNCE LIMPIO
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length < 2) {
        setResultados([]);
        return;
      }

      const { data, error } = await supabase.rpc("buscar_global", {
        q: query,
      });

      if (error) {
        console.error("Error búsqueda:", error);
        setResultados([]);
        return;
      }

      setResultados(data || []);
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // 🔥 AGRUPADO
  const grupos = {
    tramite: resultados.filter((r) => r.tipo === "tramite").slice(0, 5),
    embarcacion: resultados.filter((r) => r.tipo === "embarcacion").slice(0, 5),
    cliente: resultados.filter((r) => r.tipo === "cliente").slice(0, 3),
    broker: resultados.filter((r) => r.tipo === "broker").slice(0, 3),
  };

  // 🔥 LISTA PLANA (para teclado)
  const listaPlana = [
    ...grupos.tramite,
    ...grupos.embarcacion,
    ...grupos.cliente,
    ...grupos.broker,
  ];

  async function handleSelect(r: ResultadoBusqueda) {
    onSelect(r.ref_id, r.tipo);

    if (r.tipo === "cliente") {
      router.push(`/historial/clientes/${r.ref_id}`);
    }

    if (r.tipo === "broker") {
      router.push(`/historial/brokers/${r.ref_id}`);
    }

    if (r.tipo === "embarcacion") {
      const { data: tramites, error } = await supabase
        .from("v_tramites_operativo")
        .select("tramite_id")
        .eq("embarcacion_id", r.ref_id)
        .neq("estado", "finalizado")
        .order("fecha_creacion", { ascending: false })
        .limit(1);

      if (!error && tramites?.length) {
        router.push(
          `/historial/embarcaciones/${r.ref_id}?tramite=${tramites[0].tramite_id}`
        );
      } else {
        router.push(`/historial/embarcaciones/${r.ref_id}`);
      }
    }

    setResultados([]);
    setQuery("");
    setSelectedIndex(-1);
  }

  function renderItem(r: ResultadoBusqueda, index: number) {
    return (
      <div
        key={`${r.tipo}-${r.ref_id}-${index}`}
        onClick={() => handleSelect(r)}
        className={`p-2 cursor-pointer text-sm flex flex-col
          ${index === selectedIndex ? "bg-gray-700" : "hover:bg-gray-800"}
        `}
      >
        <div className="flex justify-between">
          <span>{r.titulo}</span>

          <span className="text-xs text-gray-500 capitalize">
            {r.tipo}
          </span>
        </div>

        <div className="text-xs text-gray-400">
          {r.subtitulo}
        </div>
      </div>
    );
  }

  let indexGlobal = 0;

  return (
    <div className="relative w-80">

      {/* INPUT */}
      <input
        placeholder="Buscar embarcación, titular, DNI..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            setSelectedIndex((prev) =>
              prev < listaPlana.length - 1 ? prev + 1 : prev
            );
          }

          if (e.key === "ArrowUp") {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }

          if (e.key === "Enter") {
            if (listaPlana[selectedIndex]) {
              handleSelect(listaPlana[selectedIndex]);
            }
          }
        }}
        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
      />

      {/* RESULTADOS */}
      {resultados.length > 0 && (
        <div className="absolute bg-gray-900 w-full mt-1 rounded shadow border border-gray-700 z-50 max-h-96 overflow-y-auto">

          {/* 📄 TRÁMITES */}
          {grupos.tramite.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-800">
                📄 Trámites
              </div>
              {grupos.tramite.map((r) => renderItem(r, indexGlobal++))}
            </div>
          )}

          {/* 🚤 EMBARCACIONES */}
          {grupos.embarcacion.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-800">
                🚤 Embarcaciones
              </div>
              {grupos.embarcacion.map((r) => renderItem(r, indexGlobal++))}
            </div>
          )}

          {/* 👤 CLIENTES */}
          {grupos.cliente.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-800">
                👤 Clientes
              </div>
              {grupos.cliente.map((r) => renderItem(r, indexGlobal++))}
            </div>
          )}

          {/* 🧑‍💼 BROKERS */}
          {grupos.broker.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-800">
                🧑‍💼 Brokers
              </div>
              {grupos.broker.map((r) => renderItem(r, indexGlobal++))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
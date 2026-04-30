"use client";

import { useState } from "react";
import { useParametros } from "./hook/useParametros";
import ModalParametro from "./components/ModalParametro";
import { useRouter } from "next/navigation";
import type { Parametro } from "./hook/useParametros";
import { supabase } from "@/lib/supabase/client";

export default function ParametrosPage() {
  const { data, loading, refetch } = useParametros();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Parametro | null>(null);

  const router = useRouter();

  const getParametro = async (clave: string) => {
  const { data } = await supabase
    .from("configuracion_general")
    .select("valor")
    .eq("clave", clave)
    .single();

  return data?.valor;
};

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 space-y-4">
      {/* VOLVER */}
      <button
        onClick={() => router.push("/configuracion")}
        className="text-sm text-gray-400 hover:text-white"
      >
        ← Volver
      </button>

      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">
          Parámetros del sistema
        </h1>

        <button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          + Nuevo
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left p-2">Clave</th>
              <th className="text-left">Valor</th>
              <th className="text-left">Descripción</th>
              <th className="text-right p-2 pr-4">Acciones</th>
              <td className="text-right p-2 pr-4"> </td>
            </tr>
          </thead>

          <tbody>
            {data.map((p) => (
              <tr
                key={p.id}
                className="border-t border-slate-700 hover:bg-slate-700/40"
              >
                <td className="p-2">
  {p.clave
    .replaceAll("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())}
</td>
                <td>{p.valor}</td>
                <td className="text-gray-400 text-sm">
                  {p.descripcion}
                </td>

                <td className="text-right space-x-2 pr-2">
                  <button
                    onClick={() => {
                      setSelected(p);
                      setOpen(true);
                    }}
                    className="px-2 py-1 text-blue-400 hover:bg-slate-700 rounded"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {open && (
        <ModalParametro
          parametro={selected}
          onClose={() => setOpen(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
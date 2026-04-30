"use client";

import { useState } from "react";
import { useDependencias } from "./hook/useDependencias";
import type { Dependencia } from "./hook/useDependencias";
import ModalDependencia from "./components/ModalDependencia";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client"; // 👈 IMPORT FALTANTE

export default function DependenciasPage() {
  const { data, loading, refetch } = useDependencias();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Dependencia | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const router = useRouter();

  if (loading) return <div className="p-6">Cargando...</div>;

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar dependencia?")) return;

    try {
      setDeletingId(id);

      await supabase.from("dependencias").delete().eq("id", id);

      refetch();
    } catch (e) {
      console.error(e);
      alert("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }
console.log("RENDER DEPENDENCIAS PAGE");
  return (
    <div className="p-6 space-y-4">
      {/* 🔙 VOLVER */}
      <button
        onClick={() => router.push("/configuracion")}
        className="text-sm text-gray-400 hover:text-white"
      >
        ← Volver
      </button>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Dependencias</h1>

        <button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          + Nueva
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left p-3">Dependencia</th>
              <th className="text-center">Días</th>
              <th className="text-right">Capacidad</th>
              <th className="text-right">Promedio</th>
              <th className="text-center">Activo</th>
              <th className="text-right p-2 pr-4">Acciones</th>
              <td className="text-right p-2 pr-4"> </td>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-gray-400 py-6"
                >
                  No hay dependencias cargadas
                </td>
              </tr>
            )}

            {data.map((d) => (
              <tr
                key={d.id}
                className="border-t border-slate-700 hover:bg-slate-700/40"
              >
                {/* NOMBRE + SIGLA */}
                <td
  className="p-3 cursor-pointer"
  onClick={() => {
    setSelected(d);
    setOpen(true);
  }}
>
  <div className="font-medium hover:underline">{d.nombre}</div>
  <div className="text-xs text-gray-400">{d.sigla}</div>
</td>

                {/* DIAS */}
                <td className="text-center">
                  {[
                    d.lunes && "L",
                    d.martes && "M",
                    d.miercoles && "X",
                    d.jueves && "J",
                    d.viernes && "V",
                  ]
                    .filter(Boolean)
                    .join(" - ") || "-"}
                </td>

                {/* CAPACIDAD */}
                <td className="text-right">
                  {d.max_tramites_diarios}
                </td>

                {/* PROMEDIO */}
                <td className="text-right">
                  {d.dias_turno_promedio}
                </td>

                {/* ACTIVO */}
       <td className="text-center">
  <button
    onClick={async () => {
      const nuevoEstado = !d.activo;

      try {
        await supabase
          .from("dependencias")
          .update({ activo: nuevoEstado })
          .eq("id", d.id);

        refetch();
      } catch (e) {
        console.error(e);
        alert("Error al actualizar estado");
      }
    }}
    className={`cursor-pointer px-3 py-1 rounded text-xs font-medium transition ${
      d.activo
        ? "bg-green-600/20 text-green-400"
        : "bg-red-600/20 text-red-400"
    }`}
  >
    {d.activo ? "Activo" : "Inactivo"}
  </button>
</td>
                {/* ACCIONES */}
                <td className="text-right pr-3 space-x-2">
                  <button
                    onClick={() => {
                      setSelected(d);
                      setOpen(true);
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    className="text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === d.id
                      ? "Eliminando..."
                      : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {open && (
        <ModalDependencia
          dependencia={selected ?? null} // 👈 importante
          onClose={() => setOpen(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
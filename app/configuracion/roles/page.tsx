"use client";

import { useState } from "react";
import { useRoles, Rol } from "./hook/useRoles";
import ModalRol from "./components/ModalRol";
import { useRouter } from "next/navigation";

export default function RolesPage() {
  const { data, loading, refetch } = useRoles();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Rol | null>(null);
  const router = useRouter();

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 space-y-4">
      <button onClick={() => router.push("/configuracion")} className="text-sm text-gray-400">
        ← Volver
      </button>

      <div className="flex justify-between">
        <h1 className="text-xl">Roles</h1>
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

      <table className="w-full bg-slate-800 rounded-xl">
        <tbody>
          {data.map((r) => (
            <tr
              key={r.id}
              onClick={() => {
                setSelected(r);
                setOpen(true);
              }}
              className="border-t border-slate-700 cursor-pointer hover:bg-slate-700/40"
            >
              <td className="p-3">{r.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <ModalRol
          rol={selected}
          onClose={() => setOpen(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
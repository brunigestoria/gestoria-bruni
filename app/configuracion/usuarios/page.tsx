"use client";

import { useState } from "react";
import { useUsuarios} from "./hook/useUsuarios";
import ModalUsuario from "./components/ModalUsuario";
import { useRouter } from "next/navigation";
import type { Usuario } from "./hook/useUsuarios";

export default function UsuariosPage() {
  const { data, loading, refetch } = useUsuarios();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Usuario | null>(null);
  const router = useRouter();

  if (loading) return <div className="p-6">Cargando...</div>;

  

  return (
    <div className="p-6 space-y-4">
      <button onClick={() => router.push("/configuracion")} className="text-sm text-gray-400">
        ← Volver
      </button>

      <div className="flex justify-between">
        <h1 className="text-xl">Usuarios</h1>
        <button onClick={() => { setSelected(null); setOpen(true); }} className="bg-blue-600 px-4 py-2 rounded">
          + Nuevo
        </button>
      </div>

      <table className="w-full text-sm bg-slate-800 rounded-xl overflow-hidden">
  <thead>
    <tr className="text-gray-400 border-b border-slate-700">
      <th className="text-left p-3">Nombre</th>
      <th className="text-left">Email</th>
      <th className="text-left">Rol</th>
      <th className="text-center">Activo</th>
    </tr>
  </thead>

  <tbody>
    {data.map((u) => (
      <tr
        key={u.id}
        onClick={() => {
          setSelected(u);
          setOpen(true);
        }}
        className="border-t border-slate-700 cursor-pointer hover:bg-slate-700/40"
      >
        <td className="p-3">{u.nombre}</td>
        <td>{u.email}</td>
        <td>
  {u.roles.length
    ? u.roles.map((r) => r.replaceAll("_", " ")).join(", ")
    : "Sin rol"}
</td>
        <td className="text-center">
          {u.activo ? "Sí" : "No"}
        </td>
      </tr>
    ))}
  </tbody>
</table>

      {open && (
        <ModalUsuario
          usuario={selected}
          onClose={() => setOpen(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
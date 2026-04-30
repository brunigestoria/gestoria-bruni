"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Rol } from "../hook/useRoles";

export default function ModalRol({
  rol,
  onClose,
  onSaved,
}: {
  rol: Rol | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(rol?.nombre || "");

  async function handleSave() {
    if (rol) {
      await supabase.from("roles").update({ nombre }).eq("id", rol.id);
    } else {
      await supabase.from("roles").insert({ nombre });
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-800 p-6 rounded-xl w-[400px]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg mb-4">
          {rol ? "Editar rol" : "Nuevo rol"}
        </h2>

        <input
          className="w-full p-2 bg-slate-700 rounded mb-4"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del rol"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave} className="bg-blue-600 px-3 py-1 rounded">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
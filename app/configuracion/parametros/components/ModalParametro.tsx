"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Parametro = {
  id: string;
  clave: string;
  valor: string;
  descripcion: string | null;
};

type Props = {
  parametro: Parametro | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ModalParametro({
  parametro,
  onClose,
  onSaved,
}: Props) {
  const [clave, setClave] = useState(parametro?.clave || "");
  const [valor, setValor] = useState(parametro?.valor || "");
  const [descripcion, setDescripcion] = useState(
    parametro?.descripcion || ""
  );

  async function handleSave() {
    if (parametro) {
      await supabase
        .from("configuracion_general")
        .update({ valor, descripcion })
        .eq("id", parametro.id);
    } else {
      await supabase
        .from("configuracion_general")
        .insert({ clave, valor, descripcion });
    }

    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-6 rounded-xl w-96 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">
          {parametro ? "Editar parámetro" : "Nuevo parámetro"}
        </h2>

        {!parametro && (
          <input
            placeholder="Clave"
            className="w-full p-2 bg-slate-700 rounded"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
        )}

        <input
          placeholder="Valor"
          className="w-full p-2 bg-slate-700 rounded"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <input
          placeholder="Descripción"
          className="w-full p-2 bg-slate-700 rounded"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={handleSave}
            className="bg-blue-600 px-3 py-1 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
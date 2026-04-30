"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Embarcacion = {
  id: string;
  nombre: string;
  matricula: string;
};

export default function EmbarcacionesPage() {
  const [data, setData] = useState<Embarcacion[]>([]);
  const [filtro, setFiltro] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from("embarcaciones")
        .select("id, nombre, matricula")
        .order("created_at", { ascending: false });

      setData(data || []);
    }

    cargar();
  }, []);

  const filtradas = data.filter((e) =>
    `${e.nombre} ${e.matricula}`
      .toLowerCase()
      .includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700"
      >
        ← Volver
      </button>

      <h1 className="text-xl font-semibold">Embarcaciones</h1>

      {/* 🔍 BUSCADOR LOCAL */}
      <input
        placeholder="Buscar por nombre o matrícula..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm"
      />

      {/* 📋 TABLA */}
      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-gray-700">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Matrícula</th>
          </tr>
        </thead>

        <tbody>
          {filtradas.map((e) => (
           <tr
  key={e.id}
  onClick={() => {
    console.log("navegando a", e.id);
     console.log("CLICK", e.id);
    router.push(`/historial/embarcaciones/${e.id}`);
  }}
  className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
>
              <td className="p-2">{e.nombre}</td>
              <td className="p-2">{e.matricula}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
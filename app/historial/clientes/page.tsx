"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Cliente = {
  id: string;
  nombre: string;
  dni?: string;
  icc_score?: number;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from("personas")
        .select("id, nombre, dni, icc_score")
        .neq("tipo", "broker")
        .order("nombre");

      setClientes(data || []);
    }

    cargar();
  }, []);

  function getICCColor(icc?: number) {
    if (!icc) return "text-gray-400";
    if (icc >= 80) return "text-green-400";
    if (icc >= 50) return "text-yellow-400";
    return "text-red-400";
  }

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700"
      >
        ← Volver
      </button>

      <h1 className="text-xl mb-4">Clientes</h1>

      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-gray-700">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">DNI</th>
          </tr>
        </thead>

        <tbody>
          {clientes.map((c) => (
            <tr
              key={c.id}
              onClick={() => router.push(`/historial/clientes/${c.id}`)}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
            >
              <td className="p-2">{c.nombre}</td>
              <td className="p-2">{c.dni || "-"}</td>
              <td className={`p-2 ${getICCColor(c.icc_score)}`}>
                {c.icc_score ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
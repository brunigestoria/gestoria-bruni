"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Broker = {
  id: string;
  nombre: string;
  dni?: string;
  icc_score?: number;
};

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from("personas")
        .select("id, nombre, dni, icc_score, tipo")
        .eq("tipo", "broker") // 🔥 SOLO brokers
        .order("nombre", { ascending: true });

      if (error) {
        console.error("ERROR BROKERS:", error);
        return;
      }

      setBrokers(data || []);
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

      <h1 className="text-xl mb-4">Brokers</h1>

      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-gray-700">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">DNI</th>
            <th className="p-2 text-left">ICC</th>
          </tr>
        </thead>

        <tbody>
          {brokers.map((b) => (
            <tr
              key={b.id}
              onClick={() => router.push(`/historial/brokers/${b.id}`)}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
            >
              <td className="p-2">{b.nombre}</td>
              <td className="p-2">{b.dni || "-"}</td>
              <td className={`p-2 ${getICCColor(b.icc_score)}`}>
                {b.icc_score ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

type Item = {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
};

export default function TramiteHistorial({ tramiteId }: { tramiteId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!tramiteId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("tramite_historial")
      .select("*")
      .eq("tramite_id", tramiteId)
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error cargando historial:", error);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }, [tramiteId]);

  // 🔹 carga inicial
 useEffect(() => {
  async function cargarData() {
    if (!tramiteId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("tramite_historial")
      .select("*")
      .eq("tramite_id", tramiteId)
      .order("fecha", { ascending: false });

    if (error) {
      console.error(error);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  cargarData();
}, [tramiteId]);

  // 🔹 recarga por evento global
  useEffect(() => {
    const recargar = () => {
      cargar();
    };

    window.addEventListener("tramite_actualizado", recargar);

    return () => {
      window.removeEventListener("tramite_actualizado", recargar);
    };
  }, [cargar]);

  return (
    <div className="bg-gray-900 p-6 rounded mt-6">
      <h3 className="text-lg font-semibold mb-4">Historial</h3>

      <div className="space-y-3">
        {loading && (
          <div className="text-gray-400 text-sm">Cargando...</div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-gray-500 text-sm">
            Sin movimientos aún
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="border border-gray-800 rounded p-3 text-sm"
          >
            <div className="text-gray-400 text-xs">
              {new Date(item.fecha).toLocaleString()}
            </div>

            <div className="mt-1">{item.descripcion}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
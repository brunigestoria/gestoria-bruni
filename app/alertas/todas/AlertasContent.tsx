"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/modal/hook/modal";

type Item = {
  id?: string;
  tramite_id: string;
  embarcacion?: string;
  matricula?: string;
};

export default function TodasAlertasPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tipo = params.get("tipo");

  const [data, setData] = useState<Item[]>([]);
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState<string | null>(null);

  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  /* ================= CARGA ================= */

  useEffect(() => {
    async function cargar() {
      setPagina(1);
      let query;

      if (tipo === "documentos") {
        query = supabase
          .from("vista_tramite_documentos_estado")
          .select("*");
      } else if (tipo === "dormidos") {
        query = supabase
          .from("vista_alertas_tramites_dormidos")
          .select("*");
      } else {
        query = supabase
          .from("alerta_promesas_pago_vencidas")
          .select("*");
      }

      const { data } = await query;
      setData(data || []);
    }

    cargar();
  }, [tipo]);


  /* ================= PAGINACIÓN ================= */

  const inicio = (pagina - 1) * porPagina;
  const fin = inicio + porPagina;

  const datosPaginados = data.slice(inicio, fin);
  const totalPaginas = Math.ceil(data.length / porPagina);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Volver
        </button>

        <h1 className="text-xl">Todas las alertas</h1>

        <div className="text-sm text-gray-500">
          {data.length} resultados
        </div>
      </div>

      {/* LISTA */}
      <div className="grid md:grid-cols-2 gap-3">
        {datosPaginados.map((a, index) => (
          <div
            key={`${a.tramite_id}-${index}`} // 🔥 evita duplicados
            onClick={() => setTramiteSeleccionado(a.tramite_id)}
            className="bg-gray-800 p-4 rounded cursor-pointer hover:bg-gray-700 transition"
          >
            <p className="font-medium">
              {a.embarcacion || "Sin nombre"}
            </p>

            <p className="text-sm text-gray-400">
              {a.matricula ? `(${a.matricula})` : "Sin matrícula"}
            </p>
          </div>
        ))}
      </div>

      {/* PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">

          <button
            onClick={() => setPagina((p) => Math.max(p - 1, 1))}
            disabled={pagina === 1}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30"
          >
            ← Anterior
          </button>

          <span className="text-sm text-gray-400">
            Página {pagina} de {totalPaginas}
          </span>

          <button
            onClick={() =>
              setPagina((p) => Math.min(p + 1, totalPaginas))
            }
            disabled={pagina === totalPaginas}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30"
          >
            Siguiente →
          </button>

        </div>
      )}

      {/* MODAL */}
      {tramiteSeleccionado && (
        <Modal
          tramiteId={tramiteSeleccionado}
          onClose={() => setTramiteSeleccionado(null)}
        />
      )}
    </div>
  );
}
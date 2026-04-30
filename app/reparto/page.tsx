"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toastSuccess, toastError } from "@/lib/toast";

type RepartoItem = {
  id: string;
  tramite_id: string;
  lugar_entrega?: string;
  fecha_marcado: string;
  fecha_entregado?: string;
  embarcacion: string;
  titular: string;
  lugar_guarda_actual?: string;
};

type RepartoHistorialRow = {
  id: string;
  tramite_id: string;
  lugar_entrega?: string;
  fecha_marcado: string;
  fecha_entregado?: string;
  tramites?: {
    embarcaciones?: { nombre?: string };
    tramite_titulares?: Array<{ personas?: { nombre?: string } }>;
  };
};

type RepartoHoyRow = {
  id: string;
  tramite_id: string;
  lugar_entrega?: string;
  fecha_marcado: string;
  fecha_entregado?: string;
  embarcacion: string;
  titular: string;
  tramites?: {
    lugar_guarda_actual?: string;
  };
};

export default function RepartoPage() {
  const [hoy, setHoy] = useState<RepartoItem[]>([]);
  const [historial, setHistorial] = useState<RepartoItem[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [entrega, setEntrega] = useState<RepartoItem | null>(null);
  const [lugar, setLugar] = useState("");
  const [recibe, setRecibe] = useState("");

  async function cargarTodo() {
    // 🟢 PARA REPARTIR
    const hoyData = (
      await supabase
        .from("repartir_hoy")
        .select(`
          *,
          tramites ( lugar_guarda_actual )
        `)
        .order("fecha_marcado", { ascending: true })
    ).data as RepartoHoyRow[] | null;

    const hoyFormateado = hoyData?.map((r) => ({
      id: r.id,
      tramite_id: r.tramite_id,
      lugar_entrega: r.lugar_entrega,
      fecha_marcado: r.fecha_marcado,
      fecha_entregado: r.fecha_entregado,
      embarcacion: r.embarcacion,
      titular: r.titular,
      lugar_guarda_actual: r.tramites?.lugar_guarda_actual || "oficina",
    })) || [];

    setHoy(hoyFormateado);

    // 📜 HISTORIAL
    const histData = (
      await supabase
        .from("reparto_documentos")
        .select(`
          id,
          tramite_id,
          lugar_entrega,
          fecha_marcado,
          fecha_entregado,
          tramites (
            embarcaciones ( nombre ),
            tramite_titulares (
              personas ( nombre )
            )
          )
        `)
        .not("fecha_entregado", "is", null)
        .order("fecha_entregado", { ascending: false })
    ).data as RepartoHistorialRow[] | null;

    const formateado =
      histData?.map((r) => ({
        id: r.id,
        tramite_id: r.tramite_id,
        lugar_entrega: r.lugar_entrega,
        fecha_marcado: r.fecha_marcado,
        fecha_entregado: r.fecha_entregado,
        embarcacion: r.tramites?.embarcaciones?.nombre || "-",
        titular:
          r.tramites?.tramite_titulares?.[0]?.personas?.nombre || "-",
      })) || [];

    setHistorial(formateado);
  }

  // 🔥 CARGAR DATOS
  useEffect(() => {
    const timer = window.setTimeout(() => {
      cargarTodo();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // 🔓 ABRIR MODAL
  function abrirEntrega(item: RepartoItem) {
    setEntrega(item);
    setLugar(item.lugar_guarda_actual || "oficina");
    setRecibe("");
  }

  // 💾 CONFIRMAR ENTREGA
  async function confirmarEntrega() {
    if (!entrega) return;

    await supabase
      .from("reparto_documentos")
      .update({
        lugar_entrega: lugar,
        fecha_entregado: new Date().toISOString(),
        recibido_por: recibe
      })
      .eq("id", entrega.id);

    setEntrega(null);
    cargarTodo();
  }

  // 🔎 FILTRO HISTORIAL
  const historialFiltrado = historial.filter((r) => {
    const texto = `${r.embarcacion} ${r.titular}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // FUNCION QUITAR Y VOLVER A REPARTO
  async function quitarDeReparto(id: string) {
  if (!confirm("¿Quitar de reparto este trámite?")) return;

  const { error } = await supabase
    .from("reparto_documentos")
    .delete()
    .eq("id", id);

  if (error) {
    toastError("Error al quitar de reparto");
    return;
  }

  toastSuccess("Quitado de reparto");
  cargarTodo();
}

async function volverAReparto(id: string) {
  if (!confirm("¿Volver este trámite a reparto?")) return;

  const { error } = await supabase
    .from("reparto_documentos")
    .update({
      fecha_entregado: null,
      recibido_por: null,
    })
    .eq("id", id);

  if (error) {
    toastError("Error al volver a reparto");
    return;
  }

  toastSuccess("Volvió a reparto");
  cargarTodo();
}

  return (
    <div className="p-6 space-y-8">

      {/* 🟢 HOY */}
      <div>
        <h1 className="text-xl mb-4">Para repartir hoy</h1>

        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Embarcación</th>
              <th className="p-2 text-left">Titular</th>
              <th className="p-2 text-left">Lugar</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {hoy.map((r) => (
              <tr key={r.id} className="border-b border-gray-800">
                <td className="p-2">
                  {new Date(r.fecha_marcado).toLocaleDateString()}
                </td>
                <td className="p-2">{r.embarcacion}</td>
                <td className="p-2">{r.titular}</td>
                <td className="p-2">{r.lugar_entrega || "-"}</td>

                <td className="p-2 flex gap-2">

  {/* 🟢 SI NO ESTÁ ENTREGADO */}
  {!r.fecha_entregado && (
    <button
      onClick={() => quitarDeReparto(r.id)}
      className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-500"
    >
      Quitar
    </button>
  )}

</td>
              </tr>
            ))}

            {hoy.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Nada para repartir hoy
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📜 HISTORIAL */}
      <div>
        <h2 className="text-lg mb-3">Historial de entregas</h2>

        <input
          placeholder="Buscar embarcación o titular..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 p-2 bg-gray-800 rounded w-full max-w-sm"
        />

        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Embarcación</th>
              <th className="p-2 text-left">Titular</th>
              <th className="p-2 text-left">Lugar</th>
              
            </tr>
          </thead>

          <tbody>
            {historialFiltrado.map((r) => (
              <tr key={r.id} className="border-b border-gray-800">
                <td className="p-2">
                  {r.fecha_entregado
  ? new Date(r.fecha_entregado).toLocaleDateString()
  : "-"}
                </td>
                <td className="p-2">{r.embarcacion}</td>
                <td className="p-2">{r.titular}</td>
                <td className="p-2">{r.lugar_entrega || "-"}</td>
                <td className="p-2 pr-8">
  <div className="flex justify-end items-center gap-10">

    {r.fecha_entregado && (
      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
        Entregado
      </span>
    )}

    {r.fecha_entregado && (
      <button
        onClick={() => volverAReparto(r.id)}
        className="text-xs bg-yellow-600 px-2 py-0.5 rounded hover:bg-yellow-500"
      >
        Volver
      </button>
    )}

  </div>
</td>
              </tr>
            ))}

            {historialFiltrado.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📦 MODAL */}
      {entrega && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded w-100 space-y-4">

            <h2 className="text-lg">Marcar entrega</h2>

            <div>
              <label className="text-sm text-gray-400">Lugar</label>
              <input
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full mt-1 p-2 bg-gray-800 rounded"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Recibido por</label>
              <input
                value={recibe}
                onChange={(e) => setRecibe(e.target.value)}
                className="w-full mt-1 p-2 bg-gray-800 rounded"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEntrega(null)}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarEntrega}
                className="px-3 py-1 bg-green-600 rounded"
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
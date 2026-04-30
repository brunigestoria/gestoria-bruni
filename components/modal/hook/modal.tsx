"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import TramiteDatos from "@/components/modal/hook/TramiteDatos";
import TramiteFinanzas from "@/components/modal/hook/TramiteFinanzas";
import TramiteTitulares from "@/components/modal/hook/TramiteTitulares";
import ModalEdicionTramite from "@/components/tramite/ModalEdicionTramite";
import DocumentosSection from "@/components/tramite/DocumentosSection";
import TabContable from "@/components/tramite/TabContable";
import TitularItem from "@/components/ICC/TitularItem";
import { toastSuccess, toastWarning, toastError } from "@/lib/toast";

type Props = {
  tramiteId: string;
  onClose: () => void;
  startInEdit?: boolean;
};

type Titular = {
  id?: string; // 🔥 agregar esto
  nombre: string;
  dni?: string;
  telefono?: string;
  principal: boolean;
};

type TramiteDetalle = {
  id: string;
  embarcacion: string;
  matricula?: string;
  estado: string;
  lugar_guarda_actual?: string;

  numero_tramite?: string;
  numero_gde?: string;

  tipo_tramite?: string;
  dependencia?: string;
  fecha_presentacion?: string;
  fecha_estado_actual?: string;

  total_pactado?: number;
  saldo?: number;

  firmo_autorizacion?: boolean;
  dejo_arba?: boolean;

  titulares?: Titular[];
};

export default function Modal({ tramiteId, onClose, startInEdit }: Props) {
  const [tramite, setTramite] = useState<TramiteDetalle | null>(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(startInEdit || false);
  const [broker, setBroker] = useState("");
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [menuAccionesOpen, setMenuAccionesOpen] = useState(false);
  const [showRepartoForm, setShowRepartoForm] = useState(false);
 const [lugarEntrega, setLugarEntrega] = useState("");
  const [recibe, setRecibe] = useState("");
  
  

  // 🔹 cargar datos
  useEffect(() => {
    if (!tramiteId) return;

    async function cargar() {
      const { data } = await supabase
        .from("v_tramite_detalle")
        .select("*")
        .eq("id", tramiteId)
        .single();
        setBroker(data.broker || "");
setBrokerId(data.broker_id || null);

      setTramite(data);
      console.log("TRAMITE COMPLETO:", tramite);
console.log("TITULARES:", data?.titulares);

    }

    cargar();
  }, [tramiteId]);



  // 🔥 abrir directo en edición

  function emitirRefresh() {
    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  async function actualizarEstado(nuevoEstado: string) {
    if (!tramite) return;

    await supabase
      .from("tramites")
      .update({ estado: nuevoEstado })
      .eq("id", tramite.id);

    emitirRefresh();
    onClose();
  }

  if (!tramiteId) return null;
  if (!tramite) return <div className="p-6">Cargando...</div>;

  return (
  <>
    {/* 🔥 MODAL PRINCIPAL */}
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 w-full h-full overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >

{/* 🔥 HEADER */}
<div className="mb-6 border-b border-gray-800 pb-4 space-y-3">

  {/* 🔥 FILA 1 */}
  <div className="flex justify-between items-start">

    {/* IZQUIERDA */}
    <div>

      <h2 className="text-2xl font-semibold">
        {tramite.embarcacion?.toUpperCase()}
      </h2>
      
      <p className="text-gray-400 text-sm mt-1">
        Matrícula: {tramite.matricula?.toUpperCase() || "-"}
      </p>

    </div>

    {/* DERECHA */}
    <div className="flex items-start gap-3">

      {/* 🔥 BOTONERA DESKTOP */}
      <div className="hidden sm:flex gap-2 bg-gray-900 border border-gray-800 rounded p-2 mt-1 mr-24">

        <button
          onClick={() => setMostrarModalEdicion(true)}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
        >
          Editar
        </button>

        {tramite.estado !== "presentado" && (
          <button
            onClick={async () => {
              await supabase
                .from("tramites")
                .update({ listo_para_presentar: true })
                .eq("id", tramite.id);

              emitirRefresh();
            }}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm"
          >
            Presentar
          </button>
        )}

    <button
  onClick={async () => {
  const { data } = await supabase
    .from("reparto_documentos")
    .select("id")
    .eq("tramite_id", tramite.id)
    .is("fecha_entregado", null)
    .limit(1);

  if (data && data.length > 0) {
toastWarning("Ya está en reparto");
    return;
  }

  setLugarEntrega(tramite?.lugar_guarda_actual || "Oficina");
  setShowRepartoForm(true);
}}
  className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
 
>
  Reparto
</button>

        {tramite.estado === "observado" && (
          <button
            onClick={async () => {
              await supabase
                .from("tramites")
                .update({ subsanacion_lista: true })
                .eq("id", tramite.id);

              emitirRefresh();
            }}
            className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-sm"
          >
            Subsanar
          </button>
        )}

      </div>

      {/* ❌ CERRAR */}
      <button
        onClick={onClose}
        className="text-gray-300 hover:text-white text-xl bg-gray-800 px-3 py-1 rounded"
      >
        ✕
      </button>

    </div>
  </div>

  {/* 🔥 FILA 2 */}
  <div className="flex items-center justify-between">

    {/* BADGE */}
    {tramite.firmo_autorizacion && (
      <span className="text-sm bg-green-600/20 text-green-300 px-3 py-1.5 rounded font-medium">
        Firmó autorización de manejo
      </span>
    )}

    {/* 🔥 MENÚ MOBILE */}
    <div className="sm:hidden relative">

      <button
        onClick={() => setMenuAccionesOpen(!menuAccionesOpen)}
        className="bg-gray-800 px-3 py-1 rounded text-white"
      >
        ⋮
      </button>

      {menuAccionesOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded shadow-lg z-50">

          <button
            onClick={() => {
              setMostrarModalEdicion(true);
              setMenuAccionesOpen(false);
            }}
            className="block w-full text-left px-3 py-2 hover:bg-gray-800 text-sm"
          >
            Editar
          </button>

          {tramite.estado !== "presentado" && (
            <button
              onClick={async () => {
                await supabase
                  .from("tramites")
                  .update({ listo_para_presentar: true })
                  .eq("id", tramite.id);

                emitirRefresh();
                setMenuAccionesOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-800 text-sm"
            >
              Presentar
            </button>
          )}

          <button
            onClick={async () => {
              await supabase
                .from("tramites")
                .update({ listo_para_repartir: true })
                .eq("id", tramite.id);

              emitirRefresh();
              setMenuAccionesOpen(false);
            }}
            className="block w-full text-left px-3 py-2 hover:bg-gray-800 text-sm"
          >
            Reparto
          </button>

          {tramite.estado === "observado" && (
            <button
              onClick={async () => {
                await supabase
                  .from("tramites")
                  .update({ subsanacion_lista: true })
                  .eq("id", tramite.id);

                emitirRefresh();
                setMenuAccionesOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-800 text-sm"
            >
              Subsanar
            </button>
          )}

        </div>
      )}

    </div>

  </div>

</div>


        {/* 🔹 TITULARES */}
        <TramiteTitulares titulares={tramite.titulares} />


        {/* 🔹 BROKER */}
        <div className="mb-6 border border-gray-800 p-4 rounded">
          <h3 className="text-sm text-gray-400 mb-3">Broker</h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Vendedor / Broker
            </label>

            <input
              value={broker || ""}
              onChange={(e) => setBroker(e.target.value)}
              disabled={!mostrarModalEdicion}
              className={`w-full px-2 py-1 rounded border 
                ${mostrarModalEdicion 
                  ? "bg-gray-900 border-gray-700 text-white" 
                  : "bg-gray-800 border-gray-800 text-gray-400 cursor-not-allowed"
                }`}
            />
          </div>
        </div>

        {/* 🔹 DATOS */}
        <TramiteDatos tramite={tramite} />
        

        {/* 🔹 DOCUMENTOS */}
        <DocumentosSection tramiteId={tramite.id} />

        {/* 🔹 FINANZAS */}
        <TabContable tramiteId={tramite.id} />

        {/* 🔹 CERRAR */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>

    {/* formulario reparto */}
{showRepartoForm && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-gray-900 p-6 rounded w-[400px] space-y-4">

      <h3 className="text-lg font-semibold">Enviar a reparto</h3>

      {/* 📍 LUGAR */}
      <input
        value={lugarEntrega}
        onChange={(e) => setLugarEntrega(e.target.value)}
        placeholder="Lugar de entrega"
        className="w-full bg-gray-800 p-2 rounded"
      />

      {/* BOTONES */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowRepartoForm(false)}
          className="px-3 py-1 bg-gray-700 rounded"
        >
          Cancelar
        </button>

        <button
          onClick={async () => {
            const { error } = await supabase
              .from("reparto_documentos")
              .insert({
                tramite_id: tramite.id,
                lugar_entrega: lugarEntrega,
              });

            if (error) {
              toastError("Error al enviar a reparto");
              return;
            }

            setShowRepartoForm(false);
            toastSuccess("Enviado a reparto");
            emitirRefresh();
          }}
          className="px-3 py-1 bg-purple-600 rounded"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}
    {/* 🔥 MODAL EDICIÓN */}
    {mostrarModalEdicion && (
      <ModalEdicionTramite
        tramiteId={tramite.id}
        onClose={() => {
          setMostrarModalEdicion(false);
          emitirRefresh();
        }}
      />
    )}
  </>
);
}
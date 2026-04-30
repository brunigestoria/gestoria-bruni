"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Modal from "@/components/modal/hook/modal";
import { useICC } from "@/components/ICC/useICC";
import ICCBadge from "@/components/ICC/ICCBadge";

type Cliente = {
  id: string;
  nombre: string;
  dni?: string;
  telefono?: string;
};

type Tramite = {
  tramite_id: string;
  tipo_tramite: string;
  estado: string;
  dependencia: string;
  fecha_creacion: string;
  embarcacion: string;
  matricula: string;
  saldo: number;
};

// 🔥 TABLA
function Tabla({
  data,
  onClick,
}: {
  data: Tramite[];
  onClick: (id: string) => void;
}) {
  return (
    <table className="w-full text-sm mb-6">
      <thead className="text-gray-400 border-b border-gray-700">
        <tr>
          <th className="p-2 text-left">Fecha</th>
          <th className="p-2 text-left">Embarcación</th>
          <th className="p-2 text-left">Matrícula</th>
          <th className="p-2 text-left">Tipo</th>
          <th className="p-2 text-left">Estado</th>
          <th className="p-2 text-left">Dependencia</th>
          <th className="p-2 text-left">Saldo</th>
        </tr>
      </thead>

      <tbody>
        {data.map((t) => (
          <tr
            key={t.tramite_id}
            onClick={() => onClick(t.tramite_id)}
            className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
          >
            <td className="p-2">
              {new Date(t.fecha_creacion).toLocaleDateString()}
            </td>
            <td className="p-2">{t.embarcacion}</td>
            <td className="p-2">{t.matricula}</td>
            <td className="p-2">{t.tipo_tramite}</td>
            <td className="p-2">{t.estado}</td>
            <td className="p-2">{t.dependencia}</td>
            <td
              className={`p-2 ${
                t.saldo > 0 ? "text-red-400" : "text-green-400"
              }`}
            >
              ${t.saldo}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ClienteFicha() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState<string | null>(null);

  // 🔥 HOOK ICC (siempre se llama)
  const icc = useICC(id);

  useEffect(() => {
    async function cargar() {
      const { data: clienteData } = await supabase
        .from("personas")
        .select("*")
        .eq("id", id)
        .single();

      setCliente(clienteData);

      const { data: tramitesData } = await supabase
        .from("v_tramites_operativo")
        .select("*")
        .ilike("titular", clienteData?.nombre || "");

      setTramites(tramitesData || []);
    }

    if (id) cargar();
  }, [id]);

  if (!cliente) return <div className="p-6">Cargando...</div>;

  const activos = tramites.filter((t) => t.estado !== "finalizado");
  const historicos = tramites.filter((t) => t.estado === "finalizado");

  const totalDeuda = tramites.reduce((acc, t) => acc + (t.saldo || 0), 0);

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700"
      >
        ← Volver
      </button>

      <h1 className="text-xl font-semibold">{cliente.nombre}</h1>
      <p className="text-gray-400">DNI: {cliente.dni || "-"}</p>
      <p className="text-gray-400">Tel: {cliente.telefono || "-"}</p>

      {/* 🔥 ICC */}
      <div className="mt-2">
        {!icc && (
          <div className="text-xs text-gray-500">
            Cargando ICC...
          </div>
        )}

        {icc && (
          <>
            <ICCBadge
              icc={icc.icc}
              categoria={icc.categoria}
              color={icc.color}
            />

            {icc.icc < 50 && (
              <div className="text-red-400 text-xs mt-1">
                ⚠ Cliente con comportamiento riesgoso
              </div>
            )}
          </>
        )}
      </div>

      {/* 💰 FINANZAS */}
      <p className="mt-2">
        Estado financiero:
        <span className={totalDeuda > 0 ? "text-red-400" : "text-green-400"}>
          {totalDeuda > 0 ? ` Debe $${totalDeuda}` : " Sin deuda"}
        </span>
      </p>

      {/* 📂 TRÁMITES */}
      <h2 className="mt-6 mb-2">Trámites Activos</h2>
      <Tabla data={activos} onClick={setTramiteSeleccionado} />

      <h2 className="mt-6 mb-2">Historial</h2>
      <Tabla data={historicos} onClick={setTramiteSeleccionado} />

      {/* 🔥 MODAL */}
      {tramiteSeleccionado && (
        <Modal
          tramiteId={tramiteSeleccionado}
          startInEdit={false}
          onClose={() => setTramiteSeleccionado(null)}
        />
      )}
    </div>
  );
}
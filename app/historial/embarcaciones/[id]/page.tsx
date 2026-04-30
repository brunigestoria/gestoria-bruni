"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Modal from "@/components/modal/hook/modal";
import DocumentosSection from "@/components/tramite/DocumentosSection";

type Embarcacion = {
  id: string;
  nombre: string;
  matricula: string;
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
type TramiteDocFlags = {
  expediente?: boolean;
  provisorio?: boolean;
  matricula?: boolean;
  fotos?: boolean;
};

// 🔥 TABLA
function Tabla({
  data,
  onClick,
  docsMap,
  onDocumentClick,
}: {
  data: Tramite[];
  onClick: (id: string) => void;
  docsMap: Record<string, TramiteDocFlags>;
  onDocumentClick: (tramiteId: string) => void;
}) {
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  function toggleMenu(id: string) {
    setMenuAbierto((prev) => (prev === id ? null : id));
  }

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
          <th className="p-2 text-left">Docs</th>
          
        </tr>
      </thead>

      <tbody>
        {data.map((t) => {
          const docs = docsMap[t.tramite_id] || {};

          return (
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

              {/* 🔥 MENÚ DOCUMENTOS */}
             <td
  className="p-2"
  onClick={(e) => e.stopPropagation()}
>
  <button
    onClick={() => onDocumentClick(t.tramite_id)}
    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
  >
    Ver
  </button>
</td>
              

            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function FichaEmbarcacion() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [data, setData] = useState<Embarcacion | null>(null);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [documentosPorTramite, setDocumentosPorTramite] = useState<
    Record<string, TramiteDocFlags>
  >({});
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState<string | null>(null);
  const [drawerTramite, setDrawerTramite] = useState<string | null>(null);
  const tramiteIdFromQuery = searchParams.get("tramite");
  const tramiteIdVisible = tramiteSeleccionado || tramiteIdFromQuery;

  useEffect(() => {
    async function cargar() {
      // 🔹 datos embarcación
      const { data: emb } = await supabase
        .from("embarcaciones")
        .select("*")
        .eq("id", id)
        .single();

      setData(emb);

      // 🔹 trámites asociados
      const { data: tram } = await supabase
        .from("v_tramites_operativo")
        .select("*")
        .eq("embarcacion_id", id)
        .order("fecha_creacion", { ascending: false });

      const tramitesData = tram || [];
      setTramites(tramitesData);

      const tramiteIds = tramitesData.map((t) => t.tramite_id);
      if (tramiteIds.length) {
        const { data: docs } = await supabase
          .from("tramite_documentos")
          .select("tramite_id, tipo_documento")
          .in("tramite_id", tramiteIds);

        const docFlags: Record<string, TramiteDocFlags> = {};

        (docs || []).forEach((doc) => {
          const existing = docFlags[doc.tramite_id] || {};
          docFlags[doc.tramite_id] = {
            ...existing,
            [doc.tipo_documento]: true,
          };
        });

        const fotosFlags = await Promise.all(
          tramiteIds.map(async (tramiteId) => {
            const { data: fotos } = await supabase.storage
              .from("documentos-tramites")
              .list(`${tramiteId}/fotos`, { limit: 1 });

            return {
              tramiteId,
              hasFotos: Array.isArray(fotos) && fotos.length > 0,
            };
          })
        );

        fotosFlags.forEach(({ tramiteId, hasFotos }) => {
          if (hasFotos) {
            docFlags[tramiteId] = {
              ...docFlags[tramiteId],
              fotos: true,
            };
          }
        });

        setDocumentosPorTramite(docFlags);
      } else {
        setDocumentosPorTramite({});
      }
    }

    if (id) cargar();
  }, [id]);

  if (!data) {
    return <div className="p-6">Cargando...</div>;
  }

  const activos = tramites.filter((t) => t.estado !== "finalizado");
  const historicos = tramites.filter((t) => t.estado === "finalizado");

  const totalDeuda = tramites.reduce((acc, t) => acc + (t.saldo || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700"
      >
        ← Volver
      </button>

      {/* 🔥 HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">{data.nombre}</h1>
        <p className="text-gray-400">Matrícula: {data.matricula}</p>
      </div>

      {/* � FINANZAS */}
      <p className="mt-2">
        Estado financiero:
        <span className={totalDeuda > 0 ? "text-red-400" : "text-green-400"}>
          {totalDeuda > 0 ? ` Debe $${totalDeuda}` : " Sin deuda"}
        </span>
      </p>

      {/* 📂 TRÁMITES */}
      <h2 className="mt-6 mb-2">Trámites Activos</h2>
      <Tabla
        data={activos}
        docsMap={documentosPorTramite}
        onClick={(tramiteId) => {
          setTramiteSeleccionado(tramiteId);
          router.replace(`/historial/embarcaciones/${id}?tramite=${tramiteId}`);
        }}
        onDocumentClick={setDrawerTramite}
      />

      <h2 className="mt-6 mb-2">Historial</h2>
      <Tabla
        data={historicos}
        docsMap={documentosPorTramite}
        onClick={(tramiteId) => {
          setTramiteSeleccionado(tramiteId);
          router.replace(`/historial/embarcaciones/${id}?tramite=${tramiteId}`);
        }}
        onDocumentClick={setDrawerTramite}
      />
{drawerTramite && (
  <div className="fixed inset-0 z-40 flex justify-end">
   <div
  className="flex-1 bg-black/40 backdrop-blur-sm"
  onClick={() => setDrawerTramite(null)}
/>
 <div className="
  w-full 
  sm:w-[420px] 
  md:w-[480px] 
  lg:w-[520px] 
  bg-gray-900 
  border-l border-gray-700 
  p-5 
  overflow-y-auto
  shadow-2xl
  transform transition-transform duration-300 ease-out
">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <button
          type="button"
          onClick={() => setDrawerTramite(null)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="p-4 pb-8">
        <DocumentosSection tramiteId={drawerTramite} />
      </div>
    </div>
  </div>
)}
      {tramiteIdVisible && (
        <Modal
          tramiteId={tramiteIdVisible}
          startInEdit={false}
          onClose={() => {
            setTramiteSeleccionado(null);
            if (id) {
              router.replace(`/historial/embarcaciones/${id}`);
            }
          }}
          
        />
        
      )}
    </div>
  );
}
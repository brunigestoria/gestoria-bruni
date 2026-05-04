"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import Modal from "@/components/modal/hook/modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTramites } from "@/app/hooks/useTramites";

type Tramite = {
  tramite_id: string;
  embarcacion: string;
  titular: string;
  matricula: string;
  estado: string;
  dependencia: string;
  tipo_tramite: string;
  broker: string;
  saldo: number;
  dias_abierto: number;
  fecha_creacion?: string;
};

export default function TramitesTable() {
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [editarDirecto, setEditarDirecto] = useState(false);

  const hoy = new Date();
  const [mes, setMes] = useState(String(hoy.getMonth() + 1));
  const [anio, setAnio] = useState(String(hoy.getFullYear()));
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const queryClient = useQueryClient();

  // 🔥 NUEVO HOOK
  const { tramites, refetch } = useTramites(mes, anio);

  // 🔥 QUERY ANUAL (la dejamos igual)
  const { data: tramitesAnuales = [] } = useQuery<Tramite[]>({
    queryKey: ["tramites-anuales", anio],
    queryFn: async () => {
      let query = supabase.from("v_tramites_operativo").select("*");

      if (anio) {
        query = query
          .gte("fecha_creacion", `${anio}-01-01`)
          .lte("fecha_creacion", `${anio}-12-31`);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // 🔥 REFRESH GLOBAL (IMPORTANTE)
  useEffect(() => {
    function handleUpdate() {
      refetch();
    }

    window.addEventListener("tramite-creado", handleUpdate);
    window.addEventListener("tramite_actualizado", handleUpdate);

    return () => {
      window.removeEventListener("tramite-creado", handleUpdate);
      window.removeEventListener("tramite_actualizado", handleUpdate);
    };
  }, [refetch]);

  // 🔥 FUNCION GENÉRICA UPDATE
  async function updateTramite(
  id: string,
  data: Record<string, unknown>
) {
    const { error } = await supabase.from("tramites").update(data).eq("id", id);

    if (error) {
      console.error(error);
      alert("Error");
      return;
    }

    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Seguro que querés eliminar este trámite?")) return;

    const { error } = await supabase.from("tramites").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Error al eliminar");
    } else {
      window.dispatchEvent(new Event("tramite_actualizado"));
    }
  }

  function estadoColor(estado: string) {
    switch (estado) {
      case "en_preparacion": return "bg-yellow-500";
      case "presentado": return "bg-green-500";
      case "observado": return "bg-red-500";
      case "subsanado": return "bg-purple-500";
      case "finalizado": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  }

  const tramitesFiltrados = tramites.filter((t) => {
    if (estadoFiltro === "todos") return true;
    return t.estado === estadoFiltro;
  });

  return (
    <div className="p-4">

      {/* TABLA */}
      <table className="w-full text-left border-collapse">
        <thead className="border-b border-gray-700 text-gray-400 text-sm">
          <tr>
            <th className="p-2"></th>
            <th className="p-2">Embarcación</th>
            <th className="p-2">Titular</th>
            <th className="p-2">Matrícula</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Dependencia</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Broker</th>
            <th className="p-2">Días</th>
            <th className="p-2">Saldo</th>
            <th className="p-2 text-right"></th>
          </tr>
        </thead>

        <tbody>
          {tramitesFiltrados.map((t) => (
            <tr
              key={t.tramite_id}
              onClick={() => {
                setTramiteSeleccionado(t.tramite_id);
                setEditarDirecto(false);
              }}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
            >
              <td className="p-2" onClick={(e) => {
                e.stopPropagation();
                updateTramite(t.tramite_id, { provisorio_solicitado: true });
              }}>
                🔄
              </td>

              <td className="p-2">{t.embarcacion}</td>
              <td className="p-2">{t.titular}</td>
              <td className="p-2">{t.matricula}</td>

              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs ${estadoColor(t.estado)}`}>
                  {t.estado}
                </span>
              </td>

              <td className="p-2">{t.dependencia}</td>
              <td className="p-2">{t.tipo_tramite}</td>
              <td className="p-2">{t.broker || "-"}</td>
              <td className="p-2">{t.dias_abierto}</td>
              <td className="p-2">${t.saldo}</td>

              <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setMenuAbierto(menuAbierto === t.tramite_id ? null : t.tramite_id)}>
                  ⋮
                </button>

                {menuAbierto === t.tramite_id && (
                  <div className="absolute right-2 mt-2 bg-gray-900 border border-gray-700 rounded z-50">

                    <div className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        setTramiteSeleccionado(t.tramite_id);
                        setEditarDirecto(true);
                        setMenuAbierto(null);
                      }}>
                      Editar
                    </div>

                    <div className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
                      onClick={() => updateTramite(t.tramite_id, { subsanacion_lista: true })}>
                      Subsanar
                    </div>

                    <div className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
                      onClick={() => updateTramite(t.tramite_id, { listo_para_repartir: true })}>
                      Repartir
                    </div>

                    <div className="px-3 py-2 hover:bg-red-600 cursor-pointer text-red-400"
                      onClick={() => handleEliminar(t.tramite_id)}>
                      Eliminar
                    </div>

                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tramiteSeleccionado && (
        <Modal
          tramiteId={tramiteSeleccionado}
          startInEdit={editarDirecto}
          onClose={() => {
            setTramiteSeleccionado(null);
            setEditarDirecto(false);
          }}
        />
      )}
    </div>
  );
}
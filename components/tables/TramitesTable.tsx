"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Modal from "@/components/modal/hook/modal";
import { useTramites } from "@/app/hooks/useTramites";

const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "en_preparacion", label: "En preparacion" },
  { value: "presentado", label: "Presentado" },
  { value: "observado", label: "Observado" },
  { value: "subsanado", label: "Subsanado" },
  { value: "finalizado", label: "Finalizado" },
];

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export default function TramitesTable() {
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [editarDirecto, setEditarDirecto] = useState(false);

  const hoy = new Date();
  const [mes, setMes] = useState(String(hoy.getMonth() + 1));
  const [anio, setAnio] = useState(String(hoy.getFullYear()));
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const { tramites, loading, fetching, refetch } = useTramites(mes, anio);

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

  async function updateTramite(id: string, data: Record<string, unknown>) {
    const { error } = await supabase.from("tramites").update(data).eq("id", id);

    if (error) {
      console.error("ERROR TramitesTable:", error);
      alert("Error al actualizar el tramite");
      return;
    }

    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  async function handleEliminar(id: string) {
    if (!confirm("Seguro que queres eliminar este tramite?")) return;

    const { error } = await supabase.from("tramites").delete().eq("id", id);

    if (error) {
      console.error("ERROR eliminar tramite:", error);
      alert("Error al eliminar");
      return;
    }

    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  function estadoColor(estado: string | null | undefined) {
    switch (estado) {
      case "en_preparacion":
        return "bg-yellow-500";
      case "presentado":
        return "bg-green-500";
      case "observado":
        return "bg-red-500";
      case "subsanado":
        return "bg-purple-500";
      case "finalizado":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  }

  const tramitesFiltrados = tramites.filter((tramite) => {
    if (estadoFiltro === "todos") return true;
    return tramite.estado === estadoFiltro;
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-gray-400">
            Mes
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="rounded bg-gray-800 px-3 py-2 text-white"
            >
              {MESES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-400">
            Anio
            <input
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="rounded bg-gray-800 px-3 py-2 text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-400">
            Estado
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="rounded bg-gray-800 px-3 py-2 text-white"
            >
              {ESTADOS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {fetching && !loading && (
          <span className="text-sm text-gray-400">Actualizando...</span>
        )}
      </div>

      {loading ? (
        <div className="rounded border border-gray-800 p-6 text-gray-400">
          Cargando tramites...
        </div>
      ) : (
        <>
          {tramitesFiltrados.length === 0 && (
            <div className="mb-4 rounded border border-gray-800 p-4 text-sm text-gray-400">
              No hay tramites para los filtros seleccionados.
            </div>
          )}

          <table className="w-full border-collapse text-left">
            <thead className="border-b border-gray-700 text-sm text-gray-400">
              <tr>
                <th className="p-2"></th>
                <th className="p-2">Embarcacion</th>
                <th className="p-2">Titular</th>
                <th className="p-2">Matricula</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Dependencia</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Broker</th>
                <th className="p-2">Dias</th>
                <th className="p-2">Saldo</th>
                <th className="p-2 text-right"></th>
              </tr>
            </thead>

            <tbody>
              {tramitesFiltrados.map((tramite) => (
                <tr
                  key={tramite.tramite_id}
                  onClick={() => {
                    setTramiteSeleccionado(tramite.tramite_id);
                    setEditarDirecto(false);
                  }}
                  className="cursor-pointer border-b border-gray-800 hover:bg-gray-800"
                >
                  <td
                    className="p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTramite(tramite.tramite_id, { provisorio_solicitado: true });
                    }}
                  >
                    R
                  </td>

                  <td className="p-2">{tramite.embarcacion || "-"}</td>
                  <td className="p-2">{tramite.titular || "-"}</td>
                  <td className="p-2">{tramite.matricula || "-"}</td>

                  <td className="p-2">
                    <span className={`rounded px-2 py-1 text-xs ${estadoColor(tramite.estado)}`}>
                      {tramite.estado || "-"}
                    </span>
                  </td>

                  <td className="p-2">{tramite.dependencia || "-"}</td>
                  <td className="p-2">{tramite.tipo_tramite || "-"}</td>
                  <td className="p-2">{tramite.broker || "-"}</td>
                  <td className="p-2">{tramite.dias_abierto ?? "-"}</td>
                  <td className="p-2">${tramite.saldo ?? 0}</td>

                  <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() =>
                        setMenuAbierto(
                          menuAbierto === tramite.tramite_id ? null : tramite.tramite_id
                        )
                      }
                    >
                      ...
                    </button>

                    {menuAbierto === tramite.tramite_id && (
                      <div className="absolute right-2 z-50 mt-2 rounded border border-gray-700 bg-gray-900">
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left hover:bg-gray-800"
                          onClick={() => {
                            setTramiteSeleccionado(tramite.tramite_id);
                            setEditarDirecto(true);
                            setMenuAbierto(null);
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left hover:bg-gray-800"
                          onClick={() =>
                            updateTramite(tramite.tramite_id, { subsanacion_lista: true })
                          }
                        >
                          Subsanar
                        </button>

                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left hover:bg-gray-800"
                          onClick={() =>
                            updateTramite(tramite.tramite_id, { listo_para_repartir: true })
                          }
                        >
                          Repartir
                        </button>

                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-red-400 hover:bg-red-600 hover:text-white"
                          onClick={() => handleEliminar(tramite.tramite_id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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

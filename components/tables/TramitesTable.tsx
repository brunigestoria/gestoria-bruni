"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/modal/hook/modal";
import { useQueryClient } from "@tanstack/react-query";

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
  
  const meses = [
    "Enero","Febrero","Marzo","Abril",
    "Mayo","Junio","Julio","Agosto",
    "Septiembre","Octubre","Noviembre","Diciembre"
  ];

  // 🔥 QUERY MENSUAL
  const { data: tramites = [], refetch } = useQuery<Tramite[]>({
    queryKey: ["tramites", mes, anio],
    queryFn: async () => {
      let query = supabase
        .from("v_tramites_operativo")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (anio && mes) {
        const mesNum = Number(mes);
        const anioNum = Number(anio);

        const ultimoDia = new Date(anioNum, mesNum, 0).getDate();
        const mesStr = mes.padStart(2, "0");
        const diaStr = String(ultimoDia).padStart(2, "0");

        query = query
          .gte("fecha_creacion", `${anio}-${mesStr}-01`)
          .lte("fecha_creacion", `${anio}-${mesStr}-${diaStr}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },
    placeholderData: (prev) => prev,
  });

  // 🔥 QUERY ANUAL
  const { data: tramitesAnuales = [] } = useQuery<Tramite[]>({
    queryKey: ["tramites-anuales", anio],
    queryFn: async () => {
      let query = supabase
        .from("v_tramites_operativo")
        .select("*");

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
  // QUERY MES ANTERIOR
  const queryClient = useQueryClient();

useEffect(() => {
  const mesActual = Number(mes);
  const anioActual = Number(anio);

  const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
  const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

  queryClient.prefetchQuery({
    queryKey: ["tramites", String(mesAnterior), String(anioAnterior)],
    queryFn: async () => {
      let query = supabase
        .from("v_tramites_operativo")
        .select("*");

      const ultimoDia = new Date(anioAnterior, mesAnterior, 0).getDate();

      query = query
        .gte("fecha_creacion", `${anioAnterior}-${String(mesAnterior).padStart(2,"0")}-01`)
        .lte("fecha_creacion", `${anioAnterior}-${String(mesAnterior).padStart(2,"0")}-${String(ultimoDia).padStart(2,"0")}`);

      const { data } = await query;
      return data || [];
    },
  });

}, [mes, anio]);

  // 🔄 REFRESH GLOBAL
  useEffect(() => {
    function handleUpdate() {
      refetch();
    }

  window.addEventListener("tramite_actualizado", handleUpdate);
  window.addEventListener("tramite_creado", handleUpdate);

  return () => {
    window.removeEventListener("tramite_actualizado", handleUpdate);
    window.removeEventListener("tramite_creado", handleUpdate);
  };
}, [refetch]);

  const aniosDisponibles = Array.from(
    new Set(
      tramitesAnuales
        .map((t) => t.fecha_creacion)
        .filter(Boolean)
        .map((f) => new Date(f as string).getFullYear())
    )
  ).sort((a, b) => b - a);

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

  async function handleRenovar(id: string) {
    await supabase.from("tramites").update({ provisorio_solicitado: true }).eq("id", id);
    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  async function handleSubsanar(id: string) {
    await supabase.from("tramites").update({ subsanacion_lista: true }).eq("id", id);
    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  async function handleRepartir(id: string) {
    await supabase.from("tramites").update({ listo_para_repartir: true }).eq("id", id);
    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  // 🔥 MÉTRICAS
  const totalMes = tramites.length;
  const totalAnio = tramitesAnuales.length;

  const presentadosMes = tramites.filter(t => t.estado === "presentado").length;
  const presentadosAnio = tramitesAnuales.filter(t => t.estado === "presentado").length;

  const observadosMes = tramites.filter(t => t.estado === "observado").length;
  const observadosAnio = tramitesAnuales.filter(t => t.estado === "observado").length;

  const finalizadosMes = tramites.filter(t => t.estado === "finalizado").length;
  const finalizadosAnio = tramitesAnuales.filter(t => t.estado === "finalizado").length;

  const tramitesFiltrados = tramites.filter((t) => {
    if (estadoFiltro === "todos") return true;
    return t.estado === estadoFiltro;
  });

  return (
    <div className="p-4">

      {/* FILTROS */}
      <div className="flex gap-2 mb-4">
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="px-2 py-1 bg-gray-900 border border-gray-700 rounded">
          <option value="">Todos</option>
          {meses.map((nombre, i) => (
            <option key={i} value={i + 1}>{nombre}</option>
          ))}
        </select>

        <select value={anio} onChange={(e) => setAnio(e.target.value)} className="px-2 py-1 bg-gray-900 border border-gray-700 rounded">
          {aniosDisponibles.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-4">

        <div className="bg-gray-800 p-4 rounded">
          <p className="text-xs text-gray-400">TOTAL</p>
          <p className="text-xl">{totalMes}</p>
          <p className="text-xs text-gray-500">Anual: {totalAnio}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p className="text-xs text-gray-400">PRESENTADOS</p>
          <p className="text-xl text-green-400">{presentadosMes}</p>
          <p className="text-xs text-gray-500">Anual: {presentadosAnio}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p className="text-xs text-gray-400">OBSERVADOS</p>
          <p className="text-xl text-red-400">{observadosMes}</p>
          <p className="text-xs text-gray-500">Anual: {observadosAnio}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p className="text-xs text-gray-400">FINALIZADOS</p>
          <p className="text-xl text-blue-400">{finalizadosMes}</p>
          <p className="text-xs text-gray-500">Anual: {finalizadosAnio}</p>
        </div>

      </div>

      {/* FILTRO ESTADO */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { label: "Todos", value: "todos" },
          { label: "Preparación", value: "en_preparacion" },
          { label: "Presentado", value: "presentado" },
          { label: "Observado", value: "observado" },
          { label: "Subsanado", value: "subsanado" },
          { label: "Finalizado", value: "finalizado" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setEstadoFiltro(f.value)}
            className={`px-3 py-1 rounded-full text-sm ${
              estadoFiltro === f.value
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

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
              <td className="p-2" onClick={(e) => { e.stopPropagation(); handleRenovar(t.tramite_id); }}>
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

              <td className="p-2 text-right relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setMenuAbierto(menuAbierto === t.tramite_id ? null : t.tramite_id)}>
                  ⋮
                </button>

                {menuAbierto === t.tramite_id && (
                  <div className="absolute right-2 mt-2 bg-gray-900 border border-gray-700 rounded z-50">

                    <div className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        setTramiteSeleccionado(t.tramite_id);
                        setEditarDirecto(false);
                        setMenuAbierto(null);
                      }}>
                      Consultar
                    </div>

                    <div className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        setTramiteSeleccionado(t.tramite_id);
                        setEditarDirecto(true);
                        setMenuAbierto(null);
                      }}>
                      Editar
                    </div>

                    <div className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        handleSubsanar(t.tramite_id);
                        setMenuAbierto(null);
                      }}>
                      Subsanar
                    </div>

                    <div className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        handleRepartir(t.tramite_id);
                        setMenuAbierto(null);
                      }}>
                      Repartir
                    </div>

                    <div className="px-3 py-2 hover:bg-red-600 cursor-pointer text-red-400"
                      onClick={() => {
                        handleEliminar(t.tramite_id);
                        setMenuAbierto(null);
                      }}>
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
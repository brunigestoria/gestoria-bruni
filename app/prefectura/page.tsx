"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Resumen = {
  presentar: number;
  subsanar: number;
  renovar: number;
  consultar: number;
  seguimiento: number;
};

type TramiteItem = {
  id?: string;
  embarcacion?: string;
  titular_principal?: string;
  fecha?: string;
  estado?: string;
  [key: string]: unknown;
};

type CardProps = {
  titulo: string;
  cantidad: number;
  onClick: () => void;
};

export default function PrefecturaPage() {
  const [data, setData] = useState<Resumen | null>(null);
  const [vistaActiva, setVistaActiva] = useState<string | null>(null);
  const [lista, setLista] = useState<TramiteItem[]>([]);
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState<string | null>(null);

  const columnasPorVista: Record<string, { label: string; key: string }[]> = {
    vista_subsanar_hoy: [
      { label: "Embarcación", key: "embarcacion" },
      { label: "Titular", key: "titular_principal" },
      { label: "Días", key: "dias_en_estado" },
    ],
    vista_renovar_hoy: [
      { label: "Embarcación", key: "embarcacion" },
      { label: "Titular", key: "titular_principal" },
      { label: "Vencimiento", key: "fecha_vencimiento" },
      { label: "Pedido", key: "provisorio_solicitado" },
    ],
    vista_consultar_hoy: [
      { label: "Embarcación", key: "embarcacion" },
      { label: "Descripción", key: "description" },
      { label: "Tipo", key: "tipo" },
      { label: "Prioridad", key: "prioridad" },
    ],
    vista_presentar_hoy: [
      { label: "Embarcación", key: "embarcacion" },
      { label: "Titular", key: "titular_principal" },
      { label: "Prioridad", key: "prioridad_provisorio" },
    ],
    vista_seguimiento_hoy: [
      { label: "Embarcación", key: "embarcacion" },
      { label: "Titular", key: "titular_principal" },
      { label: "Prioridad", key: "prioridad_matricula" },
    ],
  };

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from("vista_prefectura_resumen")
        .select("*")
        .single();

      setData(data);
    }

    cargar();
  }, []);

  async function cargarLista(vista: string) {
    const { data } = await supabase.from(vista).select("*");

    setLista(data || []);
    setVistaActiva(vista);
  }

  if (!data) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Prefectura Hoy</h1>

      {/* 🔹 CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card titulo="Presentar" cantidad={data.presentar} onClick={() => cargarLista("vista_presentar_hoy")} />
        <Card titulo="Subsanar" cantidad={data.subsanar} onClick={() => cargarLista("vista_subsanar_hoy")} />
        <Card titulo="Renovar" cantidad={data.renovar} onClick={() => cargarLista("vista_renovar_hoy")} />
        <Card titulo="Consultar" cantidad={data.consultar} onClick={() => cargarLista("vista_consultar_hoy")} />
        <Card titulo="Seguimiento" cantidad={data.seguimiento} onClick={() => cargarLista("vista_seguimiento_hoy")} />
      </div>

      {/* 🔹 LISTA */}
      {vistaActiva && (
        <div className="mt-6 bg-gray-900 p-4 rounded border border-gray-700">
          <h2 className="mb-4 text-sm text-gray-400">
            Lista - {vistaActiva}
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr>
                {columnasPorVista[vistaActiva]?.map((col) => (
                  <th key={col.key} className="text-left py-2">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-4 text-center text-gray-500">
                    No hay registros
                  </td>
                </tr>
              ) : (
                lista.map((item, i) => (
                  <tr
                    key={i}
                    onClick={() => item.id && setTramiteSeleccionado(item.id)}
                    className="border-t border-gray-800 cursor-pointer hover:bg-gray-800"
                  >
                    {columnasPorVista[vistaActiva]?.map((col) => (
                      <td key={col.key} className="py-2">
                        {(() => {
                          const valor = item[col.key];

                          if (valor === true) return "Sí";
                          if (valor === false) return "No";
                          if (!valor) return "-";

                          return String(valor);
                        })()}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 🔹 CARD
function Card({ titulo, cantidad, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-900 p-4 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition"
    >
      <div className="text-sm text-gray-400">{titulo}</div>
      <div className="text-3xl font-bold mt-2">{cantidad}</div>
      <div className="mt-4 text-blue-400 text-sm">Ver lista</div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type TipoTramite = {
  id: string;
  nombre: string;
};

type Props = {
  onChange: (data: {
    tipoBaseId: string | null;
    adicionales: string[];
    nuevoNombre?: string;
  }) => void;
};

export default function TiposTramiteSection({ onChange }: Props) {
  const [tipos, setTipos] = useState<TipoTramite[]>([]);
  const [tipoBaseId, setTipoBaseId] = useState<string | null>(null);

  const [cambioMotor, setCambioMotor] = useState(false);
  const [cambioNombre, setCambioNombre] = useState(false);
  const [cambioRegistro, setCambioRegistro] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState("");
  

  // cargar tipos desde supabase
  useEffect(() => {
    async function cargarTipos() {
      const { data, error } = await supabase
        .from("tipos_tramite")
        .select("id,nombre")
        .order("nombre");

      if (!error && data) setTipos(data);
    }

    cargarTipos();
  }, []);

  // avisar cambios al componente padre
  useEffect(() => {
    const adicionales: string[] = [];

    if (cambioMotor) adicionales.push("cambio_motor");
    if (cambioNombre) adicionales.push("cambio_nombre");
    if (cambioRegistro) adicionales.push("cambio_registro");

    onChange({
      tipoBaseId,
      adicionales,
      nuevoNombre: cambioNombre ? nuevoNombre : undefined,
    });
  }, [
    tipoBaseId,
    cambioMotor,
    cambioNombre,
    cambioRegistro,
    nuevoNombre,
    onChange,
  ]);
  

  const tipoSeleccionado = tipos.find((t) => t.id === tipoBaseId);

  return (
    <div className="bg-gray-900 p-4 rounded space-y-4">

      <div>
        <label className="block text-sm mb-1">Tipo de trámite</label>

        <select
          className="w-full bg-gray-800 p-2 rounded"
          value={tipoBaseId ?? ""}
          onChange={(e) => {
            setTipoBaseId(e.target.value);
            setCambioMotor(false);
            setCambioNombre(false);
            setCambioRegistro(false);
          }}
        >
          <option value="">Seleccionar...</option>

          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Opciones dinámicas */}
      {tipoSeleccionado && (
        <div className="space-y-2">

          {/* transferencia */}
          {tipoSeleccionado.nombre.toLowerCase() === "transferencia" && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cambioMotor}
                  onChange={(e) => setCambioMotor(e.target.checked)}
                />
                Cambio de motor
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cambioNombre}
                  onChange={(e) => setCambioNombre(e.target.checked)}
                />
                Cambio de nombre
              </label>

              {cambioNombre && (
                <input
                  className="w-full bg-gray-800 p-2 rounded"
                  placeholder="Nuevo nombre"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cambioRegistro}
                  onChange={(e) => setCambioRegistro(e.target.checked)}
                />
                Eliminación o cambio de jurisdicción
              </label>
            </>
          )}

          {/* cambio de motor */}
          {tipoSeleccionado.nombre.toLowerCase() === "cambio de motor" && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cambioNombre}
                  onChange={(e) => setCambioNombre(e.target.checked)}
                />
                Cambio de nombre
              </label>

              {cambioNombre && (
                <input
                  className="w-full bg-gray-800 p-2 rounded"
                  placeholder="Nuevo nombre"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cambioRegistro}
                  onChange={(e) => setCambioRegistro(e.target.checked)}
                />
                Eliminación o cambio de jurisdicción
              </label>
            </>
          )}

        </div>
      )}
    </div>
  );
}
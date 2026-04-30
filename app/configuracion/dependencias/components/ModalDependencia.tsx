"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Dependencia } from "../hook/useDependencias";

type Props = {
  dependencia: Dependencia | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ModalDependencia({
  dependencia,
  onClose,
  onSaved,
}: Props) {
  const [nombre, setNombre] = useState(dependencia?.nombre || "");
  const [sigla, setSigla] = useState(dependencia?.sigla || "");
  const [capacidad, setCapacidad] = useState(
    dependencia?.max_tramites_diarios || 0
  );
  const [diasPromedio, setDiasPromedio] = useState(
    dependencia?.dias_turno_promedio || 0
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 👇 días de atención
  const [dias, setDias] = useState({
    lunes: dependencia?.lunes ?? false,
    martes: dependencia?.martes ?? false,
    miercoles: dependencia?.miercoles ?? false,
    jueves: dependencia?.jueves ?? false,
    viernes: dependencia?.viernes ?? false,
  });

  function toggleDia(dia: keyof typeof dias) {
    setDias((prev) => ({
      ...prev,
      [dia]: !prev[dia],
    }));
  }

  function validar() {
    if (!nombre.trim()) return "El nombre es obligatorio";
    if (!sigla.trim()) return "La sigla es obligatoria";
    if (capacidad <= 0) return "La capacidad debe ser mayor a 0";
    if (diasPromedio <= 0) return "Los días deben ser mayor a 0";

    const algunDia = Object.values(dias).some(Boolean);
    if (!algunDia) return "Seleccioná al menos un día de atención";

    return "";
  }

  async function handleSave() {
    const errorMsg = validar();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    if (saving) return;
    setSaving(true);
    setError("");

    const payload = {
      nombre,
      sigla,
      max_tramites_diarios: capacidad,
      dias_turno_promedio: diasPromedio,
      ...dias,
    };

    try {
      if (dependencia) {
        await supabase
          .from("dependencias")
          .update(payload)
          .eq("id", dependencia.id);
      } else {
        await supabase.from("dependencias").insert(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-6 rounded-xl w-105 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">
          {dependencia ? "Editar dependencia" : "Nueva dependencia"}
        </h2>

        {/* ERROR */}
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        {/* NOMBRE */}
        <div>
          <label className="text-sm text-gray-400">
            Nombre completo
          </label>
          <input
            className="w-full mt-1 p-2 bg-slate-700 rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        {/* SIGLA */}
        <div>
          <label className="text-sm text-gray-400">
            Sigla (ej: TIGR, SFER)
          </label>
          <input
            className="w-full mt-1 p-2 bg-slate-700 rounded uppercase"
            value={sigla}
            onChange={(e) =>
              setSigla(e.target.value.toUpperCase())
            }
          />
        </div>

        {/* CAPACIDAD */}
        <div>
          <label className="text-sm text-gray-400">
            Capacidad diaria (trámites/día)
          </label>
          <input
            type="number"
            className="w-full mt-1 p-2 bg-slate-700 rounded"
            value={capacidad}
            onChange={(e) => setCapacidad(Number(e.target.value))}
          />
        </div>

        {/* DIAS PROMEDIO */}
        <div>
          <label className="text-sm text-gray-400">
            Días promedio hasta provisorio
          </label>
          <input
            type="number"
            className="w-full mt-1 p-2 bg-slate-700 rounded"
            value={diasPromedio}
            onChange={(e) =>
              setDiasPromedio(Number(e.target.value))
            }
          />
        </div>

        {/* DIAS */}
        <div>
          <label className="text-sm text-gray-400">
            Días de atención
          </label>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(dias).map(([dia, value]) => (
              <label
                key={dia}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() =>
                    toggleDia(dia as keyof typeof dias)
                  }
                />
                {dia.charAt(0).toUpperCase() + dia.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-600 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-blue-600 rounded disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
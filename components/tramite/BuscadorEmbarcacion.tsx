"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Embarcacion = {
  id: string;
  nombre: string;
  matricula: string;
};

type Props = {
  onSelect: (embarcacion: Embarcacion) => void;
};

export default function BuscadorEmbarcacion({ onSelect }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Embarcacion[]>([]);
  const [crearNuevo, setCrearNuevo] = useState(false);

  const [nombre, setNombre] = useState("");
  const [matricula, setMatricula] = useState("");
  const [eslora, setEslora] = useState("");
  const [tieneMotor, setTieneMotor] = useState(false);

  useEffect(() => {
    async function buscar() {
      if (busqueda.length < 2) {
        setResultados([]);
        return;
      }

      const { data } = await supabase
        .from("embarcaciones")
        .select("id,nombre,matricula")
        .ilike("nombre", `%${busqueda}%`)
        .limit(5);

      if (data) setResultados(data);
    }

    buscar();
  }, [busqueda]);

  async function crearEmbarcacion() {
    const { data, error } = await supabase
      .from("embarcaciones")
      .insert({
        nombre,
        matricula,
        eslora: eslora ? Number(eslora) : null,
        tiene_motor: tieneMotor,
      })
      .select()
      .single();

    if (!error && data) {
      onSelect(data);
      setCrearNuevo(false);
      setBusqueda("");
    }
  }

  return (
    <div className="bg-gray-900 p-4 rounded space-y-3">

      <label className="text-sm">Embarcación</label>

      <input
        className="w-full bg-gray-800 p-2 rounded"
        placeholder="Buscar embarcación..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {resultados.length > 0 && (
        <div className="bg-gray-800 rounded">

          {resultados.map((e) => (
            <div
              key={e.id}
              className="p-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => onSelect(e)}
            >
              {e.nombre} — {e.matricula}
            </div>
          ))}

        </div>
      )}

      {busqueda.length > 2 && resultados.length === 0 && !crearNuevo && (
        <button
          className="text-blue-400"
          onClick={() => setCrearNuevo(true)}
        >
          + Crear nueva embarcación
        </button>
      )}

      {crearNuevo && (
        <div className="space-y-2 bg-gray-800 p-3 rounded">

          <input
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="Matrícula *"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
          />

          <input
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="Eslora"
            value={eslora}
            onChange={(e) => setEslora(e.target.value)}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tieneMotor}
              onChange={(e) => setTieneMotor(e.target.checked)}
            />
            Tiene motor
          </label>

          <button
            className="bg-blue-600 px-3 py-1 rounded"
            onClick={crearEmbarcacion}
          >
            Crear embarcación
          </button>

        </div>
      )}

    </div>
  );
}
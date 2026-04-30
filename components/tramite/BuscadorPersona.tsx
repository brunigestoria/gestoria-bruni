"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  dni: string;
};

type Props = {
  onSelect: (persona: Persona) => void;
};

export default function BuscadorPersona({ onSelect }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Persona[]>([]);
  const [crearNuevo, setCrearNuevo] = useState(false);

  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mail, setMail] = useState("");

  useEffect(() => {
    async function buscar() {
      if (busqueda.length < 2) {
        setResultados([]);
        return;
      }

      const { data } = await supabase
        .from("personas")
        .select("id,nombre,dni")
        .ilike("nombre", `%${busqueda}%`)
        .limit(5);

      if (data) setResultados(data);
    }

    buscar();
  }, [busqueda]);

  async function crearPersona() {
    const { data, error } = await supabase
      .from("personas")
      .insert({
        nombre,
        dni,
        telefono,
        mail,
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

      <input
        className="w-full bg-gray-800 p-2 rounded"
        placeholder="Buscar persona..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {resultados.length > 0 && (
        <div className="bg-gray-800 rounded">

          {resultados.map((p) => (
            <div
              key={p.id}
              className="p-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => onSelect(p)}
            >
              {p.nombre} — DNI {p.dni}
            </div>
          ))}

        </div>
      )}

      {busqueda.length > 2 && resultados.length === 0 && !crearNuevo && (
        <button
          className="text-blue-400"
          onClick={() => setCrearNuevo(true)}
        >
          + Crear nueva persona
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
            placeholder="DNI *"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
          />

          <input
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />

          <input
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="Mail"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />

          <button
            className="bg-blue-600 px-3 py-1 rounded"
            onClick={crearPersona}
          >
            Crear persona
          </button>

        </div>
      )}

    </div>
  );
}
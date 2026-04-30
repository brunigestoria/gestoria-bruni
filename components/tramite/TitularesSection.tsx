"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import TitularItem from "@/components/ICC/TitularItem";

type Titular = {
  id?: string;
  nombre: string;
  dni: string;
  telefono?: string;
  email?: string;
  es_principal: boolean;
};

type Persona = {
  id: string;
  nombre: string;
  dni: string;
};

type Props = {
  onChange: (titulares: Titular[]) => void;
};

export default function TitularesSection({ onChange }: Props) {
  const [titulares, setTitulares] = useState<Titular[]>([]);
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);

  // 🔹 cargar personas
  useEffect(() => {
    async function cargarPersonas() {
      const { data } = await supabase
        .from("personas")
        .select("id, nombre, dni")
        .eq("tipo", "titular");

      setPersonas(data || []);
    }

    cargarPersonas();
  }, []);

  // 🔹 filtros
  const filtradosNombre = personas.filter((p) =>
    p.nombre.toLowerCase().includes(nombre.toLowerCase())
  );

  const filtradosDni = personas.filter((p) =>
    (p.dni || "").includes(dni)
  );

  // 🔥 AGREGAR TITULAR (VERSIÓN CORRECTA)
  const agregarTitular = async () => {
    if (!nombre || !dni) return;

    const dniLimpio = dni.replace(/\D/g, "");

    if (titulares.some((t) => t.dni === dniLimpio)) return;

    // 🔥 buscar en DB (clave para ICC)
    const { data: personaExistente } = await supabase
      .from("personas")
      .select("id, nombre, dni")
      .eq("dni", dniLimpio)
      .maybeSingle();

    const nuevo: Titular = {
      id: personaExistente?.id,
      nombre: (personaExistente?.nombre || nombre).trim().toUpperCase(),
      dni: dniLimpio,
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      es_principal: titulares.length === 0,
    };

    setTitulares((prev) => [...prev, nuevo]);

    setNombre("");
    setDni("");
    setTelefono("");
    setEmail("");
  };

  const cambiarPrincipal = (index: number) => {
    setTitulares((prev) =>
      prev.map((t, i) => ({
        ...t,
        es_principal: i === index,
      }))
    );
  };

  const eliminarTitular = (index: number) => {
    setTitulares((prev) => {
      const nuevos = prev.filter((_, i) => i !== index);

      if (nuevos.length > 0 && !nuevos.find((t) => t.es_principal)) {
        nuevos[0].es_principal = true;
      }

      return nuevos;
    });
  };

  // 🔹 enviar al padre
  useEffect(() => {
    onChange(titulares);
  }, [titulares, onChange]);

  // 🔹 auto-add (corregido async)
  useEffect(() => {
    async function autoAdd() {
      if (!nombre || !dni) return;
      if (dni.length < 7) return;

      const yaExiste = titulares.some((t) => t.dni === dni);
      if (yaExiste) return;

      await agregarTitular();
    }

    autoAdd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni]);

  return (
    <div className="bg-gray-900 p-4 rounded space-y-4">
      <label className="block text-sm">Titulares</label>

      {/* INPUTS */}
      <div className="flex gap-2">

        {/* DNI */}
        <div className="relative w-40">
          <input
            className="w-full bg-gray-800 p-2 rounded"
            placeholder="DNI"
            value={dni}
            onChange={(e) =>
              setDni(e.target.value.replace(/\D/g, ""))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") agregarTitular();
            }}
          />

          {dni && (
            <div className="absolute w-full bg-gray-800 border border-gray-700 mt-1 rounded z-50 max-h-40 overflow-auto">
              {filtradosDni.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setDni(p.dni);
                    setNombre(p.nombre);
                  }}
                  className="p-2 hover:bg-gray-700 cursor-pointer"
                >
                  {p.dni} ({p.nombre})
                </div>
              ))}

              {filtradosDni.length === 0 && (
                <div className="p-2 text-gray-400">
                  DNI no registrado
                </div>
              )}
            </div>
          )}
        </div>

        {/* NOMBRE */}
        <div className="relative flex-1">
          <input
            className="w-full bg-gray-800 p-2 rounded"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          {nombre && (
            <div className="absolute w-full bg-gray-800 border border-gray-700 mt-1 rounded z-50 max-h-40 overflow-auto">
              {filtradosNombre.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setNombre(p.nombre);
                    setDni(p.dni);
                  }}
                  className="p-2 hover:bg-gray-700 cursor-pointer"
                >
                  {p.nombre} ({p.dni})
                </div>
              ))}

              {filtradosNombre.length === 0 && (
                <div className="p-2 text-gray-400">
                  Se creará nuevo titular
                </div>
              )}
            </div>
          )}
        </div>

        {/* TEL */}
        <input
          className="w-40 bg-gray-800 p-2 rounded"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        {/* EMAIL */}
        <input
          className="w-40 bg-gray-800 p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="bg-blue-600 px-3 rounded"
          onClick={agregarTitular}
        >
          +
        </button>
      </div>

      {/* LISTA */}
      {titulares.length > 0 && (
        <div className="space-y-2">
          {titulares.map((t, i) => (
            <div key={i} className="bg-gray-800 p-2 rounded">
              
              <TitularItem titular={t} />

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={t.es_principal}
                    onChange={() => cambiarPrincipal(i)}
                  />
                  {t.es_principal && (
                    <span className="text-xs text-green-400">
                      (principal)
                    </span>
                  )}
                </div>

                <button
                  className="text-red-400"
                  onClick={() => eliminarTitular(i)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
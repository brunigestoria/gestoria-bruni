"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import TitularesSection from "./TitularesSection";
import TiposTramiteSection from "./TiposTramiteSection";
import DatosOperativosSection from "./DatosOperativosSection";

export default function NuevoTramiteModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  // 🔹 TYPES
  type Embarcacion = { id: string; nombre: string; matricula: string };
  type Persona = { id: string; nombre: string; dni: string };
  type Titular = { nombre: string; dni: string; es_principal: boolean };

  type DatosOperativos = {
    lugar_guarda: string;
    valor: number | null;
    dejo_arba: boolean;
    firmo_autorizacion: boolean;
    observaciones: string;
    pago_inicial: number | null;
  };

  type Broker = { id: string; nombre: string };

  // 🔹 STATES
  const [nombreEmbarcacion, setNombreEmbarcacion] = useState("");
  const [matricula, setMatricula] = useState("");
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [titulares, setTitulares] = useState<Titular[]>([]);
  const [datos, setDatos] = useState<DatosOperativos | null>(null);

  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokerNombre, setBrokerNombre] = useState("");
  const [brokerTelefono, setBrokerTelefono] = useState("");

  const [loading, setLoading] = useState(false);

  // 🔹 LOAD DATA
  useEffect(() => {
    async function cargar() {
      const { data: emb } = await supabase
        .from("embarcaciones")
        .select("id, nombre, matricula");

      const { data: pers } = await supabase
        .from("personas")
        .select("id, nombre, dni")
        .eq("tipo", "titular");

      const { data: brok } = await supabase
        .from("personas")
        .select("id, nombre")
        .eq("tipo", "broker");

      setEmbarcaciones((emb as Embarcacion[]) || []);
      setPersonas((pers as Persona[]) || []);
      setBrokers((brok as Broker[]) || []);
    }

    cargar();
  }, []);

  // 🔥 FUNCIÓN PRINCIPAL
  const crearTramite = async () => {
    if (loading) return;

    if (!nombreEmbarcacion.trim()) {
      alert("Debe ingresar una embarcación");
      return;
    }

    setLoading(true);

    try {
      const total = datos?.valor || 0;
      const pago = datos?.pago_inicial || 0;

      // ✅ VALIDACIÓN CORRECTA
      if (pago > total) {
        alert("El pago inicial no puede ser mayor al total del trámite");
        return;
      }

      // 🔹 EMBARCACIÓN
      const nombreEmb = nombreEmbarcacion.trim().toUpperCase();
      let embarcacion_id = null;

      const { data: embarcacionExistente } = await supabase
        .from("embarcaciones")
        .select("id")
        .ilike("nombre", nombreEmb)
        .eq("matricula", matricula)
        .maybeSingle();

      if (embarcacionExistente) {
        embarcacion_id = embarcacionExistente.id;
      } else {
        const { data: nuevaEmbarcacion, error } = await supabase
          .from("embarcaciones")
          .insert({
            nombre: nombreEmb,
            matricula,
          })
          .select()
          .single();

        if (error) throw error;

        embarcacion_id = nuevaEmbarcacion.id;
      }

      // 🔹 BROKER
      let broker_id = null;

      if (brokerNombre.trim()) {
        const nombreBroker = brokerNombre.trim().toUpperCase();

        const { data: brokerExistente } = await supabase
          .from("personas")
          .select("id")
          .eq("nombre", nombreBroker)
          .eq("tipo", "broker")
          .maybeSingle();

        if (brokerExistente) {
          broker_id = brokerExistente.id;
        } else {
          const { data: nuevoBroker, error } = await supabase
            .from("personas")
            .insert({
              nombre: nombreBroker,
              telefono: brokerTelefono || null,
              tipo: "broker",
            })
            .select()
            .single();

          if (error) throw error;

          broker_id = nuevoBroker.id;
        }
      }

      // 🔹 CREAR TRÁMITE
      const { data: tramite, error } = await supabase
        .from("tramites")
        .insert({
          embarcacion_id,
          broker_id,
          lugar_guarda_actual: datos?.lugar_guarda || null,
          total_pactado: datos?.valor || null,
          dejo_arba: datos?.dejo_arba || false,
          firmo_autorizacion: datos?.firmo_autorizacion || false,
          observaciones: datos?.observaciones || null,
        })
        .select()
        .single();

      if (error) throw error;

      const tramite_id = tramite.id;

      // 💰 PAGO INICIAL (FIX FINAL)
      if (pago > 0) {
        const { error: errorPago } = await supabase
          .from("pagos_cliente")
          .insert({
            tramite_id,
            monto: Number(pago),
            fecha: new Date(), // 🔥 FIX IMPORTANTE
            es_promesa: false,
          });

        if (errorPago) {
          console.error("ERROR PAGO:", errorPago);
          alert("El trámite se creó, pero falló el pago inicial");
          return; // ❗ no cerrar modal
        }
      }

      // 🔹 TITULARES
      for (const t of titulares) {
        let persona_id = null;

        const { data: personaExistente } = await supabase
          .from("personas")
          .select("id")
          .eq("dni", t.dni)
          .maybeSingle();

        if (personaExistente) {
          persona_id = personaExistente.id;
        } else {
          const { data: nuevaPersona } = await supabase
            .from("personas")
            .insert({
              nombre: t.nombre,
              dni: t.dni,
              tipo: "titular",
            })
            .select()
            .single();

          persona_id = nuevaPersona.id;
        }

        await supabase.from("tramite_titulares").insert({
          tramite_id,
          persona_id,
          es_principal: t.es_principal,
        });
      }

      // 🔹 ESTADO INICIAL
      await supabase.from("tramite_estados_historial").insert({
        tramite_id,
        estado: "en_preparacion",
      });

      alert("Trámite creado");
      onCreated();
    } catch (err: unknown) {
  console.error(err);

  if (err instanceof Error) {
    alert(err.message);
  } else {
    alert("Error inesperado");
  }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 UI
  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 w-225 max-w-[90vw] max-h-[90vh] overflow-y-auto p-6 rounded space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">Nuevo trámite</h2>

        <input
          value={matricula}
          placeholder="Matrícula"
          className="w-full p-2 bg-gray-800 rounded"
          onChange={(e) => setMatricula(e.target.value)}
        />

        <input
          value={nombreEmbarcacion}
          placeholder="Nombre embarcación"
          className="w-full p-2 bg-gray-800 rounded"
          onChange={(e) => setNombreEmbarcacion(e.target.value)}
        />

        <TitularesSection onChange={setTitulares} />

        <input
          value={brokerNombre}
          placeholder="Broker"
          className="w-full p-2 bg-gray-800 rounded"
          onChange={(e) => setBrokerNombre(e.target.value)}
        />

        <input
          value={brokerTelefono}
          placeholder="Teléfono"
          className="w-full p-2 bg-gray-800 rounded"
          onChange={(e) =>
            setBrokerTelefono(e.target.value.replace(/\D/g, ""))
          }
        />

        <TiposTramiteSection onChange={() => {}} />
        <DatosOperativosSection onChange={setDatos} />

        <div className="flex justify-end gap-3">
          <button
            className="bg-gray-700 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="bg-blue-600 px-4 py-2 rounded"
            onClick={crearTramite}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear trámite"}
          </button>
        </div>
      </div>
    </div>
  );
}
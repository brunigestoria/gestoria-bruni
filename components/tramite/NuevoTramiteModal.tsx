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
  type Embarcacion = {
    id: string;
    nombre: string;
    matricula: string;
  };

  type Persona = {
    id: string;
    nombre: string;
    dni: string;
  };

  type Titular = {
    nombre: string;
    dni: string;
    es_principal: boolean;
  };

  type TiposData = {
    tipoBaseId: string | null;
    adicionales: string[];
  };

  type DatosOperativos = {
    lugar_guarda: string;
    valor: number | null;
    dejo_arba: boolean;
    firmo_autorizacion: boolean;
    observaciones: string;
    pago_inicial: number | null;
  };

  type Broker = {
    id: string;
    nombre: string;
  };

  // 🔹 STATES ORIGINALES
  const [nombreEmbarcacion, setNombreEmbarcacion] = useState("");
  const [matricula, setMatricula] = useState("");
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [titulares, setTitulares] = useState<Titular[]>([]);
  const [tipos, setTipos] = useState<TiposData | null>(null);
  const [datos, setDatos] = useState<DatosOperativos | null>(null);
  const [pagoInicial, setPagoInicial] = useState("");
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokerNombre, setBrokerNombre] = useState("");
  const [brokerTelefono, setBrokerTelefono] = useState("");

  // 🔥 NUEVO: CONTROL DROPDOWNS
  const [showEmb, setShowEmb] = useState(false);
  const [showMat, setShowMat] = useState(false);
  const [showBroker, setShowBroker] = useState(false);

  // 🔥 NUEVO: ÍNDICES TECLADO
  const [indexEmb, setIndexEmb] = useState(0);
  const [indexMat, setIndexMat] = useState(0);
  const [indexBroker, setIndexBroker] = useState(0);

  // 🔹 CARGA ORIGINAL
  useEffect(() => {
    async function cargarBrokers() {
      const { data } = await supabase
        .from("personas")
        .select("id, nombre")
        .eq("tipo", "broker");

      setBrokers((data as Broker []) || []);
    }

    cargarBrokers();
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      const { data: emb } = await supabase
        .from("embarcaciones")
        .select("id, nombre, matricula");

      const { data: pers } = await supabase
        .from("personas")
        .select("id, nombre, dni")
        .eq("tipo", "titular");

      setEmbarcaciones((emb as Embarcacion []) || []);
      setPersonas((pers as Persona []) || []);
    }

    cargarDatos();
  }, []);

  // 🔥 NUEVO: CLICK AFUERA
  useEffect(() => {
    function cerrar() {
      setShowEmb(false);
      setShowMat(false);
      setShowBroker(false);
    }

    window.addEventListener("click", cerrar);
    return () => window.removeEventListener("click", cerrar);
  }, []);

  // 🔹 FILTROS ORIGINALES
  const embarcacionesFiltradas = embarcaciones.filter((e) =>
    e.nombre.toLowerCase().includes(nombreEmbarcacion.toLowerCase())
  );

  const embarcacionesFiltradasPorMatricula = embarcaciones.filter((e) =>
    (e.matricula || "").toLowerCase().includes(matricula.toLowerCase())
  );

  const brokersFiltrados = brokers.filter((b) =>
    b.nombre.toLowerCase().includes(brokerNombre.toLowerCase())
  );

  // 🔥 NUEVO: TECLADO
  function handleKeyDown<T>(
  e: React.KeyboardEvent<HTMLInputElement>,
  list: T[],
  index: number,
  setIndex: React.Dispatch<React.SetStateAction<number>>,
  onSelect: (item: T) => void
) {
  if (!list.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    setIndex((prev) => (prev + 1) % list.length);
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    setIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  }

  if (e.key === "Enter") {
    e.preventDefault();
    onSelect(list[index]);
  }
}

  // 🔥 FUNCIÓN ORIGINAL (NO TOCADA)
  const crearTramite = async () => {
    if (!nombreEmbarcacion.trim()) {
      alert("Debe ingresar una embarcación");
      return;
    }
    // 💰 validación pago inicial vs total
const total = datos?.valor || 0;
const pago = datos?.pago_inicial || 0;

if (pago > total) {
  alert("El pago inicial no puede ser mayor al total del trámite");
  return;
}

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

      if (error) {
        alert("Error creando embarcación");
        return;
      }

      embarcacion_id = nuevaEmbarcacion.id;
    }

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

        if (error) {
          alert("Error creando broker");
          return;
        }

        broker_id = nuevoBroker.id;
      }
    }

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

    if (error) {
      alert(error.message);
      return;
    }

    const tramite_id = tramite.id;

    // 💰 pago inicial
if (datos?.pago_inicial && datos.pago_inicial > 0) {
  const { error: errorPago } = await supabase
    .from("pagos_cliente")
    .insert({
      tramite_id,
      monto: datos.pago_inicial,
      fecha: new Date().toISOString(),
      es_promesa: false,
    });

  if (errorPago) {
    alert("El trámite se creó, pero falló el pago inicial");
  }
 const total = datos?.valor || 0;
const pago = datos?.pago_inicial || 0;

if (pago > total) {
  alert("El pago inicial no puede ser mayor al total del trámite");
  return;
  }

}

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

    await supabase.from("tramite_estados_historial").insert({
      tramite_id,
      estado: "en_preparacion",
    });

    alert("Trámite creado");
    onClose();
    onCreated();
  };

  // 🔥 UI
  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 w-[w-225] max-w-[90vw] max-h-[90vh] overflow-y-auto p-6 rounded space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">Nuevo trámite</h2>

        {/* MATRÍCULA */}
        <div className="relative">
          <input
            value={matricula}
            placeholder="Matrícula"
            className="w-full p-2 bg-gray-800 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setShowMat(true);
              setShowEmb(false);
              setShowBroker(false);
            }}
            onChange={(e) => {
              setMatricula(e.target.value);
              setShowMat(true);
            }}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                embarcacionesFiltradasPorMatricula,
                indexMat,
                setIndexMat,
                (item: Embarcacion) => {
                setMatricula(item.matricula || "");
                setShowMat(false);
                }
              )
            }
          />

          {showMat && matricula && (
            <div className="absolute w-full bg-gray-800 border mt-1 rounded z-50 max-h-40 overflow-auto">
              {embarcacionesFiltradasPorMatricula.map((e, i) => (
                <div
                  key={e.id}
                  onClick={() => {
                    setMatricula(e.matricula || "");
                    setShowMat(false);
                  }}
                  className={`p-2 cursor-pointer ${
                    i === indexMat ? "bg-gray-700" : ""
                  }`}
                >
                  {e.matricula} ({e.nombre})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EMBARCACIÓN */}
        <div className="relative">
          <input
            value={nombreEmbarcacion}
            placeholder="Nombre embarcación"
            className="w-full p-2 bg-gray-800 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmb(true);
              setShowMat(false);
              setShowBroker(false);
            }}
            onChange={(e) => {
              setNombreEmbarcacion(e.target.value);
              setShowEmb(true);
            }}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                embarcacionesFiltradas,
                indexEmb,
                setIndexEmb,
               (item: Embarcacion) => {
                setNombreEmbarcacion(item.nombre);
                setShowEmb(false);
                }
              )
            }
          />

          {showEmb && nombreEmbarcacion && (
            <div className="absolute w-full bg-gray-800 border mt-1 rounded z-50 max-h-40 overflow-auto">
              {embarcacionesFiltradas.map((e, i) => (
                <div
                  key={e.id}
                  onClick={() => {
                    setNombreEmbarcacion(e.nombre);
                    setShowEmb(false);
                  }}
                  className={`p-2 cursor-pointer ${
                    i === indexEmb ? "bg-gray-700" : ""
                  }`}
                >
                  {e.nombre} ({e.matricula || "sin matrícula"})
                </div>
              ))}
            </div>
          )}
        </div>


        <TitularesSection onChange={setTitulares} />

        {/* BROKER */}
        <div className="relative">
          <input
            value={brokerNombre}
            placeholder="Broker"
            className="w-full p-2 bg-gray-800 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setShowBroker(true);
              setShowEmb(false);
              setShowMat(false);
            }}
            onChange={(e) => {
              setBrokerNombre(e.target.value);
              setShowBroker(true);
            }}
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                brokersFiltrados,
                indexBroker,
                setIndexBroker,
                (item: Broker) => {
                setBrokerNombre(item.nombre);
                setShowBroker(false);
                }
              )
            }
          />

          {showBroker && brokerNombre && (
            <div className="absolute w-full bg-gray-800 border mt-1 rounded z-50 max-h-40 overflow-auto">
              {brokersFiltrados.map((b, i) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setBrokerNombre(b.nombre);
                    setShowBroker(false);
                  }}
                  className={`p-2 cursor-pointer ${
                    i === indexBroker ? "bg-gray-700" : ""
                  }`}
                >
                  {b.nombre}
                </div>
              ))}
            </div>
          )}

          <input
            value={brokerTelefono}
            placeholder="Teléfono"
            className="w-full mt-2 p-2 bg-gray-800 rounded"
            onChange={(e) =>
              setBrokerTelefono(e.target.value.replace(/\D/g, ""))
            }
          />
        </div>

        <TiposTramiteSection onChange={setTipos} />

        <DatosOperativosSection onChange={setDatos} />

        <div className="flex justify-end gap-3">
          <button className="bg-gray-700 px-4 py-2 rounded" onClick={onClose}>
            Cancelar
          </button>

          <button className="bg-blue-600 px-4 py-2 rounded" onClick={crearTramite}>
            Crear trámite
          </button>
        </div>
      </div>
    </div>
  );
}
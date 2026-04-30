"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// 🔹 tipos
type Dependencia = {
  id: string;
  nombre: string;
};

type Titular = {
  id: string;
  nombre: string;
  principal?: boolean;
};

type Props = {
  tramiteId: string;
  onClose: () => void;
};

export default function ModalEdicionTramite({ tramiteId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [override, setOverride] = useState(false);

  // 🔹 estructurales
  const [embarcacion, setEmbarcacion] = useState("");
  const [matricula, setMatricula] = useState("");
  const [tipoTramite, setTipoTramite] = useState("");
  const [embarcacionId, setEmbarcacionId] = useState<string | null>(null);

  // 🔹 titulares (multi)
  const [titulares, setTitulares] = useState<Titular[]>([]);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<{ id: string; nombre: string }[]>([]);

  // 🔹 operativos
  const [numeroGDE, setNumeroGDE] = useState("");
  const [numeroTramite, setNumeroTramite] = useState("");
  const [dependencia, setDependencia] = useState("");
  const [fechaPresentacion, setFechaPresentacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);

  // 🔥 cargar datos
  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from("v_tramite_detalle")
        .select("*")
        .eq("id", tramiteId)
        .single();

      if (!data) return;

      setEmbarcacion(data.embarcacion || "");
      setMatricula(data.matricula || "");
      setTipoTramite(data.tipo_tramite || "");
      setEmbarcacionId(data.embarcacion_id || null);
      setBrokerId(data.broker_id || null);

      console.log("DATA broker_id:", data.broker_id);
      // 🔹 titulares
      if (data.titulares && data.titulares.length > 0) {
        setTitulares(
         data.titulares.map((t: Titular) => ({
            id: t.id,
            nombre: t.nombre,
            principal: t.principal,
          }))
        );
      }

      setNumeroGDE(data.numero_gde || "");
      setNumeroTramite(data.numero_tramite || "");
      setDependencia(data.dependencia_id || "");

      setFechaPresentacion(
        data.fecha_presentacion?.split("T")[0] ||
          new Date().toISOString().split("T")[0]
      );

      setObservaciones(data.observaciones || "");

      setLoading(false);
    }

  async function cargarBrokers() {
  const { data } = await supabase
    .from("personas")
    .select("*")
    .eq("tipo", "broker")  // 👈 CLAVE
    .order("nombre", { ascending: true });
  setBrokers(data || []);

  console.log("BROKERS:", brokers);
}
cargarBrokers();

    async function cargarDependencias() {
      const { data } = await supabase.from("dependencias").select("*");
      setDependencias(data || []);
    }

    cargar();
    cargarDependencias();
  }, [tramiteId]);

  // 🔥 guardar
  async function guardar() {
if (!numeroGDE && !numeroTramite) {
  console.warn("Trámite sin GDE ni número");
}

    setSaving(true);

    // 🔹 actualizar trámite
    const { error } = await supabase
      .from("tramites")
      .update({
        numero_gde: numeroGDE || null,
        numero_tramite: numeroTramite || null,
        dependencia_id: dependencia || null,
        fecha_presentacion: fechaPresentacion || null,
        observaciones: observaciones || null,
        broker_id: brokerId || null,
      })
      .eq("id", tramiteId);

    if (error) {
      setMensaje("Error al guardar trámite");
      setSaving(false);
      return;
    }

    // 🔹 embarcación
    if (override && embarcacionId) {
      await supabase
        .from("embarcaciones")
        .update({
          nombre: embarcacion,
          matricula: matricula,
        })
        .eq("id", embarcacionId);
        console.log("EMBARCACION ID:", embarcacionId);
console.log("NOMBRE NUEVO:", embarcacion);
    }

    // 🔹 titulares
const titularesActualizados = [...titulares];

if (titularesActualizados.length > 0) {
  if (!titularesActualizados.some((t) => t.principal)) {
    titularesActualizados[0] = {
      ...titularesActualizados[0],
      principal: true,
    };
  }

  for (const t of titularesActualizados) {
    if (!t.id) continue;

    // update persona
    await supabase
      .from("personas")
      .update({ nombre: t.nombre })
      .eq("id", t.id);

    // update relación
    await supabase
      .from("tramite_titulares")
      .update({ principal: t.principal || false })
      .eq("persona_id", t.id)
      .eq("tramite_id", tramiteId);
  }
}

    setSaving(false);
    setMensaje("Guardado correctamente");

    setTimeout(() => {
      window.dispatchEvent(new Event("tramite_actualizado"));
      onClose();
    }, 1000);
  }

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 w-full max-w-5xl p-6 rounded-xl border border-gray-800">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h2 className="text-xl">Editar trámite</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {mensaje && (
          <div className="mb-4 text-sm text-green-400">{mensaje}</div>
        )}

        {/* 🔒 ESTRUCTURAL */}
        <div className="mb-6 border border-gray-800 p-4 rounded">
          <div className="flex justify-between mb-3">
            <h3 className="text-sm text-gray-400">Datos estructurales</h3>

            {!override && (
              <button
                onClick={() => {
                  if (confirm("Modificar datos sensibles")) setOverride(true);
                }}
                className="text-xs bg-gray-700 px-2 py-1 rounded"
              >
                Editar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Embarcación">
              <input
                disabled={!override}
                value={embarcacion}
                onChange={(e) => setEmbarcacion(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Matrícula">
              <input
                disabled={!override}
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Tipo trámite">
              <input disabled value={tipoTramite} className="input" />
            </Field>
          </div>
        </div>

        {/* 👤 TITULARES */}
        <div className="mb-6 border border-gray-800 p-4 rounded">
          <h3 className="text-sm text-gray-400 mb-3">Titulares</h3>

          {titulares.map((t, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                value={t.nombre}
                onChange={(e) => {
                  const nuevos = [...titulares];
                  nuevos[index].nombre = e.target.value;
                  setTitulares(nuevos);
                }}
                className="input flex-1"
              />

              <input
                type="radio"
                checked={t.principal}
                onChange={() => {
                  const nuevos = titulares.map((tit) => ({
                    ...tit,
                    principal: false,
                  }));
                  nuevos[index].principal = true;
                  setTitulares(nuevos);
                }}
              />

              <button
                onClick={() =>
                  setTitulares(titulares.filter((_, i) => i !== index))
                }
                className="text-red-400"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() =>
              setTitulares([
                ...titulares,
                { id: "", nombre: "", principal: false },
              ])
            }
            className="text-blue-400 text-sm mt-2"
          >
            + Agregar titular
          </button>
        </div>

  <div className="mb-6 border border-gray-800 p-4 rounded">
  <h3 className="text-sm text-gray-400 mb-3">Broker</h3>
        <Field label="">
  <select
    value={brokerId || ""}
    onChange={(e) =>
  setBrokerId(e.target.value || null)
}
    className="input"
  >
    <option value="">Sin asignar</option>
    {brokers.map((b) => (
      <option key={b.id} value={b.id}>
        {b.nombre}
      </option>
    ))}
  </select>
</Field>
</div>


        {/* ✏️ OPERATIVO */}
        <div className="mb-6 border border-gray-800 p-4 rounded">
          <h3 className="text-sm text-gray-400 mb-3">Datos operativos</h3>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Número GDE">
              <input
                value={numeroGDE}
                onChange={(e) => setNumeroGDE(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Número de trámite">
              <input
                value={numeroTramite}
                onChange={(e) => setNumeroTramite(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Dependencia">
              <select
                value={dependencia}
                onChange={(e) => setDependencia(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar</option>
                {dependencias.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fecha presentación">
              <input
                type="date"
                value={fechaPresentacion}
                onChange={(e) => setFechaPresentacion(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Observaciones">
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="input mt-2"
            />
          </Field>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-gray">
            Cancelar
          </button>

          <button onClick={guardar} disabled={saving} className="btn-blue">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px;
          background: #1f2937;
          border-radius: 6px;
        }
        .btn-blue {
          background: #2563eb;
          padding: 8px 14px;
          border-radius: 6px;
        }
        .btn-gray {
          background: #374151;
          padding: 8px 14px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}



// 🔹 helper
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      {children}
    </div>
  );
}
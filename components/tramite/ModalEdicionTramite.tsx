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

type Broker = {
  id: string;
  nombre: string;
};

type Props = {
  tramiteId: string;
  onClose: () => void;
};

export default function ModalEdicionTramite({
  tramiteId,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [override, setOverride] = useState(false);

  // 🔹 estructurales
  const [embarcacion, setEmbarcacion] = useState("");
  const [matricula, setMatricula] = useState("");
  const [tipoTramite, setTipoTramite] = useState("");
  const [embarcacionId, setEmbarcacionId] = useState<string | null>(null);

  // 🔹 titulares
  const [titulares, setTitulares] = useState<Titular[]>([]);

  // 🔹 brokers
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);

  // 🔹 operativos
  const [numeroGDE, setNumeroGDE] = useState("");
  const [numeroTramite, setNumeroTramite] = useState("");
  const [dependencia, setDependencia] = useState("");
  const [fechaPresentacion, setFechaPresentacion] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);

  // 🔥 cerrar con escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // 🔥 carga inicial
  useEffect(() => {
    async function cargar() {
      setLoading(true);

      const { data } = await supabase
        .from("v_tramite_detalle")
        .select("*")
        .eq("id", tramiteId)
        .single();

      if (!data) {
        setLoading(false);
        return;
      }

      setEmbarcacion(data.embarcacion || "");
      setMatricula(data.matricula || "");
      setTipoTramite(data.tipo_tramite || "");
      setEmbarcacionId(data.embarcacion_id || null);

      setBrokerId(data.broker_id || null);

      if (data.titulares?.length > 0) {
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

    async function cargarDependencias() {
      const { data } = await supabase
        .from("dependencias")
        .select("*")
        .order("nombre");

      setDependencias(data || []);
    }

    async function cargarBrokers() {
      const { data } = await supabase
        .from("personas")
        .select("id,nombre")
        .eq("tipo", "broker")
        .order("nombre");

      setBrokers(data || []);
    }

    cargar();
    cargarDependencias();
    cargarBrokers();
  }, [tramiteId]);

  // 🔥 titulares helpers
  function actualizarTitular(index: number, valor: string) {
    const nuevos = [...titulares];
    nuevos[index].nombre = valor;
    setTitulares(nuevos);
  }

  function setPrincipal(index: number) {
    const nuevos = titulares.map((t) => ({
      ...t,
      principal: false,
    }));

    nuevos[index].principal = true;

    setTitulares(nuevos);
  }

  function eliminarTitular(index: number) {
    setTitulares(titulares.filter((_, i) => i !== index));
  }

  // 🔥 guardar
  async function guardar() {
    setSaving(true);
    setMensaje("");

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

        await supabase
          .from("personas")
          .update({
            nombre: t.nombre,
          })
          .eq("id", t.id);

        await supabase
          .from("tramite_titulares")
          .update({
            principal: t.principal || false,
          })
          .eq("persona_id", t.id)
          .eq("tramite_id", tramiteId);
      }
    }

    setSaving(false);
    setMensaje("Guardado correctamente");

    window.dispatchEvent(new Event("tramite_actualizado"));

    setTimeout(() => {
      onClose();
    }, 700);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
        <div className="bg-gray-900 px-6 py-4 rounded-lg">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          bg-gray-900
          w-full
          max-w-5xl
          mx-auto
          my-10
          p-4 md:p-6
          rounded-xl
          border
          border-gray-800
          max-h-[90vh]
          overflow-y-auto
        "
      >
        {/* HEADER */}
        <div className="sticky top-0 bg-gray-900 z-10 pb-4 flex justify-between items-center mb-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold">Editar trámite</h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {mensaje && (
          <div className="mb-4 text-sm text-green-400">
            {mensaje}
          </div>
        )}

        {/* 🔒 ESTRUCTURAL */}
        <Section title="Datos estructurales">
          <div className="flex justify-end mb-3">
            {!override && (
              <button
                onClick={() => {
                  if (confirm("Modificar datos sensibles")) {
                    setOverride(true);
                  }
                }}
                className="text-xs bg-gray-700 px-2 py-1 rounded"
              >
                Editar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <input
                disabled
                value={tipoTramite}
                className="input"
              />
            </Field>
          </div>
        </Section>

        {/* 👤 TITULARES */}
        <Section title="Titulares">
          {titulares.map((t, index) => (
            <div
              key={index}
              className="flex gap-2 items-center mb-2"
            >
              <input
                value={t.nombre}
                onChange={(e) =>
                  actualizarTitular(index, e.target.value)
                }
                className="input flex-1"
              />

              <input
                type="radio"
                checked={t.principal}
                onChange={() => setPrincipal(index)}
              />

              <button
                onClick={() => eliminarTitular(index)}
                className="text-red-400"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => {
              alert(
                "Por ahora los titulares nuevos deben agregarse desde Nuevo Trámite"
              );
            }}
            className="text-blue-400 text-sm mt-2"
          >
            + Agregar titular
          </button>
        </Section>

        {/* 🤝 BROKER */}
        <Section title="Broker">
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
        </Section>

        {/* ✏️ OPERATIVO */}
        <Section title="Datos operativos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                onChange={(e) =>
                  setNumeroTramite(e.target.value)
                }
                className="input"
              />
            </Field>

            <Field label="Dependencia">
              <select
                value={dependencia}
                onChange={(e) =>
                  setDependencia(e.target.value)
                }
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
                onChange={(e) =>
                  setFechaPresentacion(e.target.value)
                }
                className="input"
              />
            </Field>
          </div>

          <Field label="Observaciones">
            <textarea
              value={observaciones}
              onChange={(e) =>
                setObservaciones(e.target.value)
              }
              className="input mt-2"
            />
          </Field>
        </Section>

        {/* BOTONES */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="btn-gray"
          >
            Cancelar
          </button>

          <button
            onClick={guardar}
            disabled={saving}
            className="btn-blue"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 10px;
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

// 🔹 sections helper
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 border border-gray-800 p-4 rounded">
      <h3 className="text-sm text-gray-400 mb-3">
        {title}
      </h3>

      {children}
    </div>
  );
}

// 🔹 field helper
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">
        {label}
      </label>

      {children}
    </div>
  );
}
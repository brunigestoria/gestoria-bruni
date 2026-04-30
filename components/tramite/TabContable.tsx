"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Props = {
  tramiteId: string;
};

type Pago = {
  id: string;
  fecha: string;
  monto: number;
  es_promesa: boolean;
  cumplido: boolean;
  anulado?: boolean;
  motivo_anulacion?: string;
};

type Finanzas = {
  total_final: number;
  total_pagado: number;
  saldo_actual: number;
  pagos: Pago[];
};

export default function TabContable({ tramiteId }: Props) {
  const [finanzas, setFinanzas] = useState<Finanzas | null>(null);

  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [esPromesa, setEsPromesa] = useState(false);

  const [pagoAEliminar, setPagoAEliminar] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [motivoLibre, setMotivoLibre] = useState("");

  const [loading, setLoading] = useState(false);
  const [rol, setRol] = useState<string | null>(null);

  // 🔥 helpers
  function formatearMoneda(valor: string) {
    if (!valor) return "";
    const numero = Number(valor.replace(/\D/g, "") || 0);
    return numero.toLocaleString("es-AR");
  }

  function limpiarNumero(valor: string) {
    return valor.replace(/\D/g, "");
  }

  // 🔥 cargar rol usuario
  useEffect(() => {
    async function getUserRole() {
      const user = await supabase.auth.getUser();

      if (!user.data.user) return;

      const { data } = await supabase
        .from("users")
        .select("rol")
        .eq("id", user.data.user.id)
        .single();

      setRol(data?.rol || null);
    }

    getUserRole();
  }, []);

  // 🔥 cargar datos
  useEffect(() => {
    if (!tramiteId) return;

    async function cargar() {
      const { data } = await supabase
        .from("vista_finanzas_tramite")
        .select("*")
        .eq("tramite_id", tramiteId)
        .maybeSingle();

      setFinanzas(data);
    }

    cargar();
  }, [tramiteId]);

  // 💰 registrar pago
  async function registrarPago() {
    if (!monto) return alert("Ingresá un monto");

    const pago = Number(monto);
    const saldo = finanzas?.saldo_actual || 0;

    if (pago > saldo) return alert("No puede superar el saldo");
    if (pago <= 0) return alert("Monto inválido");

    setLoading(true);

    await supabase.from("pagos_cliente").insert({
      tramite_id: tramiteId,
      monto: pago,
      fecha: fecha || new Date().toISOString(),
      es_promesa: esPromesa,
    });

    setMonto("");
    setFecha("");
    setEsPromesa(false);

    recargar();

    setLoading(false);
  }

  async function recargar() {
    const { data } = await supabase
      .from("vista_finanzas_tramite")
      .select("*")
      .eq("tramite_id", tramiteId)
      .maybeSingle();

    setFinanzas(data);
    window.dispatchEvent(new Event("tramite_actualizado"));
  }

  // 🔥 ANULAR PAGO
  async function anularPago() {
    if (!pagoAEliminar) return;

    const user = await supabase.auth.getUser();

    const motivoFinal =
      motivo === "otro" ? motivoLibre : motivo;

    if (!motivoFinal.trim()) {
      alert("Debés ingresar un motivo válido");
      return;
    }

    const { error } = await supabase
      .from("pagos_cliente")
      .update({
        anulado: true,
        motivo_anulacion: motivoFinal,
        anulado_en: new Date().toISOString(),
        anulado_por: user.data.user?.id,
      })
      .eq("id", pagoAEliminar);

    if (error) {
      alert("Error al anular el pago");
      console.error(error);
      return;
    }

    setPagoAEliminar(null);
    setMotivo("");
    setMotivoLibre("");

    recargar();
  }

  if (!finanzas) return <div className="p-4">Cargando...</div>;

  const puedeVerAnulados = rol === "supervisor" || rol === "dueño";

  return (
    <div className="space-y-6">

      {/* RESUMEN */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <p>Total</p>
          <p>${finanzas.total_final?.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p>Pagado</p>
          <p className="text-green-400">
            ${finanzas.total_pagado?.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p>Saldo</p>
          <p className="text-red-400">
            ${finanzas.saldo_actual?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* LISTADO */}
<table className="w-full text-sm table-fixed">
  <thead className="text-gray-400 border-b border-gray-800">
    <tr>
      <th className="p-2 text-left w-1/4">Fecha</th>
      <th className="p-2 text-left w-1/4">Monto</th>
      <th className="p-2 text-left w-1/4">Tipo</th>
      <th className="p-2 text-right w-1/4"></th>
    </tr>
  </thead>

  <tbody>
    {finanzas.pagos.map((p) => {
      if (p.anulado && !puedeVerAnulados) return null;

      return (
        <tr
          key={p.id}
          className={`border-b border-gray-800 hover:bg-gray-800 transition ${
            p.anulado ? "opacity-40" : ""
          }`}
        >
          <td className="p-2 text-left">
            {new Date(p.fecha).toLocaleDateString()}
          </td>

          <td className="p-2 text-left">
            ${p.monto.toLocaleString()}
          </td>

          <td className="p-2 text-left">
            {p.anulado ? (
             <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
              Anulado
              </span>
            ) : p.es_promesa ? (
              <span className="text-yellow-400">Promesa</span>
            ) : (
              <span className="text-green-400">Pago</span>
            )}
          </td>

          <td className="p-2 text-right">
            {!p.anulado && (
              <button
                onClick={() => {
                  setPagoAEliminar(p.id);
                  setMotivo("");
                }}
                className="text-red-400 hover:text-red-300"
                title="Anular pago"
              >
                🗑️
              </button>
            )}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

      {/* MODAL */}
      {pagoAEliminar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded w-[400px] space-y-3">

            <h3>Anular pago</h3>

            <select
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setMotivoLibre("");
              }}
              className="w-full bg-gray-800 p-2 rounded"
            >
              <option value="">Seleccionar motivo</option>
              <option value="error_carga">Error de carga</option>
              <option value="pago_duplicado">Duplicado</option>
              <option value="otro">Otro</option>
            </select>

            {motivo === "otro" && (
              <input
                value={motivoLibre}
                onChange={(e) => setMotivoLibre(e.target.value)}
                className="w-full bg-gray-800 p-2 rounded"
                placeholder="Detalle"
              />
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setPagoAEliminar(null)}>
                Cancelar
              </button>

              <button
                onClick={anularPago}
                className="bg-red-600 px-3 py-1 rounded"
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
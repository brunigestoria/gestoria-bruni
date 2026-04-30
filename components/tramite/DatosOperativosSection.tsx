"use client";

import { useEffect, useState } from "react";

type Props = {
  onChange: (data: {
    lugar_guarda: string;
    valor: number | null;
    dejo_arba: boolean;
    firmo_autorizacion: boolean;
    observaciones: string;
        pago_inicial: number | null;
  }) => void;
};

export default function DatosOperativosSection({ onChange }: Props) {
  const [lugarGuarda, setLugarGuarda] = useState("");
  const [valor, setValor] = useState("");
  const [pagoInicial, setPagoInicial] = useState("");
  const [dejoArba, setDejoArba] = useState(false);
  const [firmoAutorizacion, setFirmoAutorizacion] = useState(false);
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    onChange({
      lugar_guarda: lugarGuarda,
      valor: valor ? Number(valor) : null,
      dejo_arba: dejoArba,
      firmo_autorizacion: firmoAutorizacion,
      observaciones,
      pago_inicial: pagoInicial ? Number(pagoInicial) : null,
    });
  }, [lugarGuarda, valor, dejoArba, firmoAutorizacion, observaciones,pagoInicial, onChange]);

  return (
    <div className="bg-gray-900 p-4 rounded space-y-4">

      <label className="text-sm">Lugar de guarda</label>

      <input
        className="w-full bg-gray-800 p-2 rounded"
        value={lugarGuarda}
        onChange={(e) => setLugarGuarda(e.target.value)}
        placeholder="Ej: Guardería San Fernando"
      />

      <label className="text-sm">Valor del trámite</label>

      <input
        type="number"
        className="w-full bg-gray-800 p-2 rounded"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Monto pactado"
      />
      <div>
  <label className="block text-sm mb-1">Pago inicial</label>
  <input
    type="number"
    value={pagoInicial}
    onChange={(e) => setPagoInicial(e.target.value)}
    className="w-full p-2 bg-gray-800 rounded"
    placeholder="Monto inicial"
  />
</div>

      <div className="flex gap-6">

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={dejoArba}
            onChange={(e) => setDejoArba(e.target.checked)}
          />
          Dejó trámite ARBA
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={firmoAutorizacion}
            onChange={(e) => setFirmoAutorizacion(e.target.checked)}
          />
          Firmó autorización manejo
        </label>

      </div>

      <label className="text-sm">Observaciones</label>

      <textarea
        className="w-full bg-gray-800 p-2 rounded"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Observaciones del trámite"
      />

    </div>
  );
}
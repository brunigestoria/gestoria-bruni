"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type FlujoMensual = {
  mes: string;
  ingresos: number;
  costos: number;
  ganancia: number;
  proyeccion?: number; // 🔥 agregado
};

type ProyeccionMensual = {
  mes: string;
  ingresos: number;
};

type TramiteFinanza = {
  tramite_id: string;
  ingresos: number;
  costos: number;
  ganancia: number;
  total_final: number;
  created_at: string;
};

type FinanzasData = {
  kpis: {
    ingresos: number;
    costos: number;
    ganancia: number;
    margen: number;
    saldoPendiente: number;
  };
  evolucion: FlujoMensual[];
  proyeccion: ProyeccionMensual[];
  tramites: TramiteFinanza[];
};

export function useFinanzas() {
  const [data, setData] = useState<FinanzasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // ---------------- FETCH ----------------

      const { data: global } = await supabase
        .from("vista_finanzas_global")
        .select("*");

      const { data: pagos } = await supabase
        .from("pagos_cliente")
        .select("*");

      const { data: costos } = await supabase
        .from("movimientos_economicos")
        .select("*");

      const { data: vistaTramite } = await supabase
        .from("vista_finanzas_tramite")
        .select("*");

      // ---------------- KPIs ----------------

      const ingresos =
        global?.reduce((acc, t) => acc + (t.ingresos || 0), 0) || 0;

      const costosTotal =
        global?.reduce((acc, t) => acc + (t.costos || 0), 0) || 0;

      const ganancia = ingresos - costosTotal;

      const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;

      const saldoPendiente =
        vistaTramite?.reduce((acc, t) => acc + (t.saldo_actual || 0), 0) || 0;

      // ---------------- FLUJO REAL ----------------

      const flujoMensual: Record<string, FlujoMensual> = {};

      pagos?.forEach((p) => {
        if (p.anulado) return;
        if (!p.fecha || isNaN(new Date(p.fecha).getTime())) return;

        const mes = new Date(p.fecha).toISOString().slice(0, 7);

        if (!flujoMensual[mes]) {
          flujoMensual[mes] = {
            mes,
            ingresos: 0,
            costos: 0,
            ganancia: 0,
          };
        }

        if (!p.es_promesa) {
          flujoMensual[mes].ingresos += p.monto;
        }
      });

      costos?.forEach((c) => {
        if (!c.fecha_pago || isNaN(new Date(c.fecha_pago).getTime())) return;

        const mes = new Date(c.fecha_pago).toISOString().slice(0, 7);

        if (!flujoMensual[mes]) {
          flujoMensual[mes] = {
            mes,
            ingresos: 0,
            costos: 0,
            ganancia: 0,
          };
        }

        flujoMensual[mes].costos += c.monto;
      });

      // 🔥 evolucion ordenada correctamente por fecha real
      const evolucionBase: FlujoMensual[] = Object.values(flujoMensual)
        .map((m) => ({
          ...m,
          ganancia: m.ingresos - m.costos,
        }))
        .sort(
          (a, b) =>
            new Date(a.mes + "-01").getTime() -
            new Date(b.mes + "-01").getTime()
        );

      // ---------------- PROYECCIÓN ----------------

      const proyeccionMensual: Record<string, ProyeccionMensual> = {};

      pagos?.forEach((p) => {
        if (!p.es_promesa) return;
        if (!p.fecha_promesa || isNaN(new Date(p.fecha_promesa).getTime())) return;

        const mes = new Date(p.fecha_promesa).toISOString().slice(0, 7);

        if (!proyeccionMensual[mes]) {
          proyeccionMensual[mes] = { mes, ingresos: 0 };
        }

        proyeccionMensual[mes].ingresos += p.monto;
      });

      const proyeccion: ProyeccionMensual[] = Object.values(proyeccionMensual);

      // ---------------- MERGE (CLAVE) ----------------

      const evolucion: FlujoMensual[] = evolucionBase.map((m) => {
        const p = proyeccion.find((x) => x.mes === m.mes);

        return {
          ...m,
          proyeccion: p?.ingresos || 0,
        };
      });

      // ---------------- RESULTADO ----------------

      setData({
        kpis: {
          ingresos,
          costos: costosTotal,
          ganancia,
          margen,
          saldoPendiente,
        },
        evolucion,
        proyeccion,
        tramites: global || [],
      });

      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}
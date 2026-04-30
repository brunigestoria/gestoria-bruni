"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type RangeType = "90d" | "180d" | "year" | "prevYear" | "all";

type BrokerMetric = {
  broker_id: string;
  broker_nombre: string;
  ingresos: number;
  tramites: number;
  ticket: number;
  participacion: number;
  icc: number;
  crecimiento: number; // 🔥 nuevo
};

type Row = {
  broker_id: string;
  broker_nombre: string;
  tramite_id: string;
  fecha_tramite: string;
  ingresos: number;
  costos: number;
  ganancia: number;
  icc: number;
};

function getDateRange(range: RangeType) {
  const now = new Date();

  if (range === "year") {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31),
    };
  }

  if (range === "prevYear") {
    const year = now.getFullYear() - 1;
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, 11, 31),
    };
  }

  if (range === "90d") {
    const from = new Date();
    from.setDate(now.getDate() - 90);
    return { from, to: now };
  }

  if (range === "180d") {
    const from = new Date();
    from.setDate(now.getDate() - 180);
    return { from, to: now };
  }

  return null;
}

// 🔥 rango anterior (clave para crecimiento)
function getPreviousRange(range: RangeType) {
  const now = new Date();

  if (range === "year") {
    const year = now.getFullYear() - 1;
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, 11, 31),
    };
  }

  if (range === "90d") {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 90);

    const prevTo = new Date(from);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevTo.getDate() - 90);

    return { from: prevFrom, to: prevTo };
  }

  if (range === "180d") {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 180);

    const prevTo = new Date(from);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevTo.getDate() - 180);

    return { from: prevFrom, to: prevTo };
  }

  return null;
}

export function useBrokers(range: RangeType) {
  const [data, setData] = useState<BrokerMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        const rangeDates = getDateRange(range);

        // 🔹 ACTUAL
        let query = supabase
          .from("vista_brokers_dashboard")
          .select("*");

        if (rangeDates) {
          query = query
            .gte("fecha_tramite", rangeDates.from.toISOString())
            .lte("fecha_tramite", rangeDates.to.toISOString());
        }

        const { data: rows, error } = await query;

        if (error) {
          console.error(error);
          return;
        }

        if (!rows) return;

        // 🔹 ACUMULADO ACTUAL
        const acumulado: Record<string, BrokerMetric> = {};

        (rows as Row[]).forEach((r) => {
          if (!acumulado[r.broker_id]) {
            acumulado[r.broker_id] = {
              broker_id: r.broker_id,
              broker_nombre: r.broker_nombre,
              ingresos: 0,
              tramites: 0,
              ticket: 0,
              participacion: 0,
              icc: r.icc,
              crecimiento: 0,
            };
          }

          acumulado[r.broker_id].tramites += 1;
          acumulado[r.broker_id].ingresos += r.ingresos || 0;
        });

        const values = Object.values(acumulado);

        // 🔹 TOTAL
        const totalIngresos = values.reduce(
          (acc, b) => acc + b.ingresos,
          0
        );

        // 🔹 PERIODO ANTERIOR
        const prevRange = getPreviousRange(range);

        const prevMap: Record<string, number> = {};

        if (prevRange) {
          const { data: prevRows } = await supabase
            .from("vista_brokers_dashboard")
            .select("*")
            .gte("fecha_tramite", prevRange.from.toISOString())
            .lte("fecha_tramite", prevRange.to.toISOString());

          (prevRows || []).forEach((r: Row) => {
            if (!prevMap[r.broker_id]) {
              prevMap[r.broker_id] = 0;
            }

            prevMap[r.broker_id] += r.ingresos || 0;
          });
        }

        // 🔥 RESULTADO FINAL
        const resultado = values.map((b) => {
          const prev = prevMap[b.broker_id] || 0;

          return {
            ...b,
            ticket:
              b.tramites > 0 ? b.ingresos / b.tramites : 0,
            participacion:
              totalIngresos > 0
                ? (b.ingresos / totalIngresos) * 100
                : 0,

            crecimiento:
              prev > 0
                ? ((b.ingresos - prev) / prev) * 100
                : b.ingresos > 0
                ? 100 // broker nuevo
                : 0,
          };
        });

        resultado.sort((a, b) => b.ingresos - a.ingresos);

        setData(resultado);
      } catch (err) {
        console.error("ERROR BROKERS:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [range]);
console.log(data);
  return { data, loading };
}
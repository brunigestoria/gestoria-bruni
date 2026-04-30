"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type RangeType = "90d" | "180d" | "year" | "prevYear" | "all";

type ClienteMetric = {
  cliente_id: string;
  cliente_nombre: string;
  ingresos: number;
  tramites: number;
  ticket: number;
  participacion: number;
  icc: number;
};

type Row = {
  cliente_id: string;
  cliente_nombre: string;
  tramite_id: string;
  fecha_tramite: string;
  ingreso: number;
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

export function useClientes(range: RangeType) {
  const [data, setData] = useState<ClienteMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        let query = supabase
          .from("vista_clientes_dashboard")
          .select("*");

        const rangeDates = getDateRange(range);

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

        const acumulado: Record<string, ClienteMetric> = {};

        (rows as Row[]).forEach((r) => {
          if (!acumulado[r.cliente_id]) {
            acumulado[r.cliente_id] = {
              cliente_id: r.cliente_id,
              cliente_nombre: r.cliente_nombre,
              ingresos: 0,
              tramites: 0,
              ticket: 0,
              participacion: 0,
              icc: r.icc,
            };
          }

          acumulado[r.cliente_id].tramites += 1;
          acumulado[r.cliente_id].ingresos += r.ingreso || 0;
        });

        const values = Object.values(acumulado);

        const totalIngresos = values.reduce(
          (acc, c) => acc + c.ingresos,
          0
        );

        const resultado = values.map((c) => ({
          ...c,
          ticket:
            c.tramites > 0 ? c.ingresos / c.tramites : 0,
          participacion:
            totalIngresos > 0
              ? (c.ingresos / totalIngresos) * 100
              : 0,
        }));

        resultado.sort((a, b) => b.ingresos - a.ingresos);

        setData(resultado);
      } catch (err) {
        console.error("ERROR CLIENTES:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [range]);

  return { data, loading };
}
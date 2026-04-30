"use client";

import { useEffect, useState } from "react";
import { useBrokers } from "@/app/metricas/brokers/hook/useBrokers";
import { useClientes } from "@/app/metricas/clientes/hook/useClientes";
import { supabase } from "@/lib/supabase/client";

import { getAlertasBrokers } from "../utils/brokers";
import { getAlertasClientes } from "../utils/clientes";
import { getAlertasTramites } from "../utils/tramites";
import { getAlertasTiempos } from "../utils/tiempos";

type RangeType = "90d" | "180d" | "year" | "prevYear" | "all";

type Alerta = {
  positiva?: string;
  negativa?: string;
};

type AlertasMetricas = {
  tramites: Alerta;
  brokers: Alerta;
  clientes: Alerta;
  tiempos: Alerta;
};

type ClientePrimer = {
  cliente_id: string;
  fecha_primer_tramite: string;
};

export function useAlertasMetricas(range: RangeType) {
  // =========================
  // 🔹 HOOKS EXISTENTES
  // =========================
  const { data: brokers, loading: loadingBrokers } = useBrokers(range);
  const { data: clientes, loading: loadingClientes } = useClientes(range);

  // =========================
  // 🔹 STATE (MEMORIA)
  // =========================
  const [primeros, setPrimeros] = useState<ClientePrimer[]>([]);
  const [loadingPrimeros, setLoadingPrimeros] = useState(true);

  const [tramitesActual, setTramitesActual] = useState(0);
  const [tramitesPrev, setTramitesPrev] = useState(0);
  const [loadingTramites, setLoadingTramites] = useState(true);

  const [promedioDias, setPromedioDias] = useState(0);
const [promedioPrev, setPromedioPrev] = useState(0);
const [loadingTiempos, setLoadingTiempos] = useState(true);

  // =========================
  // 🔹 FETCH CLIENTES (PRIMER TRÁMITE)
  // =========================
  useEffect(() => {
    async function loadPrimeros() {
      const { data } = await supabase
        .from("vista_clientes_primer_tramite")
        .select("*");

      if (data) setPrimeros(data);

      setLoadingPrimeros(false);
    }

    loadPrimeros();
  }, []);

  // =========================
  // 🔹 FUNCION DE FECHAS
  // =========================
  function getRangeDates(range: RangeType) {
    const now = new Date();

    if (range === "year") {
      return {
        from: `${now.getFullYear()}-01-01`,
        to: `${now.getFullYear()}-12-31`,
        prevFrom: `${now.getFullYear() - 1}-01-01`,
        prevTo: `${now.getFullYear() - 1}-12-31`,
      };
    }

    if (range === "90d") {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 90);

      const prevTo = new Date(from);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevTo.getDate() - 90);

      return {
        from: from.toISOString(),
        to: to.toISOString(),
        prevFrom: prevFrom.toISOString(),
        prevTo: prevTo.toISOString(),
      };
    }

    if (range === "180d") {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 180);

      const prevTo = new Date(from);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevTo.getDate() - 180);

      return {
        from: from.toISOString(),
        to: to.toISOString(),
        prevFrom: prevFrom.toISOString(),
        prevTo: prevTo.toISOString(),
      };
    }

    return null;
  }

  // =========================
  // 🔹 FETCH TRÁMITES (ACTUAL vs ANTERIOR)
  // =========================
  useEffect(() => {
    async function loadTramites() {
      const dates = getRangeDates(range);
      if (!dates) return;

      const { count: actual } = await supabase
        .from("tramites")
        .select("*", { count: "exact", head: true })
        .gte("fecha_creacion", dates.from)
        .lte("fecha_creacion", dates.to);

      const { count: prev } = await supabase
        .from("tramites")
        .select("*", { count: "exact", head: true })
        .gte("fecha_creacion", dates.prevFrom)
        .lte("fecha_creacion", dates.prevTo);

      setTramitesActual(actual || 0);
      setTramitesPrev(prev || 0);

      setLoadingTramites(false);
    }

    loadTramites();
  }, [range]);

  // =========================
  // 🔹 FETCH TIEMPOS PROMEDI0
  // ========================
  useEffect(() => {
  async function loadTiempos() {
    const dates = getRangeDates(range);
    if (!dates) return;

    // 🔹 ACTUAL
    const { data: actual } = await supabase
      .from("tramites")
      .select("fecha_inicio, fecha_fin")
      .gte("fecha_inicio", dates.from)
      .lte("fecha_inicio", dates.to)
      .not("fecha_fin", "is", null);

    // 🔹 ANTERIOR
    const { data: prev } = await supabase
      .from("tramites")
      .select("fecha_inicio, fecha_fin")
      .gte("fecha_inicio", dates.prevFrom)
      .lte("fecha_inicio", dates.prevTo)
      .not("fecha_fin", "is", null);

    type TramiteRow = {
  fecha_inicio: string;
  fecha_fin: string;
};

function calcularPromedio(rows: TramiteRow[]) {
      if (!rows || rows.length === 0) return 0;

      let totalDias = 0;

      rows.forEach((r) => {
        const inicio = new Date(r.fecha_inicio);
        const fin = new Date(r.fecha_fin);

        const dias =
          (fin.getTime() - inicio.getTime()) /
          (1000 * 60 * 60 * 24);

        totalDias += dias;
      });

      return totalDias / rows.length;
    }

    setPromedioDias(calcularPromedio(actual || []));
    setPromedioPrev(calcularPromedio(prev || []));

    setLoadingTiempos(false);
  }

  loadTiempos();
}, [range]);

  // =========================
  // 🔹 LOADING GLOBAL (CLAVE)
  // =========================
  const loading =
    loadingBrokers ||
    loadingClientes ||
    loadingPrimeros ||
    loadingTramites ||
    loadingTiempos;

  if (loading) {
    return { data: null, loading: true };
  }

  // =========================
  // 📊 TRÁMITES (REAL)
  // =========================
  const tramitesAlertas = getAlertasTramites(
    { total: tramitesActual },
    { total: tramitesPrev }
  );

  // =========================
  // 🤝 BROKERS
  // =========================
  const brokersAlertas = getAlertasBrokers(brokers);

  // =========================
  // 👥 CLIENTES
  // =========================
  function getStartDate(range: RangeType) {
    const now = new Date();

    if (range === "year") return `${now.getFullYear()}-01-01`;

    if (range === "90d") {
      const d = new Date();
      d.setDate(now.getDate() - 90);
      return d.toISOString().split("T")[0];
    }

    if (range === "180d") {
      const d = new Date();
      d.setDate(now.getDate() - 180);
      return d.toISOString().split("T")[0];
    }

    return "2000-01-01";
  }

  const startDate = getStartDate(range);

  const clientesAlertas = getAlertasClientes(
    clientes,
    primeros,
    startDate
  );

  // =========================
  // ⏱️ TIEMPOS (placeholder)
  // =========================
 const tiemposAlertas = getAlertasTiempos(
  { promedioDias },
  { promedioDias: promedioPrev }
);

  // =========================
  // 🎯 RESULTADO FINAL
  // =========================
  return {
    data: {
      tramites: tramitesAlertas,
      brokers: brokersAlertas,
      clientes: clientesAlertas,
      tiempos: tiemposAlertas,
    },
    loading: false,
  };
}
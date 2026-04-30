"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Dependencia = {
  id: string;
  nombre: string;
  activo: boolean;
  max_tramites_diarios: number;
  dias_turno_promedio: number;
 dias_vencimiento_provisorio: number;
 sigla: string;
  lunes?: boolean;
  martes?: boolean;
  miercoles?: boolean;
  jueves?: boolean;
  viernes?: boolean;
};

export function useDependencias() {
  const [data, setData] = useState<Dependencia[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const { data: rows, error } = await supabase
      .from("dependencias")
      .select("*")
      .order("nombre");

   if (!error && rows) {
  setData(rows.map(row => ({ ...row, activo: !!row.activo })));
}

    setLoading(false);
  }

  useEffect(() => {
  const load = async () => {
    await fetchData();
  };

  load();
}, []);

  return {
    data,
    loading,
    refetch: fetchData,
  };
}
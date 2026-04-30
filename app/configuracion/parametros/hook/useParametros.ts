"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Parametro = {
  id: string;
  clave: string;
  valor: string;
  descripcion: string | null;
};

export function useParametros() {
  const [data, setData] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const { data, error } = await supabase
      .from("configuracion_general")
      .select("*")
      .order("clave");

    if (!error && data) {
      setData(data);
    }

    setLoading(false);
  }

  useEffect(() => {
  async function load() {
    await fetchData();
  }
  load();
}, []);

  return {
    data,
    loading,
    refetch: fetchData,
  };
}
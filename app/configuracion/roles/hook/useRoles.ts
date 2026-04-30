"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Rol = {
  id: string;
  nombre: string;
};

export function useRoles() {
  const [data, setData] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const { data } = await supabase
      .from("roles")
      .select("*")
      .order("nombre");

    setData(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData(); // 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, refetch: fetchData };
}
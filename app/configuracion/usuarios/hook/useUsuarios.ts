"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  roles: string[];
};

export function useUsuarios() {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        nombre,
        email,
        activo,
        user_roles (
          roles (
            nombre
          )
        )
      `)
      .order("nombre");

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usuarios: Usuario[] = data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        activo: u.activo,
        roles:
          u.user_roles?.map((r: any) => r.roles?.nombre).filter(Boolean) || [],
      }));

      setData(usuarios);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, refetch: fetchData };
}
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export function useTramites(mes: string, anio: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tramites", mes, anio],
    queryFn: async () => {
      let query = supabase
        .from("v_tramites_operativo")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (anio && mes) {
        const mesNum = Number(mes);
        const anioNum = Number(anio);

        const ultimoDia = new Date(anioNum, mesNum, 0).getDate();

        query = query
          .gte("fecha_creacion", `${anio}-${mes.padStart(2, "0")}-01`)
          .lte(
            "fecha_creacion",
            `${anio}-${mes.padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`
          );
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },
    placeholderData: (prev) => prev,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["tramites"] });
  };

  return {
    tramites: query.data || [],
    loading: query.isLoading,
    refetch,
  };
}
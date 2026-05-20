"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type TramiteOperativo = {
  tramite_id: string;
  embarcacion: string | null;
  titular: string | null;
  matricula: string | null;
  estado: string | null;
  dependencia: string | null;
  tipo_tramite: string | null;
  broker: string | null;
  saldo: number | null;
  dias_abierto: number | null;
  fecha_creacion?: string | null;
};

export function useTramites(mes: string, anio: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tramites", mes, anio],
    queryFn: async (): Promise<TramiteOperativo[]> => {
      try {
        let query = supabase
          .from("v_tramites_operativo")
          .select("*")
          .order("fecha_creacion", { ascending: false });

        if (anio && mes) {
          const mesNum = Number(mes);
          const anioNum = Number(anio);

          if (!Number.isNaN(mesNum) && !Number.isNaN(anioNum)) {
            const desde = `${anioNum}-${String(mesNum).padStart(2, "0")}-01`;
            const hasta = new Date(anioNum, mesNum, 1)
              .toISOString()
              .split("T")[0];

            query = query.gte("fecha_creacion", desde).lt("fecha_creacion", hasta);
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error("ERROR useTramites:", error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error("ERROR useTramites fetch:", error);
        return [];
      }
    },
    placeholderData: (prev) => prev,
    retry: 1,
    staleTime: 1000 * 30,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tramites"] });
  }, [queryClient]);

  return {
    tramites: query.data || [],
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    refetch,
  };
}

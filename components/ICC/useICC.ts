import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ICCData = {
  persona_id: string;
  nombre: string;
  icc: number;
  categoria: string;
  color: string;
};

export function useICC(personaId?: string) {
  const [iccData, setIccData] = useState<ICCData | null>(null);

  useEffect(() => {
    if (!personaId) return;

    async function fetchICC() {
      const { data, error } = await supabase
        .from("vista_icc_clientes")
        .select("*")
        .eq("persona_id", personaId);

      console.log("ICC QUERY:", personaId, data, error);

      if (error) {
        console.error("ICC ERROR:", error);
        setIccData({
          persona_id: personaId || "",
          nombre: "",
          icc: 100,
          categoria: "sin historial",
          color: "gris",
        });
        return;
      }

      if (data && data.length > 0) {
        setIccData(data[0]);
      } else {
        setIccData({
          persona_id: personaId || "",
          nombre: "",
          icc: 100,
          categoria: "sin historial",
          color: "gris",
        });
      }
    }

    fetchICC();
  }, [personaId]);

  return iccData;
}
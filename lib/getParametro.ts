import { supabase } from "@/lib/supabase/client";

export async function getParametro(clave: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("configuracion_general")
    .select("valor")
    .eq("clave", clave)
    .single();

  if (error) {
    console.error("Error obteniendo parámetro:", clave, error);
    return null;
  }

  return data?.valor || null;
}
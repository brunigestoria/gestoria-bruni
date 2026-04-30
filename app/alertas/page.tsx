"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal/hook/modal";
import { getParametro } from "@/lib/getParametro";

/* ================= TYPES ================= */

type AlertaBase = {
  id: string;
  tramite_id: string;
  embarcacion?: string;
  titular?: string;
  matricula?: string;
};

type DocAlerta = {
  tramite_id: string;
  embarcacion: string;
  titular: string;
  matricula: string;
  tipo: string;
};

type DocAlertaAgrupada = {
  tramite_id: string;
  embarcacion: string;
  titular: string;
  matricula: string;
  tipos: string[];
};

type DocRaw = {
  tramite_id: string;
  embarcacion: string;
  matricula: string;
  nombre: string;
  tiene_expediente: boolean;
  tiene_provisorio: boolean;
  tiene_matricula: boolean;
  estado: string;
};

/* ================= HELPERS ================= */

function agruparAlertas(alertas: DocAlerta[]): DocAlertaAgrupada[] {
  const map = new Map<string, DocAlertaAgrupada>();

  alertas.forEach((a) => {
    if (!map.has(a.tramite_id)) {
      map.set(a.tramite_id, {
        tramite_id: a.tramite_id,
        embarcacion: a.embarcacion,
        titular: a.titular,
        matricula: a.matricula,
        tipos: [a.tipo],
      });
    } else {
      map.get(a.tramite_id)!.tipos.push(a.tipo);
    }
  });

  return Array.from(map.values());
}

/* ================= COMPONENT ================= */

export default function AlertasPage() {
  const [dormidos, setDormidos] = useState<AlertaBase[]>([]);
  const [promesas, setPromesas] = useState<AlertaBase[]>([]);
  const [docAlertas, setDocAlertas] = useState<DocAlertaAgrupada[]>([]);
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState<string | null>(null);
  const [diasDormido, setDiasDormido] = useState(10);

  const [loading, setLoading] = useState(true);

  async function cargar() {
  setLoading(true);

  // 🔥 TRAEMOS PARAMETROS
  const diasDormidoParam = await getParametro(
    "dias_seguimiento_sin_movimiento"
  );
  const diasDormido = Number(diasDormidoParam || 10);

  const { data: dormidosData } = await supabase
    .from("vista_alertas_tramites_dormidos")
    .select("*");

  setDormidos(dormidosData || []);

  const { data: promesasData } = await supabase
    .from("alerta_promesas_pago_vencidas")
    .select("*");

  setPromesas(promesasData || []);

  const { data: docs } = await supabase
    .from("vista_tramite_documentos_estado")
    .select("*");

  const alertasDocs: DocAlerta[] = [];

  (docs as DocRaw[] || []).forEach((t) => {
    if (!t.tiene_expediente) {
      alertasDocs.push({
        tramite_id: t.tramite_id,
        embarcacion: t.embarcacion,
        titular: t.nombre,
        matricula: t.matricula,
        tipo: "Falta expediente",
      });
    }

    if (!t.tiene_provisorio) {
      alertasDocs.push({
        tramite_id: t.tramite_id,
        embarcacion: t.embarcacion,
        titular: t.nombre,
        matricula: t.matricula,
        tipo: "Falta provisorio",
      });
    }

    if (t.estado === "finalizado" && !t.tiene_matricula) {
      alertasDocs.push({
        tramite_id: t.tramite_id,
        embarcacion: t.embarcacion,
        titular: t.nombre,
        matricula: t.matricula,
        tipo: "Falta matrícula",
      });
    }
  });

  setDocAlertas(agruparAlertas(alertasDocs));

  // 👇 GUARDAMOS EL PARAMETRO EN STATE (lo vamos a usar en UI)
  setDiasDormido(diasDormido);

  setLoading(false);
}

useEffect(() => {
  const init = async () => {
    await cargar();
  };

  init();
}, []);

  if (loading) return <div className="p-6">Cargando alertas...</div>;

  const totalAlertas =
    dormidos.length + promesas.length + docAlertas.length;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Alertas</h1>
        <div className="text-sm text-gray-400">
          Total: {totalAlertas}
        </div>
      </div>

      {/* ================= DORMIDOS ================= */}
      <Seccion titulo="Trámites detenidos" color="red" cantidad={dormidos.length}>
  {dormidos.length === 0 ? (
    <SinAlertas />
  ) : (
    <>
      <Grid>
        {dormidos.slice(0, 10).map((t) => (
          <AlertaItem
            key={t.id}
            embarcacion={`${t.embarcacion || "-"} (${t.matricula || "-"})`}
            detalle={`Más de ${diasDormido} días sin movimiento`}
            onClick={() => setTramiteSeleccionado(t.tramite_id)}
          />
        ))}
      </Grid>

      {dormidos.length > 10 && (
        <VerMas cantidad={dormidos.length} tipo="dormidos" />
      )}
    </>
  )}
</Seccion>

      {/* ================= PROMESAS ================= */}
      <Seccion titulo="Promesas vencidas" color="red" cantidad={promesas.length}>
  {promesas.length === 0 ? (
    <SinAlertas />
  ) : (
    <>
      <Grid>
        {promesas.slice(0, 10).map((p, i) => (
          <AlertaItem
            key={`${p.tramite_id}-${i}`}
            embarcacion={`Trámite ${p.tramite_id}`}
            detalle="Promesa vencida"
            onClick={() => setTramiteSeleccionado(p.tramite_id)}
          />
        ))}
      </Grid>

      {promesas.length > 10 && (
        <VerMas cantidad={promesas.length} tipo="promesas" />
      )}
    </>
  )}
</Seccion>

      {/* ================= DOCUMENTOS ================= */}
      <Seccion titulo="Documentación" color="yellow" cantidad={docAlertas.length}>
  {docAlertas.length === 0 ? (
    <SinAlertas />
  ) : (
    <>
      <Grid>
        {docAlertas.slice(0, 10).map((a) => (
          <AlertaItem
            key={a.tramite_id}
            embarcacion={`${a.embarcacion || "-"} (${a.matricula || "-"})`}
            detalle={a.tipos.join(" • ")}
            onClick={() => setTramiteSeleccionado(a.tramite_id)}
          />
        ))}
      </Grid>

      {docAlertas.length > 10 && (
        <VerMas cantidad={docAlertas.length} tipo="documentos" />
      )}
    </>
  )}
</Seccion>

      {/* MODAL */}
      {tramiteSeleccionado && (
        <Modal
          tramiteId={tramiteSeleccionado}
          onClose={() => setTramiteSeleccionado(null)}
        />
      )}
    </div>
  );
}

/* ================= COMPONENTES ================= */

function Seccion({
  titulo,
  cantidad,
  color,
  children,
}: {
  titulo: string;
  cantidad: number;
  color: "red" | "yellow";
  children: React.ReactNode;
}) {
  const colorMap = {
    red: "bg-red-600/20 text-red-400",
    yellow: "bg-yellow-600/20 text-yellow-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg">{titulo}</h2>
        <span className={`text-xs px-2 py-1 rounded ${colorMap[color]}`}>
          {cantidad}
        </span>
      </div>

      {/* 👇 sin min-height, sin flex, sin centrado */}
      <div>
        {children}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {children}
    </div>
  );
}

function AlertaItem({
  embarcacion,
  detalle,
  onClick,
}: {
  embarcacion: string;
  detalle: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 p-4 rounded cursor-pointer hover:bg-gray-700 transition"
    >
      <p className="font-medium">{embarcacion}</p>
      <p className="text-sm text-gray-400">{detalle}</p>
    </div>
  );
}

function SinAlertas() {
  return (
    <div className="text-sm text-gray-500">
      Sin alertas por el momento 
    </div>
  );
}

function VerMas({
  cantidad,
  tipo,
}: {
  cantidad: number;
  tipo: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/alertas/todas?tipo=${tipo}`)}
      className="text-sm text-blue-400 hover:text-blue-300"
    >
      Ver todas ({cantidad})
    </button>
  );
}
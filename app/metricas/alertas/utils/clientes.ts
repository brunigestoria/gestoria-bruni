type Alerta = {
  positiva?: string;
  negativa?: string;
};

type ClienteBase = {
  cliente_id: string;
};

type ClientePrimer = {
  cliente_id: string;
  fecha_primer_tramite: string;
};

export function getAlertasClientes(
  clientes: ClienteBase[],
  primeros: ClientePrimer[],
  startDate: string,
  prev?: {
    clientes: ClienteBase[];
    primeros: ClientePrimer[];
    startDate: string;
  }
): Alerta {
  if (!clientes || clientes.length === 0) return {};

  const firstMap = new Map(
    primeros.map((p) => [p.cliente_id, p.fecha_primer_tramite])
  );

  let nuevos = 0;
  let recurrentes = 0;

  clientes.forEach((c) => {
    const first = firstMap.get(c.cliente_id);

    if (!first) return;

    if (first >= startDate) {
      nuevos++;
    } else {
      recurrentes++;
    }
  });

  const total = nuevos + recurrentes;
  if (total === 0) return {};

  const pctNuevos = (nuevos / total) * 100;

  let positiva: string | undefined;
  let negativa: string | undefined;

  // 🟢 / 🔴 por nivel
  if (pctNuevos > 40) {
    positiva = `Alta captación (${pctNuevos.toFixed(1)}%)`;
  }

  if (pctNuevos < 20) {
    negativa = `Baja captación (${pctNuevos.toFixed(1)}%)`;
  }

  // 🔥 comparación vs período anterior
  if (prev) {
    const prevFirstMap = new Map(
      prev.primeros.map((p) => [p.cliente_id, p.fecha_primer_tramite])
    );

    let prevNuevos = 0;
    let prevRecurrentes = 0;

    prev.clientes.forEach((c) => {
      const first = prevFirstMap.get(c.cliente_id);
      if (!first) return;

      if (first >= prev.startDate) {
        prevNuevos++;
      } else {
        prevRecurrentes++;
      }
    });

    const prevTotal = prevNuevos + prevRecurrentes;

    if (prevTotal > 0) {
      const prevPct = (prevNuevos / prevTotal) * 100;
      const diff = pctNuevos - prevPct;

      if (diff > 15) {
        positiva = `Nuevos ↑ ${diff.toFixed(1)}%`;
      }

      if (diff < -15) {
        negativa = `Nuevos ↓ ${Math.abs(diff).toFixed(1)}%`;
      }
    }
  }

  return { positiva, negativa };
}
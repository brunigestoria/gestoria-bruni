export type BrokerMetric = {
  broker_id: string;
  broker_nombre: string;
  ingresos: number;
  tramites: number;
  ticket: number;
  participacion: number;
  icc: number;
  crecimiento: number;
};

type Alerta = {
  positiva?: string;
  negativa?: string;
};

export function getAlertasBrokers(
  brokers: BrokerMetric[]
): Alerta {
  if (!brokers || brokers.length === 0) {
    return {};
  }

  // 🔥 filtramos ruido (sin actividad)
  const activos = brokers.filter((b) => b.tramites > 0);

  if (activos.length === 0) return {};

  // 🔝 mayor crecimiento
  const top = [...activos].sort(
    (a, b) => b.crecimiento - a.crecimiento
  )[0];

  // 🔻 peor caída
  const worst = [...activos].sort(
    (a, b) => a.crecimiento - b.crecimiento
  )[0];

  let positiva: string | undefined;
  let negativa: string | undefined;

  // 🟢 POSITIVA (solo si es relevante)
  if (top && top.crecimiento > 20) {
    positiva = `${top.broker_nombre} crece ${top.crecimiento.toFixed(1)}%`;
  }

  // 🔴 NEGATIVA (solo si es preocupante)
  if (worst && worst.crecimiento < -20) {
    negativa = `${worst.broker_nombre} cae ${worst.crecimiento.toFixed(1)}%`;
  }

  return {
    positiva,
    negativa,
  };
}
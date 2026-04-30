type Alerta = {
  positiva?: string;
  negativa?: string;
};

type TramitesMetric = {
  total: number;
};

export function getAlertasTramites(
  actual: TramitesMetric,
  anterior?: TramitesMetric
): Alerta {
  if (!actual || actual.total === 0) return {};

  let positiva: string | undefined;
  let negativa: string | undefined;

  // 🔥 si tenemos comparación
  if (anterior && anterior.total > 0) {
    const diff =
      ((actual.total - anterior.total) / anterior.total) * 100;

    // 🔴 caída fuerte
    if (diff < -20) {
      negativa = `Volumen ↓ ${Math.abs(diff).toFixed(1)}%`;
    }

    // 🟢 crecimiento relevante
    if (diff > 20) {
      positiva = `Volumen ↑ ${diff.toFixed(1)}%`;
    }
  }

  // 🧠 fallback si no hay histórico
  if (!anterior) {
    if (actual.total < 10) {
      negativa = "Volumen muy bajo";
    }

    if (actual.total > 50) {
      positiva = "Buen nivel de actividad";
    }
  }

  return {
    positiva,
    negativa,
  };
}
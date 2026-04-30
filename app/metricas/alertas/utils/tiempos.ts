type Alerta = {
  positiva?: string;
  negativa?: string;
};

type TiemposMetric = {
  promedioDias: number;
};

export function getAlertasTiempos(
  actual: TiemposMetric,
  anterior?: TiemposMetric
): Alerta {
  if (!actual || !actual.promedioDias) return {};

  let positiva: string | undefined;
  let negativa: string | undefined;

  // 🔥 comparación vs período anterior
  if (anterior && anterior.promedioDias > 0) {
    const diff =
      ((actual.promedioDias - anterior.promedioDias) /
        anterior.promedioDias) *
      100;

    // 🔴 empeoró
    if (diff > 20) {
      negativa = `Tiempos ↑ ${diff.toFixed(1)}%`;
    }

    // 🟢 mejoró
    if (diff < -20) {
      positiva = `Tiempos ↓ ${Math.abs(diff).toFixed(1)}%`;
    }
  }

  // 🧠 fallback (sin histórico)
  if (!anterior) {
    if (actual.promedioDias > 30) {
      negativa = `Demora alta (${actual.promedioDias.toFixed(0)} días)`;
    }

    if (actual.promedioDias < 10) {
      positiva = `Resolución rápida (${actual.promedioDias.toFixed(0)} días)`;
    }
  }

  return {
    positiva,
    negativa,
  };
}
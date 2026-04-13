import { ConditionsReport, ScoreResult } from '../types/index.js';

export function parseSnowValue(s: string | undefined): number {
  if (!s) return 0;
  const match = s.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function scoreFreshSnow(cm: number): number {
  if (cm >= 25) return 4;
  if (cm >= 15) return 3;
  if (cm >= 6) return 2;
  if (cm >= 1) return 1;
  return 0;
}

function scoreForecastSnow(cm: number): number {
  if (cm >= 20) return 3;
  if (cm >= 10) return 2;
  if (cm >= 1) return 1;
  return 0;
}

function scoreBaseDepth(cm: number): number {
  if (cm >= 120) return 2;
  if (cm >= 80) return 1.5;
  if (cm >= 50) return 1;
  return 0;
}

function scoreLabel(total: number): string {
  if (total >= 8.0) return '🔥 SEND IT';
  if (total >= 6.0) return '✅ Good';
  if (total >= 4.0) return '😐 Meh';
  return '❌ Skip';
}

export function scoreConditions(report: ConditionsReport): ScoreResult {
  const freshCm = parseSnowValue(report.fresh_snow_cm);
  const baseCm = parseSnowValue(report.snow_depth_base_cm);
  const forecastCm = report.forecast.reduce((sum, day) => sum + day.snow_accumulation_cm, 0);

  const avgTemp =
    report.forecast.length > 0
      ? report.forecast.reduce((sum, day) => sum + day.temp_c, 0) / report.forecast.length
      : 0;

  const maxWind =
    report.forecast.length > 0
      ? Math.max(...report.forecast.map((day) => day.wind_kmh ?? 0))
      : 0;

  const fresh_snow = scoreFreshSnow(freshCm);
  const forecast_snow = scoreForecastSnow(forecastCm);
  const base_depth = scoreBaseDepth(baseCm);

  let weather_penalty = 0;
  if (baseCm < 50) weather_penalty -= 1;
  if (freshCm > 0 && avgTemp > 0) weather_penalty -= 1;
  if (maxWind > 60) weather_penalty -= 1;

  const raw = fresh_snow + forecast_snow + base_depth + weather_penalty;
  const clamped = Math.max(0, Math.min(9, raw));
  const total = Math.round((clamped / 9) * 10 * 10) / 10;

  const summary: string[] = [];

  if (forecastCm > 0) {
    summary.push(`${Math.round(forecastCm)}cm forecast over next ${report.forecast.length} days`);
  } else {
    summary.push('No significant snowfall forecast');
  }

  if (freshCm > 0 && avgTemp <= -2) {
    summary.push('Cold temps → good powder quality');
  } else if (freshCm > 0 && avgTemp > 0) {
    summary.push('Warm temps → heavy/slushy snow');
  }

  if (baseCm > 0) {
    const coverage = baseCm >= 120 ? 'solid coverage' : baseCm >= 50 ? 'adequate coverage' : 'patchy coverage';
    summary.push(`Base: ${Math.round(baseCm)}cm (${coverage})`);
  }

  if (maxWind > 60) {
    summary.push(`High wind ${Math.round(maxWind)}km/h → possible lift closures`);
  } else if (maxWind > 0) {
    summary.push('Low wind expected');
  }

  // Best day: highest single-day snow accumulation
  let best_day: string | undefined;
  if (report.forecast.length > 0) {
    const best = report.forecast.reduce((a, b) =>
      a.snow_accumulation_cm >= b.snow_accumulation_cm ? a : b,
    );
    if (best.snow_accumulation_cm > 0) {
      const date = new Date(best.date);
      best_day = date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' });
    }
  }

  return {
    total,
    label: scoreLabel(total),
    factors: { fresh_snow, forecast_snow, base_depth, weather_penalty },
    summary,
    best_day,
  };
}

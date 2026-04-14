import { MOCK_REPORTS } from '../dev/mock_reports.js';
import { ConditionsReport, Alert, ScoredConditions } from '../types/index.js';
import { ResortService } from './resort_service.js';
import { parseSnowValue, scoreConditions } from './scorer.js';

export const DEFAULT_ALERT_RESORTS = ['falls-creek', 'hotham', 'perisher', 'thredbo'];

export interface AlertHistory {
  hasSeen(alert: Alert): Promise<boolean> | boolean;
  record?(alert: Alert): Promise<void> | void;
}

export interface GetScoredResortsOptions {
  resortKeys?: string[];
  useMock?: boolean;
  failFast?: boolean;
  fetchConditions?: (resortKey: string) => Promise<ConditionsReport>;
  onFetchError?: (resortKey: string, error: unknown) => void;
}

export interface GetAlertsOptions extends GetScoredResortsOptions {
  minScore?: number;
  history?: AlertHistory;
  recordHistory?: boolean;
}

export async function getScoredResorts(
  options: GetScoredResortsOptions = {},
): Promise<ScoredConditions[]> {
  const resortKeys = options.resortKeys ?? DEFAULT_ALERT_RESORTS;
  const results = await Promise.all(
    resortKeys.map(async (resortKey): Promise<ScoredConditions | null> => {
      try {
        const report = await getConditionsForResort(resortKey, options);
        return {
          resortKey,
          report,
          score: scoreConditions(report),
        };
      } catch (error) {
        options.onFetchError?.(resortKey, error);
        if (options.failFast) {
          throw error;
        }

        return null;
      }
    }),
  );

  return results.filter((result): result is ScoredConditions => result !== null);
}

export async function getAlerts(options: GetAlertsOptions = {}): Promise<Alert[]> {
  const minScore = options.minScore ?? 8;
  const scoredResorts = await getScoredResorts(options);
  const candidateAlerts = scoredResorts
    .filter(({ score }) => score.total >= minScore)
    .map(toAlert);

  const alerts: Alert[] = [];
  for (const alert of candidateAlerts) {
    const seen = await options.history?.hasSeen(alert);
    if (seen) continue;

    alerts.push(alert);
    if (options.recordHistory) {
      await options.history?.record?.(alert);
    }
  }

  return alerts;
}

async function getConditionsForResort(
  resortKey: string,
  options: GetScoredResortsOptions,
): Promise<ConditionsReport> {
  if (options.fetchConditions) {
    return options.fetchConditions(resortKey);
  }

  if (options.useMock) {
    const report = MOCK_REPORTS[resortKey];
    if (!report) {
      throw new Error(
        `No mock report for '${resortKey}'. Available: ${Object.keys(MOCK_REPORTS).join(', ')}`,
      );
    }

    return report;
  }

  return new ResortService(resortKey).getConditions();
}

function toAlert({ resortKey, report, score }: ScoredConditions): Alert {
  const freshSnowCm = parseSnowValue(report.fresh_snow_cm);
  const baseDepthCm = parseSnowValue(report.snow_depth_base_cm);
  const forecastSnowCm = report.forecast.reduce(
    (sum, day) => sum + day.snow_accumulation_cm,
    0,
  );
  const id = [
    resortKey,
    report.timestamp.slice(0, 10),
    score.total.toFixed(1),
    Math.round(freshSnowCm),
    Math.round(forecastSnowCm),
  ].join(':');

  return {
    id,
    resortKey,
    resort: report.resort,
    timestamp: report.timestamp,
    score,
    report,
    freshSnowCm,
    baseDepthCm,
    forecastSnowCm,
    message: buildAlertMessage(report, score.total, freshSnowCm, forecastSnowCm),
  };
}

function buildAlertMessage(
  report: ConditionsReport,
  score: number,
  freshSnowCm: number,
  forecastSnowCm: number,
): string {
  const parts = [
    `${report.resort} is ${score}/10`,
    `${Math.round(freshSnowCm)}cm fresh`,
    `${Math.round(forecastSnowCm)}cm forecast`,
  ];

  return parts.join(' - ');
}

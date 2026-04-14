import { describe, expect, it } from 'vitest';
import { getAlerts } from '../../src/services/alerts.js';
import { Alert, ConditionsReport } from '../../src/types/index.js';

function makeReport(overrides: Partial<ConditionsReport> = {}): ConditionsReport {
  return {
    resort: 'Test Resort',
    timestamp: '2026-04-13T07:15:00.000Z',
    fresh_snow_cm: '30 cm',
    snow_depth_base_cm: '150 cm',
    snow_depth_top_cm: '200 cm',
    forecast: [
      {
        date: '2026-04-14',
        temp_c: -5,
        precipitation_mm: 0,
        snow_accumulation_cm: 12,
        wind_kmh: 10,
      },
      {
        date: '2026-04-15',
        temp_c: -4,
        precipitation_mm: 0,
        snow_accumulation_cm: 10,
        wind_kmh: 15,
      },
    ],
    ...overrides,
  };
}

describe('getAlerts', () => {
  it('returns alert objects for resorts that meet the score threshold', async () => {
    const alerts = await getAlerts({
      resortKeys: ['test-resort'],
      fetchConditions: async () => makeReport(),
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      resortKey: 'test-resort',
      resort: 'Test Resort',
      freshSnowCm: 30,
      baseDepthCm: 150,
      forecastSnowCm: 22,
    });
    expect(alerts[0].score.total).toBeGreaterThanOrEqual(8);
  });

  it('does not return alerts that history has already seen', async () => {
    const alerts = await getAlerts({
      resortKeys: ['test-resort'],
      fetchConditions: async () => makeReport(),
      history: {
        hasSeen: () => true,
      },
    });

    expect(alerts).toEqual([]);
  });

  it('records new alerts when recordHistory is enabled', async () => {
    const recorded: Alert[] = [];

    const alerts = await getAlerts({
      resortKeys: ['test-resort'],
      fetchConditions: async () => makeReport(),
      recordHistory: true,
      history: {
        hasSeen: () => false,
        record: (alert) => {
          recorded.push(alert);
        },
      },
    });

    expect(alerts).toHaveLength(1);
    expect(recorded).toEqual(alerts);
  });

  it('skips resorts below the score threshold', async () => {
    const alerts = await getAlerts({
      resortKeys: ['test-resort'],
      fetchConditions: async () => makeReport({
        fresh_snow_cm: '0 cm',
        snow_depth_base_cm: '20 cm',
        forecast: [],
      }),
    });

    expect(alerts).toEqual([]);
  });
});

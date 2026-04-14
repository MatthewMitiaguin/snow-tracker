import { describe, it, expect } from 'vitest';
import { scoreConditions, parseSnowValue } from '../../src/services/scorer.js';
import { ConditionsReport } from '../../src/types/index.js';

function makeReport(overrides: Partial<ConditionsReport> = {}): ConditionsReport {
  return {
    resort: 'Test Resort',
    timestamp: new Date().toISOString(),
    fresh_snow_cm: '0 cm',
    snow_depth_base_cm: '100 cm',
    snow_depth_top_cm: '150 cm',
    forecast: [],
    ...overrides,
  };
}

// --- parseSnowValue ---

describe('parseSnowValue', () => {
  it('parses "45 cm" → 45', () => expect(parseSnowValue('45 cm')).toBe(45));
  it('parses "345 cm" → 345', () => expect(parseSnowValue('345 cm')).toBe(345));
  it('parses "—" → 0', () => expect(parseSnowValue('—')).toBe(0));
  it('parses undefined → 0', () => expect(parseSnowValue(undefined)).toBe(0));
  it('parses "0 cm" → 0', () => expect(parseSnowValue('0 cm')).toBe(0));
});

// --- Fresh snow factor ---

describe('fresh snow factor', () => {
  it('scores 0 for no fresh snow', () => {
    const result = scoreConditions(makeReport({ fresh_snow_cm: '0 cm' }));
    expect(result.factors.fresh_snow).toBe(0);
  });

  it('scores 1 for 1–5cm', () => {
    const result = scoreConditions(makeReport({ fresh_snow_cm: '5 cm' }));
    expect(result.factors.fresh_snow).toBe(1);
  });

  it('scores 2 for 6–14cm', () => {
    const result = scoreConditions(makeReport({ fresh_snow_cm: '10 cm' }));
    expect(result.factors.fresh_snow).toBe(2);
  });

  it('scores 3 for 15–24cm', () => {
    const result = scoreConditions(makeReport({ fresh_snow_cm: '20 cm' }));
    expect(result.factors.fresh_snow).toBe(3);
  });

  it('scores 4 for 25cm+', () => {
    const result = scoreConditions(makeReport({ fresh_snow_cm: '30 cm' }));
    expect(result.factors.fresh_snow).toBe(4);
  });
});

// --- Forecast snow factor ---

describe('forecast snow factor', () => {
  it('scores 0 with no forecast', () => {
    const result = scoreConditions(makeReport({ forecast: [] }));
    expect(result.factors.forecast_snow).toBe(0);
  });

  it('scores 1 for 1–9cm total forecast', () => {
    const result = scoreConditions(makeReport({
      forecast: [{ date: '2026-04-14', temp_c: -3, precipitation_mm: 0, snow_accumulation_cm: 5 }],
    }));
    expect(result.factors.forecast_snow).toBe(1);
  });

  it('scores 2 for 10–19cm total forecast', () => {
    const result = scoreConditions(makeReport({
      forecast: [{ date: '2026-04-14', temp_c: -3, precipitation_mm: 0, snow_accumulation_cm: 15 }],
    }));
    expect(result.factors.forecast_snow).toBe(2);
  });

  it('scores 3 for 20cm+ total forecast', () => {
    const result = scoreConditions(makeReport({
      forecast: [{ date: '2026-04-14', temp_c: -3, precipitation_mm: 0, snow_accumulation_cm: 25 }],
    }));
    expect(result.factors.forecast_snow).toBe(3);
  });
});

// --- Base depth factor ---

describe('base depth factor', () => {
  it('scores 0 for base under 50cm', () => {
    const result = scoreConditions(makeReport({ snow_depth_base_cm: '30 cm' }));
    expect(result.factors.base_depth).toBe(0);
  });

  it('scores 1 for 50–79cm', () => {
    const result = scoreConditions(makeReport({ snow_depth_base_cm: '60 cm' }));
    expect(result.factors.base_depth).toBe(1);
  });

  it('scores 1.5 for 80–119cm', () => {
    const result = scoreConditions(makeReport({ snow_depth_base_cm: '100 cm' }));
    expect(result.factors.base_depth).toBe(1.5);
  });

  it('scores 2 for 120cm+', () => {
    const result = scoreConditions(makeReport({ snow_depth_base_cm: '140 cm' }));
    expect(result.factors.base_depth).toBe(2);
  });
});

// --- Weather penalties ---

describe('weather penalties', () => {
  it('applies -1 for base under 50cm', () => {
    const result = scoreConditions(makeReport({ snow_depth_base_cm: '30 cm' }));
    expect(result.factors.weather_penalty).toBeLessThanOrEqual(-1);
  });

  it('applies -1 for warm temps with fresh snow', () => {
    const result = scoreConditions(makeReport({
      fresh_snow_cm: '15 cm',
      forecast: [{ date: '2026-04-14', temp_c: 2, precipitation_mm: 0, snow_accumulation_cm: 0 }],
    }));
    expect(result.factors.weather_penalty).toBeLessThanOrEqual(-1);
  });

  it('does not penalise warm temps without fresh snow', () => {
    const result = scoreConditions(makeReport({
      fresh_snow_cm: '0 cm',
      forecast: [{ date: '2026-04-14', temp_c: 3, precipitation_mm: 0, snow_accumulation_cm: 0 }],
    }));
    expect(result.factors.weather_penalty).toBe(0);
  });

  it('applies -1 for wind over 60km/h', () => {
    const result = scoreConditions(makeReport({
      forecast: [{ date: '2026-04-14', temp_c: -5, precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 80 }],
    }));
    expect(result.factors.weather_penalty).toBeLessThanOrEqual(-1);
  });

  it('does not penalise wind under 60km/h', () => {
    const result = scoreConditions(makeReport({
      forecast: [{ date: '2026-04-14', temp_c: -5, precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 40 }],
    }));
    expect(result.factors.weather_penalty).toBe(0);
  });
});

// --- Integration ---

describe('integration', () => {
  it('scores high for excellent conditions', () => {
    const result = scoreConditions(makeReport({
      fresh_snow_cm: '30 cm',
      snow_depth_base_cm: '150 cm',
      forecast: [
        { date: '2026-04-14', temp_c: -5, precipitation_mm: 0, snow_accumulation_cm: 12, wind_kmh: 10 },
        { date: '2026-04-15', temp_c: -4, precipitation_mm: 0, snow_accumulation_cm: 10, wind_kmh: 15 },
      ],
    }));
    expect(result.total).toBeGreaterThanOrEqual(8.0);
    expect(result.label).toBe('🔥');
  });

  it('scores low for poor conditions', () => {
    const result = scoreConditions(makeReport({
      fresh_snow_cm: '0 cm',
      snow_depth_base_cm: '30 cm',
      forecast: [{ date: '2026-04-14', temp_c: 5, precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 70 }],
    }));
    expect(result.total).toBeLessThan(4.0);
  });

  it('total is between 0 and 10', () => {
    const result = scoreConditions(makeReport());
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(10);
  });

  it('includes summary bullet points', () => {
    const result = scoreConditions(makeReport());
    expect(result.summary.length).toBeGreaterThan(0);
  });
});

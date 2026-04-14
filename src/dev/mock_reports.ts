import { ConditionsReport } from '../types/index.js';

// Realistic mock data for testing scoring and output formatting.
// Covers a spread: big dump → decent → marginal → skip.

export const MOCK_REPORTS: Record<string, ConditionsReport> = {
  'falls-creek': {
    resort: 'Falls Creek',
    timestamp: new Date().toISOString(),
    fresh_snow_cm: '32 cm',
    snow_depth_base_cm: '145 cm',
    snow_depth_top_cm: '210 cm',
    last_snowfall: 'Yesterday',
    forecast: [
      { date: '2026-04-14', temp_c: -5, precipitation_mm: 8, snow_accumulation_cm: 12, wind_kmh: 15 },
      { date: '2026-04-15', temp_c: -4, precipitation_mm: 10, snow_accumulation_cm: 14, wind_kmh: 20 },
      { date: '2026-04-16', temp_c: -6, precipitation_mm: 4, snow_accumulation_cm: 6, wind_kmh: 10 },
      { date: '2026-04-17', temp_c: -3, precipitation_mm: 2, snow_accumulation_cm: 3, wind_kmh: 25 },
      { date: '2026-04-18', temp_c: -2, precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 18 },
      { date: '2026-04-19', temp_c: -1, precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 12 },
    ],
  },

  hotham: {
    resort: 'Mount Hotham',
    timestamp: new Date().toISOString(),
    fresh_snow_cm: '14 cm',
    snow_depth_base_cm: '98 cm',
    snow_depth_top_cm: '155 cm',
    last_snowfall: '2 days ago',
    forecast: [
      { date: '2026-04-14', temp_c: -2, precipitation_mm: 3, snow_accumulation_cm: 4, wind_kmh: 30 },
      { date: '2026-04-15', temp_c: -1, precipitation_mm: 5, snow_accumulation_cm: 6, wind_kmh: 35 },
      { date: '2026-04-16', temp_c: 0,  precipitation_mm: 2, snow_accumulation_cm: 2, wind_kmh: 40 },
      { date: '2026-04-17', temp_c: 1,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 28 },
      { date: '2026-04-18', temp_c: 0,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 22 },
      { date: '2026-04-19', temp_c: -1, precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 18 },
    ],
  },

  perisher: {
    resort: 'Perisher',
    timestamp: new Date().toISOString(),
    fresh_snow_cm: '4 cm',
    snow_depth_base_cm: '62 cm',
    snow_depth_top_cm: '95 cm',
    last_snowfall: '4 days ago',
    forecast: [
      { date: '2026-04-14', temp_c: 1,  precipitation_mm: 1, snow_accumulation_cm: 1, wind_kmh: 45 },
      { date: '2026-04-15', temp_c: 2,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 50 },
      { date: '2026-04-16', temp_c: 3,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 38 },
      { date: '2026-04-17', temp_c: 2,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 30 },
      { date: '2026-04-18', temp_c: 1,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 25 },
      { date: '2026-04-19', temp_c: 0,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 20 },
    ],
  },

  thredbo: {
    resort: 'Thredbo',
    timestamp: new Date().toISOString(),
    fresh_snow_cm: '0 cm',
    snow_depth_base_cm: '28 cm',
    snow_depth_top_cm: '45 cm',
    last_snowfall: '12 days ago',
    forecast: [
      { date: '2026-04-14', temp_c: 4,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 20 },
      { date: '2026-04-15', temp_c: 5,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 15 },
      { date: '2026-04-16', temp_c: 4,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 18 },
      { date: '2026-04-17', temp_c: 3,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 22 },
      { date: '2026-04-18', temp_c: 3,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 20 },
      { date: '2026-04-19', temp_c: 2,  precipitation_mm: 0, snow_accumulation_cm: 0, wind_kmh: 16 },
    ],
  },
};

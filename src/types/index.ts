export interface Forecast {
  date: string;
  temp_c: number;
  precipitation_mm: number;
  snow_accumulation_cm: number;
  wind_kmh?: number;
}

export interface ScoreResult {
  total: number;
  label: string;
  factors: {
    fresh_snow: number;
    forecast_snow: number;
    base_depth: number;
    weather_penalty: number;
  };
  summary: string[];
  best_day?: string;
}

export interface ConditionsReport {
  resort: string;
  timestamp: string;
  snow_depth_top_cm?: string;
  snow_depth_base_cm?: string;
  fresh_snow_cm?: string;
  last_snowfall?: string;
  forecast: Forecast[];
}

export interface ResortConfig {
  name: string;
  url: string;
  tableClass: string;
  fieldMap: Record<string, string>;
  coordinates: [number, number];
}

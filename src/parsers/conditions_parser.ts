import * as cheerio from 'cheerio';
import { ConditionsReport, Forecast, ResortConfig } from '../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = any;

const SLOTS_PER_DAY = 3;

function extractSnowValue(td: CheerioElement): string {
  const value = td.find('span.snowht').text().trim();
  const unit = td.find('span.snowu').text().trim();

  if (value) {
    return `${value} ${unit}`.trim();
  }

  return td.text().trim();
}

function parseForecast($: ReturnType<typeof cheerio.load>): Forecast[] {
  // Read dates from column headers — each day has colspan=3 (AM/PM/night slots)
  const dates: string[] = [];
  $('td[data-date]').each((_i, el) => {
    const date = $(el).attr('data-date');
    if (date) dates.push(date);
  });

  if (!dates.length) return [];

  const totalSlots = dates.length * SLOTS_PER_DAY;

  // Collect per-slot values from each forecast row
  const snowSlots: number[] = Array(totalSlots).fill(0);
  const tempSlots: number[] = Array(totalSlots).fill(0);
  const windSlots: number[] = Array(totalSlots).fill(0);

  $('tr[data-row="snow"] td').each((i, td) => {
    if (i >= totalSlots) return;
    const val = $(td).find('div.snow-amount').attr('data-value');
    snowSlots[i] = val ? parseFloat(val) : 0;
  });

  $('tr[data-row="temperature-max"] td').each((i, td) => {
    if (i >= totalSlots) return;
    const val = $(td).find('div[data-value]').attr('data-value');
    tempSlots[i] = val ? parseFloat(val) : 0;
  });

  $('tr[data-row="wind"] td').each((i, td) => {
    if (i >= totalSlots) return;
    const val = $(td).find('div.wind-icon').attr('data-speed');
    windSlots[i] = val ? parseFloat(val) : 0;
  });

  // Aggregate 3 slots → 1 day: sum snow, max temp, max wind
  return dates.map((date, dayIndex) => {
    const start = dayIndex * SLOTS_PER_DAY;
    const snow = snowSlots.slice(start, start + SLOTS_PER_DAY).reduce((a, b) => a + b, 0);
    const temp = Math.max(...tempSlots.slice(start, start + SLOTS_PER_DAY));
    const wind = Math.max(...windSlots.slice(start, start + SLOTS_PER_DAY));

    return {
      date,
      temp_c: temp,
      precipitation_mm: 0,
      snow_accumulation_cm: Math.round(snow * 10) / 10,
      wind_kmh: wind,
    };
  });
}

export function parseConditions(html: string, config: ResortConfig): ConditionsReport {
  const $ = cheerio.load(html);

  const report: ConditionsReport = {
    resort: config.name,
    timestamp: new Date().toISOString(),
    forecast: [],
  };

  const table = $(`table.${config.tableClass}`);
  if (!table.length) {
    return report;
  }

  table.find('tr').each((_i, row) => {
    const th = $(row).find('th');
    const td = $(row).find('td');

    if (!th.length || !td.length) return;

    const label = th.text().trim().replace(/:$/, '').toLowerCase();
    const reportField = config.fieldMap[label];

    if (!reportField) return;

    const value = extractSnowValue(td);

    if (reportField === 'snow_depth_top_cm') report.snow_depth_top_cm = value;
    if (reportField === 'snow_depth_base_cm') report.snow_depth_base_cm = value;
    if (reportField === 'fresh_snow_cm') report.fresh_snow_cm = value;
    if (reportField === 'last_snowfall') report.last_snowfall = value;
  });

  report.forecast = parseForecast($);

  return report;
}

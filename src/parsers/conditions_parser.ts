import * as cheerio from 'cheerio';
import { ConditionsReport, ResortConfig } from '../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = any;

function extractSnowValue(td: CheerioElement): string {
  const value = td.find('span.snowht').text().trim();
  const unit = td.find('span.snowu').text().trim();

  if (value) {
    return `${value} ${unit}`.trim();
  }

  return td.text().trim();
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

  return report;
}

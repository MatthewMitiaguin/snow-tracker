// src/conditionsService.ts

import * as cheerio from 'cheerio';
import { ConditionsReport, ResortConfig } from './types.js';
import { RESORT_CONFIGS } from './resort_config.js';

function safeText(text: string | undefined): string {
  return text?.trim() ?? '';
}

function parseConditions(html: string, config: ResortConfig): ConditionsReport {
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
    const reportField = config.fieldMap[label] as keyof ConditionsReport;
    if (!reportField) return;

    const snowValue = td.find('span.snowht');
    const snowUnit = td.find('span.snowu');

    if (snowValue.length) {
      const value = snowValue.text().trim();
      const unit = safeText(snowUnit.text());
      (report as Record<string, unknown>)[reportField] = `${value} ${unit}`.trim();
    } else {
      (report as Record<string, unknown>)[reportField] = td.text().trim();
    }
  });

  return report;
}

export class ResortService {
  private config: ResortConfig;
  private resortKey: string;

  constructor(resortKey: string) {
    const config = RESORT_CONFIGS[resortKey];
    if (!config) {
      throw new Error(
        `Unknown resort '${resortKey}'. Available: ${Object.keys(RESORT_CONFIGS).join(', ')}`
      );
    }
    this.config = config;
    this.resortKey = resortKey;
  }

  async getConditions(): Promise<ConditionsReport> {
    try {
      const response = await fetch(this.config.url, {
        headers: { 'User-Agent': 'snow-tracker/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      return parseConditions(html, this.config);
    } catch (e) {
      throw new Error(`Failed to fetch conditions for ${this.resortKey}: ${e}`);
    }
  }
}
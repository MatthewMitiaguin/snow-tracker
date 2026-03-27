import * as cheerio from "cheerio";
import { ConditionsReport, ResortConfig } from "./types.js";
import { RESORT_CONFIGS } from "./resort_config.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = any;

function extractSnowValue(td: CheerioElement): string {
  const value = td.find("span.snowht").text().trim();
  const unit = td.find("span.snowu").text().trim();

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

  table.find("tr").each((_i, row) => {
    const th = $(row).find("th");
    const td = $(row).find("td");

    if (!th.length || !td.length) return;

    const label = th.text().trim().replace(/:$/, "").toLowerCase();
    const reportField = config.fieldMap[label];

    if (!reportField) return;

    const value = extractSnowValue(td);

    if (reportField === "snow_depth_top_cm") report.snow_depth_top_cm = value;
    if (reportField === "snow_depth_base_cm") report.snow_depth_base_cm = value;
    if (reportField === "fresh_snow_cm") report.fresh_snow_cm = value;
    if (reportField === "last_snowfall") report.last_snowfall = value;
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
        `Unknown resort '${resortKey}'. Available: ${Object.keys(RESORT_CONFIGS).join(", ")}`,
      );
    }
    this.config = config;
    this.resortKey = resortKey;
  }

  async getConditions(): Promise<ConditionsReport> {
    try {
      const response = await fetch(this.config.url, {
        headers: { "User-Agent": "snow-tracker/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      return parseConditions(html, this.config);
    } catch (error) {
      console.error(`Failed to fetch conditions for ${this.resortKey}:`, error);
      throw error;
    }
  }
}

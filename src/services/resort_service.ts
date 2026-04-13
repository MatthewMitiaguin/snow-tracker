import { ConditionsReport, ResortConfig } from '../types/index.js';
import { RESORT_CONFIGS } from '../config/resorts.js';
import { parseConditions } from '../parsers/conditions_parser.js';

export class ResortService {
  private config: ResortConfig;
  private resortKey: string;

  constructor(resortKey: string) {
    const config = RESORT_CONFIGS[resortKey];
    if (!config) {
      throw new Error(
        `Unknown resort '${resortKey}'. Available: ${Object.keys(RESORT_CONFIGS).join(', ')}`,
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
    } catch (error) {
      console.error(`Failed to fetch conditions for ${this.resortKey}:`, error);
      throw error;
    }
  }
}

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { parseConditions } from '../../src/parsers/conditions_parser.js';
import { RESORT_CONFIGS } from '../../src/config/resorts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const html = readFileSync(join(__dirname, '../fixtures/niseko.html'), 'utf-8');
const config = RESORT_CONFIGS['niseko'];

describe('parseConditions (niseko fixture)', () => {
  it('returns the correct resort name', () => {
    const report = parseConditions(html, config);
    expect(report.resort).toBe('Niseko Grand Hirafu');
  });

  it('sets a timestamp', () => {
    const report = parseConditions(html, config);
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('populates snow_depth_top_cm', () => {
    const report = parseConditions(html, config);
    expect(report.snow_depth_top_cm).toBeDefined();
    expect(report.snow_depth_top_cm).not.toBe('');
  });

  it('populates snow_depth_base_cm', () => {
    const report = parseConditions(html, config);
    expect(report.snow_depth_base_cm).toBeDefined();
    expect(report.snow_depth_base_cm).not.toBe('');
  });

  it('populates fresh_snow_cm', () => {
    const report = parseConditions(html, config);
    expect(report.fresh_snow_cm).toBeDefined();
    expect(report.fresh_snow_cm).not.toBe('');
  });

  it('populates last_snowfall', () => {
    const report = parseConditions(html, config);
    expect(report.last_snowfall).toBeDefined();
    expect(report.last_snowfall).not.toBe('');
  });

  it('returns empty forecast array (not yet implemented)', () => {
    const report = parseConditions(html, config);
    expect(Array.isArray(report.forecast)).toBe(true);
  });

  it('returns empty report for unrecognised HTML', () => {
    const report = parseConditions('<html><body>nothing here</body></html>', config);
    expect(report.snow_depth_top_cm).toBeUndefined();
    expect(report.snow_depth_base_cm).toBeUndefined();
    expect(report.fresh_snow_cm).toBeUndefined();
    expect(report.last_snowfall).toBeUndefined();
  });
});

import { Command } from 'commander';
import { ResortService } from './services/resort_service.js';
import { scoreConditions, parseSnowValue } from './services/scorer.js';
import { ConditionsReport, ScoreResult } from './types/index.js';

const AUSTRALIAN_RESORTS = ['falls-creek', 'hotham', 'perisher', 'thredbo'];

function printScore(resort: string, score: ScoreResult): void {
  console.log(`\n${score.total}/10 — ${score.label}`);
  console.log(`Resort: ${resort}\n`);
  for (const line of score.summary) {
    console.log(`- ${line}`);
  }
  if (score.best_day) {
    console.log(`\nBest day: ${score.best_day}`);
  }
  console.log();
}

const program = new Command();

program
  .name('snow')
  .description('Should I go skiing?')
  .version('1.0.0');

program
  .command('check <resort>')
  .description('Rate conditions for a resort (1–10)')
  .action(async (resort: string) => {
    try {
      const service = new ResortService(resort);
      console.log(`Fetching conditions for ${resort}...`);
      const report = await service.getConditions();
      const score = scoreConditions(report);
      printScore(report.resort, score);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare all Australian resorts ranked by score')
  .action(async () => {
    console.log('Fetching conditions for all Australian resorts...\n');

    const results = await Promise.all(
      AUSTRALIAN_RESORTS.map(async (key) => {
        try {
          const report = await new ResortService(key).getConditions();
          const score = scoreConditions(report);
          return { report, score };
        } catch {
          console.warn(`⚠  Could not fetch data for ${key}`);
          return null;
        }
      }),
    );

    const ranked = results
      .filter((r): r is { report: ConditionsReport; score: ScoreResult } => r !== null)
      .sort((a, b) => b.score.total - a.score.total);

    if (!ranked.length) {
      console.error('No resort data available.');
      process.exit(1);
    }

    const col = { resort: 14, score: 7, fresh: 7, base: 7 };
    const header =
      'Resort'.padEnd(col.resort) +
      'Score'.padEnd(col.score) +
      'Fresh'.padEnd(col.fresh) +
      'Base'.padEnd(col.base) +
      'Verdict';
    console.log(header);
    console.log('─'.repeat(header.length + 10));

    ranked.forEach(({ report, score }, i) => {
      const freshCm = parseSnowValue(report.fresh_snow_cm);
      const baseCm = parseSnowValue(report.snow_depth_base_cm);
      const verdict = i === 0 && score.total >= 8.0 ? '🔥 Best option' : score.label;

      const row =
        report.resort.padEnd(col.resort) +
        `${score.total}/10`.padEnd(col.score) +
        `${Math.round(freshCm)}cm`.padEnd(col.fresh) +
        `${Math.round(baseCm)}cm`.padEnd(col.base) +
        verdict;
      console.log(row);
    });

    console.log();
  });

program.parse();

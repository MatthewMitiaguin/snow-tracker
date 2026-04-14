import 'dotenv/config';
import { Command } from 'commander';
import {
  DEFAULT_ALERT_RESORTS,
  getAlerts,
  getScoredResorts,
} from './services/alerts.js';
import { DynamoAlertHistory, InMemoryAlertHistory } from './services/dynamo_history.js';
import { sendDiscordAlert } from './services/discord.js';
import { parseSnowValue } from './services/scorer.js';
import { ScoreResult } from './types/index.js';

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
      console.log(`Fetching conditions for ${resort}...`);
      const [result] = await getScoredResorts({
        resortKeys: [resort],
        failFast: true,
      });
      if (!result) {
        throw new Error(`No resort data available for ${resort}.`);
      }

      const { report, score } = result;
      printScore(report.resort, score);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare all Australian resorts ranked by score')
  .option('--mock', 'use realistic fake data instead of live scraping')
  .action(async (opts: { mock?: boolean }) => {
    const usingMock = opts.mock ?? false;
    console.log(usingMock
      ? 'Using mock data...\n'
      : 'Fetching conditions for all Australian resorts...\n'
    );

    const ranked = (await getScoredResorts({
      useMock: usingMock,
      onFetchError: (key) => console.warn(`⚠  Could not fetch data for ${key}`),
    }))
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

program
  .command('alerts')
  .description('List new high-scoring resort alerts')
  .option('--mock', 'use realistic fake data instead of live scraping')
  .option('--min-score <score>', 'minimum score required for an alert', '8')
  .action(async (opts: { mock?: boolean; minScore: string }) => {
    const minScore = Number(opts.minScore);
    if (Number.isNaN(minScore)) {
      console.error('--min-score must be a number.');
      process.exit(1);
    }

    const history = opts.mock ? new InMemoryAlertHistory() : new DynamoAlertHistory();
    const alerts = await getAlerts({
      useMock: opts.mock ?? false,
      minScore,
      resortKeys: DEFAULT_ALERT_RESORTS,
      history,
      recordHistory: true,
      onFetchError: (key) => console.warn(`⚠  Could not fetch data for ${key}`),
    });

    if (!alerts.length) {
      console.log('No new alerts.');
      return;
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL ?? '';
    for (const alert of alerts) {
      console.log(`${alert.message} (${alert.score.label})`);
      for (const line of alert.score.summary) {
        console.log(`- ${line}`);
      }
      console.log();
      await sendDiscordAlert(alert, webhookUrl);
    }
  });

program.parse();

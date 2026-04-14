import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getAlerts, DEFAULT_ALERT_RESORTS } from './services/alerts.js';
import { DynamoAlertHistory } from './services/dynamo_history.js';
import { sendDiscordAlert } from './services/discord.js';

export const handler = async () => {
  const ssm = new SSMClient({});
  const { Parameter } = await ssm.send(
    new GetParameterCommand({
      Name: process.env.DISCORD_WEBHOOK_PARAM!,
      WithDecryption: true,
    }),
  );
  const webhookUrl = Parameter?.Value ?? '';

  const history = new DynamoAlertHistory();
  const alerts = await getAlerts({
    minScore: Number(process.env.MIN_SCORE ?? '8'),
    resortKeys: DEFAULT_ALERT_RESORTS,
    history,
    recordHistory: true,
    onFetchError: (key, error) =>
      console.warn(`Could not fetch data for ${key}:`, error),
  });

  for (const alert of alerts) {
    await sendDiscordAlert(alert, webhookUrl);
  }

  return { alertsSent: alerts.length };
};

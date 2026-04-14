import { Alert } from '../types/index.js';

const COLOURS = {
  red: 0xe74c3c,    // ≥8 — SEND IT
  orange: 0xe67e22, // ≥6 — Good
  grey: 0x95a5a6,   // <6
};

function embedColour(score: number): number {
  if (score >= 8) return COLOURS.red;
  if (score >= 6) return COLOURS.orange;
  return COLOURS.grey;
}

export async function sendDiscordAlert(alert: Alert, webhookUrl: string): Promise<void> {
  if (!webhookUrl) return;

  const description = alert.score.summary.map((line) => `- ${line}`).join('\n');

  const payload = {
    embeds: [
      {
        title: `🚨 ${alert.resort} — ${alert.score.total}/10 ${alert.score.label}`,
        description,
        color: embedColour(alert.score.total),
        footer: { text: new Date(alert.timestamp).toLocaleString('en-AU') },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.warn(`Discord webhook failed: HTTP ${response.status}`);
  }
}

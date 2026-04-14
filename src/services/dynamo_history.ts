import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Alert } from '../types/index.js';
import { AlertHistory } from './alerts.js';

const TTL_DAYS = 7;

export class InMemoryAlertHistory implements AlertHistory {
  private seen = new Set<string>();

  hasSeen(alert: Alert): boolean {
    return this.seen.has(alert.id);
  }

  record(alert: Alert): void {
    this.seen.add(alert.id);
  }
}

export class DynamoAlertHistory implements AlertHistory {
  private client: DynamoDBDocumentClient;
  private table: string;

  constructor() {
    const base = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'ap-southeast-2',
      // Uses default credential chain: AWS_PROFILE, ~/.aws/credentials, IAM role, etc.
    });
    this.client = DynamoDBDocumentClient.from(base);
    this.table = process.env.DYNAMODB_TABLE ?? 'snow-tracker-alerts';
  }

  async hasSeen(alert: Alert): Promise<boolean> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.table,
        Key: { id: alert.id },
      }),
    );
    return result.Item !== undefined;
  }

  async record(alert: Alert): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + TTL_DAYS * 24 * 60 * 60;
    await this.client.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          id: alert.id,
          resort: alert.resort,
          score: alert.score.total,
          timestamp: alert.timestamp,
          expires_at: expiresAt,
        },
      }),
    );
  }
}

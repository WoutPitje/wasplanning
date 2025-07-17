import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebhookEventsTable1736256000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE webhook_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
      CREATE INDEX idx_webhook_events_status ON webhook_events(status);
      CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_webhook_events_created_at;
      DROP INDEX IF EXISTS idx_webhook_events_status;
      DROP INDEX IF EXISTS idx_webhook_events_stripe_event_id;
      DROP TABLE IF EXISTS webhook_events;
    `);
  }
}

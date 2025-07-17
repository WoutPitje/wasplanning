import { DataSource } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';

describe('SubscriptionPlan Entity', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USERNAME || 'wasplanning',
      password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
      database: process.env.DATABASE_NAME || 'wasplanning',
      entities: [SubscriptionPlan],
      synchronize: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('Migration Verification', () => {
    it('should have created the subscription_plans table', async () => {
      const queryRunner = dataSource.createQueryRunner();
      const table = await queryRunner.getTable('subscription_plans');
      await queryRunner.release();

      expect(table).toBeDefined();
      expect(table.name).toBe('subscription_plans');
    });

    it('should have seeded 3 subscription plans', async () => {
      const repository = dataSource.getRepository(SubscriptionPlan);
      const plans = await repository.find({
        order: { price_cents: 'ASC' },
      });

      expect(plans).toHaveLength(3);
    });

    it('should have correct FREE plan data', async () => {
      const repository = dataSource.getRepository(SubscriptionPlan);
      const freePlan = await repository.findOne({
        where: { name: 'free' },
      });

      expect(freePlan).toBeDefined();
      expect(freePlan.display_name).toBe('Gratis');
      expect(freePlan.price_cents).toBe(0);
      expect(freePlan.stripe_price_id).toBeNull();
      expect(freePlan.max_cars_per_month).toBe(50);
      expect(freePlan.max_active_users).toBe(2);
      expect(freePlan.max_locations).toBe(1);
      expect(freePlan.features.api_access).toBe(false);
      expect(freePlan.features.multi_location).toBe(false);
    });

    it('should have correct STANDARD plan data', async () => {
      const repository = dataSource.getRepository(SubscriptionPlan);
      const standardPlan = await repository.findOne({
        where: { name: 'standard' },
      });

      expect(standardPlan).toBeDefined();
      expect(standardPlan.display_name).toBe('Standaard');
      expect(standardPlan.price_cents).toBe(10000);
      expect(standardPlan.stripe_price_id).toBe(
        'price_1RiZo24dzLrGEbJawJDvGLda',
      );
      expect(standardPlan.max_cars_per_month).toBe(1500);
      expect(standardPlan.max_active_users).toBe(10);
      expect(standardPlan.max_locations).toBe(3);
      expect(standardPlan.features.advanced_reporting).toBe(true);
      expect(standardPlan.features.export_data).toBe(true);
      expect(standardPlan.features.multi_location).toBe(true);
      expect(standardPlan.features.api_access).toBe(false);
    });

    it('should have correct ENTERPRISE plan data', async () => {
      const repository = dataSource.getRepository(SubscriptionPlan);
      const enterprisePlan = await repository.findOne({
        where: { name: 'enterprise' },
      });

      expect(enterprisePlan).toBeDefined();
      expect(enterprisePlan.display_name).toBe('Enterprise');
      expect(enterprisePlan.price_cents).toBe(40000);
      expect(enterprisePlan.stripe_price_id).toBe(
        'price_1RiZo34dzLrGEbJaPIxSP15A',
      );
      expect(enterprisePlan.max_cars_per_month).toBeNull(); // unlimited
      expect(enterprisePlan.max_active_users).toBeNull(); // unlimited
      expect(enterprisePlan.max_locations).toBeNull(); // unlimited
      expect(enterprisePlan.features.api_access).toBe(true);
      expect(enterprisePlan.features.custom_branding).toBe(true);
      expect(enterprisePlan.features.priority_support).toBe(true);
    });
  });

  describe('Entity Structure', () => {
    it('should have all required columns', async () => {
      const queryRunner = dataSource.createQueryRunner();
      const table = await queryRunner.getTable('subscription_plans');
      await queryRunner.release();

      const columnNames = table.columns.map((col) => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('display_name');
      expect(columnNames).toContain('price_cents');
      expect(columnNames).toContain('stripe_price_id');
      expect(columnNames).toContain('max_cars_per_month');
      expect(columnNames).toContain('max_active_users');
      expect(columnNames).toContain('max_locations');
      expect(columnNames).toContain('features');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have unique constraint on name', async () => {
      const queryRunner = dataSource.createQueryRunner();
      const table = await queryRunner.getTable('subscription_plans');
      await queryRunner.release();

      const uniqueConstraint = table.uniques.find((unique) =>
        unique.columnNames.includes('name'),
      );
      expect(uniqueConstraint).toBeDefined();
    });

    it('should have index on name', async () => {
      const queryRunner = dataSource.createQueryRunner();
      const table = await queryRunner.getTable('subscription_plans');
      await queryRunner.release();

      const nameIndex = table.indices.find((index) =>
        index.columnNames.includes('name'),
      );
      expect(nameIndex).toBeDefined();
    });
  });
});

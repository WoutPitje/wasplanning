import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { Tenant } from '../src/auth/entities/tenant.entity';
import { SubscriptionPlan, PlanName } from '../src/subscriptions/entities/subscription-plan.entity';
import { Subscription } from '../src/subscriptions/entities/subscription.entity';
import { AuthService } from '../src/auth/auth.service';

describe('Subscriptions (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  let authToken: string;
  let testTenant: Tenant;
  let testUser: User;
  let starterPlan: SubscriptionPlan;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure validation pipe like the main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();

    dataSource = app.get(DataSource);
    authService = app.get(AuthService);

    // Create test tenant and user
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Generate fresh auth token for each test
    const loginResponse = await authService.validateUser(testUser.email, 'TestPassword123!');
    if (loginResponse) {
      const tokenData = await authService.login(loginResponse);
      authToken = tokenData.access_token;
    }
  });

  async function setupTestData() {
    // Create test tenant
    const tenantRepository = dataSource.getRepository(Tenant);
    testTenant = tenantRepository.create({
      name: 'Test Garage E2E',
      display_name: 'Test Garage E2E',
    });
    await tenantRepository.save(testTenant);

    // Create test user
    const userRepository = dataSource.getRepository(User);
    const hashedPassword = await authService.hashPassword('TestPassword123!');
    testUser = userRepository.create({
      email: 'admin-e2e@garage.com',
      first_name: 'Admin',
      last_name: 'E2E',
      password: hashedPassword,
      role: UserRole.GARAGE_ADMIN,
      tenant_id: testTenant.id,
      is_active: true,
    });
    await userRepository.save(testUser);

    // Get starter plan
    const planRepository = dataSource.getRepository(SubscriptionPlan);
    starterPlan = await planRepository.findOne({
      where: { name: PlanName.STARTER },
    });
  }

  async function cleanupTestData() {
    // Clean up in reverse order due to foreign key constraints
    // First delete usage records, then billing cycles, then subscriptions, then audit logs, then users, then tenants
    await dataSource.query('DELETE FROM usage_records WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
    await dataSource.query('DELETE FROM billing_cycles WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
    await dataSource.getRepository(Subscription).delete({ tenantId: testTenant.id });
    await dataSource.query('DELETE FROM audit_logs WHERE tenant_id = $1', [testTenant.id]);
    await dataSource.getRepository(User).delete({ id: testUser.id });
    await dataSource.getRepository(Tenant).delete({ id: testTenant.id });
  }

  describe('/subscriptions/plans (GET)', () => {
    it('should return all available subscription plans', () => {
      return request(app.getHttpServer())
        .get('/subscriptions/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('displayName');
          expect(res.body[0]).toHaveProperty('priceMonthly');
          expect(res.body[0]).toHaveProperty('features');
        });
    });
  });

  describe('/subscriptions (POST)', () => {
    beforeEach(async () => {
      // Ensure clean state for each test
      await dataSource.query('DELETE FROM usage_records WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.query('DELETE FROM billing_cycles WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.getRepository(Subscription).delete({ tenantId: testTenant.id });
    });

    it('should create a new subscription', () => {
      const createSubscriptionDto = {
        planName: PlanName.STARTER,
        billingInterval: 'month',
        metadata: { source: 'e2e-test' },
      };

      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createSubscriptionDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.tenantId).toBe(testTenant.id);
          expect(res.body.planId).toBe(starterPlan.id);
          expect(res.body.status).toBe('trialing');
          expect(res.body.billingInterval).toBe('month');
        });
    });

    it('should not allow creating multiple subscriptions for same tenant', async () => {
      // First subscription should succeed
      const createSubscriptionDto = {
        planName: PlanName.STARTER,
        billingInterval: 'month',
      };

      await request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createSubscriptionDto)
        .expect(201);

      // Second subscription should fail
      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createSubscriptionDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('already has a subscription');
        });
    });

    it('should return 404 for invalid plan name', () => {
      const createSubscriptionDto = {
        planName: 'INVALID_PLAN',
        billingInterval: 'month',
      };

      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createSubscriptionDto)
        .expect(400); // Bad request due to validation
    });
  });

  describe('/subscriptions/current (GET)', () => {
    beforeEach(async () => {
      // Ensure clean state - remove any existing subscription
      await dataSource.query('DELETE FROM usage_records WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.query('DELETE FROM billing_cycles WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.getRepository(Subscription).delete({ tenantId: testTenant.id });
    });

    it('should return current subscription when it exists', async () => {
      // Create subscription first
      const createSubscriptionDto = {
        planName: PlanName.STARTER,
        billingInterval: 'month',
      };

      await request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createSubscriptionDto)
        .expect(201);

      // Then get current subscription
      return request(app.getHttpServer())
        .get('/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.tenantId).toBe(testTenant.id);
          expect(res.body).toHaveProperty('plan');
          expect(res.body.plan.name).toBe(PlanName.STARTER);
        });
    });

    it('should return null when no subscription exists', () => {
      return request(app.getHttpServer())
        .get('/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          // NestJS might serialize null as {} in some cases
          expect(res.body === null || Object.keys(res.body).length === 0).toBe(true);
        });
    });
  });

  describe('/subscriptions/:id (PATCH)', () => {
    let subscriptionId: string;

    beforeEach(async () => {
      // Clean state
      await dataSource.query('DELETE FROM usage_records WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.query('DELETE FROM billing_cycles WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.getRepository(Subscription).delete({ tenantId: testTenant.id });

      // Create subscription for testing
      const createResponse = await request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planName: PlanName.STARTER,
          billingInterval: 'month',
        });

      subscriptionId = createResponse.body.id;
    });

    it('should update subscription successfully', () => {
      const updateSubscriptionDto = {
        planName: PlanName.GROEI,
        cancelAtPeriodEnd: false,
        metadata: { updated: true },
      };

      return request(app.getHttpServer())
        .patch(`/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateSubscriptionDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(subscriptionId);
          expect(res.body.cancelAtPeriodEnd).toBe(false);
        });
    });

    it('should return 404 for non-existent subscription', () => {
      const updateSubscriptionDto = {
        planName: PlanName.GROEI,
      };

      return request(app.getHttpServer())
        .patch('/subscriptions/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateSubscriptionDto)
        .expect(404);
    });
  });

  describe('/subscriptions/usage/current-period (GET)', () => {
    beforeEach(async () => {
      // Clean state and create subscription
      await dataSource.query('DELETE FROM usage_records WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.query('DELETE FROM billing_cycles WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.getRepository(Subscription).delete({ tenantId: testTenant.id });

      await request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planName: PlanName.STARTER,
          billingInterval: 'month',
        });
    });

    it('should return current usage with limits and warnings', () => {
      return request(app.getHttpServer())
        .get('/subscriptions/usage/current-period')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('subscription');
          expect(res.body).toHaveProperty('usage');
          expect(res.body).toHaveProperty('limits');
          expect(res.body).toHaveProperty('warnings');
          expect(res.body.subscription).toHaveProperty('plan');
          expect(res.body.limits).toHaveProperty('cars');
          expect(res.body.limits).toHaveProperty('users');
          expect(res.body.limits).toHaveProperty('locations');
          expect(res.body.limits).toHaveProperty('features');
        });
    });
  });

  describe('/subscriptions/usage (POST)', () => {
    beforeEach(async () => {
      // Clean state and create subscription
      await dataSource.query('DELETE FROM usage_records WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.query('DELETE FROM billing_cycles WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)', [testTenant.id]);
      await dataSource.getRepository(Subscription).delete({ tenantId: testTenant.id });

      await request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planName: PlanName.STARTER,
          billingInterval: 'month',
        });
    });

    it('should record usage successfully', () => {
      const recordUsageDto = {
        metricType: 'cars_washed',
        quantity: 1,
        metadata: { washTaskId: 'wash-123' },
      };

      return request(app.getHttpServer())
        .post('/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recordUsageDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.metricType).toBe('cars_washed');
          expect(res.body.quantity).toBe(1);
          expect(res.body.metadata).toEqual({ washTaskId: 'wash-123' });
        });
    });

    it('should validate metric type', () => {
      const recordUsageDto = {
        metricType: 'invalid_metric',
        quantity: 1,
      };

      return request(app.getHttpServer())
        .post('/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recordUsageDto)
        .expect(400);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', () => {
      return request(app.getHttpServer())
        .get('/subscriptions/plans')
        .expect(401);
    });

    it('should reject invalid tokens', () => {
      return request(app.getHttpServer())
        .get('/subscriptions/plans')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
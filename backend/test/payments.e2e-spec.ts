import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { Tenant } from '../src/auth/entities/tenant.entity';
import { PaymentMethod } from '../src/payments/entities/payment-method.entity';
import { PaymentTransaction } from '../src/payments/entities/payment-transaction.entity';
import { AuthService } from '../src/auth/auth.service';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  let authToken: string;
  let testTenant: Tenant;
  let testUser: User;

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
      name: 'Test Garage Payment E2E',
      display_name: 'Test Garage Payment E2E',
    });
    await tenantRepository.save(testTenant);

    // Create test user
    const userRepository = dataSource.getRepository(User);
    const hashedPassword = await authService.hashPassword('TestPassword123!');
    testUser = userRepository.create({
      email: 'payment-admin-e2e@garage.com',
      first_name: 'Payment',
      last_name: 'Admin',
      password: hashedPassword,
      role: UserRole.GARAGE_ADMIN,
      tenant_id: testTenant.id,
      is_active: true,
    });
    await userRepository.save(testUser);
  }

  async function cleanupTestData() {
    // Clean up in reverse order due to foreign key constraints
    await dataSource.query('DELETE FROM payment_transactions WHERE tenant_id = $1', [testTenant.id]);
    await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);
    await dataSource.query('DELETE FROM audit_logs WHERE tenant_id = $1', [testTenant.id]);
    await dataSource.getRepository(User).delete({ id: testUser.id });
    await dataSource.getRepository(Tenant).delete({ id: testTenant.id });
  }

  describe('/payments/methods (GET)', () => {
    beforeEach(async () => {
      // Clean state
      await dataSource.query('DELETE FROM payment_transactions WHERE tenant_id = $1', [testTenant.id]);
      await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);
    });

    it('should return empty array when no payment methods exist', () => {
      return request(app.getHttpServer())
        .get('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('/payments/methods (POST)', () => {
    beforeEach(async () => {
      // Clean state
      await dataSource.query('DELETE FROM payment_transactions WHERE tenant_id = $1', [testTenant.id]);
      await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);
    });

    it('should create a payment method successfully', () => {
      const createPaymentMethodDto = {
        type: 'creditcard',
        details: { holderName: 'John Doe', last4: '1234' },
        isDefault: true,
        metadata: { holderName: 'John Doe', test: true },
      };

      return request(app.getHttpServer())
        .post('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentMethodDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe('creditcard');
          expect(res.body.isDefault).toBe(true);
          expect(res.body.metadata.holderName).toBe('John Doe');
          expect(res.body.tenantId).toBe(testTenant.id);
        });
    });

    it('should validate required fields', () => {
      const invalidDto = {
        // Missing required type and details fields
        isDefault: true,
      };

      return request(app.getHttpServer())
        .post('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should accept any payment method type (no strict validation)', () => {
      const validDto = {
        type: 'custom_type',
        details: { test: 'value' },
        isDefault: true,
      };

      return request(app.getHttpServer())
        .post('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe('custom_type');
        });
    });
  });

  describe('/payments/methods/:id (DELETE)', () => {
    let paymentMethodId: string;

    beforeEach(async () => {
      // Clean state and create payment method for testing
      await dataSource.query('DELETE FROM payment_transactions WHERE tenant_id = $1', [testTenant.id]);
      await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);

      const createResponse = await request(app.getHttpServer())
        .post('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'creditcard',
          details: { holderName: 'Test User', last4: '1234' },
          isDefault: false,
        });

      paymentMethodId = createResponse.body.id;
    });

    it('should delete payment method successfully', () => {
      return request(app.getHttpServer())
        .delete(`/payments/methods/${paymentMethodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent payment method', () => {
      return request(app.getHttpServer())
        .delete('/payments/methods/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/payments/charge (POST)', () => {
    let paymentMethodId: string;

    beforeEach(async () => {
      // Clean state and create payment method for testing
      await dataSource.query('DELETE FROM payment_transactions WHERE tenant_id = $1', [testTenant.id]);
      await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);

      const createResponse = await request(app.getHttpServer())
        .post('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'creditcard',
          details: { holderName: 'Test User', last4: '5678' },
          isDefault: true,
        });

      paymentMethodId = createResponse.body.id;
    });

    it('should process payment with specified payment method', () => {
      const processPaymentDto = {
        amount: 49.99,
        currency: 'EUR',
        description: 'Monthly subscription',
        paymentMethodId: paymentMethodId,
        metadata: { subscriptionId: 'sub-123' },
      };

      return request(app.getHttpServer())
        .post('/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(processPaymentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(parseFloat(res.body.amount)).toBe(49.99);
          expect(res.body.currency).toBe('EUR');
          expect(res.body.description).toBe('Monthly subscription');
          expect(res.body).toHaveProperty('tenantId');
          expect(res.body).toHaveProperty('status');
        });
    });

    it('should process payment with default payment method when none specified', () => {
      const processPaymentDto = {
        amount: 149.99,
        currency: 'EUR',
        description: 'Annual subscription',
      };

      return request(app.getHttpServer())
        .post('/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(processPaymentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(parseFloat(res.body.amount)).toBe(149.99);
          expect(res.body.currency).toBe('EUR');
          expect(res.body.description).toBe('Annual subscription');
          expect(res.body).toHaveProperty('tenantId');
        });
    });

    it('should validate required payment fields', () => {
      const invalidDto = {
        // Missing amount and currency
        description: 'Test payment',
      };

      return request(app.getHttpServer())
        .post('/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should validate positive amount', () => {
      const invalidDto = {
        amount: -10.00,
        currency: 'EUR',
        description: 'Invalid payment',
      };

      return request(app.getHttpServer())
        .post('/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should fail when no payment method is available', async () => {
      // Delete the payment method
      await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);

      const processPaymentDto = {
        amount: 49.99,
        currency: 'EUR',
        description: 'Test payment',
      };

      return request(app.getHttpServer())
        .post('/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(processPaymentDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Failed to process payment');
        });
    });
  });

  describe('/payments/transactions (GET)', () => {
    beforeEach(async () => {
      // Clean state
      await dataSource.query('DELETE FROM payment_transactions WHERE tenant_id = $1', [testTenant.id]);
      await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);
    });

    it('should return empty array when no transactions exist', () => {
      return request(app.getHttpServer())
        .get('/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should return transactions after processing payments', async () => {
      // Create payment method and process payment first
      const createMethodResponse = await request(app.getHttpServer())
        .post('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'creditcard',
          details: { holderName: 'Test User', last4: '9999' },
          isDefault: true,
        });

      await request(app.getHttpServer())
        .post('/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 49.99,
          currency: 'EUR',
          description: 'Test payment',
        });

      return request(app.getHttpServer())
        .get('/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0]).toHaveProperty('id');
          expect(parseFloat(res.body[0].amount)).toBe(49.99);
          expect(res.body[0].currency).toBe('EUR');
        });
    });
  });

  describe('/payments/transactions/:id (GET)', () => {
    let transactionId: string;

    beforeEach(async () => {
      // Clean state and create transaction for testing
      await dataSource.query('DELETE FROM payment_transactions WHERE tenant_id = $1', [testTenant.id]);
      await dataSource.query('DELETE FROM payment_methods WHERE tenant_id = $1', [testTenant.id]);

      // Create payment method
      await request(app.getHttpServer())
        .post('/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'creditcard',
          details: { holderName: 'Test User', last4: '7777' },
          isDefault: true,
        });

      // Process payment
      const processResponse = await request(app.getHttpServer())
        .post('/payments/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 49.99,
          currency: 'EUR',
          description: 'Test payment',
        });

      transactionId = processResponse.body.id;
    });

    it('should return specific transaction', () => {
      return request(app.getHttpServer())
        .get(`/payments/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(transactionId);
          expect(parseFloat(res.body.amount)).toBe(49.99);
          expect(res.body.currency).toBe('EUR');
        });
    });

    it('should return 404 for non-existent transaction', () => {
      return request(app.getHttpServer())
        .get('/payments/transactions/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', () => {
      return request(app.getHttpServer())
        .get('/payments/methods')
        .expect(401);
    });

    it('should reject invalid tokens', () => {
      return request(app.getHttpServer())
        .get('/payments/methods')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
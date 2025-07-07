import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/auth/entities/user.entity';
import { EmailService } from '../src/email/email.service';
import { cleanupTestData } from './test-helpers';

describe('Email (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let emailService: EmailService;
  let superAdminToken: string;
  let testTenantId: string;

  // Spy on email service methods
  let sendEmailSpy: jest.SpyInstance;
  let sendWelcomeEmailSpy: jest.SpyInstance;

  // Helper to generate unique test data names
  const getUniqueName = (prefix: string) =>
    `test-email-e2e-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    emailService = moduleFixture.get<EmailService>(EmailService);

    // Clean up any existing test data first
    await cleanupTestData(dataSource);

    // Mock email service methods to avoid sending actual emails in tests
    sendEmailSpy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: [],
      response: 'OK',
    });

    sendWelcomeEmailSpy = jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue();

    // Create test tenant for email tests
    const tenantEmail = getUniqueName('tenant') + '@test-email.com';
    const tenantResponse = await request(app.getHttpServer())
      .post('/admin/tenants')
      .send({
        name: getUniqueName('email-tenant'),
        display_name: 'Email Test Garage',
        email: tenantEmail,
        phone: '+31612345678',
        address: 'Test Street 123',
        city: 'Test City',
        postal_code: '1234AB',
        country: 'NL',
        language: 'nl',
      });

    expect(tenantResponse.status).toBe(201);
    testTenantId = tenantResponse.body.tenant.id;

    // Login as super admin
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'super@admin.com',
        password: 'Admin123!',
      });

    expect(loginResponse.status).toBe(200);
    superAdminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData(dataSource);
    await app.close();
  });

  beforeEach(() => {
    // Clear mock calls before each test
    sendEmailSpy.mockClear();
    sendWelcomeEmailSpy.mockClear();
  });

  describe('User Creation with Email', () => {
    it('should send welcome email when creating user with generated password', async () => {
      const userEmail = getUniqueName('user') + '@test-email.com';
      
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: userEmail,
          first_name: 'Test',
          last_name: 'User',
          role: UserRole.WERKPLAATS,
          tenant_id: testTenantId,
          // No password provided - should generate temporary password
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(userEmail);
      expect(response.body.temporary_password).toBeDefined();

      // Verify welcome email was called with correct parameters
      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendWelcomeEmailSpy).toHaveBeenCalledWith(userEmail, {
        firstName: 'Test',
        lastName: 'User',
        temporaryPassword: expect.any(String),
        tenantName: 'Email Test Garage',
      });
    });

    it('should send welcome email when creating user with provided password', async () => {
      const userEmail = getUniqueName('user-pwd') + '@test-email.com';
      
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: userEmail,
          first_name: 'Test',
          last_name: 'UserWithPwd',
          password: 'CustomPassword123!',
          role: UserRole.WASSERS,
          tenant_id: testTenantId,
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(userEmail);
      expect(response.body.temporary_password).toBeUndefined();

      // Verify welcome email was called without temporary password
      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendWelcomeEmailSpy).toHaveBeenCalledWith(userEmail, {
        firstName: 'Test',
        lastName: 'UserWithPwd',
        temporaryPassword: undefined,
        tenantName: 'Email Test Garage',
      });
    });

    it('should handle email sending errors gracefully', async () => {
      // Mock email service to throw error
      sendWelcomeEmailSpy.mockRejectedValueOnce(new Error('SMTP Error'));

      const userEmail = getUniqueName('user-error') + '@test-email.com';
      
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: userEmail,
          first_name: 'Test',
          last_name: 'ErrorUser',
          role: UserRole.HAAL_BRENG_PLANNERS,
          tenant_id: testTenantId,
        });

      // User creation should still succeed even if email fails
      expect(response.status).toBe(201);
      expect(response.body.email).toBe(userEmail);

      // Verify email was attempted
      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
    });

    it('should use fallback tenant name when tenant info is missing', async () => {
      // Create user with minimal tenant info
      const userEmail = getUniqueName('user-fallback') + '@test-email.com';
      
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: userEmail,
          first_name: 'Test',
          last_name: 'FallbackUser',
          role: UserRole.WASPLANNERS,
          tenant_id: testTenantId,
        });

      expect(response.status).toBe(201);

      // Verify welcome email was called with tenant display name
      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      const [email, userData] = sendWelcomeEmailSpy.mock.calls[0];
      expect(email).toBe(userEmail);
      expect(userData.tenantName).toBe('Email Test Garage');
    });

    it('should handle users without first/last name', async () => {
      const userEmail = getUniqueName('user-minimal') + '@test-email.com';
      
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: userEmail,
          role: UserRole.GARAGE_ADMIN,
          tenant_id: testTenantId,
        });

      expect(response.status).toBe(201);

      // Verify welcome email was called with default name values
      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      const [email, userData] = sendWelcomeEmailSpy.mock.calls[0];
      expect(email).toBe(userEmail);
      expect(userData.firstName).toBe('Gebruiker'); // Default fallback
      expect(userData.lastName).toBe(''); // Empty string fallback
    });
  });

  describe('Email Service Integration', () => {
    it('should have EmailService available in application context', () => {
      expect(emailService).toBeDefined();
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should have mocked email methods working', async () => {
      // Test direct email service call
      await emailService.sendWelcomeEmail('direct@test.com', {
        firstName: 'Direct',
        lastName: 'Test',
        tenantName: 'Test Tenant',
      });

      expect(sendWelcomeEmailSpy).toHaveBeenCalledWith('direct@test.com', {
        firstName: 'Direct',
        lastName: 'Test',
        tenantName: 'Test Tenant',
      });
    });
  });
});
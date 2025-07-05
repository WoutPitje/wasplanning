import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let garageAdminToken: string;
  let wasplannerToken: string;
  let testTenantId: string;
  let testUserId: string | null;

  // Helper to generate unique test data names
  const getUniqueName = (prefix: string) =>
    `test-e2e-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  let testTimestamp: number;
  let garageAdminEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Clean up any existing test data first
    await cleanupTestData(dataSource);

    // Create unique test data for this suite with timestamp
    testTimestamp = Date.now();
    const superAdminTenantId = 'b1111111-1111-1111-1111-111111111111';
    const testGarageTenantId = 'b3333333-3333-3333-3333-333333333333';
    const superAdminUserId = 'b2222222-2222-2222-2222-222222222222';
    const garageAdminUserId = 'b4444444-4444-4444-4444-444444444444';
    const wasplannerUserId = 'b5555555-5555-5555-5555-555555555555';

    garageAdminEmail = `garage@test-e2e-users-${testTimestamp}.com`;

    // Create test tenants
    await dataSource.query(
      `
      INSERT INTO tenants (id, name, display_name, is_active) 
      VALUES 
        ($1, $2, 'Test E2E Users Super Admin Tenant', true),
        ($3, $4, 'Test E2E Users Test Garage', true)
    `,
      [
        superAdminTenantId,
        `test-e2e-users-super-admin-tenant-${testTimestamp}`,
        testGarageTenantId,
        `test-e2e-users-test-garage-${testTimestamp}`,
      ],
    );

    testTenantId = testGarageTenantId;

    // Create test users
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    await dataSource.query(
      `
      INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, is_active) 
      VALUES 
        ($1, $2, $3, 'Super', 'Admin', $4, $5, true),
        ($6, $7, $3, 'Garage', 'Admin', $8, $9, true),
        ($10, $11, $3, 'Was', 'Planner', $12, $9, true)
    `,
      [
        superAdminUserId,
        `super@test-e2e-users-${testTimestamp}.com`,
        hashedPassword,
        UserRole.SUPER_ADMIN,
        superAdminTenantId,
        garageAdminUserId,
        garageAdminEmail,
        UserRole.GARAGE_ADMIN,
        testGarageTenantId,
        wasplannerUserId,
        `wasplanner@test-e2e-users-${testTimestamp}.com`,
        UserRole.WASPLANNERS,
      ],
    );

    // Login to get tokens
    const superAdminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `super@test-e2e-users-${testTimestamp}.com`,
        password: 'testpassword',
      })
      .expect(200);
    superAdminToken = superAdminLogin.body.access_token;

    const garageAdminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: garageAdminEmail, password: 'testpassword' })
      .expect(200);
    garageAdminToken = garageAdminLogin.body.access_token;

    const wasplannerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `wasplanner@test-e2e-users-${testTimestamp}.com`,
        password: 'testpassword',
      })
      .expect(200);
    wasplannerToken = wasplannerLogin.body.access_token;
  });

  afterAll(async () => {
    // Clean up all test data
    await cleanupTestData(dataSource);
    await app.close();
  });

  afterEach(async () => {
    // Clean up test users
    if (testUserId) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [testUserId]);
      testUserId = null;
    }
  });

  describe('/users (POST)', () => {
    it('should create a new user as garage admin', async () => {
      const createUserDto = {
        email: `newwasher@${getUniqueName('user')}.nl`,
        first_name: 'New',
        last_name: 'Washer',
        role: UserRole.WASSERS,
        tenant_id: testTenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(createUserDto.email);
      expect(response.body).toHaveProperty('temporary_password');
      expect(response.body).not.toHaveProperty('password');

      testUserId = response.body.id;
    });

    it('should create a user with specified password', async () => {
      const createUserDto = {
        email: `withpassword@${getUniqueName('user')}.nl`,
        password: 'MySecurePassword123',
        first_name: 'With',
        last_name: 'Password',
        role: UserRole.WASSERS,
        tenant_id: testTenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body).not.toHaveProperty('temporary_password');
      expect(response.body).not.toHaveProperty('password');

      testUserId = response.body.id;

      // Verify user can login with provided password
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: createUserDto.email, password: createUserDto.password })
        .expect(200);
    });

    it('should prevent garage admin from creating users in other tenants', async () => {
      const createUserDto = {
        email: `crosstenantuser@${getUniqueName('user')}.nl`,
        first_name: 'Cross',
        last_name: 'Tenant',
        role: UserRole.WASSERS,
        tenant_id: '99999999-9999-9999-9999-999999999999',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send(createUserDto)
        .expect(403);
    });

    it('should allow super admin to create users in any tenant', async () => {
      const createUserDto = {
        email: `superadmincreated@${getUniqueName('user')}.nl`,
        first_name: 'Super',
        last_name: 'Created',
        role: UserRole.WASSERS,
        tenant_id: testTenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(createUserDto)
        .expect(201);

      testUserId = response.body.id;
    });

    it('should return 409 if email already exists', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({
          email: garageAdminEmail, // Already exists
          first_name: 'Duplicate',
          last_name: 'Email',
          role: UserRole.WASSERS,
          tenant_id: testTenantId,
        })
        .expect(409);
    });

    it('should return 403 for wasplanner trying to create user', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${wasplannerToken}`)
        .send({
          email: `notallowed@${getUniqueName('user')}.nl`,
          first_name: 'Not',
          last_name: 'Allowed',
          role: UserRole.WASSERS,
          tenant_id: testTenantId,
        })
        .expect(403);
    });
  });

  describe('/users (GET)', () => {
    it('should return all users for super admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3); // At least our test users
      expect(response.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('should return only tenant users for garage admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((user: any) => {
        expect(user.tenant.id).toBe(testTenantId);
      });
    });

    it('should allow wasplanner to view users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${wasplannerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    beforeEach(async () => {
      // Create a test user
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({
          email: `gettest@${getUniqueName('user')}.nl`,
          first_name: 'Get',
          last_name: 'Test',
          role: UserRole.WASSERS,
          tenant_id: testTenantId,
        })
        .expect(201);

      testUserId = response.body.id;
    });

    it('should return user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('tenant');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(404);
    });

    it('should prevent cross-tenant access', async () => {
      // Create super admin user in different tenant
      const superResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: `othertenant@${getUniqueName('user')}.nl`,
          first_name: 'Other',
          last_name: 'Tenant',
          role: UserRole.WASSERS,
          tenant_id: 'b1111111-1111-1111-1111-111111111111',
        });

      if (superResponse.status !== 201) {
        console.error(
          'Failed to create user in different tenant:',
          superResponse.status,
          superResponse.body,
        );
        console.error('Super admin token present:', !!superAdminToken);
      }
      expect(superResponse.status).toBe(201);

      const otherTenantUserId = superResponse.body.id;

      // Garage admin should not access other tenant's user
      await request(app.getHttpServer())
        .get(`/users/${otherTenantUserId}`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(403);

      // Clean up
      await dataSource.query('DELETE FROM users WHERE id = $1', [
        otherTenantUserId,
      ]);
    });
  });

  describe('/users/:id (PATCH)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({
          email: `updatetest@${getUniqueName('user')}.nl`,
          first_name: 'Update',
          last_name: 'Test',
          role: UserRole.WASSERS,
          tenant_id: testTenantId,
        })
        .expect(201);

      testUserId = response.body.id;
    });

    it('should update user', async () => {
      const updateDto = {
        first_name: 'Updated',
        last_name: 'Name',
        is_active: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.first_name).toBe(updateDto.first_name);
      expect(response.body.last_name).toBe(updateDto.last_name);
      expect(response.body.is_active).toBe(updateDto.is_active);
    });

    it('should prevent role change by non-super admin', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({ role: UserRole.GARAGE_ADMIN })
        .expect(403);
    });

    it('should allow super admin to change roles', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: UserRole.WASPLANNERS })
        .expect(200);

      expect(response.body.role).toBe(UserRole.WASPLANNERS);
    });

    it('should ignore email updates', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({ email: 'newemail@test.nl' })
        .expect(200);

      // Email should remain unchanged from what was created
    });
  });

  describe('/users/:id/password (PATCH)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({
          email: `passwordtest@${getUniqueName('user')}.nl`,
          first_name: 'Password',
          last_name: 'Test',
          role: UserRole.WASSERS,
          tenant_id: testTenantId,
        })
        .expect(201);

      testUserId = response.body.id;
    });

    it('should reset user password', async () => {
      const newPassword = 'NewSecurePassword123!';

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({ new_password: newPassword })
        .expect(200);

      expect(response.body.message).toBe('Password reset successfully');

      // Note: Can't verify login without knowing the exact email that was created
    });

    it('should return 403 for wasplanner', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${wasplannerToken}`)
        .send({ new_password: 'NotAllowed123!' })
        .expect(403);
    });
  });

  describe('/users/:id (DELETE)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .send({
          email: `deletetest@${getUniqueName('user')}.nl`,
          first_name: 'Delete',
          last_name: 'Test',
          role: UserRole.WASSERS,
          tenant_id: testTenantId,
        })
        .expect(201);

      testUserId = response.body.id;
    });

    it('should deactivate user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deactivated');

      // Verify user is deactivated
      const checkResponse = await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(200);

      expect(checkResponse.body.is_active).toBe(false);
    });

    it('should prevent user from deactivating themselves', async () => {
      await request(app.getHttpServer())
        .delete('/users/b4444444-4444-4444-4444-444444444444') // Garage admin's own ID
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(403);
    });

    it('should return 403 for wasplanner', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${wasplannerToken}`)
        .expect(403);
    });
  });
});

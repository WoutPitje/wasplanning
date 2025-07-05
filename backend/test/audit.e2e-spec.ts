import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/auth/entities/user.entity';

describe('Audit Endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  let usersService: UsersService;
  let superAdminToken: string;
  let garageAdminToken: string;
  let regularUserToken: string;
  let tenantId: string;
  let uniqueId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure validation pipe to transform query params
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
    usersService = app.get(UsersService);

    // Create test tenant with unique name
    uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
    const tenant = await dataSource.query(
      `INSERT INTO tenants (name, display_name, is_active) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [`test-audit-${uniqueId}`, 'Test Audit Garage', true],
    );
    tenantId = tenant[0].id;

    // Create test users with unique emails
    const superAdmin = await usersService.create({
      email: `superadmin-${uniqueId}@test.com`,
      password: 'Test123!',
      first_name: 'Super',
      last_name: 'Admin',
      role: UserRole.SUPER_ADMIN,
      tenant_id: tenantId,
    });

    const garageAdmin = await usersService.create({
      email: `garageadmin-${uniqueId}@test.com`,
      password: 'Test123!',
      first_name: 'Garage',
      last_name: 'Admin',
      role: UserRole.GARAGE_ADMIN,
      tenant_id: tenantId,
    });

    const regularUser = await usersService.create({
      email: `user-${uniqueId}@test.com`,
      password: 'Test123!',
      first_name: 'Regular',
      last_name: 'User',
      role: UserRole.WERKPLAATS,
      tenant_id: tenantId,
    });

    // Get tokens by logging in with credentials
    let response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `superadmin-${uniqueId}@test.com`, password: 'Test123!' });
    superAdminToken = response.body.access_token;

    response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `garageadmin-${uniqueId}@test.com`, password: 'Test123!' });
    garageAdminToken = response.body.access_token;

    response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `user-${uniqueId}@test.com`, password: 'Test123!' });
    regularUserToken = response.body.access_token;

    // Generate some audit logs
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `superadmin-${uniqueId}@test.com`, password: 'Test123!' });

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: `newuser-${uniqueId}@test.com`,
        password: 'Test123!',
        first_name: 'New',
        last_name: 'User',
        role: UserRole.WASSERS,
        tenant_id: tenantId,
      });
  });

  afterAll(async () => {
    // Clean up test data
    await dataSource.query('DELETE FROM audit_logs WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    
    await app.close();
  });

  describe('/audit (GET)', () => {
    it('should return audit logs for super admin', () => {
      return request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 20);
          expect(res.body).toHaveProperty('pages');
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.items.length).toBeGreaterThan(0);
        });
    });

    it('should return audit logs for garage admin', () => {
      return request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should reject regular users', () => {
      return request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/audit')
        .expect(401);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/audit?page=1&limit=5')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
          expect(res.body.items.length).toBeLessThanOrEqual(5);
        });
    });

    it('should support filtering by action', () => {
      return request(app.getHttpServer())
        .get('/audit?action=auth.login')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          const items = res.body.items;
          if (items.length > 0) {
            expect(items.every((item: any) => item.action === 'auth.login')).toBe(true);
          }
        });
    });

    it('should support filtering by resource type', () => {
      return request(app.getHttpServer())
        .get('/audit?resource_type=user')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          const items = res.body.items;
          if (items.length > 0) {
            expect(items.every((item: any) => item.resource_type === 'user')).toBe(true);
          }
        });
    });

    it('should support date filtering', () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      return request(app.getHttpServer())
        .get(`/audit?start_date=${today}&end_date=${tomorrow}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should support sorting', () => {
      return request(app.getHttpServer())
        .get('/audit?sort=action&order=ASC')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          const items = res.body.items;
          if (items.length > 1) {
            // Check if sorted
            for (let i = 1; i < items.length; i++) {
              expect(items[i].action >= items[i - 1].action).toBe(true);
            }
          }
        });
    });
  });

  describe('/audit/stats (GET)', () => {
    it('should return audit statistics', () => {
      return request(app.getHttpServer())
        .get('/audit/stats')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('action');
            expect(res.body[0]).toHaveProperty('count');
          }
        });
    });

    it('should reject regular users', () => {
      return request(app.getHttpServer())
        .get('/audit/stats')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('/audit/users/:userId (GET)', () => {
    it('should return user activity', async () => {
      // Get a user ID from the database
      const users = await dataSource.query(
        'SELECT id FROM users WHERE tenant_id = $1 LIMIT 1',
        [tenantId],
      );
      const userId = users[0].id;

      return request(app.getHttpServer())
        .get(`/audit/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should validate UUID format', () => {
      return request(app.getHttpServer())
        .get('/audit/users/invalid-uuid')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });

    it('should reject regular users', async () => {
      const users = await dataSource.query(
        'SELECT id FROM users WHERE tenant_id = $1 LIMIT 1',
        [tenantId],
      );
      const userId = users[0].id;

      return request(app.getHttpServer())
        .get(`/audit/users/${userId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('/audit/export (GET)', () => {
    it('should export audit logs as CSV', () => {
      return request(app.getHttpServer())
        .get('/audit/export')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .expect((res) => {
          expect(res.headers['content-disposition']).toContain('attachment');
          expect(res.headers['content-disposition']).toContain('.csv');
          expect(res.text).toContain('Date,Time,User,Action');
        });
    });

    it('should support filters in export', () => {
      return request(app.getHttpServer())
        .get('/audit/export?action=auth.login')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .expect((res) => {
          expect(res.text).toContain('Date,Time,User,Action');
        });
    });

    it('should reject regular users', () => {
      return request(app.getHttpServer())
        .get('/audit/export')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('Tenant isolation', () => {
    it('should only return logs for the user tenant', async () => {
      // Create another tenant with unique name
      const otherUniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
      const otherTenant = await dataSource.query(
        `INSERT INTO tenants (name, display_name, is_active) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [`other-audit-${otherUniqueId}`, 'Other Garage', true],
      );
      const otherTenantId = otherTenant[0].id;

      // Create a user in the other tenant
      const otherUser = await usersService.create({
        email: `other-${otherUniqueId}@test.com`,
        password: 'Test123!',
        first_name: 'Other',
        last_name: 'User',
        role: UserRole.GARAGE_ADMIN,
        tenant_id: otherTenantId,
      });

      // Login as the other tenant's admin
      const otherAuthResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `other-${otherUniqueId}@test.com`, password: 'Test123!' });
      const otherToken = otherAuthResponse.body.access_token;

      // Perform action in other tenant
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `other-${otherUniqueId}@test.com`, password: 'Test123!' });

      // Check that original tenant admin can't see other tenant's logs
      const response = await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${garageAdminToken}`)
        .expect(200);

      const items = response.body.items;
      const otherTenantLogs = items.filter((item: any) => 
        item.user && item.user.email === `other-${otherUniqueId}@test.com`
      );
      
      expect(otherTenantLogs.length).toBe(0);

      // Clean up
      await dataSource.query('DELETE FROM audit_logs WHERE tenant_id = $1', [otherTenantId]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [otherTenantId]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [otherTenantId]);
    });
  });
});
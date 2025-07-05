import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let tenantId: string | null;

  // Helper to generate unique test data names
  const getUniqueName = (prefix: string) => `test-e2e-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    
    // Clean up any existing test data first
    await cleanupTestData(dataSource);
    
    // Use unique IDs for this test suite with timestamp to avoid conflicts
    const timestamp = Date.now();
    const adminTenantId = 'a1111111-1111-1111-1111-111111111111';
    const adminUserId = 'a2222222-2222-2222-2222-222222222222';
    
    // Create super admin tenant and user
    await dataSource.query(`
      INSERT INTO tenants (id, name, display_name, is_active) 
      VALUES ($1, $2, 'Test E2E Super Admin Tenant', true)
    `, [adminTenantId, `test-e2e-super-admin-tenant-${timestamp}`]);
    
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    await dataSource.query(`
      INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, is_active) 
      VALUES ($1, $2, $3, 'Super', 'Admin', $4, $5, true)
    `, [adminUserId, `super@test-e2e-admin-${timestamp}.com`, hashedPassword, UserRole.SUPER_ADMIN, adminTenantId]);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `super@test-e2e-admin-${timestamp}.com`, password: 'testpassword' })
      .expect(200);

    superAdminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up all test data
    await cleanupTestData(dataSource);
    await app.close();
  });

  afterEach(async () => {
    // Clean up test tenants and their users
    if (tenantId) {
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      tenantId = null;
    }
  });

  describe('/admin/tenants (POST)', () => {
    it('should create a new tenant with admin user', async () => {
      // First verify we have a valid super admin token
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      expect(profileResponse.body.role).toBe(UserRole.SUPER_ADMIN);
      const timestamp = Date.now();
      const createTenantDto = {
        name: `test-e2e-garage-${timestamp}`,
        display_name: `Test Garage E2E ${timestamp}`,
        logo_url: 'https://example.com/logo.png',
        admin_email: `admin@test-e2e-${timestamp}.nl`,
        admin_first_name: 'Test',
        admin_last_name: 'Admin',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(createTenantDto)
        .expect(201);

      expect(response.body).toHaveProperty('tenant');
      expect(response.body).toHaveProperty('admin_user');
      expect(response.body).toHaveProperty('instructions');
      expect(response.body.tenant.name).toBe(createTenantDto.name);
      expect(response.body.admin_user.email).toBe(createTenantDto.admin_email);
      expect(response.body.admin_user).toHaveProperty('temporary_password');

      tenantId = response.body.tenant.id;
    });

    it('should return 409 if tenant name already exists', async () => {
      const tenantName = getUniqueName('duplicate');
      const createTenantDto = {
        name: tenantName,
        display_name: 'Duplicate Garage',
        admin_email: `admin1@${tenantName}.nl`,
        admin_first_name: 'Admin',
        admin_last_name: 'One',
      };

      // Create first tenant
      const firstResponse = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(createTenantDto)
        .expect(201);

      tenantId = firstResponse.body.tenant.id;

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...createTenantDto,
          admin_email: `admin2@${tenantName}.nl`,
        })
        .expect(409);
    });

    it('should return 409 if admin email already exists', async () => {
      const baseName = getUniqueName('dupemail');
      const adminEmail = `admin@${baseName}.nl`;
      const createTenantDto = {
        name: baseName,
        display_name: 'Duplicate Email Garage',
        admin_email: adminEmail,
        admin_first_name: 'Admin',
        admin_last_name: 'One',
      };

      // Create first tenant
      const firstResponse = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(createTenantDto)
        .expect(201);

      tenantId = firstResponse.body.tenant.id;

      // Try to create with duplicate email
      await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...createTenantDto,
          name: getUniqueName('different'),
        })
        .expect(409);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/admin/tenants')
        .send({
          name: getUniqueName('test'),
          display_name: 'Test Garage',
          admin_email: `admin@${getUniqueName('test')}.nl`,
          admin_first_name: 'Test',
          admin_last_name: 'Admin',
        })
        .expect(401);
    });
  });

  describe('/admin/tenants (GET)', () => {
    it('should return all tenants', async () => {
      // Create a test tenant first
      const createResponse = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: getUniqueName('list'),
          display_name: 'List Test Garage',
          admin_email: `admin@${getUniqueName('list')}.nl`,
          admin_first_name: 'List',
          admin_last_name: 'Test',
        })
        .expect(201);

      tenantId = createResponse.body.tenant.id;

      const response = await request(app.getHttpServer())
        .get('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const testTenant = response.body.find(t => t.id === tenantId);
      expect(testTenant).toBeDefined();
      expect(testTenant).toBeDefined();
    });
  });

  describe('/admin/tenants/:id (GET)', () => {
    it('should return tenant with users', async () => {
      // Create a test tenant first
      const createResponse = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: getUniqueName('detail'),
          display_name: 'Detail Test Garage',
          admin_email: `admin@${getUniqueName('detail')}.nl`,
          admin_first_name: 'Detail',
          admin_last_name: 'Test',
        })
        .expect(201);

      tenantId = createResponse.body.tenant.id;

      const response = await request(app.getHttpServer())
        .get(`/admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', tenantId);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBe(1); // Should have the admin user
      expect(response.body.users[0]).not.toHaveProperty('password'); // Password should be excluded
    });

    it('should return 404 for non-existent tenant', async () => {
      await request(app.getHttpServer())
        .get('/admin/tenants/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });

  describe('/admin/tenants/:id/stats (GET)', () => {
    it('should return tenant statistics', async () => {
      // Create a test tenant first
      const createResponse = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: getUniqueName('stats'),
          display_name: 'Stats Test Garage',
          admin_email: `admin@${getUniqueName('stats')}.nl`,
          admin_first_name: 'Stats',
          admin_last_name: 'Test',
        })
        .expect(201);

      tenantId = createResponse.body.tenant.id;

      const response = await request(app.getHttpServer())
        .get(`/admin/tenants/${tenantId}/stats`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tenant_id', tenantId);
      expect(response.body).toHaveProperty('tenant_name');
      expect(response.body).toHaveProperty('total_users', 1);
      expect(response.body).toHaveProperty('active_users', 1);
      expect(response.body).toHaveProperty('users_by_role');
      expect(response.body.users_by_role).toHaveProperty(UserRole.GARAGE_ADMIN, 1);
    });
  });

  describe('/admin/tenants/:id (PATCH)', () => {
    it('should update tenant', async () => {
      // Create a test tenant first
      const createResponse = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: getUniqueName('update'),
          display_name: 'Update Test Garage',
          admin_email: `admin@${getUniqueName('update')}.nl`,
          admin_first_name: 'Update',
          admin_last_name: 'Test',
        })
        .expect(201);

      tenantId = createResponse.body.tenant.id;

      const updateDto = {
        display_name: 'Updated Garage Name',
        logo_url: 'https://example.com/new-logo.png',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.display_name).toBe(updateDto.display_name);
      expect(response.body.logo_url).toBe(updateDto.logo_url);
    });
  });

  describe('/admin/tenants/:id (DELETE)', () => {
    it('should deactivate tenant', async () => {
      // Create a test tenant first
      const createResponse = await request(app.getHttpServer())
        .post('/admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: getUniqueName('delete'),
          display_name: 'Delete Test Garage',
          admin_email: `admin@${getUniqueName('delete')}.nl`,
          admin_first_name: 'Delete',
          admin_last_name: 'Test',
        })
        .expect(201);

      tenantId = createResponse.body.tenant.id;

      const response = await request(app.getHttpServer())
        .delete(`/admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deactivated');

      // Verify tenant is deactivated
      const checkResponse = await request(app.getHttpServer())
        .get(`/admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(checkResponse.body.is_active).toBe(false);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthModule } from '../src/auth/auth.module';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { Tenant } from '../src/auth/entities/tenant.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let tenantRepository: Repository<Tenant>;
  let testTenant: Tenant;
  let testUser: User;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432'),
          username: process.env.DATABASE_USERNAME || 'wasplanning',
          password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
          database: process.env.DATABASE_NAME || 'wasplanning_test',
          entities: [User, Tenant],
          synchronize: true, // Only for testing
          dropSchema: true, // Clean database for each test run
        }),
        JwtModule.register({
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    tenantRepository = moduleFixture.get<Repository<Tenant>>(
      getRepositoryToken(Tenant),
    );

    await app.init();
  });

  beforeEach(async () => {
    // Clean up database - delete all records
    await userRepository.createQueryBuilder().delete().execute();
    await tenantRepository.createQueryBuilder().delete().execute();

    // Create test tenant
    testTenant = tenantRepository.create({
      name: 'test-garage',
      display_name: 'Test Garage',
      is_active: true,
      language: 'nl',
    });
    await tenantRepository.save(testTenant);

    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    testUser = userRepository.create({
      email: 'test@example.com',
      password: hashedPassword,
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.WERKPLAATS,
      tenant_id: testTenant.id,
      is_active: true,
    });
    await userRepository.save(testUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        tenant: {
          id: testTenant.id,
          name: testTenant.name,
          display_name: testTenant.display_name,
          language: 'nl',
        },
      });

      accessToken = response.body.access_token;
    });

    it('should fail with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword',
        })
        .expect(401);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testpassword',
        })
        .expect(401); // LocalAuthGuard returns 401 for any auth failure
    });

    it('should fail with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(401); // LocalAuthGuard returns 401 for any auth failure
    });

    it('should fail with inactive user', async () => {
      await userRepository.update(testUser.id, { is_active: false });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        })
        .expect(401);
    });

    it('should update last_login on successful login', async () => {
      const beforeLogin = new Date();

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        })
        .expect(200);

      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.last_login).toBeDefined();
      expect(updatedUser!.last_login.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime(),
      );
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });

      accessToken = loginResponse.body.access_token;
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      // Access token should be valid (we can decode it)
      expect(response.body.access_token).toBeTruthy();
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        })
        .expect(401);
    });

    it('should fail with missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });

      accessToken = loginResponse.body.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        tenant: {
          id: testTenant.id,
          name: testTenant.name,
          display_name: testTenant.display_name,
          language: 'nl',
        },
      });
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Multi-tenant isolation', () => {
    let anotherTenant: Tenant;
    let anotherUser: User;

    beforeEach(async () => {
      // Create another tenant and user
      anotherTenant = tenantRepository.create({
        name: 'another-garage',
        display_name: 'Another Garage',
        is_active: true,
        language: 'nl',
      });
      await tenantRepository.save(anotherTenant);

      const hashedPassword = await bcrypt.hash('anotherpassword', 12);
      anotherUser = userRepository.create({
        email: 'another@example.com',
        password: hashedPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        role: UserRole.GARAGE_ADMIN,
        tenant_id: anotherTenant.id,
        is_active: true,
      });
      await userRepository.save(anotherUser);
    });

    it('should maintain tenant context in JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'another@example.com',
          password: 'anotherpassword',
        })
        .expect(200);

      expect(response.body.user.tenant).toEqual({
        id: anotherTenant.id,
        name: anotherTenant.name,
        display_name: anotherTenant.display_name,
        language: 'nl',
      });
    });

    it('should isolate users by tenant', async () => {
      // Login as user from first tenant
      const firstResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });

      // Login as user from second tenant
      const secondResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'another@example.com',
          password: 'anotherpassword',
        });

      expect(firstResponse.body.user.tenant.id).not.toBe(
        secondResponse.body.user.tenant.id,
      );
    });
  });

  describe('Role-based access', () => {
    it('should handle different user roles', async () => {
      const roles = [
        UserRole.WERKPLAATS,
        UserRole.WASSERS,
        UserRole.HAAL_BRENG_PLANNERS,
        UserRole.WASPLANNERS,
        UserRole.GARAGE_ADMIN,
        UserRole.SUPER_ADMIN,
      ];

      for (const role of roles) {
        // Create user with specific role
        const hashedPassword = await bcrypt.hash('testpassword', 12);
        const roleUser = userRepository.create({
          email: `${role}@example.com`,
          password: hashedPassword,
          first_name: 'Test',
          last_name: 'User',
          role: role,
          tenant_id: testTenant.id,
          is_active: true,
        });
        await userRepository.save(roleUser);

        // Test login and profile access
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: `${role}@example.com`,
            password: 'testpassword',
          })
          .expect(200);

        const profileResponse = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
          .expect(200);

        expect(profileResponse.body.role).toBe(role);
      }
    });
  });

  describe('Impersonation', () => {
    let superAdminUser: User;
    let superAdminToken: string;
    let targetUser: User;

    beforeEach(async () => {
      // Create super admin user
      const superAdminPassword = await bcrypt.hash('superadminpass', 12);
      superAdminUser = userRepository.create({
        email: 'superadmin@example.com',
        password: superAdminPassword,
        first_name: 'Super',
        last_name: 'Admin',
        role: UserRole.SUPER_ADMIN,
        tenant_id: testTenant.id,
        is_active: true,
      });
      await userRepository.save(superAdminUser);

      // Create another regular user to impersonate
      const targetPassword = await bcrypt.hash('targetpass', 12);
      targetUser = userRepository.create({
        email: 'target@example.com',
        password: targetPassword,
        first_name: 'Target',
        last_name: 'User',
        role: UserRole.WERKPLAATS,
        tenant_id: testTenant.id,
        is_active: true,
      });
      await userRepository.save(targetUser);

      // Get super admin token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'superadmin@example.com',
          password: 'superadminpass',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('access_token');
      expect(loginResponse.body.user.role).toBe(UserRole.SUPER_ADMIN);

      superAdminToken = loginResponse.body.access_token;
    });

    describe('/auth/impersonate/:userId (POST)', () => {
      it('should successfully impersonate a user as super admin', async () => {
        // First verify we have a valid super admin token
        const profileResponse = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);

        expect(profileResponse.body.role).toBe(UserRole.SUPER_ADMIN);

        const response = await request(app.getHttpServer())
          .post(`/auth/impersonate/${targetUser.id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toEqual({
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
          tenant: {
            id: testTenant.id,
            name: testTenant.name,
            display_name: testTenant.display_name,
            language: 'nl',
          },
        });
        expect(response.body).toHaveProperty('impersonation');
        expect(response.body.impersonation).toEqual({
          is_impersonating: true,
          impersonator_id: superAdminUser.id,
          impersonator_email: superAdminUser.email,
        });
      });

      it('should fail when non-super admin tries to impersonate', async () => {
        // Login as regular user
        const regularLoginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'testpassword',
          });

        const regularToken = regularLoginResponse.body.access_token;

        await request(app.getHttpServer())
          .post(`/auth/impersonate/${targetUser.id}`)
          .set('Authorization', `Bearer ${regularToken}`)
          .expect(403);
      });

      it('should fail when trying to impersonate another super admin', async () => {
        // Create another super admin
        const anotherSuperAdminPassword = await bcrypt.hash(
          'anothersuperpass',
          12,
        );
        const anotherSuperAdmin = userRepository.create({
          email: 'anothersuperadmin@example.com',
          password: anotherSuperAdminPassword,
          first_name: 'Another',
          last_name: 'SuperAdmin',
          role: UserRole.SUPER_ADMIN,
          tenant_id: testTenant.id,
          is_active: true,
        });
        await userRepository.save(anotherSuperAdmin);

        await request(app.getHttpServer())
          .post(`/auth/impersonate/${anotherSuperAdmin.id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(403);
      });

      it('should fail when trying to impersonate non-existent user', async () => {
        const fakeUserId = '00000000-0000-0000-0000-000000000000';

        await request(app.getHttpServer())
          .post(`/auth/impersonate/${fakeUserId}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(404);
      });

      it('should fail when trying to impersonate inactive user', async () => {
        // Make target user inactive
        await userRepository.update(targetUser.id, { is_active: false });

        await request(app.getHttpServer())
          .post(`/auth/impersonate/${targetUser.id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(403);
      });
    });

    describe('/auth/stop-impersonation (POST)', () => {
      it('should successfully stop impersonation', async () => {
        // First impersonate
        const impersonateResponse = await request(app.getHttpServer())
          .post(`/auth/impersonate/${targetUser.id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(201);

        const impersonatedToken = impersonateResponse.body.access_token;

        // Then stop impersonation
        const response = await request(app.getHttpServer())
          .post('/auth/stop-impersonation')
          .set('Authorization', `Bearer ${impersonatedToken}`)
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toEqual({
          id: superAdminUser.id,
          email: superAdminUser.email,
          role: superAdminUser.role,
          first_name: superAdminUser.first_name,
          last_name: superAdminUser.last_name,
          tenant: {
            id: testTenant.id,
            name: testTenant.name,
            display_name: testTenant.display_name,
            language: 'nl',
          },
        });
      });

      it('should fail when not impersonating', async () => {
        await request(app.getHttpServer())
          .post('/auth/stop-impersonation')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(403);
      });
    });
  });
});

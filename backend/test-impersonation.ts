import { Test } from '@nestjs/testing';
import { AuthService } from './src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './src/auth/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

async function testImpersonation() {
  // Mock user repository
  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // Mock JWT service
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,
      {
        provide: getRepositoryToken(User),
        useValue: mockUserRepository,
      },
      {
        provide: JwtService,
        useValue: mockJwtService,
      },
    ],
  }).compile();

  const authService = moduleRef.get<AuthService>(AuthService);

  // Test 1: Successful impersonation
  console.log('\nTest 1: Successful impersonation');
  const superAdmin = {
    id: 'super-admin-id',
    email: 'superadmin@example.com',
    role: UserRole.SUPER_ADMIN,
    is_active: true,
    tenant: {
      id: 'tenant-1',
      name: 'Tenant 1',
      display_name: 'Tenant One',
      language: 'nl',
    },
  };

  const targetUser = {
    id: 'target-user-id',
    email: 'user@example.com',
    role: UserRole.WASPLANNERS,
    is_active: true,
    first_name: 'Test',
    last_name: 'User',
    tenant: {
      id: 'tenant-2',
      name: 'Tenant 2',
      display_name: 'Tenant Two',
      language: 'en',
    },
  };

  mockUserRepository.findOne
    .mockResolvedValueOnce(superAdmin) // impersonator lookup
    .mockResolvedValueOnce(targetUser); // target user lookup

  const currentUser = {
    id: 'super-admin-id',
    email: 'superadmin@example.com',
    role: UserRole.SUPER_ADMIN,
  };

  try {
    const result = await authService.impersonateUser(currentUser, 'target-user-id');
    console.log('✓ Impersonation successful');
    console.log('  Access token created:', !!result.access_token);
    console.log('  Impersonation info included:', !!result.impersonation);
  } catch (error) {
    console.error('✗ Impersonation failed:', error.message);
  }

  // Test 2: Prevent nested impersonation
  console.log('\nTest 2: Prevent nested impersonation');
  const impersonatingUser = {
    id: 'target-user-id',
    email: 'user@example.com',
    role: UserRole.WASPLANNERS,
    impersonation: {
      is_impersonating: true,
      impersonator_id: 'super-admin-id',
    },
  };

  try {
    await authService.impersonateUser(impersonatingUser, 'another-user-id');
    console.error('✗ Should have thrown ForbiddenException');
  } catch (error) {
    if (error instanceof ForbiddenException && error.message === 'Cannot impersonate while already impersonating another user') {
      console.log('✓ Correctly prevented nested impersonation');
    } else {
      console.error('✗ Wrong error thrown:', error.message);
    }
  }

  // Test 3: Only SUPER_ADMIN can impersonate
  console.log('\nTest 3: Only SUPER_ADMIN can impersonate');
  const regularUser = {
    id: 'regular-user-id',
    email: 'regular@example.com',
    role: UserRole.GARAGE_ADMIN,
    is_active: true,
    tenant: {
      id: 'tenant-1',
      name: 'Tenant 1',
      display_name: 'Tenant One',
      language: 'nl',
    },
  };

  mockUserRepository.findOne.mockReset();
  mockUserRepository.findOne.mockResolvedValueOnce(regularUser);

  const regularCurrentUser = {
    id: 'regular-user-id',
    email: 'regular@example.com',
    role: UserRole.GARAGE_ADMIN,
  };

  try {
    await authService.impersonateUser(regularCurrentUser, 'target-user-id');
    console.error('✗ Should have thrown ForbiddenException');
  } catch (error) {
    if (error instanceof ForbiddenException && error.message === 'Only SUPER_ADMIN can impersonate users') {
      console.log('✓ Correctly prevented non-SUPER_ADMIN from impersonating');
    } else {
      console.error('✗ Wrong error thrown:', error.message);
    }
  }

  console.log('\nAll tests completed!');
  process.exit(0);
}

testImpersonation().catch(console.error);
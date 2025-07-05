import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../../auth/entities/tenant.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

export async function seedSuperAdmin(dataSource: DataSource): Promise<void> {
  const tenantRepository = dataSource.getRepository(Tenant);
  const userRepository = dataSource.getRepository(User);

  console.log('🌱 Seeding Super Admin...');

  // Check if super admin tenant already exists
 
  const existingSuperAdmin = await userRepository.findOne({
    where: { email: 'admin@wasplanning.nl' },
  });

  if (!existingSuperAdmin) {
    // Hash password
    const hashedPassword = await bcrypt.hash('WasAdmin123!', 12);

    // Create super admin user
    const superAdminUser = userRepository.create({
      email: 'admin@wasplanning.nl',
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: UserRole.SUPER_ADMIN,
      tenant_id: undefined,
      is_active: true,
    });

    await userRepository.save(superAdminUser);
    console.log('✅ Created Super Admin user');
    console.log('📧 Email: admin@wasplanning.nl');
    console.log('🔑 Password: WasAdmin123!');
  } else {
    console.log('⏭️  Super Admin user already exists');
    console.log('📧 Email: admin@wasplanning.nl');
    console.log('🔑 Password: WasAdmin123!');
  }

  console.log('🎉 Super Admin seeding completed!');
}

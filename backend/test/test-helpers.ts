import { DataSource } from 'typeorm';

export async function cleanupTestData(dataSource: DataSource) {
  // Delete all test data to ensure clean state
  // First delete audit logs to avoid foreign key constraint violations
  await dataSource.query(`
    DELETE FROM audit_logs 
    WHERE tenant_id IN (
      SELECT id FROM tenants 
      WHERE name LIKE 'test-e2e-%' 
         OR id IN (
           'a1111111-1111-1111-1111-111111111111',
           'b1111111-1111-1111-1111-111111111111',
           'b3333333-3333-3333-3333-333333333333'
         )
    )
  `);
  
  await dataSource.query(`
    DELETE FROM users 
    WHERE email LIKE '%@test-e2e-%' 
       OR tenant_id IN (
         'a1111111-1111-1111-1111-111111111111',
         'a2222222-2222-2222-2222-222222222222',
         'b1111111-1111-1111-1111-111111111111',
         'b3333333-3333-3333-3333-333333333333',
         'b2222222-2222-2222-2222-222222222222',
         'b4444444-4444-4444-4444-444444444444',
         'b5555555-5555-5555-5555-555555555555'
       )
  `);

  await dataSource.query(`
    DELETE FROM tenants 
    WHERE name LIKE 'test-e2e-%' 
       OR id IN (
         'a1111111-1111-1111-1111-111111111111',
         'b1111111-1111-1111-1111-111111111111',
         'b3333333-3333-3333-3333-333333333333'
       )
  `);
}

export function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
}

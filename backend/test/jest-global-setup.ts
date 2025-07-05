import { setupTestDatabase } from './test-setup';

export default async function globalSetup() {
  console.log('Running global test setup...');
  await setupTestDatabase();
}
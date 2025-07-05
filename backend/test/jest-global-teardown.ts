import { teardownTestDatabase } from './test-setup';

export default async function globalTeardown() {
  console.log('Running global test teardown...');
  await teardownTestDatabase();
}
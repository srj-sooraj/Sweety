const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  throw new Error('TEST_DATABASE_URL must be configured in .env before running tests.');
}

const parsedUrl = new URL(testDbUrl);
if (!parsedUrl.pathname.endsWith('_test')) {
  throw new Error(
    `Refusing to run tests against non-test database "${parsedUrl.pathname}". Expected a *_test database.`
  );
}

// Point Prisma exclusively at the isolated test database before importing app/db modules.
process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = 'test';

let schemaMigrated = false;

function ensureTestSchema() {
  if (schemaMigrated) return;
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'pipe',
  });
  schemaMigrated = true;
}

ensureTestSchema();

const request = require('supertest');
const { prisma, disconnectDb } = require('../config/db');
const { createApp } = require('../app');

const app = createApp();

async function resetTestDatabase() {
  await prisma.glucoseReading.deleteMany({});
  await prisma.user.deleteMany({});
}

async function registerTestUser(overrides = {}) {
  const payload = {
    name: overrides.name || 'Test User',
    email: overrides.email || `user_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`,
    password: overrides.password || 'Password123!',
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  return {
    res,
    user: res.body?.data?.user,
    token: res.body?.data?.token,
    credentials: payload,
  };
}

module.exports = {
  app,
  request,
  prisma,
  disconnectDb,
  resetTestDatabase,
  registerTestUser,
};

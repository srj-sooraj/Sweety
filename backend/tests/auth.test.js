const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const {
  app,
  request,
  prisma,
  disconnectDb,
  resetTestDatabase,
  registerTestUser,
} = require('./setup');

describe('Authentication API', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  after(async () => {
    await disconnectDb();
  });

  it('1. registers a new user, hashes password with bcrypt, and returns JWT', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'Jane.Doe@example.com',
      password: 'StrongPassword123',
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'jane.doe@example.com');
    assert.equal(res.body.data.user.password, undefined);

    const dbUser = await prisma.user.findUnique({ where: { email: 'jane.doe@example.com' } });
    assert.ok(dbUser);
    assert.notEqual(dbUser.password, 'StrongPassword123');
    assert.ok(dbUser.password.startsWith('$2'));
  });

  it('2. rejects duplicate email registration with 409', async () => {
    await registerTestUser({ email: 'duplicate@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Another User',
      email: 'DUPLICATE@example.com',
      password: 'Password123!',
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  it('3. logs in an existing user with valid credentials and allows /api/auth/me', async () => {
    await registerTestUser({
      name: 'Login User',
      email: 'login@example.com',
      password: 'MySecretPassword',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'MySecretPassword',
    });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.ok(loginRes.body.data.token);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.user.email, 'login@example.com');
  });

  it('4. rejects login with an incorrect password', async () => {
    await registerTestUser({
      email: 'wrongpass@example.com',
      password: 'CorrectPassword1',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpass@example.com',
      password: 'WrongPassword999',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid email or password/i);
  });

  it('5. blocks unauthorized API access when token is missing, invalid, or expired', async () => {
    const noTokenRes = await request(app).get('/api/readings');
    assert.equal(noTokenRes.status, 401);

    const badTokenRes = await request(app)
      .get('/api/readings')
      .set('Authorization', 'Bearer invalid.jwt.token');
    assert.equal(badTokenRes.status, 401);

    const expiredToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000000' },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );
    const expiredRes = await request(app)
      .get('/api/reports/daily')
      .set('Authorization', `Bearer ${expiredToken}`);
    assert.equal(expiredRes.status, 401);
    assert.match(expiredRes.body.message, /expired/i);
  });
});

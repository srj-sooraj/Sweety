const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { getTodayDateString } = require('../utils/dateUtils');
const {
  app,
  request,
  disconnectDb,
  resetTestDatabase,
  registerTestUser,
} = require('./setup');

function offsetLocalDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return getTodayDateString(d);
}

describe('Glucose Readings CRUD & Validation API', () => {
  let token;
  let otherToken;

  beforeEach(async () => {
    await resetTestDatabase();
    const u1 = await registerTestUser({ email: 'owner@example.com' });
    const u2 = await registerTestUser({ email: 'other@example.com' });
    token = u1.token;
    otherToken = u2.token;
  });

  after(async () => {
    await disconnectDb();
  });

  it('6. creates a valid glucose reading', async () => {
    const today = getTodayDateString();
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: today,
        glucoseValue: 118,
        readingSlot: 'MORNING_FASTING',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.reading.date, today);
    assert.equal(res.body.data.reading.glucoseValue, 118);
    assert.equal(res.body.data.reading.readingSlot, 'MORNING_FASTING');
  });

  it('7. rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.date);
    assert.ok(res.body.errors.glucoseValue);
    assert.ok(res.body.errors.readingSlot);
  });

  it('8. rejects glucose value below 40', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: 39,
        readingSlot: 'MORNING_FASTING',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /40 and 600/i);
  });

  it('9. rejects glucose value above 600', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: 601,
        readingSlot: 'AFTER_LUNCH',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /40 and 600/i);
  });

  it('10. rejects decimal and non-numeric glucose values', async () => {
    const decimalRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: 120.5,
        readingSlot: 'AFTER_BREAKFAST',
      });
    assert.equal(decimalRes.status, 400);
    assert.match(decimalRes.body.message, /whole number/i);

    const stringDecimalRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: '120.5',
        readingSlot: 'AFTER_BREAKFAST',
      });
    assert.equal(stringDecimalRes.status, 400);

    const alphaRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: 'abc',
        readingSlot: 'AFTER_BREAKFAST',
      });
    assert.equal(alphaRes.status, 400);
  });

  it('11. rejects duplicate reading slot on the same date', async () => {
    const today = getTodayDateString();
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 105, readingSlot: 'MORNING_FASTING' });

    const dupRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 110, readingSlot: 'MORNING_FASTING' });

    assert.equal(dupRes.status, 409);
    assert.match(dupRes.body.message, /already exists/i);
  });

  it('12. enforces maximum of 4 readings per date (and rejects any 5th attempt)', async () => {
    const today = getTodayDateString();
    const slots = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

    for (const slot of slots) {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token}`)
        .send({ date: today, glucoseValue: 120, readingSlot: slot });
      assert.equal(res.status, 201);
    }

    // Attempting a 5th reading on the same date (even if slot is duplicated or invalid) is rejected
    const fifthRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 125, readingSlot: 'AFTER_DINNER' });
    assert.ok([400, 409].includes(fifthRes.status));

    const listRes = await request(app)
      .get(`/api/readings?date=${today}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(listRes.body.data.readings.length, 4);
  });

  it('13. rejects future dates', async () => {
    const tomorrow = offsetLocalDate(1);
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: tomorrow,
        glucoseValue: 112,
        readingSlot: 'MORNING_FASTING',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /future/i);
  });

  it('14. updates an existing reading without self-duplicate error and enforces validation', async () => {
    const today = getTodayDateString();
    const createRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 115, readingSlot: 'MORNING_FASTING' });

    const id = createRes.body.data.reading.id;

    // Same date & same slot update must succeed
    const updateRes = await request(app)
      .put(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 122, readingSlot: 'MORNING_FASTING' });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.reading.glucoseValue, 122);

    // Create another slot on same date, then verify editing into that occupied slot fails
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 140, readingSlot: 'AFTER_LUNCH' });

    const conflictUpdate = await request(app)
      .put(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 125, readingSlot: 'AFTER_LUNCH' });

    assert.equal(conflictUpdate.status, 409);
  });

  it('15. deletes an existing reading', async () => {
    const createRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: 130,
        readingSlot: 'AFTER_BREAKFAST',
      });

    const id = createRes.body.data.reading.id;

    const deleteRes = await request(app)
      .delete(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(deleteRes.status, 200);

    const getRes = await request(app)
      .get(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(getRes.status, 404);
  });

  it('16. prevents accessing, updating, or deleting another user reading', async () => {
    const createRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: 110,
        readingSlot: 'MORNING_FASTING',
      });

    const id = createRes.body.data.reading.id;

    const viewOther = await request(app)
      .get(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    assert.equal(viewOther.status, 403);

    const editOther = await request(app)
      .put(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        date: getTodayDateString(),
        glucoseValue: 150,
        readingSlot: 'MORNING_FASTING',
      });
    assert.equal(editOther.status, 403);

    const deleteOther = await request(app)
      .delete(`/api/readings/${id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    assert.equal(deleteOther.status, 403);
  });
});

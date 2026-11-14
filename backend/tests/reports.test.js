const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  getTodayDateString,
  getMonthToDateRange,
  getPreviousMonthRange,
} = require('../utils/dateUtils');
const {
  app,
  request,
  disconnectDb,
  resetTestDatabase,
  registerTestUser,
} = require('./setup');

describe('Reports API (Daily, Month-to-Date, Previous Month)', () => {
  let token;
  let otherToken;

  beforeEach(async () => {
    await resetTestDatabase();
    const u1 = await registerTestUser({ email: 'reporter@example.com' });
    const u2 = await registerTestUser({ email: 'isolated@example.com' });
    token = u1.token;
    otherToken = u2.token;
  });

  after(async () => {
    await disconnectDb();
  });

  it('17. calculates accurate daily report statistics and slot ordering', async () => {
    const today = getTodayDateString();

    // Insert out of slot order to verify slot sorting
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 151, readingSlot: 'AFTER_LUNCH' });
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 92, readingSlot: 'MORNING_FASTING' });
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, glucoseValue: 134, readingSlot: 'AFTER_BREAKFAST' });

    // Other user's reading on same day must NOT affect user 1's report
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ date: today, glucoseValue: 550, readingSlot: 'MORNING_FASTING' });

    const res = await request(app)
      .get(`/api/reports/daily?date=${today}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.date, today);
    assert.equal(res.body.data.totalReadings, 3);
    assert.equal(res.body.data.highest, 151);
    assert.equal(res.body.data.lowest, 92);
    // (151 + 92 + 134) / 3 = 377 / 3 = 125.666... -> 125.7
    assert.equal(res.body.data.average, 125.7);
    assert.deepEqual(
      res.body.data.readings.map((r) => r.readingSlot),
      ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH']
    );
  });

  it('18. calculates accurate month-to-date statistics excluding previous month', async () => {
    const mtd = getMonthToDateRange();
    const prev = getPreviousMonthRange();

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: mtd.startStr, glucoseValue: 100, readingSlot: 'MORNING_FASTING' });
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: mtd.endStr, glucoseValue: 145, readingSlot: 'AFTER_DINNER' });

    // Previous month reading should be excluded from MTD
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: prev.endStr, glucoseValue: 400, readingSlot: 'AFTER_LUNCH' });

    const res = await request(app)
      .get('/api/reports/month-to-date')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.period.startDate, mtd.startStr);
    assert.equal(res.body.data.period.endDate, mtd.endStr);
    assert.equal(res.body.data.totalReadings, 2);
    assert.equal(res.body.data.highest, 145);
    assert.equal(res.body.data.lowest, 100);
    assert.equal(res.body.data.average, 122.5);
  });

  it('19. calculates accurate previous-month statistics excluding current month', async () => {
    const mtd = getMonthToDateRange();
    const prev = getPreviousMonthRange();

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: prev.startStr, glucoseValue: 88, readingSlot: 'MORNING_FASTING' });
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: prev.endStr, glucoseValue: 163, readingSlot: 'AFTER_LUNCH' });
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: prev.endStr, glucoseValue: 130, readingSlot: 'AFTER_DINNER' });

    // Current month reading must be excluded
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: mtd.endStr, glucoseValue: 500, readingSlot: 'AFTER_BREAKFAST' });

    const res = await request(app)
      .get('/api/reports/previous-month')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.period.startDate, prev.startStr);
    assert.equal(res.body.data.period.endDate, prev.endStr);
    assert.equal(res.body.data.totalReadings, 3);
    assert.equal(res.body.data.highest, 163);
    assert.equal(res.body.data.lowest, 88);
    // (88 + 163 + 130) / 3 = 381 / 3 = 127
    assert.equal(res.body.data.average, 127);
  });

  it('20. handles empty datasets safely across all three report endpoints', async () => {
    const today = getTodayDateString();

    const dailyRes = await request(app)
      .get(`/api/reports/daily?date=${today}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(dailyRes.status, 200);
    assert.equal(dailyRes.body.data.totalReadings, 0);
    assert.equal(dailyRes.body.data.highest, null);
    assert.equal(dailyRes.body.data.lowest, null);
    assert.equal(dailyRes.body.data.average, null);
    assert.deepEqual(dailyRes.body.data.readings, []);

    const mtdRes = await request(app)
      .get('/api/reports/month-to-date')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(mtdRes.status, 200);
    assert.equal(mtdRes.body.data.totalReadings, 0);
    assert.equal(mtdRes.body.data.highest, null);
    assert.equal(mtdRes.body.data.lowest, null);
    assert.equal(mtdRes.body.data.average, null);

    const prevRes = await request(app)
      .get('/api/reports/previous-month')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(prevRes.status, 200);
    assert.equal(prevRes.body.data.totalReadings, 0);
    assert.equal(prevRes.body.data.highest, null);
    assert.equal(prevRes.body.data.lowest, null);
    assert.equal(prevRes.body.data.average, null);
  });
});

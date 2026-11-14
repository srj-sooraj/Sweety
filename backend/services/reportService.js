const { prisma } = require('../config/db');
const { getMonthToDateRange, getPreviousMonthRange } = require('../utils/dateUtils');
const { getSlotOrder } = require('../utils/slots');
const { serializeReading } = require('./readingService');

function roundOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

async function buildAggregatedStats(userId, startDate, endDate) {
  const agg = await prisma.glucoseReading.aggregate({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _max: { glucoseValue: true },
    _min: { glucoseValue: true },
    _avg: { glucoseValue: true },
    _count: { _all: true },
  });

  const totalReadings = agg._count._all;
  if (totalReadings === 0) {
    return {
      totalReadings: 0,
      highest: null,
      lowest: null,
      average: null,
    };
  }

  return {
    totalReadings,
    highest: agg._max.glucoseValue,
    lowest: agg._min.glucoseValue,
    average: roundOneDecimal(agg._avg.glucoseValue),
  };
}

async function getDailyReport(userId, { dateObj, dateStr }) {
  const [stats, readings] = await Promise.all([
    buildAggregatedStats(userId, dateObj, dateObj),
    prisma.glucoseReading.findMany({
      where: {
        userId,
        date: dateObj,
      },
    }),
  ]);

  const orderedReadings = [...readings]
    .sort((a, b) => getSlotOrder(a.readingSlot) - getSlotOrder(b.readingSlot))
    .map(serializeReading);

  return {
    reportType: 'daily',
    date: dateStr,
    ...stats,
    readings: orderedReadings,
  };
}

async function getMonthToDateReport(userId, now = new Date()) {
  const range = getMonthToDateRange(now);
  const stats = await buildAggregatedStats(userId, range.startDate, range.endDate);

  return {
    reportType: 'month-to-date',
    period: {
      startDate: range.startStr,
      endDate: range.endStr,
      label: range.label,
    },
    ...stats,
  };
}

async function getPreviousMonthReport(userId, now = new Date()) {
  const range = getPreviousMonthRange(now);
  const stats = await buildAggregatedStats(userId, range.startDate, range.endDate);

  return {
    reportType: 'previous-month',
    period: {
      startDate: range.startStr,
      endDate: range.endStr,
      label: range.label,
    },
    ...stats,
  };
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};

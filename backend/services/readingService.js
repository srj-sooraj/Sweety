const { prisma } = require('../config/db');
const { ApiError } = require('../utils/apiError');
const { formatCalendarDate, parseCalendarDate } = require('../utils/dateUtils');
const { getSlotLabel, getSlotOrder, normalizeReadingSlot } = require('../utils/slots');

function serializeReading(reading) {
  return {
    id: reading.id,
    userId: reading.userId,
    date: formatCalendarDate(reading.date),
    glucoseValue: reading.glucoseValue,
    readingSlot: reading.readingSlot,
    slotLabel: getSlotLabel(reading.readingSlot),
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
  };
}

function sortByDateDescThenSlotAsc(readings) {
  return [...readings].sort((a, b) => {
    const dateA = formatCalendarDate(a.date);
    const dateB = formatCalendarDate(b.date);
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return getSlotOrder(a.readingSlot) - getSlotOrder(b.readingSlot);
  });
}

async function lockUserRow(tx, userId) {
  await tx.$executeRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
}

async function assertSlotAndDailyLimit(tx, userId, date, readingSlot, excludeReadingId = null) {
  const where = { userId, date };
  if (excludeReadingId) {
    where.id = { not: excludeReadingId };
  }

  const existingForDate = await tx.glucoseReading.findMany({
    where,
    select: { id: true, readingSlot: true },
  });

  const duplicate = existingForDate.some((entry) => entry.readingSlot === readingSlot);
  if (duplicate) {
    throw new ApiError(409, 'A reading for this date and reading slot already exists.', {
      readingSlot: 'A reading for this date and reading slot already exists.',
    });
  }

  if (existingForDate.length >= 4) {
    throw new ApiError(400, 'Maximum of 4 readings per day reached for this date.', {
      date: 'Maximum of 4 readings per day reached for this date.',
    });
  }
}

async function findOwnedReadingOrThrow(client, userId, readingId) {
  const reading = await client.glucoseReading.findUnique({ where: { id: readingId } });
  if (!reading) {
    throw new ApiError(404, 'Glucose reading not found.');
  }
  if (reading.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this reading.');
  }
  return reading;
}

async function createReading(userId, { date, glucoseValue, readingSlot }) {
  const created = await prisma.$transaction(async (tx) => {
    await lockUserRow(tx, userId);
    await assertSlotAndDailyLimit(tx, userId, date, readingSlot);

    return tx.glucoseReading.create({
      data: {
        userId,
        date,
        glucoseValue,
        readingSlot,
      },
    });
  });

  return serializeReading(created);
}

async function listReadings(userId, filters = {}) {
  const where = { userId };

  if (filters.date) {
    const parsed = parseCalendarDate(String(filters.date));
    if (!parsed) {
      throw new ApiError(400, 'Filter date must be in YYYY-MM-DD format.');
    }
    where.date = parsed.dateObj;
  } else if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      const start = parseCalendarDate(String(filters.startDate));
      if (!start) {
        throw new ApiError(400, 'startDate must be in YYYY-MM-DD format.');
      }
      where.date.gte = start.dateObj;
    }
    if (filters.endDate) {
      const end = parseCalendarDate(String(filters.endDate));
      if (!end) {
        throw new ApiError(400, 'endDate must be in YYYY-MM-DD format.');
      }
      where.date.lte = end.dateObj;
    }
  }

  if (filters.readingSlot) {
    const slot = normalizeReadingSlot(String(filters.readingSlot));
    if (!slot) {
      throw new ApiError(400, 'Invalid readingSlot filter.');
    }
    where.readingSlot = slot;
  }

  const readings = await prisma.glucoseReading.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'asc' }],
  });

  return sortByDateDescThenSlotAsc(readings).map(serializeReading);
}

async function getReadingById(userId, readingId) {
  const reading = await findOwnedReadingOrThrow(prisma, userId, readingId);
  return serializeReading(reading);
}

async function updateReading(userId, readingId, { date, glucoseValue, readingSlot }) {
  const updated = await prisma.$transaction(async (tx) => {
    await lockUserRow(tx, userId);
    await findOwnedReadingOrThrow(tx, userId, readingId);
    await assertSlotAndDailyLimit(tx, userId, date, readingSlot, readingId);

    return tx.glucoseReading.update({
      where: { id: readingId },
      data: {
        date,
        glucoseValue,
        readingSlot,
      },
    });
  });

  return serializeReading(updated);
}

async function deleteReading(userId, readingId) {
  await findOwnedReadingOrThrow(prisma, userId, readingId);
  await prisma.glucoseReading.delete({ where: { id: readingId } });
  return { id: readingId };
}

module.exports = {
  serializeReading,
  createReading,
  listReadings,
  getReadingById,
  updateReading,
  deleteReading,
};

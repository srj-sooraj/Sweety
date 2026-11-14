const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_USER = {
  name: 'Alex Morgan',
  email: 'demo@sweety.app',
  password: 'SweetyDemo@123',
};

function toUtcDateOnly(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function buildSeedReadings(now = new Date()) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const todayDay = now.getDate();

  const records = [];

  // Today's readings (3 of 4 slots so user can also test adding the 4th slot live)
  const todayDate = toUtcDateOnly(year, monthIndex, todayDay);
  records.push(
    { date: todayDate, readingSlot: 'MORNING_FASTING', glucoseValue: 96 },
    { date: todayDate, readingSlot: 'AFTER_BREAKFAST', glucoseValue: 134 },
    { date: todayDate, readingSlot: 'AFTER_LUNCH', glucoseValue: 142 }
  );

  // Additional current-month readings (earlier days in the same month)
  const earlierOffsets = [1, 3, 6, 9];
  const slotPatterns = [
    [92, 128, 138, 124],
    [98, 141, 152, 131],
    [89, 122, 130, 118],
    [104, 149, 158, 136],
  ];
  const slots = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

  earlierOffsets.forEach((offset, idx) => {
    const day = todayDay - offset;
    if (day >= 1) {
      const date = toUtcDateOnly(year, monthIndex, day);
      slots.forEach((readingSlot, slotIdx) => {
        records.push({
          date,
          readingSlot,
          glucoseValue: slotPatterns[idx][slotIdx],
        });
      });
    }
  });

  // Previous calendar month readings (4 full days across previous month)
  const prevMonthFirst = new Date(Date.UTC(year, monthIndex - 1, 1));
  const prevYear = prevMonthFirst.getUTCFullYear();
  const prevMonthIndex = prevMonthFirst.getUTCMonth();
  const prevDays = [3, 10, 18, 25];
  const prevPatterns = [
    [94, 135, 146, 129],
    [101, 148, 162, 140],
    [88, 119, 127, 115],
    [97, 138, 144, 126],
  ];

  prevDays.forEach((day, idx) => {
    const date = toUtcDateOnly(prevYear, prevMonthIndex, day);
    slots.forEach((readingSlot, slotIdx) => {
      records.push({
        date,
        readingSlot,
        glucoseValue: prevPatterns[idx][slotIdx],
      });
    });
  });

  return records;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      name: DEMO_USER.name,
      password: passwordHash,
    },
    create: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      password: passwordHash,
    },
  });

  const seedReadings = buildSeedReadings();

  for (const item of seedReadings) {
    await prisma.glucoseReading.upsert({
      where: {
        userId_date_readingSlot: {
          userId: user.id,
          date: item.date,
          readingSlot: item.readingSlot,
        },
      },
      update: {
        glucoseValue: item.glucoseValue,
      },
      create: {
        userId: user.id,
        date: item.date,
        readingSlot: item.readingSlot,
        glucoseValue: item.glucoseValue,
      },
    });
  }

  console.log(
    `Seeded demo user (${DEMO_USER.email}) with ${seedReadings.length} glucose readings.`
  );
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

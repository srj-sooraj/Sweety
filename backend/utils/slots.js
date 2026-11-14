const READING_SLOTS = {
  MORNING_FASTING: {
    value: 'MORNING_FASTING',
    label: 'Morning (fasting)',
    order: 1,
  },
  AFTER_BREAKFAST: {
    value: 'AFTER_BREAKFAST',
    label: 'After breakfast',
    order: 2,
  },
  AFTER_LUNCH: {
    value: 'AFTER_LUNCH',
    label: 'After lunch',
    order: 3,
  },
  AFTER_DINNER: {
    value: 'AFTER_DINNER',
    label: 'After dinner',
    order: 4,
  },
};

const SLOT_LOOKUP = {
  morning_fasting: 'MORNING_FASTING',
  'morning (fasting)': 'MORNING_FASTING',
  after_breakfast: 'AFTER_BREAKFAST',
  'after breakfast': 'AFTER_BREAKFAST',
  after_lunch: 'AFTER_LUNCH',
  'after lunch': 'AFTER_LUNCH',
  after_dinner: 'AFTER_DINNER',
  'after dinner': 'AFTER_DINNER',
};

function normalizeReadingSlot(rawSlot) {
  if (typeof rawSlot !== 'string') {
    return null;
  }
  const normalized = rawSlot.trim().toLowerCase();
  return SLOT_LOOKUP[normalized] || null;
}

function getSlotLabel(slot) {
  return READING_SLOTS[slot]?.label || slot;
}

function getSlotOrder(slot) {
  return READING_SLOTS[slot]?.order || 99;
}

module.exports = {
  READING_SLOTS,
  normalizeReadingSlot,
  getSlotLabel,
  getSlotOrder,
};

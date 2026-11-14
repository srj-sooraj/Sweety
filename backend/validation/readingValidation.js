const { ApiError } = require('../utils/apiError');
const {
  parseCalendarDate,
  getTodayDateString,
  isFutureDate,
} = require('../utils/dateUtils');
const { normalizeReadingSlot } = require('../utils/slots');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WHOLE_NUMBER_STRING_REGEX = /^\d+$/;

function parseWholeNumber(raw) {
  if (typeof raw === 'number') {
    return Number.isInteger(raw) ? raw : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!WHOLE_NUMBER_STRING_REGEX.test(trimmed)) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function validateReadingInput(body = {}) {
  const errors = {};

  const hasDate = body.date !== undefined && body.date !== null && String(body.date).trim() !== '';
  let parsedDate = null;
  if (!hasDate) {
    errors.date = 'Date is required.';
  } else {
    parsedDate = parseCalendarDate(String(body.date));
    if (!parsedDate) {
      errors.date = 'Date must be a valid calendar date in YYYY-MM-DD format.';
    } else if (isFutureDate(parsedDate.dateStr)) {
      errors.date = 'Future dates are not allowed.';
    }
  }

  const hasGlucose =
    body.glucoseValue !== undefined &&
    body.glucoseValue !== null &&
    String(body.glucoseValue).trim() !== '';
  let glucoseValue = null;
  if (!hasGlucose) {
    errors.glucoseValue = 'Blood glucose value is required.';
  } else {
    glucoseValue = parseWholeNumber(body.glucoseValue);
    if (glucoseValue === null) {
      errors.glucoseValue = 'Blood glucose value must be a whole number (no decimals).';
    } else if (glucoseValue < 40 || glucoseValue > 600) {
      errors.glucoseValue = 'Blood glucose value must be between 40 and 600 mg/dL.';
    }
  }

  const hasSlot =
    body.readingSlot !== undefined &&
    body.readingSlot !== null &&
    String(body.readingSlot).trim() !== '';
  let readingSlot = null;
  if (!hasSlot) {
    errors.readingSlot = 'Reading time slot is required.';
  } else {
    readingSlot = normalizeReadingSlot(String(body.readingSlot));
    if (!readingSlot) {
      errors.readingSlot =
        'Reading slot must be one of: Morning (fasting), After breakfast, After lunch, or After dinner.';
    }
  }

  if (Object.keys(errors).length > 0) {
    const firstMessage = Object.values(errors)[0];
    throw new ApiError(400, firstMessage, errors);
  }

  return {
    date: parsedDate.dateObj,
    dateStr: parsedDate.dateStr,
    glucoseValue,
    readingSlot,
  };
}

function validateUuidParam(id, label = 'Reading ID') {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new ApiError(400, `Invalid ${label} format.`);
  }
  return id;
}

function validateDailyReportDate(dateQuery) {
  if (dateQuery === undefined || dateQuery === null || String(dateQuery).trim() === '') {
    const todayStr = getTodayDateString();
    return parseCalendarDate(todayStr);
  }

  const parsed = parseCalendarDate(String(dateQuery));
  if (!parsed) {
    throw new ApiError(400, 'Date must be a valid calendar date in YYYY-MM-DD format.', {
      date: 'Date must be a valid calendar date in YYYY-MM-DD format.',
    });
  }
  return parsed;
}

module.exports = {
  validateReadingInput,
  validateUuidParam,
  validateDailyReportDate,
};

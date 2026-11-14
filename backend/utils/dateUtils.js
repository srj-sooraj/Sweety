const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function padTwo(num) {
  return String(num).padStart(2, '0');
}

/**
 * Parses a YYYY-MM-DD string into a UTC-midnight Date for PostgreSQL DATE columns.
 * Returns null if the format or calendar date (e.g., 2026-02-30) is invalid.
 */
function parseCalendarDate(dateStr) {
  if (typeof dateStr !== 'string') {
    return null;
  }
  const trimmed = dateStr.trim();
  if (!DATE_REGEX.test(trimmed)) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() !== month - 1 ||
    dateObj.getUTCDate() !== day
  ) {
    return null;
  }

  return { dateObj, dateStr: trimmed };
}

function formatCalendarDate(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function getTodayDateString(now = new Date()) {
  return `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`;
}

function isFutureDate(dateStr, now = new Date()) {
  return dateStr > getTodayDateString(now);
}

function getMonthToDateRange(now = new Date()) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const startStr = `${year}-${padTwo(monthIndex + 1)}-01`;
  const endStr = getTodayDateString(now);

  return {
    startDate: parseCalendarDate(startStr).dateObj,
    endDate: parseCalendarDate(endStr).dateObj,
    startStr,
    endStr,
    label: `${MONTH_NAMES[monthIndex]} ${year} (Month-to-Date)`,
  };
}

function getPreviousMonthRange(now = new Date()) {
  const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
  const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0));
  const year = startDate.getUTCFullYear();
  const monthIndex = startDate.getUTCMonth();

  return {
    startDate,
    endDate,
    startStr: formatCalendarDate(startDate),
    endStr: formatCalendarDate(endDate),
    label: `${MONTH_NAMES[monthIndex]} ${year}`,
  };
}

module.exports = {
  parseCalendarDate,
  formatCalendarDate,
  getTodayDateString,
  isFutureDate,
  getMonthToDateRange,
  getPreviousMonthRange,
};

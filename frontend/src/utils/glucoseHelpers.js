import { getTodayDateString } from './dateUtils';

export const READING_SLOT_OPTIONS = [
  { value: 'MORNING_FASTING', label: 'Morning (fasting)' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];

export function getSlotLabel(slot) {
  const match = READING_SLOT_OPTIONS.find((item) => item.value === slot);
  return match ? match.label : slot;
}

export function getGlucoseCategory(value, slot) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return { label: 'Unknown', badgeClass: 'bg-slate-100 text-slate-700' };
  }

  if (num < 70) {
    return { label: 'Low', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' };
  }

  const normalUpper = slot === 'MORNING_FASTING' ? 99 : 140;
  const elevatedUpper = slot === 'MORNING_FASTING' ? 125 : 180;

  if (num <= normalUpper) {
    return { label: 'In Range', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
  }
  if (num <= elevatedUpper) {
    return { label: 'Elevated', badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200' };
  }
  return { label: 'High', badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200' };
}

export function validateReadingForm({ date, glucoseValue, readingSlot }) {
  const errors = {};
  const today = getTodayDateString();

  if (!date || !String(date).trim()) {
    errors.date = 'Date is required.';
  } else if (date > today) {
    errors.date = 'Future dates are not allowed.';
  }

  const rawValue = String(glucoseValue ?? '').trim();
  if (!rawValue) {
    errors.glucoseValue = 'Blood glucose value is required.';
  } else if (!/^\d+$/.test(rawValue)) {
    errors.glucoseValue = 'Blood glucose value must be a whole number (no decimals).';
  } else {
    const parsed = Number(rawValue);
    if (parsed < 40 || parsed > 600) {
      errors.glucoseValue = 'Blood glucose value must be between 40 and 600 mg/dL.';
    }
  }

  if (!readingSlot || !READING_SLOT_OPTIONS.some((item) => item.value === readingSlot)) {
    errors.readingSlot = 'Reading time slot is required.';
  }

  return errors;
}

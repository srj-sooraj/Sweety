import { useEffect, useState } from 'react';
import { Calendar, Clock, Droplet } from 'lucide-react';
import { getTodayDateString } from '../utils/dateUtils';
import { READING_SLOT_OPTIONS, validateReadingForm } from '../utils/glucoseHelpers';
import { AlertBanner } from './AlertBanner';

export function ReadingForm({
  initialValues,
  submitLabel = 'Save Reading',
  isSubmitting = false,
  serverError = '',
  serverFieldErrors = {},
  onSubmit,
  onCancel,
}) {
  const today = getTodayDateString();
  const [date, setDate] = useState(initialValues?.date || today);
  const [glucoseValue, setGlucoseValue] = useState(
    initialValues?.glucoseValue !== undefined ? String(initialValues.glucoseValue) : ''
  );
  const [readingSlot, setReadingSlot] = useState(
    initialValues?.readingSlot || 'MORNING_FASTING'
  );
  const [clientErrors, setClientErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setDate(initialValues.date || today);
      setGlucoseValue(
        initialValues.glucoseValue !== undefined ? String(initialValues.glucoseValue) : ''
      );
      setReadingSlot(initialValues.readingSlot || 'MORNING_FASTING');
    }
  }, [initialValues, today]);

  const errors = { ...serverFieldErrors, ...clientErrors };

  function handleFieldChange(field, value, setter) {
    setter(value);
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateReadingForm({
      date,
      glucoseValue,
      readingSlot,
    });

    if (Object.keys(validationErrors).length > 0) {
      setClientErrors(validationErrors);
      return;
    }

    setClientErrors({});
    onSubmit({
      date,
      glucoseValue: Number(glucoseValue.trim()),
      readingSlot,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <AlertBanner type="error" message={serverError} />

      <div>
        <label htmlFor="reading-date" className="block text-sm font-semibold text-slate-700">
          Reading Date
        </label>
        <div className="relative mt-1.5">
          <Calendar
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="reading-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => handleFieldChange('date', e.target.value, setDate)}
            className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 ${
              errors.date
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200'
            }`}
            required
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Future dates are not permitted. Maximum 4 readings per day (1 per slot).
        </p>
        {errors.date && <p className="mt-1 text-xs font-medium text-rose-600">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="glucose-value" className="block text-sm font-semibold text-slate-700">
          Blood Glucose Value (mg/dL)
        </label>
        <div className="relative mt-1.5">
          <Droplet
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="glucose-value"
            type="number"
            inputMode="numeric"
            step="1"
            min="40"
            max="600"
            placeholder="e.g. 112"
            value={glucoseValue}
            onChange={(e) => handleFieldChange('glucoseValue', e.target.value, setGlucoseValue)}
            className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-16 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 ${
              errors.glucoseValue
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200'
            }`}
            required
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            mg/dL
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Whole numbers only, between 40 and 600 mg/dL.
        </p>
        {errors.glucoseValue && (
          <p className="mt-1 text-xs font-medium text-rose-600">{errors.glucoseValue}</p>
        )}
      </div>

      <div>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Reading Time Slot
        </span>
        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup">
          {READING_SLOT_OPTIONS.map((slot) => {
            const selected = readingSlot === slot.value;
            return (
              <label
                key={slot.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-all ${
                  selected
                    ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="readingSlot"
                  value={slot.value}
                  checked={selected}
                  onChange={(e) =>
                    handleFieldChange('readingSlot', e.target.value, setReadingSlot)
                  }
                  className="h-4 w-4 accent-teal-600"
                />
                <span>{slot.label}</span>
              </label>
            );
          })}
        </div>
        {errors.readingSlot && (
          <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.readingSlot}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

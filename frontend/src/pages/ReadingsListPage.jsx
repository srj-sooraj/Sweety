import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { readingsApi } from '../services/api';
import { formatDisplayDate } from '../utils/dateUtils';
import {
  READING_SLOT_OPTIONS,
  getGlucoseCategory,
  getSlotLabel,
} from '../utils/glucoseHelpers';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { AlertBanner } from '../components/AlertBanner';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function ReadingsListPage() {
  const location = useLocation();

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.flashMessage || '');

  // Filter states
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSlot, setFilterSlot] = useState('');

  // Delete modal state
  const [readingToDelete, setReadingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchReadings(params = {}) {
    setLoading(true);
    setError('');
    try {
      const data = await readingsApi.list(params);
      setReadings(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load readings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReadings();
  }, []);

  function handleApplyFilters(event) {
    event.preventDefault();
    const params = {};
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    if (filterSlot) params.readingSlot = filterSlot;
    fetchReadings(params);
  }

  function handleResetFilters() {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterSlot('');
    fetchReadings({});
  }

  async function handleDeleteConfirm() {
    if (!readingToDelete) return;
    setIsDeleting(true);
    try {
      await readingsApi.remove(readingToDelete.id);
      setSuccessMsg('Reading deleted successfully.');
      setReadingToDelete(null);

      const params = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterSlot) params.readingSlot = filterSlot;
      await fetchReadings(params);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete reading.');
    } finally {
      setIsDeleting(false);
    }
  }

  const hasActiveFilters = Boolean(filterStartDate || filterEndDate || filterSlot);

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reading History
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            View, filter, edit, and manage all your logged blood glucose measurements.
          </p>
        </div>

        <Link
          to="/readings/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Reading
        </Link>
      </div>

      <AlertBanner type="error" message={error} onDismiss={() => setError('')} />
      <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="filter-start" className="block text-xs font-semibold text-slate-600">
              From Date
            </label>
            <input
              id="filter-start"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="filter-end" className="block text-xs font-semibold text-slate-600">
              To Date
            </label>
            <input
              id="filter-end"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="filter-slot" className="block text-xs font-semibold text-slate-600">
              Time Slot
            </label>
            <select
              id="filter-slot"
              value={filterSlot}
              onChange={(e) => setFilterSlot(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Reading Slots</option>
              {READING_SLOT_OPTIONS.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Readings Table / List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Fetching your readings..." />
        ) : readings.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={hasActiveFilters ? 'No readings match your filter criteria' : 'No readings yet'}
              description={
                hasActiveFilters
                  ? 'Try adjusting or clearing your date range or time slot filter.'
                  : 'Start tracking your blood glucose by logging your first reading.'
              }
              actionLabel="Add Glucose Reading"
              actionTo="/readings/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Time Slot</th>
                  <th className="py-3.5 px-5">Glucose Level</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((reading) => {
                  const category = getGlucoseCategory(
                    reading.glucoseValue,
                    reading.readingSlot
                  );
                  return (
                    <tr key={reading.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{formatDisplayDate(reading.date)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {getSlotLabel(reading.readingSlot)}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-base font-bold text-slate-900">
                          {reading.glucoseValue}
                        </span>{' '}
                        <span className="text-xs text-slate-500 font-medium">mg/dL</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${category.badgeClass}`}
                        >
                          {category.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/readings/${reading.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            title="Edit reading"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setReadingToDelete(reading)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Delete reading"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        reading={readingToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setReadingToDelete(null)}
      />
    </div>
  );
}

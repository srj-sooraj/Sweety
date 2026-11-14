import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { readingsApi, extractApiError } from '../services/api';
import { ReadingForm } from '../components/ReadingForm';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';

export function EditReadingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverFieldErrors, setServerFieldErrors] = useState({});

  useEffect(() => {
    async function fetchReading() {
      setLoading(true);
      setLoadError('');
      try {
        const reading = await readingsApi.getOne(id);
        setInitialData({
          date: reading.date,
          glucoseValue: reading.glucoseValue,
          readingSlot: reading.readingSlot,
        });
      } catch (err) {
        setLoadError(
          err?.response?.data?.message || 'Failed to load glucose reading for editing.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchReading();
    }
  }, [id]);

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    setServerError('');
    setServerFieldErrors({});

    try {
      await readingsApi.update(id, formData);
      navigate('/readings', {
        state: { flashMessage: 'Glucose reading updated successfully.' },
      });
    } catch (err) {
      const parsed = extractApiError(err, 'Failed to update glucose reading.');
      setServerError(parsed.message);
      setServerFieldErrors(parsed.fieldErrors || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading reading details..." />;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <AlertBanner type="error" message={loadError} />
        <button
          type="button"
          onClick={() => navigate('/readings')}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Readings
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit Glucose Reading
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-slate-500">
          Update the date, glucose value, or time slot for this reading.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <ReadingForm
          initialValues={initialData}
          submitLabel="Update Reading"
          isSubmitting={isSubmitting}
          serverError={serverError}
          serverFieldErrors={serverFieldErrors}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/readings')}
        />
      </div>
    </div>
  );
}

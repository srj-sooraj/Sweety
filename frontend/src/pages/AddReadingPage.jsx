import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { readingsApi, extractApiError } from '../services/api';
import { ReadingForm } from '../components/ReadingForm';

export function AddReadingPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverFieldErrors, setServerFieldErrors] = useState({});

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    setServerError('');
    setServerFieldErrors({});

    try {
      await readingsApi.create(formData);
      navigate('/readings', {
        state: { flashMessage: 'Glucose reading added successfully.' },
      });
    } catch (err) {
      const parsed = extractApiError(err, 'Failed to save glucose reading.');
      setServerError(parsed.message);
      setServerFieldErrors(parsed.fieldErrors || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Add Glucose Reading
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-slate-500">
          Record your blood glucose level for fasting, after breakfast, after lunch, or after dinner.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <ReadingForm
          submitLabel="Record Reading"
          isSubmitting={isSubmitting}
          serverError={serverError}
          serverFieldErrors={serverFieldErrors}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

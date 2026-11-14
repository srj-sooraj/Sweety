import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../services/api';
import { AlertBanner } from '../components/AlertBanner';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    }
    return errs;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const parsed = extractApiError(err, 'Invalid email or password.');
      setErrorMessage(parsed.message);
      setFieldErrors(parsed.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials() {
    setEmail('demo@sweety.app');
    setPassword('SweetyDemo@123');
    setFieldErrors({});
    setErrorMessage('');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
            <Activity className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to Sweety
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your blood glucose readings and statistical reports.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <AlertBanner type="error" message={errorMessage} />

            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="demo@sweety.app"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200'
                  }`}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200'
                  }`}
                  required
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-5 rounded-xl border border-dashed border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-900">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">Quick Demo Login:</span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="rounded-lg bg-teal-600 px-2.5 py-1 font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Autofill Demo
              </button>
            </div>
            <p className="mt-1 text-[11px] text-teal-800">
              demo@sweety.app / SweetyDemo@123
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

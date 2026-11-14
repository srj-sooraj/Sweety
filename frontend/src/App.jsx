import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddReadingPage } from './pages/AddReadingPage';
import { EditReadingPage } from './pages/EditReadingPage';
import { ReadingsListPage } from './pages/ReadingsListPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { MonthToDateReportPage } from './pages/MonthToDateReportPage';
import { PreviousMonthReportPage } from './pages/PreviousMonthReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Application Routes inside Master Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* 3. Main Dashboard */}
            <Route path="/" element={<DashboardPage />} />

            {/* 4. Add Reading */}
            <Route path="/readings/new" element={<AddReadingPage />} />

            {/* 5. Edit Reading */}
            <Route path="/readings/:id/edit" element={<EditReadingPage />} />

            {/* 6. Reading History/List */}
            <Route path="/readings" element={<ReadingsListPage />} />

            {/* 7. Daily Report */}
            <Route path="/reports/daily" element={<DailyReportPage />} />

            {/* 8. Month-to-Date Report */}
            <Route path="/reports/month-to-date" element={<MonthToDateReportPage />} />

            {/* 9. Previous Month Report */}
            <Route path="/reports/previous-month" element={<PreviousMonthReportPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

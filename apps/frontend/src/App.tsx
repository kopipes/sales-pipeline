import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DealsPage from './pages/deals/DealsPage';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import CompaniesPage from './pages/companies/CompaniesPage';
import ContactsPage from './pages/contacts/ContactsPage';
import JobsPage from './pages/jobs/JobsPage';
import AdminPage from './pages/admin/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

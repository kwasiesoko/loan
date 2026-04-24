import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import NewCustomer from './pages/NewCustomer';
import CustomerDetail from './pages/CustomerDetail';
import Loans from './pages/Loans';
import NewLoan from './pages/NewLoan';
import LoanDetail from './pages/LoanDetail';
import Repayments from './pages/Repayments';
import Susu from './pages/Susu';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/customers/new" element={<ProtectedRoute><NewCustomer /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
      <Route path="/loans/new" element={<ProtectedRoute><NewLoan /></ProtectedRoute>} />
      <Route path="/loans/:id" element={<ProtectedRoute><LoanDetail /></ProtectedRoute>} />
      <Route path="/repayments" element={<ProtectedRoute><Repayments /></ProtectedRoute>} />
      <Route path="/susu" element={<ProtectedRoute><Susu /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{
            style: { borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' },
            success: { iconTheme: { primary: '#059669', secondary: 'white' } },
            error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
          }} />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

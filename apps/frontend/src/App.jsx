import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import SSOCallbackPage from './pages/SSOCallbackPage';
import DashboardHome from './pages/DashboardHome';
import DocumentsPage from './pages/DocumentsPage';
import DocumentViewPage from './pages/DocumentViewPage';
import DocumentCreatePage from './pages/DocumentCreatePage';
import DocumentEditPage from './pages/DocumentEditPage';
import ClientsPage from './pages/ClientsPage';
import ClientCreatePage from './pages/ClientCreatePage';
import ClientEditPage from './pages/ClientEditPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import MailPage from './pages/MailPage';
import MailPageNew from './pages/MailPageNew';
import EmailSignaturePage from './pages/EmailSignaturePage';
import TemplateEditorPage from './pages/TemplateEditorPage';
import TemplatesGalleryPage from './pages/TemplatesGalleryPage';
import BusinessCardPage from './pages/BusinessCardPage';
import FinanceDocsPage from './pages/FinanceDocsPage';
import LetterheadPage from './pages/LetterheadPage';
import SignatureManagementPage from './pages/SignatureManagementPage';
import EmailHostingPage from './pages/EmailHostingPage';
import TeamMembersPage from './pages/TeamMembersPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Import Templates
import ExoinInvoices from './components/templates/ExoinInvoices';
import ExoinQuotations from './components/templates/ExoinQuotations';
import ExoinLetterheadAlternatives from './components/templates/ExoinLetterheadAlternatives';
import ExoinBusinessCardAlternatives from './components/templates/ExoinBusinessCardAlternatives';
import ExoinEmailSignatures from './components/templates/ExoinEmailSignatures';
import ExoinStationeryAlternatives from './components/templates/ExoinStationeryAlternatives';
import ExoinDigitalAlternatives from './components/templates/ExoinDigitalAlternatives';
import ExoinAccessoriesAlternatives from './components/templates/ExoinAccessoriesAlternatives';
import ExoinBrandGuidelines from './components/templates/ExoinBrandGuidelines';
import ExoinInteriors from './components/templates/ExoinInteriors';
import ExoinLogoShowcase from './components/templates/ExoinLogoShowcase';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/sso-callback" element={<SSOCallbackPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />
        
        {/* Mail */}
        <Route path="mail" element={<MailPageNew />} />
        <Route path="mail-old" element={<MailPage />} />
        <Route path="email-signature" element={<EmailSignaturePage />} />
        <Route path="signatures" element={<SignatureManagementPage />} />
        <Route path="email-hosting" element={<EmailHostingPage />} />
        
        {/* Documents Management */}
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/new" element={<DocumentCreatePage />} />
        <Route path="documents/:id" element={<DocumentViewPage />} />
        <Route path="documents/:id/edit" element={<DocumentEditPage />} />
        
        {/* Template Editor - Create/Edit with branded templates */}
        <Route path="editor/:type" element={<TemplateEditorPage />} />
        
        {/* Business Card Creator */}
        <Route path="business-card" element={<BusinessCardPage />} />
        
        {/* Finance Documents - Invoices & Quotations */}
        <Route path="finance" element={<FinanceDocsPage />} />

        {/* Letterhead Creator */}
        <Route path="letterhead" element={<LetterheadPage />} />
        
        {/* Templates Gallery */}
        <Route path="templates" element={<TemplatesGalleryPage />} />
        
        {/* Clients Management */}
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<ClientCreatePage />} />
        <Route path="clients/:id/edit" element={<ClientEditPage />} />
        
        {/* Settings & Admin */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="admin/team-members" element={<TeamMembersPage />} />
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        
        {/* Document Templates (Preview) */}
        <Route path="templates/invoices" element={<ExoinInvoices />} />
        <Route path="templates/quotations" element={<ExoinQuotations />} />
        <Route path="templates/letterheads" element={<ExoinLetterheadAlternatives />} />
        
        {/* Brand Assets */}
        <Route path="assets/business-cards" element={<ExoinBusinessCardAlternatives />} />
        <Route path="assets/email-signatures" element={<ExoinEmailSignatures />} />
        <Route path="assets/stationery" element={<ExoinStationeryAlternatives />} />
        <Route path="assets/digital" element={<ExoinDigitalAlternatives />} />
        <Route path="assets/accessories" element={<ExoinAccessoriesAlternatives />} />
        
        {/* Brand Guidelines */}
        <Route path="brand/guidelines" element={<ExoinBrandGuidelines />} />
        <Route path="brand/interiors" element={<ExoinInteriors />} />
        <Route path="brand/logos" element={<ExoinLogoShowcase />} />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

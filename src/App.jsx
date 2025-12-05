import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider } from './context/NavigationContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import PaymentsIn from './pages/PaymentsIn';
import PaymentsOut from './pages/PaymentsOut';
import Parties from './pages/Parties';
import Departments from './pages/Departments';
import Invoices from './pages/Invoices';
import Quotations from './pages/Quotations';
import UserManagement from './pages/UserManagement';
import CompanyProfile from './pages/CompanyProfile';
import Settings from './pages/Settings';
import PricingPage from './pages/PricingPage';
import SubscriptionManagement from './pages/SubscriptionManagement';
import PaymentPage from './pages/PaymentPage';
import MaterialsPage from './pages/MaterialsPage';
import StockTransactionsPage from './pages/StockTransactionsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import WorkersPage from './pages/WorkersPage';
import AttendancePage from './pages/AttendancePage';
import TimesheetsPage from './pages/TimesheetsPage';
import PayrollPage from './pages/PayrollPage';
import BudgetPlanningPage from './pages/BudgetPlanningPage';
import BudgetTrackingPage from './pages/BudgetTrackingPage';
import RetentionManagementPage from './pages/RetentionManagementPage';
import ChangeOrdersPage from './pages/ChangeOrdersPage';
import DocumentsPage from './pages/DocumentsPage';
import Layout from './components/Layout';
import './utils/diagnostics'; // Load diagnostic tools

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('projects');
  const { isOnline, isSyncing, triggerSync } = useNetworkStatus();

  // Debug navigation changes
  const handleNavigate = (pageId) => {
    console.log('🔍 [App] Navigation requested:', pageId);
    console.log('🔍 [App] Current page before:', currentPage);
    setCurrentPage(pageId);
    console.log('✅ [App] setCurrentPage called with:', pageId);
  };

  // Track currentPage changes
  useEffect(() => {
    console.log('📄 [App] currentPage state changed to:', currentPage);
  }, [currentPage]);

  // Initial sync when user logs in
  useEffect(() => {
    if (user && isOnline && !isSyncing) {
      console.log('🔄 Triggering initial sync on login...');
      triggerSync();
    }
  }, [user?.id]); // Only run when user ID changes (login/logout)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    console.log('🔍 [App] Rendering page:', currentPage);
    console.log('🔍 [App] Available pages:', {
      projects: 'Projects',
      dashboard: 'Dashboard',
      reports: 'Reports',
      'payments-in': 'PaymentsIn',
      'payments-out': 'PaymentsOut',
      parties: 'Parties',
      departments: 'Departments',
      invoices: 'Invoices',
      quotations: 'Quotations',
      'user-management': 'UserManagement',
      'company-profile': 'CompanyProfile',
      settings: 'Settings'
    });

    switch (currentPage) {
      case 'projects':
        console.log('✅ [App] Rendering Projects page');
        return <Projects />;
      case 'dashboard':
        console.log('✅ [App] Rendering Dashboard page');
        return <Dashboard />;
      case 'reports':
        console.log('✅ [App] Rendering Reports page');
        return <Reports />;
      case 'payments-in':
        console.log('✅ [App] Rendering PaymentsIn page');
        return <PaymentsIn />;
      case 'payments-out':
        console.log('✅ [App] Rendering PaymentsOut page');
        return <PaymentsOut />;
      case 'parties':
        console.log('✅ [App] Rendering Parties page');
        return <Parties />;
      case 'departments':
        console.log('✅ [App] Rendering Departments page');
        return <Departments />;
      case 'invoices':
        console.log('✅ [App] Rendering Invoices page');
        return <Invoices />;
      case 'quotations':
        console.log('✅ [App] Rendering Quotations page');
        return <Quotations />;
      case 'user-management':
        console.log('✅ [App] Rendering UserManagement page');
        return <UserManagement />;
      case 'company-profile':
        console.log('✅ [App] Rendering CompanyProfile page');
        return <CompanyProfile />;
      case 'settings':
        console.log('✅ [App] Rendering Settings page');
        return <Settings />;
      case 'pricing':
        console.log('✅ [App] Rendering Pricing page');
        return <PricingPage />;
      case 'subscription':
        console.log('✅ [App] Rendering Subscription Management page');
        return <SubscriptionManagement />;
      case 'payment':
        console.log('✅ [App] Rendering Payment page');
        return <PaymentPage />;
      case 'materials':
        console.log('✅ [App] Rendering Materials page');
        return <MaterialsPage />;
      case 'stock-transactions':
        console.log('✅ [App] Rendering Stock Transactions page');
        return <StockTransactionsPage />;
      case 'purchase-orders':
        console.log('✅ [App] Rendering Purchase Orders page');
        return <PurchaseOrdersPage />;
      case 'workers':
        console.log('✅ [App] Rendering Workers page');
        return <WorkersPage />;
      case 'attendance':
        console.log('✅ [App] Rendering Attendance page');
        return <AttendancePage />;
      case 'timesheets':
        console.log('✅ [App] Rendering Timesheets page');
        return <TimesheetsPage />;
      case 'payroll':
        console.log('✅ [App] Rendering Payroll page');
        return <PayrollPage />;
      case 'budget-planning':
        console.log('✅ [App] Rendering Budget Planning page');
        return <BudgetPlanningPage />;
      case 'budget-tracking':
        console.log('✅ [App] Rendering Budget Tracking page');
        return <BudgetTrackingPage />;
      case 'retention-management':
        console.log('✅ [App] Rendering Retention Management page');
        return <RetentionManagementPage />;
      case 'change-orders':
        console.log('✅ [App] Rendering Change Orders page');
        return <ChangeOrdersPage />;
      case 'documents':
        console.log('✅ [App] Rendering Documents page');
        return <DocumentsPage />;
      default:
        console.log('⚠️ [App] Unknown page, defaulting to Projects');
        return <Projects />;
    }
  };

  return (
    <NavigationProvider onNavigate={handleNavigate}>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onSync={triggerSync}
      >
        {renderPage()}
      </Layout>
    </NavigationProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


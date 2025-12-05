import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Building2,
  Settings,
  Users,
  Building,
  FileText,
  FileCheck,
  Wrench,
  ShieldCheck,
  DollarSign,
  BarChart3,
  UserCircle2,
  Package,
  ShoppingCart,
  TrendingDown as StockOut,
  Warehouse,
  Briefcase,
  Calendar,
  Clock,
  Wallet,
  Calculator,
  Activity,
  Shield,
  GitBranch,
  FolderOpen
} from 'lucide-react';

/**
 * Creates the navigation configuration for the sidebar
 * @param {Object} options - Configuration options
 * @param {Function} options.isAdmin - Function to check if user is admin
 * @param {boolean} options.toolsExpanded - Whether Tools menu is expanded
 * @param {Function} options.setToolsExpanded - Function to toggle Tools menu
 * @param {boolean} options.inventoryExpanded - Whether Inventory menu is expanded
 * @param {Function} options.setInventoryExpanded - Function to toggle Inventory menu
 * @param {boolean} options.laborExpanded - Whether Labor/HR menu is expanded
 * @param {Function} options.setLaborExpanded - Function to toggle Labor/HR menu
 * @param {boolean} options.budgetExpanded - Whether Budget menu is expanded
 * @param {Function} options.setBudgetExpanded - Function to toggle Budget menu
 * @param {boolean} options.retentionExpanded - Whether Retention menu is expanded
 * @param {Function} options.setRetentionExpanded - Function to toggle Retention menu
 * @param {boolean} options.changeOrdersExpanded - Whether Change Orders menu is expanded
 * @param {Function} options.setChangeOrdersExpanded - Function to toggle Change Orders menu
 * @param {boolean} options.documentsExpanded - Whether Documents menu is expanded
 * @param {Function} options.setDocumentsExpanded - Function to toggle Documents menu
 * @param {boolean} options.adminExpanded - Whether Administration menu is expanded
 * @param {Function} options.setAdminExpanded - Function to toggle Administration menu
 * @returns {Array} Navigation configuration array
 */
export const getNavigationConfig = ({
  isAdmin,
  toolsExpanded,
  setToolsExpanded,
  inventoryExpanded,
  setInventoryExpanded,
  laborExpanded,
  setLaborExpanded,
  budgetExpanded,
  setBudgetExpanded,
  retentionExpanded,
  setRetentionExpanded,
  changeOrdersExpanded,
  setChangeOrdersExpanded,
  documentsExpanded,
  setDocumentsExpanded,
  adminExpanded,
  setAdminExpanded
}) => {
  const baseNavigation = [
    { id: 'projects', name: 'Projects', icon: Building2 },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'payments-in', name: 'Payments In', icon: TrendingUp },
    { id: 'payments-out', name: 'Payments Out', icon: TrendingDown },
    { id: 'parties', name: 'Parties', icon: UserCircle2 }, // Changed from Users to UserCircle2
    { id: 'pricing', name: 'Pricing', icon: DollarSign },
    {
      id: 'tools',
      name: 'Tools',
      icon: Wrench,
      isExpandable: true,
      isExpanded: toolsExpanded,
      onExpand: () => setToolsExpanded(!toolsExpanded),
      children: [
        { id: 'invoices', name: 'Invoices', icon: FileText },
        { id: 'quotations', name: 'Quotations', icon: FileCheck },
        { id: 'departments', name: 'Departments', icon: Building }
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: Warehouse,
      isExpandable: true,
      isExpanded: inventoryExpanded,
      onExpand: () => setInventoryExpanded(!inventoryExpanded),
      children: [
        { id: 'materials', name: 'Materials', icon: Package },
        { id: 'stock-transactions', name: 'Stock Transactions', icon: StockOut },
        { id: 'purchase-orders', name: 'Purchase Orders', icon: ShoppingCart }
      ]
    },
    {
      id: 'labor',
      name: 'Labor & HR',
      icon: Briefcase,
      isExpandable: true,
      isExpanded: laborExpanded,
      onExpand: () => setLaborExpanded(!laborExpanded),
      children: [
        { id: 'workers', name: 'Workers', icon: Users },
        { id: 'attendance', name: 'Attendance', icon: Calendar },
        { id: 'timesheets', name: 'Timesheets', icon: Clock },
        { id: 'payroll', name: 'Payroll', icon: Wallet }
      ]
    },
    {
      id: 'budget',
      name: 'Budget & Cost',
      icon: Calculator,
      isExpandable: true,
      isExpanded: budgetExpanded,
      onExpand: () => setBudgetExpanded(!budgetExpanded),
      children: [
        { id: 'budget-planning', name: 'Budget Planning', icon: DollarSign },
        { id: 'budget-tracking', name: 'Budget Tracking', icon: Activity }
      ]
    },
    { id: 'retention-management', name: 'Retention', icon: Shield },
    { id: 'change-orders', name: 'Change Orders', icon: GitBranch },
    { id: 'documents', name: 'Documents', icon: FolderOpen },
    { id: 'settings', name: 'Settings', icon: Settings } // Standalone Settings for all users
  ];

  // Add Administration section only for admins
  if (isAdmin()) {
    baseNavigation.push({
      id: 'administration',
      name: 'Administration',
      icon: ShieldCheck, // Fixed: was Users in Bootstrap
      isExpandable: true,
      isExpanded: adminExpanded,
      onExpand: () => setAdminExpanded(!adminExpanded),
      children: [
        { id: 'user-management', name: 'User Management', icon: Users },
        { id: 'company-profile', name: 'Company Profile', icon: Building }
      ]
    });
  }

  return baseNavigation;
};
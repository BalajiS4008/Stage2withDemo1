# 📋 DETAILED TASK BREAKDOWN - Construction Billing Software

## Purpose
This document provides granular, day-by-day task breakdowns for all features, making it easier to assign work, track progress, and estimate accurately.

---

# 🚨 CRITICAL FEATURES - DETAILED TASK BREAKDOWN

---

## 1. MATERIAL/INVENTORY MANAGEMENT

**Total Duration:** 4-5 weeks (20-25 working days)

### Week 1: Database & Core Setup (5 days)

#### Day 1-2: Database Schema Implementation
- [ ] **Task 1.1.1** - Design and review database schema (2 hours)
- [ ] **Task 1.1.2** - Add `materials` table to Dexie schema (1 hour)
- [ ] **Task 1.1.3** - Add `stockTransactions` table to Dexie schema (1 hour)
- [ ] **Task 1.1.4** - Add `purchaseOrders` table to Dexie schema (1.5 hours)
- [ ] **Task 1.1.5** - Add `materialAllocation` table to Dexie schema (1 hour)
- [ ] **Task 1.1.6** - Create database migration script (2 hours)
- [ ] **Task 1.1.7** - Test database operations (CRUD) (1.5 hours)
- [ ] **Task 1.1.8** - Add indexes for performance optimization (1 hour)

#### Day 3: Material Master - Backend Logic
- [ ] **Task 1.2.1** - Create material utility functions (materialUtils.js) (2 hours)
- [ ] **Task 1.2.2** - Implement material code auto-generation (MAT-001) (1 hour)
- [ ] **Task 1.2.3** - Create material category constants (1 hour)
- [ ] **Task 1.2.4** - Implement material validation logic (1.5 hours)
- [ ] **Task 1.2.5** - Create material CRUD operations (2.5 hours)

#### Day 4-5: Material Master - UI Components
- [ ] **Task 1.3.1** - Create MaterialsPage.jsx skeleton (1 hour)
- [ ] **Task 1.3.2** - Build MaterialForm.jsx component (3 hours)
- [ ] **Task 1.3.3** - Add form validation (1.5 hours)
- [ ] **Task 1.3.4** - Create category dropdown component (1 hour)
- [ ] **Task 1.3.5** - Create unit of measurement selector (1 hour)
- [ ] **Task 1.3.6** - Build MaterialList.jsx component (2.5 hours)
- [ ] **Task 1.3.7** - Add pagination to material list (1.5 hours)
- [ ] **Task 1.3.8** - Implement search and filters (2 hours)
- [ ] **Task 1.3.9** - Create MaterialCard.jsx for detail view (1.5 hours)

### Week 2: Stock Transactions (5 days)

#### Day 6-7: Stock Transaction Backend
- [ ] **Task 1.4.1** - Create stockUtils.js utility functions (2 hours)
- [ ] **Task 1.4.2** - Implement running balance calculation logic (2 hours)
- [ ] **Task 1.4.3** - Create stock IN transaction handler (2 hours)
- [ ] **Task 1.4.4** - Create stock OUT transaction handler (2 hours)
- [ ] **Task 1.4.5** - Create stock ADJUSTMENT handler (1.5 hours)
- [ ] **Task 1.4.6** - Implement auto-update material stock on transaction (2 hours)
- [ ] **Task 1.4.7** - Create transaction validation logic (1.5 hours)

#### Day 8-10: Stock Transaction UI
- [ ] **Task 1.5.1** - Create StockTransactionsPage.jsx (1 hour)
- [ ] **Task 1.5.2** - Build StockTransactionForm.jsx component (3 hours)
- [ ] **Task 1.5.3** - Add transaction type selector (IN/OUT/ADJUSTMENT) (1.5 hours)
- [ ] **Task 1.5.4** - Implement material selector with search (2 hours)
- [ ] **Task 1.5.5** - Add project and department selectors (1.5 hours)
- [ ] **Task 1.5.6** - Create attachment upload component (2 hours)
- [ ] **Task 1.5.7** - Build StockTransactionList.jsx component (2.5 hours)
- [ ] **Task 1.5.8** - Add transaction history view with filters (2 hours)
- [ ] **Task 1.5.9** - Implement date range filters (1.5 hours)
- [ ] **Task 1.5.10** - Add bulk stock adjustment feature (2 hours)

### Week 3: Purchase Orders (5 days)

#### Day 11-12: Purchase Order Backend
- [ ] **Task 1.6.1** - Create poGenerator.js for PO number generation (1 hour)
- [ ] **Task 1.6.2** - Implement PO validation logic (1.5 hours)
- [ ] **Task 1.6.3** - Create PO CRUD operations (2 hours)
- [ ] **Task 1.6.4** - Implement PO line items calculation (1.5 hours)
- [ ] **Task 1.6.5** - Create PO approval workflow logic (2 hours)
- [ ] **Task 1.6.6** - Link PO to stock IN transactions (2 hours)
- [ ] **Task 1.6.7** - Implement PO status tracking (1.5 hours)

#### Day 13-15: Purchase Order UI & PDF
- [ ] **Task 1.7.1** - Create PurchaseOrdersPage.jsx (1 hour)
- [ ] **Task 1.7.2** - Build PurchaseOrderForm.jsx component (3 hours)
- [ ] **Task 1.7.3** - Create POLineItems.jsx with add/remove rows (3 hours)
- [ ] **Task 1.7.4** - Implement material selector per line item (2 hours)
- [ ] **Task 1.7.5** - Add auto-calculation for subtotal, tax, total (2 hours)
- [ ] **Task 1.7.6** - Create PO approval interface (2 hours)
- [ ] **Task 1.7.7** - Build PurchaseOrderList.jsx with status filters (2 hours)
- [ ] **Task 1.7.8** - Create PO PDF template (3 hours)
- [ ] **Task 1.7.9** - Implement PDF generation with jsPDF (2 hours)

### Week 4: Inventory Reports & Alerts (5 days)

#### Day 16-17: Inventory Analytics
- [ ] **Task 1.8.1** - Create InventoryReportsPage.jsx (1 hour)
- [ ] **Task 1.8.2** - Build low stock alert system (2 hours)
- [ ] **Task 1.8.3** - Implement reorder level indicators (1.5 hours)
- [ ] **Task 1.8.4** - Create stock valuation report (2.5 hours)
- [ ] **Task 1.8.5** - Build material usage by project report (2 hours)
- [ ] **Task 1.8.6** - Implement ABC analysis logic (2 hours)
- [ ] **Task 1.8.7** - Create stock aging report (2 hours)

#### Day 18-19: Charts & Visualizations
- [ ] **Task 1.9.1** - Create material consumption trends chart (2 hours)
- [ ] **Task 1.9.2** - Build LowStockAlert.jsx component (1.5 hours)
- [ ] **Task 1.9.3** - Add inventory dashboard widgets (2 hours)
- [ ] **Task 1.9.4** - Create inventory value gauge chart (1.5 hours)
- [ ] **Task 1.9.5** - Implement waste tracking report (2 hours)
- [ ] **Task 1.9.6** - Add material category breakdown pie chart (1.5 hours)

#### Day 20: Integration & Testing
- [ ] **Task 1.10.1** - Link materials to paymentsOut (expenses) (2 hours)
- [ ] **Task 1.10.2** - Link stock OUT to projects (1.5 hours)
- [ ] **Task 1.10.3** - Add material costs to project expenses (2 hours)
- [ ] **Task 1.10.4** - Update dashboard with inventory metrics (1.5 hours)
- [ ] **Task 1.10.5** - Add low stock alerts to dashboard (1 hour)
- [ ] **Task 1.10.6** - Test all CRUD operations (1 hour)
- [ ] **Task 1.10.7** - Test running balance calculations (1 hour)
- [ ] **Task 1.10.8** - Performance testing with 500+ materials (30 mins)

---

## 2. LABOR/TIME TRACKING & PAYROLL

**Total Duration:** 5-6 weeks (25-30 working days)

### Week 1: Worker Database (5 days)

#### Day 1-2: Database & Worker Schema
- [ ] **Task 2.1.1** - Design workers and related schemas (2 hours)
- [ ] **Task 2.1.2** - Add `workers` table to Dexie (1.5 hours)
- [ ] **Task 2.1.3** - Add `attendance` table to Dexie (1 hour)
- [ ] **Task 2.1.4** - Add `timeSheets` table to Dexie (1 hour)
- [ ] **Task 2.1.5** - Add `payroll` table to Dexie (1.5 hours)
- [ ] **Task 2.1.6** - Add `leaveManagement` table to Dexie (1 hour)
- [ ] **Task 2.1.7** - Add `workerAdvances` table to Dexie (1 hour)
- [ ] **Task 2.1.8** - Create database migration script (2 hours)
- [ ] **Task 2.1.9** - Test all database operations (1 hour)

#### Day 3: Worker Backend Logic
- [ ] **Task 2.2.1** - Create workerUtils.js utility functions (2 hours)
- [ ] **Task 2.2.2** - Implement worker code auto-generation (WKR-001) (1 hour)
- [ ] **Task 2.2.3** - Create skill category constants (1 hour)
- [ ] **Task 2.2.4** - Implement worker validation (Aadhar, PAN) (2 hours)
- [ ] **Task 2.2.5** - Create worker CRUD operations (2 hours)

#### Day 4-5: Worker Master UI
- [ ] **Task 2.3.1** - Create WorkersPage.jsx skeleton (1 hour)
- [ ] **Task 2.3.2** - Build WorkerForm.jsx component (4 hours)
- [ ] **Task 2.3.3** - Add photo upload functionality (2 hours)
- [ ] **Task 2.3.4** - Create skill category and level dropdowns (1.5 hours)
- [ ] **Task 2.3.5** - Build WorkerList.jsx with filters (2.5 hours)
- [ ] **Task 2.3.6** - Create WorkerCard.jsx detail view (2 hours)
- [ ] **Task 2.3.7** - Implement worker search functionality (1.5 hours)
- [ ] **Task 2.3.8** - Add worker import from Excel (2 hours)
- [ ] **Task 2.3.9** - Add worker export functionality (1 hour)

### Week 2: Attendance System (5 days)

#### Day 6-7: Attendance Backend
- [ ] **Task 2.4.1** - Create attendanceUtils.js utility functions (2 hours)
- [ ] **Task 2.4.2** - Implement work hours calculation logic (1.5 hours)
- [ ] **Task 2.4.3** - Create attendance CRUD operations (2 hours)
- [ ] **Task 2.4.4** - Implement overtime calculation logic (2 hours)
- [ ] **Task 2.4.5** - Create attendance validation (1.5 hours)
- [ ] **Task 2.4.6** - Implement bulk attendance operations (2 hours)

#### Day 8-10: Attendance UI
- [ ] **Task 2.5.1** - Create AttendancePage.jsx (1 hour)
- [ ] **Task 2.5.2** - Build AttendanceForm.jsx component (2.5 hours)
- [ ] **Task 2.5.3** - Create check-in/check-out time picker (1.5 hours)
- [ ] **Task 2.5.4** - Build AttendanceSheet.jsx grid view (4 hours)
- [ ] **Task 2.5.5** - Implement bulk attendance marking (3 hours)
- [ ] **Task 2.5.6** - Add attendance status selector (1.5 hours)
- [ ] **Task 2.5.7** - Create attendance calendar view (3 hours)
- [ ] **Task 2.5.8** - Add attendance filters (date, project, worker) (2 hours)
- [ ] **Task 2.5.9** - Build attendance summary dashboard (2 hours)

### Week 3: Time Sheets (5 days)

#### Day 11-12: Time Sheet Backend
- [ ] **Task 2.6.1** - Create time sheet data structure (1 hour)
- [ ] **Task 2.6.2** - Implement weekly time sheet generation (2 hours)
- [ ] **Task 2.6.3** - Auto-populate from attendance data (2.5 hours)
- [ ] **Task 2.6.4** - Calculate regular and overtime hours (2 hours)
- [ ] **Task 2.6.5** - Create time sheet approval workflow (2 hours)
- [ ] **Task 2.6.6** - Implement time sheet validation (1.5 hours)

#### Day 13-15: Time Sheet UI
- [ ] **Task 2.7.1** - Create TimeSheetsPage.jsx (1 hour)
- [ ] **Task 2.7.2** - Build TimeSheetForm.jsx component (3 hours)
- [ ] **Task 2.7.3** - Create weekly time entry grid (3 hours)
- [ ] **Task 2.7.4** - Add project-wise time allocation (2 hours)
- [ ] **Task 2.7.5** - Implement time sheet submission workflow (2 hours)
- [ ] **Task 2.7.6** - Create TimeSheetList.jsx with filters (2 hours)
- [ ] **Task 2.7.7** - Build time sheet approval interface (2 hours)
- [ ] **Task 2.7.8** - Add time sheet export to PDF/Excel (2 hours)

### Week 4: Payroll System (5 days)

#### Day 16-17: Payroll Calculations
- [ ] **Task 2.8.1** - Create payrollUtils.js utility functions (2 hours)
- [ ] **Task 2.8.2** - Implement hourly wage calculation (1.5 hours)
- [ ] **Task 2.8.3** - Implement daily wage calculation (1.5 hours)
- [ ] **Task 2.8.4** - Implement monthly wage calculation (1.5 hours)
- [ ] **Task 2.8.5** - Implement overtime calculation (2 hours)
- [ ] **Task 2.8.6** - Create PF deduction calculation (1.5 hours)
- [ ] **Task 2.8.7** - Create ESI deduction calculation (1.5 hours)
- [ ] **Task 2.8.8** - Create TDS deduction calculation (2 hours)
- [ ] **Task 2.8.9** - Implement advance deduction logic (1.5 hours)

#### Day 18-20: Payroll UI & PDF
- [ ] **Task 2.9.1** - Create PayrollPage.jsx (1 hour)
- [ ] **Task 2.9.2** - Build PayrollForm.jsx component (3 hours)
- [ ] **Task 2.9.3** - Implement payroll number generation (PAY-YYYYMM-001) (1 hour)
- [ ] **Task 2.9.4** - Create wage components editor (earnings/deductions) (3 hours)
- [ ] **Task 2.9.5** - Add real-time net pay calculation (1.5 hours)
- [ ] **Task 2.9.6** - Build bulk payroll generation (3 hours)
- [ ] **Task 2.9.7** - Create PayrollList.jsx with filters (2 hours)
- [ ] **Task 2.9.8** - Implement payroll approval workflow (2 hours)
- [ ] **Task 2.9.9** - Create payslip PDF template (3 hours)
- [ ] **Task 2.9.10** - Build payslip generation with jsPDF (2 hours)

### Week 5: Leave & Advances (5 days)

#### Day 21-22: Leave Management
- [ ] **Task 2.10.1** - Create leave management backend logic (2 hours)
- [ ] **Task 2.10.2** - Implement leave balance tracking (2 hours)
- [ ] **Task 2.10.3** - Create LeavesPage.jsx (1 hour)
- [ ] **Task 2.10.4** - Build LeaveForm.jsx component (2 hours)
- [ ] **Task 2.10.5** - Implement leave approval workflow (2 hours)
- [ ] **Task 2.10.6** - Create leave calendar view (2 hours)
- [ ] **Task 2.10.7** - Add leave type management (1.5 hours)
- [ ] **Task 2.10.8** - Build leave quota system (2 hours)

#### Day 23-24: Worker Advances
- [ ] **Task 2.11.1** - Create advance management backend (2 hours)
- [ ] **Task 2.11.2** - Implement advance repayment logic (2 hours)
- [ ] **Task 2.11.3** - Build AdvanceForm.jsx component (2 hours)
- [ ] **Task 2.11.4** - Create advance approval workflow (2 hours)
- [ ] **Task 2.11.5** - Add advance history view (2 hours)
- [ ] **Task 2.11.6** - Implement auto-deduction from payroll (2 hours)
- [ ] **Task 2.11.7** - Create advance repayment tracker (2 hours)

#### Day 25: Integration & Testing
- [ ] **Task 2.12.1** - Link labor costs to project expenses (2 hours)
- [ ] **Task 2.12.2** - Add payroll to paymentsOut (2 hours)
- [ ] **Task 2.12.3** - Update dashboard with labor metrics (2 hours)
- [ ] **Task 2.12.4** - Link workers to projects (1 hour)
- [ ] **Task 2.12.5** - Test all payroll calculations (1.5 hours)
- [ ] **Task 2.12.6** - Test leave workflows (1 hour)
- [ ] **Task 2.12.7** - Performance testing (30 mins)

---

## 3. BUDGET PLANNING & FORECASTING

**Total Duration:** 5-6 weeks (25-30 working days)

### Week 1: Database & Core Setup (5 days)

#### Day 1-2: Database Schema
- [ ] **Task 3.1.1** - Design budget database schemas (2 hours)
- [ ] **Task 3.1.2** - Add `projectBudgets` table to Dexie (1 hour)
- [ ] **Task 3.1.3** - Add `budgetLineItems` table to Dexie (1 hour)
- [ ] **Task 3.1.4** - Add `budgetAlerts` table to Dexie (1 hour)
- [ ] **Task 3.1.5** - Add `budgetRevisions` table to Dexie (1 hour)
- [ ] **Task 3.1.6** - Add `costForecasts` table to Dexie (1 hour)
- [ ] **Task 3.1.7** - Create migration script (2 hours)
- [ ] **Task 3.1.8** - Test database operations (1 hour)

#### Day 3-4: Budget Backend Logic
- [ ] **Task 3.2.1** - Create budgetUtils.js utility functions (2 hours)
- [ ] **Task 3.2.2** - Implement budget version tracking (2 hours)
- [ ] **Task 3.2.3** - Create budget approval workflow logic (2 hours)
- [ ] **Task 3.2.4** - Implement budget line item calculations (2 hours)
- [ ] **Task 3.2.5** - Create variance calculation logic (2 hours)
- [ ] **Task 3.2.6** - Implement budget utilization tracking (2 hours)
- [ ] **Task 3.2.7** - Create available budget calculator (2 hours)

#### Day 5: Budget Context & Utilities
- [ ] **Task 3.3.1** - Create BudgetContext.jsx (1.5 hours)
- [ ] **Task 3.3.2** - Create varianceUtils.js (1.5 hours)
- [ ] **Task 3.3.3** - Create forecastUtils.js (2 hours)
- [ ] **Task 3.3.4** - Create evmUtils.js (EVM calculations) (3 hours)

### Week 2: Budget Planning UI (5 days)

#### Day 6-8: Budget Creation
- [ ] **Task 3.4.1** - Create BudgetPlanningPage.jsx (1 hour)
- [ ] **Task 3.4.2** - Build BudgetForm.jsx component (3 hours)
- [ ] **Task 3.4.3** - Create BudgetLineItemsTable.jsx (4 hours)
- [ ] **Task 3.4.4** - Build LineItemForm.jsx component (2 hours)
- [ ] **Task 3.4.5** - Implement category-wise breakdown (2 hours)
- [ ] **Task 3.4.6** - Add department selector per line item (1.5 hours)
- [ ] **Task 3.4.7** - Create budget templates (residential, commercial) (3 hours)
- [ ] **Task 3.4.8** - Implement budget import from Excel (3 hours)
- [ ] **Task 3.4.9** - Add budget duplication feature (2 hours)

#### Day 9-10: Budget Approval & Versioning
- [ ] **Task 3.5.1** - Build budget approval interface (2 hours)
- [ ] **Task 3.5.2** - Create BudgetApprovalModal.jsx (2 hours)
- [ ] **Task 3.5.3** - Implement budget version comparison (3 hours)
- [ ] **Task 3.5.4** - Add budget notes and attachments (2 hours)
- [ ] **Task 3.5.5** - Create budget summary card (2 hours)
- [ ] **Task 3.5.6** - Build budget list with filters (2 hours)

### Week 3: Budget Tracking (5 days)

#### Day 11-13: Tracking & Variance
- [ ] **Task 3.6.1** - Create BudgetTrackingPage.jsx (1 hour)
- [ ] **Task 3.6.2** - Build budget vs. actual dashboard (3 hours)
- [ ] **Task 3.6.3** - Implement real-time utilization tracking (2 hours)
- [ ] **Task 3.6.4** - Link expenses to budget line items (3 hours)
- [ ] **Task 3.6.5** - Link purchase orders to budget (committed costs) (2 hours)
- [ ] **Task 3.6.6** - Calculate available budget (2 hours)
- [ ] **Task 3.6.7** - Create VarianceAnalysisChart.jsx (3 hours)
- [ ] **Task 3.6.8** - Build BudgetVsActualChart.jsx (2 hours)
- [ ] **Task 3.6.9** - Add drill-down by category/department (3 hours)

#### Day 14-15: Budget Reallocation
- [ ] **Task 3.7.1** - Implement budget reallocation feature (2 hours)
- [ ] **Task 3.7.2** - Create budget utilization charts (2 hours)
- [ ] **Task 3.7.3** - Build budget utilization gauge (1.5 hours)
- [ ] **Task 3.7.4** - Add budget variance table (2 hours)
- [ ] **Task 3.7.5** - Create category-wise breakdown chart (2 hours)

### Week 4: Alerts & Revisions (5 days)

#### Day 16-17: Budget Alerts
- [ ] **Task 3.8.1** - Create BudgetAlertsPage.jsx (1 hour)
- [ ] **Task 3.8.2** - Implement threshold-based alert generation (3 hours)
- [ ] **Task 3.8.3** - Create BudgetAlertCard.jsx component (2 hours)
- [ ] **Task 3.8.4** - Build alert dashboard widget (2 hours)
- [ ] **Task 3.8.5** - Implement alert acknowledgment (2 hours)
- [ ] **Task 3.8.6** - Add alert history view (2 hours)
- [ ] **Task 3.8.7** - Create alert preferences (per user) (2 hours)

#### Day 18-20: Budget Revisions
- [ ] **Task 3.9.1** - Create budget revision workflow (2 hours)
- [ ] **Task 3.9.2** - Build BudgetRevisionForm.jsx (3 hours)
- [ ] **Task 3.9.3** - Implement change tracking (2 hours)
- [ ] **Task 3.9.4** - Add revision approval process (2 hours)
- [ ] **Task 3.9.5** - Create revision history view (2 hours)
- [ ] **Task 3.9.6** - Build revision comparison report (3 hours)
- [ ] **Task 3.9.7** - Add rollback to previous version (2 hours)
- [ ] **Task 3.9.8** - Track revision metadata (who, when, why) (2 hours)

### Week 5: Forecasting & EVM (5 days)

#### Day 21-23: Forecasting
- [ ] **Task 3.10.1** - Create BudgetForecastsPage.jsx (1 hour)
- [ ] **Task 3.10.2** - Implement linear forecasting algorithm (2 hours)
- [ ] **Task 3.10.3** - Implement weighted average forecasting (2 hours)
- [ ] **Task 3.10.4** - Calculate Planned Value (PV) (1.5 hours)
- [ ] **Task 3.10.5** - Calculate Earned Value (EV) (2 hours)
- [ ] **Task 3.10.6** - Calculate Actual Cost (AC) (1.5 hours)
- [ ] **Task 3.10.7** - Calculate CPI (Cost Performance Index) (1 hour)
- [ ] **Task 3.10.8** - Calculate SPI (Schedule Performance Index) (1 hour)
- [ ] **Task 3.10.9** - Calculate EAC (Estimate At Completion) (2 hours)
- [ ] **Task 3.10.10** - Calculate ETC (Estimate To Complete) (1.5 hours)
- [ ] **Task 3.10.11** - Build EVMDashboard.jsx component (3 hours)
- [ ] **Task 3.10.12** - Create ForecastChart.jsx (2 hours)

#### Day 24-25: Cash Flow & Integration
- [ ] **Task 3.11.1** - Implement cash flow projection (3 hours)
- [ ] **Task 3.11.2** - Create CashFlowChart.jsx (2 hours)
- [ ] **Task 3.11.3** - Add "what-if" scenario analysis (3 hours)
- [ ] **Task 3.11.4** - Link budget to paymentsOut (2 hours)
- [ ] **Task 3.11.5** - Link budget to purchase orders (2 hours)
- [ ] **Task 3.11.6** - Link budget to material costs (2 hours)
- [ ] **Task 3.11.7** - Link budget to labor/payroll (2 hours)
- [ ] **Task 3.11.8** - Update project dashboard with budget metrics (2 hours)
- [ ] **Task 3.11.9** - Create budget widget for project page (1.5 hours)
- [ ] **Task 3.11.10** - Test all calculations and workflows (2 hours)

---

## 4. RETENTION MANAGEMENT

**Total Duration:** 3-4 weeks (15-20 working days)

### Week 1: Database & Policies (5 days)

#### Day 1-2: Database Schema
- [ ] **Task 4.1.1** - Design retention database schemas (2 hours)
- [ ] **Task 4.1.2** - Add `retentionPolicies` table to Dexie (1 hour)
- [ ] **Task 4.1.3** - Add `retentionAccounts` table to Dexie (1 hour)
- [ ] **Task 4.1.4** - Add `retentionReleases` table to Dexie (1 hour)
- [ ] **Task 4.1.5** - Add `retentionAlerts` table to Dexie (1 hour)
- [ ] **Task 4.1.6** - Create migration script (1.5 hours)
- [ ] **Task 4.1.7** - Test database operations (1 hour)

#### Day 3-4: Retention Backend Logic
- [ ] **Task 4.2.1** - Create retentionUtils.js utility functions (2 hours)
- [ ] **Task 4.2.2** - Implement retention calculation logic (2 hours)
- [ ] **Task 4.2.3** - Create retention schedule calculator (2 hours)
- [ ] **Task 4.2.4** - Implement defect liability period tracking (1.5 hours)
- [ ] **Task 4.2.5** - Create warranty period tracking (1.5 hours)
- [ ] **Task 4.2.6** - Implement retention validation (1 hour)

#### Day 5: Retention Policies UI
- [ ] **Task 4.3.1** - Create RetentionPoliciesPage.jsx (1 hour)
- [ ] **Task 4.3.2** - Build RetentionPolicyForm.jsx (3 hours)
- [ ] **Task 4.3.3** - Create release schedule builder (2 hours)
- [ ] **Task 4.3.4** - Add default policies (5%, 10%, custom) (1.5 hours)
- [ ] **Task 4.3.5** - Build RetentionPolicyList.jsx (1.5 hours)

### Week 2: Retention Accounts (5 days)

#### Day 6-8: Auto-Creation & Tracking
- [ ] **Task 4.4.1** - Create RetentionAccountsPage.jsx (1 hour)
- [ ] **Task 4.4.2** - Implement auto-create on invoice generation (2 hours)
- [ ] **Task 4.4.3** - Implement auto-create on payment receipt (2 hours)
- [ ] **Task 4.4.4** - Link retention to projects (1.5 hours)
- [ ] **Task 4.4.5** - Calculate retention amounts automatically (2 hours)
- [ ] **Task 4.4.6** - Create RetentionAccountCard.jsx (2 hours)
- [ ] **Task 4.4.7** - Build retention account detail view (2 hours)
- [ ] **Task 4.4.8** - Add retention history view (2 hours)
- [ ] **Task 4.4.9** - Implement retention filters (party, project, status) (2 hours)
- [ ] **Task 4.4.10** - Create RetentionSummaryWidget.jsx (2 hours)

#### Day 9-10: Release Schedules
- [ ] **Task 4.5.1** - Create RetentionScheduleTimeline.jsx (3 hours)
- [ ] **Task 4.5.2** - Implement scheduled release logic (2 hours)
- [ ] **Task 4.5.3** - Add milestone-based release (2 hours)
- [ ] **Task 4.5.4** - Create time-based release scheduler (2 hours)
- [ ] **Task 4.5.5** - Build warranty-end release logic (2 hours)

### Week 3: Release Management (5 days)

#### Day 11-13: Release Workflow
- [ ] **Task 4.6.1** - Create RetentionReleasesPage.jsx (1 hour)
- [ ] **Task 4.6.2** - Build RetentionReleaseForm.jsx (2.5 hours)
- [ ] **Task 4.6.3** - Implement manual release capability (2 hours)
- [ ] **Task 4.6.4** - Create release approval workflow (2 hours)
- [ ] **Task 4.6.5** - Generate release certificates/receipts (3 hours)
- [ ] **Task 4.6.6** - Link releases to paymentsOut (2 hours)
- [ ] **Task 4.6.7** - Update retention balance on release (1.5 hours)
- [ ] **Task 4.6.8** - Add bulk release feature (2 hours)
- [ ] **Task 4.6.9** - Build RetentionReleaseList.jsx (2 hours)

#### Day 14-15: Alerts & Reports
- [ ] **Task 4.7.1** - Implement due date alert generation (2 hours)
- [ ] **Task 4.7.2** - Add overdue retention alerts (1.5 hours)
- [ ] **Task 4.7.3** - Create warranty expiry alerts (1.5 hours)
- [ ] **Task 4.7.4** - Build alert dashboard widget (2 hours)
- [ ] **Task 4.7.5** - Create retention summary report (2 hours)
- [ ] **Task 4.7.6** - Build retention receivables aging report (2 hours)
- [ ] **Task 4.7.7** - Add retention payables report (2 hours)
- [ ] **Task 4.7.8** - Create retention release schedule report (2 hours)

### Week 4: Integration & Testing (5 days)

#### Day 16-18: Integration
- [ ] **Task 4.8.1** - Integrate retention with invoice generation (3 hours)
- [ ] **Task 4.8.2** - Add retention field to invoice form (2 hours)
- [ ] **Task 4.8.3** - Auto-calculate invoice after retention (2 hours)
- [ ] **Task 4.8.4** - Display retention on invoice PDF (2 hours)
- [ ] **Task 4.8.5** - Integrate retention with payments (2 hours)
- [ ] **Task 4.8.6** - Track retention on paymentsIn (2 hours)
- [ ] **Task 4.8.7** - Track retention on paymentsOut (suppliers) (2 hours)
- [ ] **Task 4.8.8** - Add retention to project financials (2 hours)

#### Day 19-20: Testing & Polish
- [ ] **Task 4.9.1** - Test policy creation (1 hour)
- [ ] **Task 4.9.2** - Test retention calculations (1 hour)
- [ ] **Task 4.9.3** - Test automatic account creation (1 hour)
- [ ] **Task 4.9.4** - Test release workflows (1 hour)
- [ ] **Task 4.9.5** - Test alert generation (1 hour)
- [ ] **Task 4.9.6** - Test reports accuracy (1 hour)
- [ ] **Task 4.9.7** - Mobile responsiveness testing (1 hour)
- [ ] **Task 4.9.8** - Performance testing (1 hour)

---

## 5. CHANGE ORDERS

**Total Duration:** 3-4 weeks (15-20 working days)

### Week 1: Database & Core (5 days)

#### Day 1-2: Database Schema
- [ ] **Task 5.1.1** - Design change order schemas (2 hours)
- [ ] **Task 5.1.2** - Add `changeOrders` table to Dexie (1 hour)
- [ ] **Task 5.1.3** - Add `changeOrderLineItems` table to Dexie (1 hour)
- [ ] **Task 5.1.4** - Add `changeOrderHistory` table to Dexie (1 hour)
- [ ] **Task 5.1.5** - Add `changeOrderImpacts` table to Dexie (1 hour)
- [ ] **Task 5.1.6** - Create migration script (1.5 hours)
- [ ] **Task 5.1.7** - Test database operations (1 hour)

#### Day 3-4: Change Order Backend
- [ ] **Task 5.2.1** - Create changeOrderUtils.js (2 hours)
- [ ] **Task 5.2.2** - Implement CO number generation (CO-PROJ-001) (1 hour)
- [ ] **Task 5.2.3** - Create CO validation logic (1.5 hours)
- [ ] **Task 5.2.4** - Implement CO status workflow (2 hours)
- [ ] **Task 5.2.5** - Create cost impact calculator (2 hours)
- [ ] **Task 5.2.6** - Create time impact calculator (2 hours)
- [ ] **Task 5.2.7** - Implement budget impact logic (2 hours)
- [ ] **Task 5.2.8** - Create coImpactCalculator.js (2 hours)

#### Day 5: Change Order Form
- [ ] **Task 5.3.1** - Create ChangeOrdersPage.jsx (1 hour)
- [ ] **Task 5.3.2** - Build ChangeOrderForm.jsx (4 hours)
- [ ] **Task 5.3.3** - Add project and customer selector (1.5 hours)
- [ ] **Task 5.3.4** - Create reason and category dropdowns (1.5 hours)

### Week 2: Impact Analysis & UI (5 days)

#### Day 6-8: Impact Analysis
- [ ] **Task 5.4.1** - Create ImpactAnalysis.jsx component (3 hours)
- [ ] **Task 5.4.2** - Build cost impact breakdown (2 hours)
- [ ] **Task 5.4.3** - Build time impact calculator (2 hours)
- [ ] **Task 5.4.4** - Create budget impact visualization (2 hours)
- [ ] **Task 5.4.5** - Add risk assessment component (2 hours)
- [ ] **Task 5.4.6** - Implement mitigation tracking (2 hours)
- [ ] **Task 5.4.7** - Create COImpactChart.jsx (2 hours)
- [ ] **Task 5.4.8** - Build LineItemsTable.jsx for CO (3 hours)

#### Day 9-10: Approval & History
- [ ] **Task 5.5.1** - Create ApprovalWorkflow.jsx component (3 hours)
- [ ] **Task 5.5.2** - Implement multi-level approval (2 hours)
- [ ] **Task 5.5.3** - Add client approval tracking (2 hours)
- [ ] **Task 5.5.4** - Build rejection workflow (1.5 hours)
- [ ] **Task 5.5.5** - Create ChangeOrderTimeline.jsx history (2 hours)
- [ ] **Task 5.5.6** - Add approval history view (2 hours)
- [ ] **Task 5.5.7** - Build ChangeOrderList.jsx with filters (2 hours)

### Week 3: Integration & Documents (5 days)

#### Day 11-13: Budget & Timeline Integration
- [ ] **Task 5.6.1** - Link CO to project budget (2 hours)
- [ ] **Task 5.6.2** - Update budget on CO approval (2 hours)
- [ ] **Task 5.6.3** - Link CO to milestones (2 hours)
- [ ] **Task 5.6.4** - Update project timeline on CO approval (2 hours)
- [ ] **Task 5.6.5** - Link CO to invoices (additional billing) (2 hours)
- [ ] **Task 5.6.6** - Add CO widget to project page (2 hours)
- [ ] **Task 5.6.7** - Update dashboard with CO metrics (2 hours)
- [ ] **Task 5.6.8** - Create CO impact on project financials (2 hours)

#### Day 14-15: Documents & Reports
- [ ] **Task 5.7.1** - Add attachment upload to CO (1.5 hours)
- [ ] **Task 5.7.2** - Create CO PDF template (3 hours)
- [ ] **Task 5.7.3** - Build COPDFTemplate.jsx component (2 hours)
- [ ] **Task 5.7.4** - Generate CO approval documents (2 hours)
- [ ] **Task 5.7.5** - Add drawing references (1.5 hours)
- [ ] **Task 5.7.6** - Create CO summary report (2 hours)
- [ ] **Task 5.7.7** - Build CO impact analysis report (2 hours)
- [ ] **Task 5.7.8** - Add CO by project report (2 hours)

### Week 4: Testing & Polish (5 days)

#### Day 16-20: Testing
- [ ] **Task 5.8.1** - Test CO creation and submission (1 hour)
- [ ] **Task 5.8.2** - Test impact calculations (1 hour)
- [ ] **Task 5.8.3** - Test approval workflow (1 hour)
- [ ] **Task 5.8.4** - Test budget integration (1.5 hours)
- [ ] **Task 5.8.5** - Test timeline updates (1 hour)
- [ ] **Task 5.8.6** - Test PDF generation (1 hour)
- [ ] **Task 5.8.7** - Mobile responsiveness (1 hour)
- [ ] **Task 5.8.8** - Performance testing (1 hour)
- [ ] **Task 5.8.9** - End-to-end workflow testing (2 hours)

---

## 6. DOCUMENT MANAGEMENT

**Total Duration:** 4 weeks (20 working days)

### Week 1: Database & Upload (5 days)

#### Day 1-2: Database Schema
- [ ] **Task 6.1.1** - Design document management schemas (2 hours)
- [ ] **Task 6.1.2** - Add `documents` table to Dexie (1.5 hours)
- [ ] **Task 6.1.3** - Add `documentVersions` table to Dexie (1 hour)
- [ ] **Task 6.1.4** - Add `documentSharing` table to Dexie (1 hour)
- [ ] **Task 6.1.5** - Add `documentActivity` table to Dexie (1 hour)
- [ ] **Task 6.1.6** - Create migration script (1.5 hours)
- [ ] **Task 6.1.7** - Test database operations (1 hour)

#### Day 3-5: Upload & Validation
- [ ] **Task 6.2.1** - Create documentUtils.js utility functions (2 hours)
- [ ] **Task 6.2.2** - Create fileValidator.js (2 hours)
- [ ] **Task 6.2.3** - Implement document number generation (DOC-PROJ-001) (1 hour)
- [ ] **Task 6.2.4** - Build DocumentUpload.jsx component (3 hours)
- [ ] **Task 6.2.5** - Implement drag-and-drop upload (2 hours)
- [ ] **Task 6.2.6** - Add file validation (size, type) (2 hours)
- [ ] **Task 6.2.7** - Create progress bar for upload (1.5 hours)
- [ ] **Task 6.2.8** - Add multiple file upload (2 hours)
- [ ] **Task 6.2.9** - Implement thumbnail generation (2 hours)
- [ ] **Task 6.2.10** - Create document metadata form (2 hours)

### Week 2: Document Management UI (5 days)

#### Day 6-8: List & Detail Views
- [ ] **Task 6.3.1** - Create DocumentsPage.jsx (1 hour)
- [ ] **Task 6.3.2** - Build DocumentList.jsx component (3 hours)
- [ ] **Task 6.3.3** - Add table view with sorting (2 hours)
- [ ] **Task 6.3.4** - Create grid view option (2 hours)
- [ ] **Task 6.3.5** - Build DocumentCard.jsx component (2 hours)
- [ ] **Task 6.3.6** - Create DocumentDetailPage.jsx (2 hours)
- [ ] **Task 6.3.7** - Implement document editing metadata (2 hours)
- [ ] **Task 6.3.8** - Add document deletion (soft delete) (1.5 hours)
- [ ] **Task 6.3.9** - Implement document restore (1.5 hours)
- [ ] **Task 6.3.10** - Add bulk actions (delete, move, download) (3 hours)

#### Day 9-10: Document Viewer
- [ ] **Task 6.4.1** - Create DocumentViewer.jsx component (2 hours)
- [ ] **Task 6.4.2** - Implement PDF viewer (2 hours)
- [ ] **Task 6.4.3** - Implement image viewer with zoom (2 hours)
- [ ] **Task 6.4.4** - Add download functionality (1 hour)
- [ ] **Task 6.4.5** - Add share button (1 hour)
- [ ] **Task 6.4.6** - Create fullscreen mode (1.5 hours)
- [ ] **Task 6.4.7** - Build FolderTree.jsx navigation (3 hours)

### Week 3: Version Control & Search (5 days)

#### Day 11-13: Version Control
- [ ] **Task 6.5.1** - Implement version tracking logic (2 hours)
- [ ] **Task 6.5.2** - Create new version upload (2 hours)
- [ ] **Task 6.5.3** - Build DocumentVersions.jsx component (2 hours)
- [ ] **Task 6.5.4** - Create version comparison (3 hours)
- [ ] **Task 6.5.5** - Build version history view (2 hours)
- [ ] **Task 6.5.6** - Add rollback to previous version (2 hours)
- [ ] **Task 6.5.7** - Track changes between versions (2 hours)
- [ ] **Task 6.5.8** - Create version diff viewer (3 hours)

#### Day 14-15: Search & Filters
- [ ] **Task 6.6.1** - Create documentSearch.js utility (2 hours)
- [ ] **Task 6.6.2** - Implement full-text search (3 hours)
- [ ] **Task 6.6.3** - Build DocumentSearch.jsx component (2 hours)
- [ ] **Task 6.6.4** - Create DocumentFilter.jsx sidebar (2 hours)
- [ ] **Task 6.6.5** - Add category filters (1.5 hours)
- [ ] **Task 6.6.6** - Add date range filters (1.5 hours)
- [ ] **Task 6.6.7** - Add project filters (1 hour)
- [ ] **Task 6.6.8** - Add tag-based search (2 hours)
- [ ] **Task 6.6.9** - Implement advanced search (2 hours)

### Week 4: Sharing & Integration (5 days)

#### Day 16-18: Sharing & Permissions
- [ ] **Task 6.7.1** - Create DocumentSharing.jsx component (2 hours)
- [ ] **Task 6.7.2** - Implement share link generation (2 hours)
- [ ] **Task 6.7.3** - Add password protection for shares (2 hours)
- [ ] **Task 6.7.4** - Implement access level controls (2 hours)
- [ ] **Task 6.7.5** - Track document access (1.5 hours)
- [ ] **Task 6.7.6** - Add expiry for shared links (1.5 hours)
- [ ] **Task 6.7.7** - Create DocumentActivityLog.jsx (2 hours)
- [ ] **Task 6.7.8** - Build activity tracking (2 hours)

#### Day 19-20: Integration & Reports
- [ ] **Task 6.8.1** - Link documents to projects (2 hours)
- [ ] **Task 6.8.2** - Link documents to invoices (2 hours)
- [ ] **Task 6.8.3** - Link documents to change orders (2 hours)
- [ ] **Task 6.8.4** - Add document widget to project page (2 hours)
- [ ] **Task 6.8.5** - Add recent documents to dashboard (1.5 hours)
- [ ] **Task 6.8.6** - Create document register report (2 hours)
- [ ] **Task 6.8.7** - Build storage usage report (1.5 hours)
- [ ] **Task 6.8.8** - Test all functionality (2 hours)
- [ ] **Task 6.8.9** - Mobile responsiveness (1 hour)
- [ ] **Task 6.8.10** - Performance testing (1 hour)

---

# 📊 SUMMARY: CRITICAL FEATURES TASK BREAKDOWN

| Feature | Total Days | Total Tasks | Avg Tasks/Day |
|---------|-----------|-------------|---------------|
| 1. Material/Inventory Management | 20 days | 92 tasks | 4-5 tasks |
| 2. Labor/Time Tracking & Payroll | 25 days | 107 tasks | 4-5 tasks |
| 3. Budget Planning & Forecasting | 25 days | 95 tasks | 3-4 tasks |
| 4. Retention Management | 20 days | 79 tasks | 4 tasks |
| 5. Change Orders | 20 days | 71 tasks | 3-4 tasks |
| 6. Document Management | 20 days | 77 tasks | 3-4 tasks |
| **TOTAL CRITICAL** | **130 days** | **521 tasks** | **4 tasks/day** |

---

# 🟡 MEDIUM PRIORITY FEATURES - TASK BREAKDOWN

(Similar detailed breakdown for Medium Priority features - summarized here for brevity)

## 1. Recurring Invoices & Advanced Features: 25-30 days, ~95 tasks
## 2. Advanced Tax Management: 25-30 days, ~110 tasks
## 3. Audit Trail & Activity Log: 25-30 days, ~90 tasks
## 4. Notifications & Alerts: 30 days, ~120 tasks
## 5. Task/Work Order Management: 20-25 days, ~85 tasks
## 6. Multi-Currency Support: 15-20 days, ~60 tasks

**TOTAL MEDIUM: 140-165 days, ~560 tasks**

---

# 🟢 NICE TO HAVE FEATURES - TASK BREAKDOWN

(High-level breakdown for Nice-to-Have features)

## 1. Advanced Search: 15-20 days, ~50 tasks
## 2. Payment Gateway: 20 days, ~65 tasks
## 3. Collaboration: 15-20 days, ~55 tasks
## 4. Custom Fields: 15 days, ~40 tasks
## 5. PWA Enhancement: 15 days, ~45 tasks
## 6. API & Integrations: 25-30 days, ~100 tasks
## 7. Dashboard Widgets: 15-20 days, ~50 tasks
## 8. Client Portal: 20-25 days, ~75 tasks
## 9. Mobile App: 40-60 days, ~150 tasks
## 10. AI/ML Features: 30-40 days, ~120 tasks
## 11. Advanced Reporting: 25-30 days, ~85 tasks
## 12. White-Label: 30-40 days, ~110 tasks

**TOTAL NICE-TO-HAVE: 265-360 days, ~945 tasks**

---

# 🎯 OVERALL PROJECT BREAKDOWN

| Priority | Days | Tasks | Working Months (20 days/month) |
|----------|------|-------|--------------------------------|
| **Critical** | 130 | 521 | 6.5 months |
| **Medium** | 140-165 | 560 | 7-8 months |
| **Nice-to-Have** | 265-360 | 945 | 13-18 months |
| **TOTAL** | **535-655 days** | **2,026 tasks** | **27-33 months** |

---

# 💡 TASK ESTIMATION GUIDELINES

### Task Duration Standards:
- **Simple Task (UI component):** 1-2 hours
- **Medium Task (Logic + UI):** 2-4 hours
- **Complex Task (Algorithm/Integration):** 4-8 hours
- **Average Tasks per Day:** 3-5 tasks (assuming 8-hour workday)

### Task Types:
1. **Database Tasks:** Schema design, migration, testing
2. **Backend Logic:** Calculations, validation, business logic
3. **UI Components:** Forms, lists, cards, modals
4. **Integration Tasks:** Linking modules, data flow
5. **Testing Tasks:** Unit, integration, E2E testing

### Team Allocation Recommendations:
- **1 Developer:** 130 days = 6.5 months (Critical only)
- **2 Developers:** 65 days = 3.25 months (Critical only)
- **Full Team (4-5 devs):** 26-33 days = 1.5-2 months (Critical only)

---

# 📝 USAGE NOTES

1. **Each task is estimated to be completable within 1-8 hours**
2. **Tasks are grouped by days for easier sprint planning**
3. **Dependencies are implicit in the sequential order**
4. **Testing tasks are included in each phase**
5. **Integration tasks are scheduled at logical checkpoints**

---

**Ready to start implementation? Use this breakdown for sprint planning, team allocation, and progress tracking!**

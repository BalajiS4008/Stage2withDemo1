# 🚨 CRITICAL FEATURES IMPLEMENTATION PLAN

## Priority: HIGH - Essential for Construction Billing Operations

These features are **critical** for a fully functional construction billing software. Without them, the application cannot effectively manage construction projects end-to-end.

---

## 1. MATERIAL/INVENTORY MANAGEMENT

### 📋 Overview
A comprehensive system to track materials, inventory levels, costs, and allocations to projects.

### 🎯 Business Value
- Prevent material wastage and theft
- Track material costs accurately
- Optimize inventory levels
- Generate purchase orders automatically
- Reduce project delays due to stock-outs

### 🗂️ Database Schema

```javascript
// materials table
{
  id: Auto-increment,
  materialCode: String (unique),
  name: String,
  description: String,
  category: String, // Cement, Steel, Sand, Bricks, Paint, etc.
  unit: String, // kg, ton, bag, cubic meter, sqft, pieces
  currentStock: Number,
  reorderLevel: Number,
  reorderQuantity: Number,
  unitPrice: Number,
  supplier: String (FK to parties),
  location: String, // Warehouse/Site location
  lastPurchaseDate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// stockTransactions table
{
  id: Auto-increment,
  materialId: Number (FK),
  transactionType: String, // 'IN', 'OUT', 'ADJUSTMENT', 'RETURN'
  quantity: Number,
  unit: String,
  rate: Number,
  amount: Number,
  projectId: Number (FK, optional),
  supplierId: Number (FK, optional for IN),
  departmentId: Number (FK, optional for OUT),
  referenceNumber: String, // PO number, Bill number
  transactionDate: Date,
  remarks: String,
  attachments: Array,
  userId: Number (FK),
  runningBalance: Number, // Auto-calculated
  createdAt: Date
}

// purchaseOrders table
{
  id: Auto-increment,
  poNumber: String (unique, auto-generated),
  supplierId: Number (FK),
  projectId: Number (FK, optional),
  items: Array [ // Line items
    {
      materialId: Number,
      quantity: Number,
      unit: String,
      rate: Number,
      amount: Number,
      description: String
    }
  ],
  subtotal: Number,
  taxAmount: Number,
  totalAmount: Number,
  status: String, // DRAFT, SENT, APPROVED, RECEIVED, CANCELLED
  orderDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  deliveryAddress: String,
  terms: String,
  notes: String,
  approvedBy: Number (FK to users),
  approvedDate: Date,
  createdBy: Number (FK),
  createdAt: Date,
  updatedAt: Date
}

// materialAllocation table (Optional - for project-specific tracking)
{
  id: Auto-increment,
  projectId: Number (FK),
  materialId: Number (FK),
  allocatedQuantity: Number,
  usedQuantity: Number,
  returnedQuantity: Number,
  wastedQuantity: Number,
  budgetedCost: Number,
  actualCost: Number,
  allocationDate: Date,
  notes: String
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── MaterialsPage.jsx          // Main materials management page
│   ├── StockTransactionsPage.jsx  // Stock in/out transactions
│   ├── PurchaseOrdersPage.jsx     // Purchase order management
│   └── InventoryReportsPage.jsx   // Inventory reports & analytics
├── components/
│   ├── materials/
│   │   ├── MaterialForm.jsx       // Add/Edit material modal
│   │   ├── MaterialList.jsx       // Materials table with search
│   │   ├── MaterialCard.jsx       // Material detail card
│   │   ├── StockTransactionForm.jsx
│   │   ├── StockTransactionList.jsx
│   │   ├── PurchaseOrderForm.jsx
│   │   ├── PurchaseOrderList.jsx
│   │   ├── POLineItems.jsx        // PO line item editor
│   │   ├── LowStockAlert.jsx      // Alert component
│   │   └── MaterialSelector.jsx   // Dropdown for selecting materials
├── utils/
│   ├── materialUtils.js           // Material calculations
│   ├── stockUtils.js              // Stock balance calculations
│   └── poGenerator.js             // PO number generation
└── contexts/
    └── MaterialContext.jsx        // Material state management
```

### 🔧 Implementation Steps

#### **Phase 1: Database Setup (Week 1)**
1. Add material schema to Dexie database
2. Add stockTransactions schema
3. Add purchaseOrders schema
4. Add materialAllocation schema
5. Create database migration script
6. Test database operations

#### **Phase 2: Material Master (Week 1-2)**
1. Create MaterialsPage with CRUD operations
2. Build MaterialForm component
3. Build MaterialList with pagination and search
4. Implement material categories dropdown
5. Add unit of measurement selector
6. Create material detail view
7. Add material import from Excel/CSV
8. Add material export functionality

#### **Phase 3: Stock Transactions (Week 2-3)**
1. Create StockTransactionsPage
2. Build StockTransactionForm (IN/OUT/ADJUSTMENT)
3. Implement stock IN workflow:
   - Link to purchase orders
   - Link to suppliers
   - Auto-update material stock
4. Implement stock OUT workflow:
   - Link to projects
   - Link to departments
   - Deduct from stock
5. Add running balance calculation
6. Add transaction history view
7. Add filters (date range, type, material)
8. Add bulk stock adjustment feature

#### **Phase 4: Purchase Orders (Week 3-4)**
1. Create PurchaseOrdersPage
2. Build PurchaseOrderForm with line items
3. Implement PO number auto-generation (PO-YYYYMM-001)
4. Add PO approval workflow
5. Create PO PDF template with company branding
6. Add PO status tracking (Draft → Sent → Approved → Received)
7. Link PO to stock IN transactions
8. Add PO to invoice conversion
9. Implement PO search and filters
10. Add PO export to PDF/Excel

#### **Phase 5: Inventory Analytics (Week 4)**
1. Create InventoryReportsPage
2. Build low stock alert system
3. Add reorder level indicators
4. Create stock valuation report
5. Add material usage by project report
6. Build ABC analysis (A: high value, B: medium, C: low)
7. Add stock aging report
8. Create material consumption trends chart
9. Add waste tracking report

#### **Phase 6: Integration (Week 4-5)**
1. Integrate materials with paymentsOut (expenses)
2. Link stock OUT to projects
3. Add material costs to project expenses
4. Update dashboard with inventory metrics
5. Add low stock alerts to dashboard
6. Create material cost allocation to departments

#### **Phase 7: Testing & Refinement (Week 5)**
1. Test all CRUD operations
2. Test running balance calculations
3. Test PO workflow end-to-end
4. Test stock IN/OUT scenarios
5. Performance testing with 1000+ materials
6. UI/UX refinement
7. Mobile responsiveness testing

### 🎨 UI/UX Features

- **Materials Dashboard:**
  - Total materials count
  - Low stock alerts count
  - Total inventory value
  - Recent transactions

- **Material Card:**
  - Material name and code
  - Current stock with color coding (red if below reorder level)
  - Unit price
  - Last purchase date
  - Quick actions (Add Stock, Remove Stock, Edit)

- **Stock Transaction Form:**
  - Transaction type selector (IN/OUT/ADJUSTMENT)
  - Material selector with search
  - Quantity input with unit display
  - Rate input (for IN transactions)
  - Project selector (for OUT transactions)
  - Reference number input
  - Attachment upload
  - Auto-calculation of amount

- **Purchase Order Form:**
  - Supplier selector
  - Line items table (add/remove rows)
  - Material selector per line
  - Quantity and rate inputs
  - Auto-calculation of subtotal, tax, total
  - Terms and conditions textarea
  - Status badge
  - Preview before save

### 🔐 Security & Validation

- Only Admin and authorized users can create/edit materials
- Stock OUT requires sufficient stock quantity
- Rate validation (must be positive)
- Quantity validation (must be positive)
- Prevent deletion of materials with transactions
- Audit trail for all stock movements
- Role-based access for PO approval

### 📊 Reports to Include

1. **Stock Summary Report** - Current stock levels of all materials
2. **Stock Movement Report** - All IN/OUT transactions by date range
3. **Low Stock Report** - Materials below reorder level
4. **Material Usage by Project** - Material consumption per project
5. **Purchase Order Report** - All POs with status
6. **Stock Valuation Report** - Total inventory value
7. **Supplier Performance Report** - Delivery times, quality
8. **Material Cost Analysis** - Cost trends over time

### ✅ Acceptance Criteria

- [ ] Can add, edit, delete materials
- [ ] Can record stock IN transactions
- [ ] Can record stock OUT transactions with project linkage
- [ ] Running balance auto-calculates correctly
- [ ] Low stock alerts appear on dashboard
- [ ] Purchase orders can be created and approved
- [ ] PO PDF generation works correctly
- [ ] Stock valuation report displays accurate data
- [ ] Material costs flow to project expenses
- [ ] Excel import/export works for materials
- [ ] Search and filters work across all pages
- [ ] Mobile responsive design

### 🚀 Estimated Timeline: **4-5 weeks**

---

## 2. LABOR/TIME TRACKING & PAYROLL

### 📋 Overview
Complete labor management system including worker database, attendance, time sheets, wage calculations, and payroll generation.

### 🎯 Business Value
- Accurate labor cost tracking
- Automated payroll processing
- Attendance monitoring
- Overtime calculation
- Compliance with labor laws
- Reduce payroll errors

### 🗂️ Database Schema

```javascript
// workers table
{
  id: Auto-increment,
  workerCode: String (unique, auto-generated),
  name: String,
  phone: String,
  email: String,
  address: String,
  dateOfBirth: Date,
  dateOfJoining: Date,
  dateOfLeaving: Date (nullable),
  workerType: String, // PERMANENT, CONTRACT, DAILY_WAGE, PIECE_RATE
  skillCategory: String, // Mason, Carpenter, Electrician, Plumber, Helper, etc.
  skillLevel: String, // SKILLED, SEMI_SKILLED, UNSKILLED
  wageType: String, // HOURLY, DAILY, MONTHLY, PIECE_RATE
  wageRate: Number,
  overtimeRate: Number,
  bankAccountNumber: String,
  bankName: String,
  ifscCode: String,
  panNumber: String,
  aadharNumber: String,
  pfNumber: String,
  esiNumber: String,
  photo: String, // Base64 or URL
  currentProject: Number (FK to projects, nullable),
  status: String, // ACTIVE, INACTIVE, TERMINATED, ON_LEAVE
  emergencyContact: String,
  emergencyPhone: String,
  createdAt: Date,
  updatedAt: Date
}

// attendance table
{
  id: Auto-increment,
  workerId: Number (FK),
  projectId: Number (FK),
  attendanceDate: Date,
  checkInTime: DateTime,
  checkOutTime: DateTime,
  status: String, // PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY, OVERTIME
  workHours: Number, // Auto-calculated
  overtimeHours: Number,
  breakHours: Number,
  remarks: String,
  location: Object { lat, lng }, // GPS coordinates
  markedBy: Number (FK to users),
  approvedBy: Number (FK to users, nullable),
  createdAt: Date,
  updatedAt: Date
}

// timeSheets table
{
  id: Auto-increment,
  workerId: Number (FK),
  projectId: Number (FK),
  departmentId: Number (FK, nullable),
  weekStartDate: Date,
  weekEndDate: Date,
  totalHours: Number,
  regularHours: Number,
  overtimeHours: Number,
  leaveHours: Number,
  status: String, // DRAFT, SUBMITTED, APPROVED, REJECTED
  submittedDate: Date,
  approvedBy: Number (FK to users),
  approvedDate: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// payroll table
{
  id: Auto-increment,
  payrollNumber: String (unique, auto-generated),
  workerId: Number (FK),
  projectId: Number (FK, nullable),
  payPeriodStart: Date,
  payPeriodEnd: Date,
  basicWage: Number,
  overtimePay: Number,
  bonuses: Number,
  allowances: Number,
  grossPay: Number, // Auto-calculated
  deductions: Object {
    pf: Number,
    esi: Number,
    tax: Number,
    advance: Number,
    other: Number
  },
  netPay: Number, // Auto-calculated
  paymentDate: Date,
  paymentMethod: String, // CASH, BANK_TRANSFER, CHEQUE
  paymentStatus: String, // PENDING, PROCESSED, PAID, FAILED
  transactionReference: String,
  workDays: Number,
  totalHours: Number,
  notes: String,
  generatedBy: Number (FK to users),
  approvedBy: Number (FK to users),
  createdAt: Date,
  updatedAt: Date
}

// leaveManagement table
{
  id: Auto-increment,
  workerId: Number (FK),
  leaveType: String, // SICK, CASUAL, ANNUAL, UNPAID
  startDate: Date,
  endDate: Date,
  totalDays: Number,
  reason: String,
  status: String, // PENDING, APPROVED, REJECTED
  appliedDate: Date,
  approvedBy: Number (FK to users),
  approvedDate: Date,
  remarks: String,
  createdAt: Date,
  updatedAt: Date
}

// workerAdvances table
{
  id: Auto-increment,
  workerId: Number (FK),
  projectId: Number (FK, nullable),
  advanceAmount: Number,
  advanceDate: Date,
  reason: String,
  repaymentStatus: String, // PENDING, PARTIAL, FULL
  repaidAmount: Number,
  remainingBalance: Number,
  deductionPerPayroll: Number,
  approvedBy: Number (FK to users),
  createdAt: Date,
  updatedAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── WorkersPage.jsx            // Worker management
│   ├── AttendancePage.jsx         // Daily attendance marking
│   ├── TimeSheetsPage.jsx         // Weekly time sheets
│   ├── PayrollPage.jsx            // Payroll generation
│   ├── LeavesPage.jsx             // Leave management
│   └── LaborReportsPage.jsx       // Labor analytics
├── components/
│   ├── labor/
│   │   ├── WorkerForm.jsx         // Add/Edit worker
│   │   ├── WorkerList.jsx         // Workers table
│   │   ├── WorkerCard.jsx         // Worker profile card
│   │   ├── AttendanceForm.jsx     // Mark attendance
│   │   ├── AttendanceSheet.jsx    // Attendance grid view
│   │   ├── TimeSheetForm.jsx      // Time sheet entry
│   │   ├── TimeSheetList.jsx
│   │   ├── PayrollForm.jsx        // Generate payroll
│   │   ├── PayrollList.jsx
│   │   ├── PayslipPDF.jsx         // Payslip template
│   │   ├── LeaveForm.jsx
│   │   ├── LeaveList.jsx
│   │   ├── AdvanceForm.jsx        // Worker advance
│   │   ├── WorkerSelector.jsx     // Dropdown selector
│   │   └── LaborCostChart.jsx     // Cost visualization
├── utils/
│   ├── workerUtils.js             // Worker calculations
│   ├── attendanceUtils.js         // Attendance calculations
│   ├── payrollUtils.js            // Payroll calculations
│   └── payslipGenerator.js        // PDF generation
└── contexts/
    └── LaborContext.jsx           // Labor state management
```

### 🔧 Implementation Steps

#### **Phase 1: Worker Database (Week 1)**
1. Add workers schema to Dexie
2. Create WorkersPage with CRUD
3. Build WorkerForm component with validation
4. Implement worker code auto-generation (WKR-001)
5. Add worker photo upload
6. Create worker detail view
7. Add skill category and level dropdowns
8. Implement worker search and filters
9. Add worker import from Excel
10. Add worker export functionality

#### **Phase 2: Attendance System (Week 2)**
1. Add attendance schema to Dexie
2. Create AttendancePage
3. Build attendance marking form
4. Implement bulk attendance marking (grid view)
5. Add check-in/check-out time picker
6. Auto-calculate work hours
7. Add GPS location capture (optional)
8. Implement attendance status options
9. Create attendance calendar view
10. Add attendance filters (date, project, worker)
11. Build attendance summary dashboard

#### **Phase 3: Time Sheets (Week 2-3)**
1. Add timeSheets schema
2. Create TimeSheetsPage
3. Build weekly time sheet form
4. Auto-populate from attendance data
5. Add time sheet approval workflow
6. Calculate regular and overtime hours
7. Implement time sheet submission
8. Add project-wise time allocation
9. Create time sheet reports
10. Add time sheet export to PDF/Excel

#### **Phase 4: Payroll System (Week 3-4)**
1. Add payroll schema to Dexie
2. Create PayrollPage
3. Build payroll generation form
4. Implement wage calculation logic:
   - Hourly/Daily/Monthly rates
   - Overtime calculation
   - Bonuses and allowances
5. Add deduction calculations:
   - PF (Provident Fund)
   - ESI (Employee State Insurance)
   - TDS (Tax Deducted at Source)
   - Advance deductions
6. Create payroll number auto-generation (PAY-YYYYMM-001)
7. Build payslip PDF template
8. Add bulk payroll generation
9. Implement payroll approval workflow
10. Add payment status tracking
11. Create payroll summary report

#### **Phase 5: Leave Management (Week 4)**
1. Add leaveManagement schema
2. Create LeavesPage
3. Build leave application form
4. Implement leave approval workflow
5. Add leave balance tracking
6. Create leave calendar view
7. Add leave type management
8. Implement leave quota system
9. Send leave notifications

#### **Phase 6: Worker Advances (Week 4)**
1. Add workerAdvances schema
2. Create advance request form
3. Implement advance approval
4. Add repayment tracking
5. Auto-deduct from payroll
6. Create advance history view

#### **Phase 7: Integration (Week 5)**
1. Link labor costs to project expenses
2. Add payroll to paymentsOut
3. Update dashboard with labor metrics
4. Link workers to projects
5. Add attendance alerts to dashboard
6. Integrate with department-wise expenses

#### **Phase 8: Reports & Analytics (Week 5)**
1. Create labor cost by project report
2. Build attendance summary report
3. Add overtime analysis report
4. Create payroll summary report
5. Build worker productivity report
6. Add leave balance report
7. Create advance repayment report

#### **Phase 9: Testing (Week 5-6)**
1. Test worker CRUD operations
2. Test attendance marking workflows
3. Test payroll calculations
4. Verify deduction calculations
5. Test leave workflows
6. Performance testing
7. Mobile responsiveness testing

### 🎨 UI/UX Features

- **Workers Dashboard:**
  - Total active workers
  - Present today count
  - Pending leave requests
  - Pending payroll count

- **Attendance Grid:**
  - Calendar view with color coding
  - Quick mark present/absent
  - Bulk actions
  - Filter by project/date

- **Payroll Form:**
  - Worker selector
  - Pay period selector
  - Auto-populate hours from time sheets
  - Editable wage components
  - Real-time calculation
  - Preview payslip before save

- **Payslip PDF:**
  - Company header
  - Worker details
  - Earnings breakdown
  - Deductions breakdown
  - Net pay highlighted
  - QR code (optional)

### 🔐 Security & Validation

- PAN, Aadhar format validation
- Bank account validation
- Wage rate must be positive
- Overtime rate ≥ regular rate
- Attendance date cannot be future
- Payroll approval required for payment
- Role-based access for sensitive data

### 📊 Reports to Include

1. **Worker Master Report** - All workers with details
2. **Attendance Summary** - Monthly attendance by worker
3. **Overtime Report** - Overtime hours by worker/project
4. **Payroll Register** - All payroll records
5. **Labor Cost by Project** - Project-wise labor expenses
6. **Leave Balance Report** - Leave quota and usage
7. **Advance Repayment Report** - Outstanding advances
8. **Worker Productivity Report** - Hours worked vs. output

### ✅ Acceptance Criteria

- [ ] Can add, edit, delete workers
- [ ] Can mark daily attendance
- [ ] Work hours auto-calculate correctly
- [ ] Can generate time sheets from attendance
- [ ] Payroll calculations are accurate
- [ ] Payslip PDF generates correctly
- [ ] Leave approval workflow works
- [ ] Advance deductions work in payroll
- [ ] Labor costs flow to project expenses
- [ ] Reports display accurate data
- [ ] Mobile attendance marking works
- [ ] Excel import/export works

### 🚀 Estimated Timeline: **5-6 weeks**

---

## 3. BUDGET PLANNING & FORECASTING

### 📋 Overview
Comprehensive budget management system with planning, tracking, forecasting, and variance analysis.

### 🎯 Business Value
- Control project costs
- Prevent budget overruns
- Track budget vs. actual in real-time
- Forecast future expenses
- Improve project profitability
- Better decision making

### 🗂️ Database Schema

```javascript
// projectBudgets table
{
  id: Auto-increment,
  projectId: Number (FK),
  budgetVersion: Number, // For revision tracking
  budgetName: String, // "Original Budget", "Revised Budget v1"
  totalBudget: Number,
  contingency: Number, // Reserve amount
  status: String, // DRAFT, APPROVED, ACTIVE, CLOSED
  startDate: Date,
  endDate: Date,
  approvedBy: Number (FK to users),
  approvedDate: Date,
  notes: String,
  isActive: Boolean, // Only one active budget per project
  createdBy: Number (FK),
  createdAt: Date,
  updatedAt: Date
}

// budgetLineItems table
{
  id: Auto-increment,
  budgetId: Number (FK),
  projectId: Number (FK),
  categoryType: String, // MATERIAL, LABOR, EQUIPMENT, SUBCONTRACTOR, OVERHEAD, OTHER
  departmentId: Number (FK, nullable),
  description: String,
  quantity: Number,
  unit: String,
  unitRate: Number,
  budgetedAmount: Number,
  allocatedAmount: Number, // Amount allocated so far
  spentAmount: Number, // Actual spent
  committedAmount: Number, // POs issued but not paid
  availableAmount: Number, // Budget - Allocated - Committed - Spent
  variance: Number, // Budget - Actual
  variancePercentage: Number,
  startDate: Date,
  endDate: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// budgetAlerts table
{
  id: Auto-increment,
  projectId: Number (FK),
  budgetId: Number (FK),
  lineItemId: Number (FK, nullable),
  alertType: String, // THRESHOLD_EXCEEDED, OVERBUDGET, FORECAST_OVERRUN
  severity: String, // LOW, MEDIUM, HIGH, CRITICAL
  threshold: Number, // 80%, 90%, 100%, etc.
  currentUtilization: Number,
  message: String,
  status: String, // ACTIVE, ACKNOWLEDGED, RESOLVED, IGNORED
  alertDate: Date,
  acknowledgedBy: Number (FK to users),
  acknowledgedDate: Date,
  createdAt: Date
}

// budgetRevisions table
{
  id: Auto-increment,
  projectId: Number (FK),
  originalBudgetId: Number (FK),
  revisionNumber: Number,
  revisionReason: String,
  changedBy: Number (FK),
  changeDate: Date,
  changes: Array [ // Detailed change log
    {
      lineItemId: Number,
      field: String,
      oldValue: Number,
      newValue: Number,
      reason: String
    }
  ],
  totalImpact: Number, // Net change in budget
  approvedBy: Number (FK to users),
  approvedDate: Date,
  notes: String,
  createdAt: Date
}

// costForecasts table
{
  id: Auto-increment,
  projectId: Number (FK),
  budgetId: Number (FK),
  forecastDate: Date,
  completionPercentage: Number, // % complete
  spentToDate: Number,
  estimateAtCompletion: Number, // EAC
  estimateToComplete: Number, // ETC = EAC - Spent
  costVariance: Number, // Budget - EAC
  costPerformanceIndex: Number, // CPI = Earned / Spent
  schedulePerformanceIndex: Number, // SPI
  forecastMethod: String, // LINEAR, WEIGHTED_AVERAGE, EARNED_VALUE
  confidence: String, // HIGH, MEDIUM, LOW
  assumptions: String,
  risks: String,
  createdBy: Number (FK),
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── BudgetPlanningPage.jsx     // Budget creation & management
│   ├── BudgetTrackingPage.jsx     // Budget vs. actual tracking
│   ├── BudgetAlertsPage.jsx       // Budget alerts & notifications
│   ├── BudgetForecastsPage.jsx    // Cost forecasting
│   └── BudgetReportsPage.jsx      // Budget analytics
├── components/
│   ├── budget/
│   │   ├── BudgetForm.jsx         // Create budget
│   │   ├── BudgetLineItemsTable.jsx // Budget breakdown
│   │   ├── LineItemForm.jsx       // Add/edit line item
│   │   ├── BudgetSummaryCard.jsx  // Summary metrics
│   │   ├── BudgetVsActualChart.jsx // Visualization
│   │   ├── VarianceAnalysisChart.jsx
│   │   ├── BudgetAlertCard.jsx    // Alert component
│   │   ├── BudgetRevisionForm.jsx // Revise budget
│   │   ├── ForecastForm.jsx       // Create forecast
│   │   ├── ForecastChart.jsx      // Forecast visualization
│   │   ├── EVMDashboard.jsx       // Earned Value Management
│   │   ├── CashFlowChart.jsx      // Cash flow projection
│   │   └── BudgetApprovalModal.jsx
├── utils/
│   ├── budgetUtils.js             // Budget calculations
│   ├── varianceUtils.js           // Variance analysis
│   ├── forecastUtils.js           // Forecasting algorithms
│   └── evmUtils.js                // Earned Value calculations
└── contexts/
    └── BudgetContext.jsx          // Budget state management
```

### 🔧 Implementation Steps

#### **Phase 1: Database & Core Setup (Week 1)**
1. Add budget schemas to Dexie
2. Create budget versioning system
3. Implement budget approval workflow
4. Set up budget context
5. Create budget utilities

#### **Phase 2: Budget Planning (Week 1-2)**
1. Create BudgetPlanningPage
2. Build budget creation form
3. Implement budget line items table
4. Add category-wise budget breakdown
5. Create budget templates (residential, commercial, industrial)
6. Implement budget import from Excel
7. Add budget duplication feature
8. Build budget approval interface
9. Create budget version comparison view
10. Add budget notes and attachments

#### **Phase 3: Budget Tracking (Week 2-3)**
1. Create BudgetTrackingPage
2. Build budget vs. actual dashboard
3. Implement real-time utilization tracking
4. Link expenses to budget line items
5. Link purchase orders to budget (committed costs)
6. Calculate available budget
7. Create variance analysis view
8. Build budget utilization charts
9. Add drill-down by category/department
10. Implement budget reallocation feature

#### **Phase 4: Budget Alerts (Week 3)**
1. Add budgetAlerts schema
2. Create BudgetAlertsPage
3. Implement threshold-based alerts (80%, 90%, 100%)
4. Add real-time alert generation
5. Create alert notification system
6. Build alert dashboard widget
7. Implement alert acknowledgment
8. Add alert history view
9. Create alert preferences (per user)
10. Send email alerts (optional)

#### **Phase 5: Budget Revisions (Week 3-4)**
1. Add budgetRevisions schema
2. Create budget revision workflow
3. Build revision form
4. Implement change tracking
5. Add revision approval process
6. Create revision history view
7. Build revision comparison report
8. Add rollback to previous version
9. Track who changed what and when

#### **Phase 6: Forecasting (Week 4)**
1. Add costForecasts schema
2. Create BudgetForecastsPage
3. Implement linear forecasting
4. Implement weighted average forecasting
5. Implement Earned Value Management (EVM):
   - Planned Value (PV)
   - Earned Value (EV)
   - Actual Cost (AC)
   - Cost Performance Index (CPI)
   - Schedule Performance Index (SPI)
   - Estimate At Completion (EAC)
   - Estimate To Complete (ETC)
6. Build forecast charts
7. Add confidence indicators
8. Create "what-if" scenario analysis
9. Build cash flow projection

#### **Phase 7: Integration (Week 4-5)**
1. Link budget to paymentsOut
2. Link budget to purchase orders
3. Link budget to material costs
4. Link budget to labor/payroll
5. Update project dashboard with budget metrics
6. Add budget widget to project page
7. Create budget utilization gauge

#### **Phase 8: Reports & Analytics (Week 5)**
1. Create budget summary report
2. Build variance analysis report
3. Add cost breakdown by category report
4. Create budget utilization report
5. Build forecast accuracy report
6. Add profitability analysis report
7. Create budget performance index report
8. Build cash flow report

#### **Phase 9: Testing (Week 5-6)**
1. Test budget creation and approval
2. Test variance calculations
3. Test alert generation
4. Test forecast accuracy
5. Test EVM calculations
6. Test budget revisions
7. Performance testing
8. Mobile responsiveness

### 🎨 UI/UX Features

- **Budget Dashboard:**
  - Total budget
  - Total spent
  - Total committed
  - Available budget
  - Budget utilization % (with color coding)
  - Active alerts count

- **Budget Line Items Table:**
  - Category breakdown
  - Budgeted vs. actual columns
  - Variance column (with +/- colors)
  - Progress bars
  - Inline editing
  - Quick add row

- **Budget Alerts:**
  - Alert cards with severity badges
  - Color coding (green, yellow, orange, red)
  - Alert message
  - Action buttons (Acknowledge, View Details)
  - Alert history timeline

- **Forecast Chart:**
  - Line chart showing budget vs. forecast
  - Confidence intervals
  - Current spend trajectory
  - Projected completion cost
  - Interactive tooltips

### 🔐 Security & Validation

- Budget creation requires Admin approval
- Budget revisions require approval
- Cannot delete approved budgets
- Cannot overspend without approval override
- Audit trail for all budget changes
- Role-based access to budget data

### 📊 Reports to Include

1. **Budget Summary Report** - Overall budget status
2. **Variance Analysis Report** - Budget vs. actual variance
3. **Budget Utilization Report** - % utilization by category
4. **Cost Breakdown Report** - Detailed cost analysis
5. **Forecast Accuracy Report** - Forecast vs. actual comparison
6. **Budget Revision History** - All revisions with reasons
7. **EVM Report** - Earned Value metrics
8. **Cash Flow Report** - Projected cash requirements
9. **Profitability Report** - Revenue vs. cost analysis
10. **Cost Performance Report** - CPI and SPI trends

### ✅ Acceptance Criteria

- [ ] Can create and approve budgets
- [ ] Can add and edit budget line items
- [ ] Budget vs. actual tracking works in real-time
- [ ] Variance calculations are accurate
- [ ] Alerts generate at threshold levels
- [ ] Can revise budgets with approval
- [ ] Forecasting algorithms work correctly
- [ ] EVM calculations are accurate
- [ ] Budget reports display correct data
- [ ] Cash flow projections are realistic
- [ ] Excel import/export works
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **5-6 weeks**

---

## 4. RETENTION MANAGEMENT

### 📋 Overview
Track and manage retention amounts (security deposits) withheld from invoices and payments, with release schedules and compliance reporting.

### 🎯 Business Value
- Ensure contractual compliance
- Track retention receivables/payables
- Automate retention release schedules
- Improve cash flow management
- Generate retention reports for audits

### 🗂️ Database Schema

```javascript
// retentionPolicies table
{
  id: Auto-increment,
  policyName: String,
  retentionPercentage: Number, // e.g., 5%, 10%
  retentionType: String, // FIXED_PERCENTAGE, TIERED, CUSTOM
  releaseType: String, // ON_COMPLETION, TIME_BASED, MILESTONE_BASED, WARRANTY_END
  releaseSchedule: Array [ // For time-based release
    {
      percentage: Number, // % to release
      daysAfter: Number, // Days after event
      eventType: String // COMPLETION, INVOICE, MILESTONE
    }
  ],
  defectLiabilityPeriod: Number, // Months
  warrantyPeriod: Number, // Months
  description: String,
  isDefault: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// retentionAccounts table
{
  id: Auto-increment,
  referenceType: String, // INVOICE, PAYMENT, PROJECT
  referenceId: Number, // FK to invoice/payment/project
  partyId: Number, // FK to parties (customer or supplier)
  projectId: Number (FK),
  policyId: Number (FK),
  retentionType: String, // RECEIVABLE (from customer), PAYABLE (to supplier)
  totalAmount: Number, // Original invoice/payment amount
  retentionPercentage: Number,
  retentionAmount: Number, // Calculated retention
  releasedAmount: Number, // Amount released so far
  balanceAmount: Number, // Retention - Released
  status: String, // HELD, PARTIALLY_RELEASED, FULLY_RELEASED, FORFEITED
  retentionDate: Date, // Date retention was held
  scheduledReleaseDate: Date,
  actualReleaseDate: Date,
  releaseReason: String,
  forfeitureReason: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// retentionReleases table
{
  id: Auto-increment,
  retentionAccountId: Number (FK),
  releaseNumber: String (unique, auto-generated),
  releaseAmount: Number,
  releasePercentage: Number,
  releaseDate: Date,
  releaseType: String, // SCHEDULED, MANUAL, FORFEITURE
  releaseReason: String,
  approvedBy: Number (FK to users),
  approvedDate: Date,
  paymentReference: String, // Link to paymentsOut if paid
  notes: String,
  attachments: Array,
  createdBy: Number (FK),
  createdAt: Date
}

// retentionAlerts table
{
  id: Auto-increment,
  retentionAccountId: Number (FK),
  alertType: String, // RELEASE_DUE, OVERDUE, WARRANTY_EXPIRING
  alertDate: Date,
  dueDate: Date,
  message: String,
  status: String, // ACTIVE, ACKNOWLEDGED, RESOLVED
  acknowledgedBy: Number (FK),
  acknowledgedDate: Date,
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── RetentionPoliciesPage.jsx  // Manage retention policies
│   ├── RetentionAccountsPage.jsx  // View all retention accounts
│   ├── RetentionReleasesPage.jsx  // Release management
│   └── RetentionReportsPage.jsx   // Retention reports
├── components/
│   ├── retention/
│   │   ├── RetentionPolicyForm.jsx
│   │   ├── RetentionPolicyList.jsx
│   │   ├── RetentionAccountCard.jsx
│   │   ├── RetentionAccountList.jsx
│   │   ├── RetentionReleaseForm.jsx
│   │   ├── RetentionReleaseList.jsx
│   │   ├── RetentionScheduleTimeline.jsx
│   │   ├── RetentionAlertCard.jsx
│   │   ├── RetentionSummaryWidget.jsx
│   │   └── RetentionCalculator.jsx
├── utils/
│   ├── retentionUtils.js          // Retention calculations
│   ├── retentionScheduleUtils.js  // Schedule calculations
│   └── retentionReportUtils.js    // Report generation
└── contexts/
    └── RetentionContext.jsx       // Retention state
```

### 🔧 Implementation Steps

#### **Phase 1: Database & Policies (Week 1)**
1. Add retention schemas to Dexie
2. Create RetentionPoliciesPage
3. Build retention policy form
4. Implement retention calculation logic
5. Create default policies (5%, 10%, custom)
6. Add release schedule builder
7. Implement defect liability period tracking
8. Add warranty period tracking

#### **Phase 2: Retention Accounts (Week 1-2)**
1. Create RetentionAccountsPage
2. Auto-create retention accounts on invoice generation
3. Auto-create retention accounts on payment receipt
4. Link retention to projects
5. Calculate retention amounts automatically
6. Create retention account detail view
7. Add retention history view
8. Implement retention filters (party, project, status)

#### **Phase 3: Retention Release (Week 2)**
1. Create RetentionReleasesPage
2. Build retention release form
3. Implement scheduled release logic
4. Add manual release capability
5. Create release approval workflow
6. Generate release certificates/receipts
7. Link releases to paymentsOut
8. Update retention balance on release
9. Add bulk release feature

#### **Phase 4: Alerts & Notifications (Week 2-3)**
1. Add retentionAlerts schema
2. Create alert generation logic
3. Implement due date alerts
4. Add overdue retention alerts
5. Create warranty expiry alerts
6. Build alert dashboard widget
7. Add email notifications (optional)

#### **Phase 5: Integration (Week 3)**
1. Integrate retention with invoice generation:
   - Add retention field to invoices
   - Auto-calculate invoice amount after retention
   - Display retention separately on invoice
2. Integrate retention with payments:
   - Track retention on paymentsIn
   - Track retention on paymentsOut (to suppliers)
3. Add retention to project financials
4. Update dashboard with retention metrics
5. Link retention releases to accounting

#### **Phase 6: Reports (Week 3)**
1. Create retention summary report
2. Build retention receivables aging report
3. Add retention payables report
4. Create retention release schedule report
5. Build retention compliance report
6. Add retention by project report
7. Create warranty tracking report

#### **Phase 7: Testing (Week 4)**
1. Test policy creation
2. Test retention calculations
3. Test automatic account creation
4. Test release workflows
5. Test alert generation
6. Test reports accuracy
7. Mobile responsiveness

### 🎨 UI/UX Features

- **Retention Dashboard:**
  - Total retention held
  - Total retention receivable
  - Total retention payable
  - Retention releases due this month
  - Overdue releases count

- **Retention Account Card:**
  - Party name
  - Project name
  - Retention amount
  - Released amount
  - Balance amount
  - Status badge
  - Scheduled release date
  - Quick release button

- **Release Schedule Timeline:**
  - Visual timeline of release schedule
  - Milestones with dates
  - Completed vs. pending releases
  - Color-coded status

### 🔐 Security & Validation

- Retention release requires approval
- Cannot release more than balance
- Cannot delete retention accounts with releases
- Audit trail for all releases
- Role-based access

### 📊 Reports to Include

1. **Retention Summary Report** - Overall retention status
2. **Retention Receivables Report** - Customer retention amounts
3. **Retention Payables Report** - Supplier retention amounts
4. **Retention Aging Report** - Age-wise retention breakdown
5. **Release Schedule Report** - Upcoming releases
6. **Retention Compliance Report** - Audit-ready report
7. **Warranty Tracking Report** - Warranty periods

### ✅ Acceptance Criteria

- [ ] Can create and manage retention policies
- [ ] Retention auto-calculates on invoices
- [ ] Retention accounts auto-create
- [ ] Release workflows function correctly
- [ ] Alerts generate on due dates
- [ ] Reports display accurate data
- [ ] Integration with invoices works
- [ ] Integration with payments works
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **3-4 weeks**

---

## 5. CHANGE ORDERS

### 📋 Overview
Manage contract variations, scope changes, and their impact on project budgets, timelines, and profitability.

### 🎯 Business Value
- Track scope changes formally
- Manage additional revenue opportunities
- Control budget impact of changes
- Maintain audit trail of modifications
- Improve client communication

### 🗂️ Database Schema

```javascript
// changeOrders table
{
  id: Auto-increment,
  changeOrderNumber: String (unique, auto-generated),
  projectId: Number (FK),
  customerId: Number (FK),
  title: String,
  description: String,
  requestedBy: String, // Client, Contractor, Architect, etc.
  requestDate: Date,
  reason: String, // DESIGN_CHANGE, SITE_CONDITION, CLIENT_REQUEST, ERROR_CORRECTION
  category: String, // ADDITION, DELETION, MODIFICATION
  status: String, // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, IMPLEMENTED
  priority: String, // LOW, MEDIUM, HIGH, URGENT

  // Cost Impact
  originalContractAmount: Number,
  changeOrderAmount: Number, // Can be positive or negative
  revisedContractAmount: Number,

  // Budget Impact
  materialCostImpact: Number,
  laborCostImpact: Number,
  equipmentCostImpact: Number,
  overheadCostImpact: Number,
  totalCostImpact: Number,

  // Time Impact
  originalCompletionDate: Date,
  timeImpact: Number, // Days added/subtracted
  revisedCompletionDate: Date,

  // Workflow
  submittedBy: Number (FK to users),
  submittedDate: Date,
  reviewedBy: Number (FK to users),
  reviewedDate: Date,
  approvedBy: Number (FK to users),
  approvedDate: Date,
  rejectionReason: String,
  implementedBy: Number (FK to users),
  implementedDate: Date,

  // Related Documents
  attachments: Array,
  drawingReferences: Array,
  specifications: String,

  // Notifications
  clientNotified: Boolean,
  clientNotifiedDate: Date,
  clientApprovalRequired: Boolean,
  clientApprovalDate: Date,

  notes: String,
  internalNotes: String,
  createdAt: Date,
  updatedAt: Date
}

// changeOrderLineItems table
{
  id: Auto-increment,
  changeOrderId: Number (FK),
  itemType: String, // MATERIAL, LABOR, EQUIPMENT, SUBCONTRACTOR, OTHER
  description: String,
  quantity: Number,
  unit: String,
  unitRate: Number,
  amount: Number,
  notes: String,
  createdAt: Date
}

// changeOrderHistory table
{
  id: Auto-increment,
  changeOrderId: Number (FK),
  action: String, // CREATED, SUBMITTED, REVIEWED, APPROVED, REJECTED, MODIFIED, IMPLEMENTED
  actionBy: Number (FK to users),
  actionDate: Date,
  previousStatus: String,
  newStatus: String,
  comments: String,
  changes: Object, // JSON of field changes
  createdAt: Date
}

// changeOrderImpacts table
{
  id: Auto-increment,
  changeOrderId: Number (FK),
  impactType: String, // BUDGET, SCHEDULE, SCOPE, QUALITY, RISK
  impactArea: String, // Department, milestone, etc.
  description: String,
  severity: String, // LOW, MEDIUM, HIGH, CRITICAL
  mitigation: String,
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── ChangeOrdersPage.jsx       // Main change orders page
│   ├── ChangeOrderDetailPage.jsx  // Detail view
│   └── ChangeOrderReportsPage.jsx // CO reports
├── components/
│   ├── changeOrders/
│   │   ├── ChangeOrderForm.jsx    // Create/Edit CO
│   │   ├── ChangeOrderList.jsx    // CO table
│   │   ├── ChangeOrderCard.jsx    // CO summary card
│   │   ├── LineItemsTable.jsx     // CO line items
│   │   ├── ImpactAnalysis.jsx     // Impact visualization
│   │   ├── ApprovalWorkflow.jsx   // Approval interface
│   │   ├── ChangeOrderTimeline.jsx // History timeline
│   │   ├── COImpactChart.jsx      // Cost/time impact chart
│   │   └── COPDFTemplate.jsx      // PDF generation
├── utils/
│   ├── changeOrderUtils.js        // CO calculations
│   ├── coNumberGenerator.js       // CO number generation
│   └── coImpactCalculator.js      // Impact calculations
└── contexts/
    └── ChangeOrderContext.jsx     // CO state management
```

### 🔧 Implementation Steps

#### **Phase 1: Database & Core (Week 1)**
1. Add change order schemas to Dexie
2. Create ChangeOrdersPage
3. Build change order form
4. Implement CO number auto-generation (CO-PROJ-001)
5. Add line items table
6. Create CO status workflow
7. Implement CO validation

#### **Phase 2: Impact Analysis (Week 1-2)**
1. Build impact analysis component
2. Calculate cost impact
3. Calculate time impact
4. Calculate budget impact
5. Create impact visualization
6. Add risk assessment
7. Implement mitigation tracking

#### **Phase 3: Approval Workflow (Week 2)**
1. Create approval interface
2. Implement multi-level approval
3. Add client approval tracking
4. Create approval notifications
5. Build rejection workflow
6. Add approval history

#### **Phase 4: Integration (Week 2-3)**
1. Link CO to project budget
2. Update budget on CO approval
3. Link CO to milestones
4. Update project timeline on CO approval
5. Link CO to invoices (additional billing)
6. Add CO widget to project page
7. Update dashboard with CO metrics

#### **Phase 5: Document Management (Week 3)**
1. Add attachment upload
2. Create CO PDF template
3. Generate CO approval documents
4. Add drawing references
5. Link specifications

#### **Phase 6: Reports (Week 3)**
1. Create CO summary report
2. Build CO impact analysis report
3. Add CO by project report
4. Create CO approval status report
5. Build financial impact report

#### **Phase 7: Testing (Week 4)**
1. Test CO creation and approval
2. Test impact calculations
3. Test budget integration
4. Test workflow
5. Mobile responsiveness

### 🎨 UI/UX Features

- **Change Order Dashboard:**
  - Total COs
  - Pending approval count
  - Total value of COs
  - Net budget impact

- **Change Order Form:**
  - Project selector
  - Title and description
  - Reason dropdown
  - Category selector
  - Line items table
  - Cost impact calculator
  - Time impact calculator
  - Attachment upload
  - Status indicator

- **Impact Analysis:**
  - Visual breakdown of cost impact
  - Timeline impact visualization
  - Budget utilization gauge
  - Risk matrix

### 🔐 Security & Validation

- CO approval requires authorized user
- Cannot approve own CO
- Cannot delete approved COs
- Audit trail for all changes
- Client approval required for external COs

### 📊 Reports to Include

1. **Change Order Register** - All COs with status
2. **CO Impact Report** - Cost and time impacts
3. **CO by Project Report** - Project-wise CO summary
4. **Approval Status Report** - Pending approvals
5. **Financial Impact Report** - Budget impact analysis

### ✅ Acceptance Criteria

- [ ] Can create and submit change orders
- [ ] Impact calculations work correctly
- [ ] Approval workflow functions
- [ ] Budget updates on CO approval
- [ ] Timeline updates on CO approval
- [ ] PDF generation works
- [ ] Reports display accurate data
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **3-4 weeks**

---

## 6. DOCUMENT MANAGEMENT

### 📋 Overview
Centralized repository for all project-related documents including contracts, permits, drawings, specifications, invoices, and photos.

### 🎯 Business Value
- Single source of truth for documents
- Organize documents by project/category
- Version control for important documents
- Quick document retrieval
- Audit trail for document changes
- Collaboration and sharing

### 🗂️ Database Schema

```javascript
// documents table
{
  id: Auto-increment,
  documentNumber: String (unique, auto-generated),
  fileName: String,
  fileType: String, // PDF, DOC, XLS, JPG, PNG, DWG, etc.
  fileSize: Number, // Bytes
  filePath: String, // Storage path or Base64
  fileUrl: String, // If stored externally

  // Classification
  category: String, // CONTRACT, PERMIT, DRAWING, SPECIFICATION, INVOICE, PHOTO, REPORT, OTHER
  subCategory: String,
  documentType: String, // ORIGINAL, REVISED, FINAL, DRAFT

  // Association
  projectId: Number (FK),
  partyId: Number (FK, nullable),
  referenceType: String, // INVOICE, PAYMENT, CHANGE_ORDER, MILESTONE
  referenceId: Number,

  // Metadata
  title: String,
  description: String,
  version: String, // v1.0, v1.1, etc.
  revisionNumber: Number,
  issueDate: Date,
  expiryDate: Date, // For permits, certifications

  // Access Control
  isPrivate: Boolean,
  sharedWith: Array, // Array of user IDs
  accessLevel: String, // VIEW_ONLY, DOWNLOAD, EDIT

  // Status
  status: String, // ACTIVE, ARCHIVED, SUPERSEDED, DELETED
  isLatestVersion: Boolean,
  supersededBy: Number (FK to documents), // Link to newer version

  // Workflow
  uploadedBy: Number (FK to users),
  approvedBy: Number (FK to users),
  approvedDate: Date,
  approvalRequired: Boolean,
  approvalStatus: String, // PENDING, APPROVED, REJECTED

  // Additional
  tags: Array, // Searchable tags
  notes: String,
  checksum: String, // File integrity check

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date // Soft delete
}

// documentVersions table
{
  id: Auto-increment,
  documentId: Number (FK),
  versionNumber: String,
  fileName: String,
  filePath: String,
  fileSize: Number,
  changes: String, // Description of changes
  uploadedBy: Number (FK),
  uploadedDate: Date,
  isCurrentVersion: Boolean,
  createdAt: Date
}

// documentSharing table
{
  id: Auto-increment,
  documentId: Number (FK),
  sharedBy: Number (FK to users),
  sharedWith: String, // Email or user ID
  sharedDate: Date,
  expiryDate: Date,
  accessLevel: String, // VIEW, DOWNLOAD, EDIT
  accessCount: Number,
  lastAccessedDate: Date,
  shareLink: String, // Unique link
  password: String, // Optional password protection
  isActive: Boolean,
  createdAt: Date
}

// documentActivity table
{
  id: Auto-increment,
  documentId: Number (FK),
  activityType: String, // UPLOADED, VIEWED, DOWNLOADED, EDITED, SHARED, DELETED, RESTORED
  performedBy: Number (FK to users),
  performedDate: Date,
  ipAddress: String,
  details: String,
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── DocumentsPage.jsx          // Main documents page
│   ├── DocumentDetailPage.jsx     // Document viewer
│   └── DocumentReportsPage.jsx    // Document reports
├── components/
│   ├── documents/
│   │   ├── DocumentUpload.jsx     // Drag-drop upload
│   │   ├── DocumentList.jsx       // Documents table/grid
│   │   ├── DocumentCard.jsx       // Document card view
│   │   ├── DocumentViewer.jsx     // In-app viewer
│   │   ├── DocumentFilter.jsx     // Filter sidebar
│   │   ├── DocumentSearch.jsx     // Search component
│   │   ├── DocumentVersions.jsx   // Version history
│   │   ├── DocumentSharing.jsx    // Sharing interface
│   │   ├── DocumentApproval.jsx   // Approval workflow
│   │   ├── FolderTree.jsx         // Folder structure
│   │   └── DocumentActivityLog.jsx // Activity timeline
├── utils/
│   ├── documentUtils.js           // Document operations
│   ├── fileValidator.js           // File validation
│   ├── documentSearch.js          // Search logic
│   └── documentNumberGenerator.js // Doc number generation
└── contexts/
    └── DocumentContext.jsx        // Document state
```

### 🔧 Implementation Steps

#### **Phase 1: Database & Upload (Week 1)**
1. Add document schemas to Dexie
2. Create DocumentsPage
3. Build file upload component (drag-drop)
4. Implement file validation (size, type)
5. Add document metadata form
6. Create folder structure
7. Implement document number generation (DOC-PROJ-001)

#### **Phase 2: Document Management (Week 1-2)**
1. Build document list view (table and grid)
2. Create document detail page
3. Implement document viewer (PDF, images)
4. Add document editing metadata
5. Create document deletion (soft delete)
6. Implement document restore
7. Add bulk upload feature
8. Add bulk actions (delete, move, download)

#### **Phase 3: Version Control (Week 2)**
1. Add version tracking
2. Implement new version upload
3. Create version comparison
4. Build version history view
5. Add rollback to previous version
6. Track changes between versions

#### **Phase 4: Search & Filter (Week 2-3)**
1. Implement full-text search
2. Add category filters
3. Add date range filters
4. Add project filters
5. Add tag-based search
6. Create advanced search
7. Add saved searches

#### **Phase 5: Sharing & Permissions (Week 3)**
1. Implement document sharing
2. Create share link generation
3. Add password protection
4. Implement access level controls
5. Track document access
6. Add expiry for shared links

#### **Phase 6: Integration (Week 3-4)**
1. Link documents to projects
2. Link documents to invoices
3. Link documents to change orders
4. Link documents to payments
5. Add document widget to project page
6. Add recent documents to dashboard

#### **Phase 7: Reports & Activity Log (Week 4)**
1. Create document activity log
2. Build document audit report
3. Add storage usage report
4. Create expiry tracking report
5. Build access statistics report

#### **Phase 8: Testing (Week 4)**
1. Test file upload and download
2. Test version control
3. Test search functionality
4. Test sharing and permissions
5. Performance testing with large files
6. Mobile responsiveness

### 🎨 UI/UX Features

- **Documents Dashboard:**
  - Total documents count
  - Storage used
  - Recent uploads
  - Documents expiring soon
  - Folder tree navigation

- **Document Card:**
  - Thumbnail preview
  - Document name
  - Category badge
  - Version indicator
  - File size
  - Upload date
  - Quick actions (view, download, share, delete)

- **Document Viewer:**
  - In-app PDF viewer
  - Image viewer with zoom
  - Download button
  - Share button
  - Version history button
  - Fullscreen mode

- **Upload Interface:**
  - Drag-and-drop area
  - Progress bar
  - Multiple file upload
  - Thumbnail previews
  - Metadata form

### 🔐 Security & Validation

- File type validation (whitelist approach)
- File size limits (e.g., 25MB per file)
- Virus scanning (optional)
- Access control by role
- Encrypted storage (optional)
- Audit trail for all actions
- Soft delete with restore option

### 📊 Reports to Include

1. **Document Register** - All documents with metadata
2. **Document Activity Report** - Who accessed what
3. **Storage Usage Report** - Storage by project/category
4. **Expiry Tracking Report** - Documents expiring soon
5. **Access Statistics** - Most viewed/downloaded documents
6. **Audit Report** - Complete audit trail

### ✅ Acceptance Criteria

- [ ] Can upload documents with metadata
- [ ] Can view documents in-app
- [ ] Can download documents
- [ ] Version control works correctly
- [ ] Search returns accurate results
- [ ] Filters work correctly
- [ ] Sharing links work
- [ ] Access controls function properly
- [ ] Activity log tracks all actions
- [ ] Reports display accurate data
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **4 weeks**

---

## 📊 OVERALL CRITICAL FEATURES SUMMARY

| Feature | Timeline | Complexity | Impact |
|---------|----------|------------|--------|
| Material/Inventory Management | 4-5 weeks | High | Critical |
| Labor/Time Tracking & Payroll | 5-6 weeks | High | Critical |
| Budget Planning & Forecasting | 5-6 weeks | High | Critical |
| Retention Management | 3-4 weeks | Medium | High |
| Change Orders | 3-4 weeks | Medium | High |
| Document Management | 4 weeks | Medium | High |

**Total Estimated Timeline: 24-29 weeks (~6-7 months)**

**Recommended Implementation Order:**
1. **Budget Planning** (Foundation for financial control)
2. **Material Management** (High ROI, inventory control)
3. **Labor Tracking** (Complete cost tracking)
4. **Change Orders** (Integrate with budget)
5. **Retention Management** (Invoice integration)
6. **Document Management** (Supporting system)

---

## 🎯 SUCCESS METRICS

### Material Management
- 100% material transactions tracked
- <2% inventory discrepancy
- Zero stock-outs on critical materials
- Purchase order cycle time < 2 days

### Labor Management
- 100% attendance tracking
- Payroll processing time < 1 hour per 100 workers
- Zero payroll errors
- Time sheet approval rate > 95%

### Budget Management
- Budget variance < 5%
- 100% of projects with approved budgets
- Alert generation within 24 hours of threshold breach
- Forecast accuracy > 90%

### Retention Management
- 100% retention tracking on invoices
- Zero missed release dates
- Release processing time < 15 minutes
- Retention report accuracy 100%

### Change Orders
- CO processing time < 3 days
- 100% impact analysis on COs
- CO approval rate > 80%
- Zero unapproved scope changes

### Document Management
- 100% critical documents digitized
- Document retrieval time < 30 seconds
- Zero lost documents
- Access audit trail 100% complete

---

## 🚀 NEXT STEPS

1. Review and prioritize features
2. Allocate development resources
3. Set up development environment
4. Begin with Budget Planning module
5. Conduct weekly progress reviews
6. Plan for user training
7. Schedule phased rollout

**Would you like me to start implementing any of these critical features?**

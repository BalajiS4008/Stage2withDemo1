# 🟡 MEDIUM PRIORITY FEATURES IMPLEMENTATION PLAN

## Priority: MEDIUM - Important for Enhanced Operations & Compliance

These features significantly enhance the software's capabilities, improve operational efficiency, and ensure regulatory compliance. While not immediately critical, they should be implemented after the critical features to create a more complete and professional system.

---

## 1. RECURRING INVOICES & ADVANCED INVOICE FEATURES

### 📋 Overview
Automate recurring billing, implement partial payments, credit notes, invoice reminders, and advanced invoice aging analysis.

### 🎯 Business Value
- Automate repetitive billing tasks
- Reduce manual invoice creation time
- Improve cash collection with reminders
- Handle refunds and adjustments professionally
- Track payment delays systematically

### 🗂️ Database Schema

```javascript
// recurringInvoices table
{
  id: Auto-increment,
  templateName: String,
  customerId: Number (FK),
  projectId: Number (FK, nullable),
  frequency: String, // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM
  startDate: Date,
  endDate: Date, // Nullable for indefinite
  nextInvoiceDate: Date,

  // Invoice Template Details
  items: Array [ // Line items template
    {
      description: String,
      quantity: Number,
      unit: String,
      rate: Number,
      amount: Number,
      taxRate: Number
    }
  ],
  subtotal: Number,
  taxAmount: Number,
  totalAmount: Number,

  // Customization
  invoicePrefix: String, // e.g., "MONTHLY-"
  notes: String,
  terms: String,
  autoSend: Boolean, // Auto-send to customer
  sendMethod: String, // EMAIL, WHATSAPP, BOTH

  // Status
  status: String, // ACTIVE, PAUSED, COMPLETED, CANCELLED
  generatedCount: Number, // Number of invoices generated
  lastGeneratedDate: Date,
  lastGeneratedInvoiceId: Number (FK),

  createdBy: Number (FK),
  createdAt: Date,
  updatedAt: Date
}

// partialPayments table
{
  id: Auto-increment,
  invoiceId: Number (FK),
  paymentNumber: Number, // 1, 2, 3... for this invoice
  paymentAmount: Number,
  paymentDate: Date,
  paymentMethod: String, // CASH, BANK_TRANSFER, CHEQUE, CARD, UPI
  transactionReference: String,
  notes: String,
  receivedBy: Number (FK to users),
  createdAt: Date
}

// creditNotes table
{
  id: Auto-increment,
  creditNoteNumber: String (unique, auto-generated),
  invoiceId: Number (FK), // Original invoice
  customerId: Number (FK),
  projectId: Number (FK, nullable),
  creditDate: Date,

  // Reason
  reason: String, // RETURN, DISCOUNT, ERROR_CORRECTION, CANCELLATION, OTHER
  reasonDescription: String,

  // Amount Details
  items: Array [ // Line items for credit
    {
      description: String,
      quantity: Number,
      unit: String,
      rate: Number,
      amount: Number
    }
  ],
  subtotal: Number,
  taxAmount: Number,
  creditAmount: Number,

  // Status
  status: String, // DRAFT, ISSUED, APPLIED, CANCELLED
  appliedToInvoiceId: Number (FK), // If applied to another invoice
  appliedDate: Date,
  refunded: Boolean,
  refundDate: Date,
  refundMethod: String,

  notes: String,
  attachments: Array,
  issuedBy: Number (FK to users),
  approvedBy: Number (FK to users),
  createdAt: Date,
  updatedAt: Date
}

// invoiceReminders table
{
  id: Auto-increment,
  invoiceId: Number (FK),
  reminderNumber: Number, // 1st reminder, 2nd reminder, etc.
  reminderDate: Date,
  dueDate: Date,
  daysOverdue: Number,
  reminderType: String, // AUTO, MANUAL
  reminderMethod: String, // EMAIL, SMS, WHATSAPP

  subject: String,
  message: String,
  sentTo: String, // Email or phone
  sentStatus: String, // PENDING, SENT, FAILED, DELIVERED, READ
  sentDate: Date,
  deliveredDate: Date,
  readDate: Date,

  responseReceived: Boolean,
  responseDate: Date,
  responseNotes: String,

  sentBy: Number (FK to users),
  createdAt: Date
}

// invoiceSchedules table (For scheduled reminders)
{
  id: Auto-increment,
  scheduleName: String, // "Standard Reminder Schedule"
  isDefault: Boolean,
  reminders: Array [ // Reminder schedule
    {
      daysBeforeDue: Number, // Negative for before, positive for after
      reminderType: String, // COURTESY, PAYMENT_DUE, OVERDUE
      subject: String,
      messageTemplate: String,
      sendMethod: String // EMAIL, SMS, WHATSAPP
    }
  ],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// invoiceAging table (Calculated/cached data for performance)
{
  id: Auto-increment,
  invoiceId: Number (FK),
  customerId: Number (FK),
  invoiceDate: Date,
  dueDate: Date,
  totalAmount: Number,
  paidAmount: Number,
  balanceAmount: Number,

  // Aging Buckets
  current: Number, // 0-30 days
  days30: Number, // 31-60 days
  days60: Number, // 61-90 days
  days90: Number, // 91-120 days
  days120Plus: Number, // 120+ days

  agingBucket: String, // CURRENT, 30_DAYS, 60_DAYS, 90_DAYS, 120_PLUS
  daysOutstanding: Number,
  isOverdue: Boolean,

  lastUpdated: Date,
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── RecurringInvoicesPage.jsx  // Manage recurring invoices
│   ├── CreditNotesPage.jsx        // Credit notes management
│   ├── InvoiceRemindersPage.jsx   // Reminders dashboard
│   └── InvoiceAgingPage.jsx       // Aging analysis
├── components/
│   ├── invoices/
│   │   ├── RecurringInvoiceForm.jsx
│   │   ├── RecurringInvoiceList.jsx
│   │   ├── PartialPaymentForm.jsx
│   │   ├── PartialPaymentsList.jsx
│   │   ├── CreditNoteForm.jsx
│   │   ├── CreditNoteList.jsx
│   │   ├── CreditNotePDF.jsx
│   │   ├── ReminderForm.jsx
│   │   ├── ReminderList.jsx
│   │   ├── ReminderScheduleForm.jsx
│   │   ├── AgingReport.jsx
│   │   ├── AgingChart.jsx
│   │   └── InvoicePaymentTracker.jsx
├── utils/
│   ├── recurringUtils.js          // Recurring logic
│   ├── partialPaymentUtils.js     // Payment calculations
│   ├── creditNoteUtils.js         // Credit note calculations
│   ├── reminderUtils.js           // Reminder generation
│   ├── agingUtils.js              // Aging calculations
│   └── invoiceScheduler.js        // Background scheduler
└── contexts/
    └── InvoiceAdvancedContext.jsx // Advanced invoice state
```

### 🔧 Implementation Steps

#### **Phase 1: Recurring Invoices (Week 1-2)**
1. Add recurringInvoices schema to Dexie
2. Create RecurringInvoicesPage
3. Build recurring invoice template form
4. Implement frequency options (daily, weekly, monthly, etc.)
5. Create invoice auto-generation scheduler
6. Add start/end date logic
7. Implement preview next invoice
8. Add pause/resume functionality
9. Create recurring invoice history view
10. Link generated invoices to template
11. Add auto-send functionality

#### **Phase 2: Partial Payments (Week 2)**
1. Add partialPayments schema
2. Modify existing invoice page to show partial payments
3. Build partial payment form
4. Calculate remaining balance automatically
5. Update invoice status (Partial, Paid)
6. Show payment history on invoice
7. Add payment tracker component
8. Generate partial payment receipts

#### **Phase 3: Credit Notes (Week 2-3)**
1. Add creditNotes schema to Dexie
2. Create CreditNotesPage
3. Build credit note form
4. Implement credit note number generation (CN-YYYYMM-001)
5. Link credit note to original invoice
6. Add line items for credit
7. Calculate credit amount
8. Create credit note PDF template
9. Implement credit note application:
   - Apply to original invoice
   - Apply to new invoice
   - Refund to customer
10. Add credit note approval workflow
11. Update customer balance on credit note

#### **Phase 4: Invoice Reminders (Week 3-4)**
1. Add invoiceReminders schema
2. Add invoiceSchedules schema
3. Create InvoiceRemindersPage
4. Build reminder schedule configuration
5. Create default reminder templates:
   - 7 days before due (courtesy)
   - On due date (payment due)
   - 7 days after due (1st reminder)
   - 14 days after due (2nd reminder)
   - 30 days after due (final notice)
6. Implement auto-reminder generation
7. Build manual reminder form
8. Add email template editor
9. Add SMS/WhatsApp integration
10. Track reminder status (sent, delivered, read)
11. Create reminder dashboard
12. Add reminder history per invoice

#### **Phase 5: Invoice Aging (Week 4)**
1. Add invoiceAging schema
2. Create InvoiceAgingPage
3. Implement aging calculation logic
4. Create aging buckets (0-30, 31-60, 61-90, 91-120, 120+)
5. Build aging report table
6. Create aging chart (bar chart by bucket)
7. Add customer-wise aging report
8. Implement aging summary dashboard
9. Create overdue invoice alerts
10. Add export to Excel

#### **Phase 6: Integration (Week 4-5)**
1. Link recurring invoices to regular invoices
2. Link partial payments to paymentsIn
3. Link credit notes to customer balance
4. Update dashboard with:
   - Overdue invoices count
   - Aging summary
   - Reminders due today
   - Recurring invoices to generate
5. Add widgets to invoice page:
   - Partial payments
   - Reminders sent
   - Credit notes linked
6. Integrate reminders with notification system

#### **Phase 7: Automation & Scheduler (Week 5)**
1. Create background scheduler for:
   - Auto-generate recurring invoices (daily check)
   - Auto-send reminders (daily check)
   - Update aging data (nightly)
2. Add scheduler status monitoring
3. Create scheduler logs
4. Implement error handling and retry logic

#### **Phase 8: Reports (Week 5)**
1. Create recurring invoice report
2. Build partial payments report
3. Add credit notes register
4. Create reminders effectiveness report
5. Build aging trend analysis report
6. Add collection efficiency report (DSO - Days Sales Outstanding)

#### **Phase 9: Testing (Week 5-6)**
1. Test recurring invoice generation
2. Test partial payment calculations
3. Test credit note workflows
4. Test reminder automation
5. Test aging calculations
6. Performance testing
7. Mobile responsiveness

### 🎨 UI/UX Features

- **Recurring Invoice Dashboard:**
  - Active templates count
  - Next scheduled invoices
  - Total invoices generated
  - Quick actions (create, pause, resume)

- **Partial Payment Tracker:**
  - Progress bar showing payment completion
  - Payment history table
  - Remaining balance highlighted
  - Quick add payment button

- **Credit Note Form:**
  - Original invoice selector
  - Reason dropdown
  - Line items with auto-calculation
  - Preview before save
  - Apply options (to invoice, refund, keep as credit)

- **Reminder Dashboard:**
  - Reminders due today
  - Overdue invoices count
  - Reminder effectiveness metrics
  - Quick send reminder button

- **Aging Report:**
  - Tabular view with aging buckets
  - Color coding (green, yellow, orange, red)
  - Drill-down by customer
  - Export to Excel
  - Chart visualization

### 🔐 Security & Validation

- Recurring invoice requires approval
- Credit note approval workflow
- Cannot edit sent reminders
- Partial payment cannot exceed invoice balance
- Credit note cannot exceed invoice amount
- Role-based access for sensitive operations

### 📊 Reports to Include

1. **Recurring Invoice Report** - All active and completed templates
2. **Partial Payments Report** - All partial payments with status
3. **Credit Notes Register** - All credit notes with reasons
4. **Reminders Sent Report** - All reminders with delivery status
5. **Invoice Aging Report** - Aging by customer and bucket
6. **Collection Efficiency Report** - DSO trends, collection rates
7. **Overdue Invoices Report** - All overdue invoices with days overdue
8. **Reminder Effectiveness Report** - Response rates after reminders

### ✅ Acceptance Criteria

- [ ] Can create recurring invoice templates
- [ ] Recurring invoices auto-generate on schedule
- [ ] Can record partial payments
- [ ] Invoice balance updates correctly
- [ ] Can create and apply credit notes
- [ ] Credit notes update customer balance
- [ ] Reminders auto-send on schedule
- [ ] Aging calculations are accurate
- [ ] Aging report displays correctly
- [ ] Reports export to Excel/PDF
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **5-6 weeks**

---

## 2. ADVANCED TAX MANAGEMENT

### 📋 Overview
Comprehensive tax handling including multiple tax types (GST, TDS, VAT), tax reports (GSTR-1, GSTR-3B), tax payment tracking, and compliance management.

### 🎯 Business Value
- Ensure tax compliance
- Automate tax calculations
- Generate statutory reports
- Track tax payments
- Reduce tax filing errors
- Audit trail for tax transactions

### 🗂️ Database Schema

```javascript
// taxTypes table
{
  id: Auto-increment,
  taxName: String, // GST, CGST, SGST, IGST, TDS, VAT, etc.
  taxCode: String (unique),
  taxType: String, // INPUT_TAX, OUTPUT_TAX, DEDUCTION
  taxCategory: String, // GOODS, SERVICES, MIXED
  defaultRate: Number, // Default percentage
  applicableOn: String, // INVOICE_AMOUNT, TAXABLE_AMOUNT
  calculation: String, // PERCENTAGE, FLAT_AMOUNT
  isActive: Boolean,
  effectiveFrom: Date,
  effectiveTo: Date,
  description: String,
  createdAt: Date,
  updatedAt: Date
}

// taxRates table
{
  id: Auto-increment,
  taxTypeId: Number (FK),
  rate: Number, // Percentage or flat amount
  hsnCode: String, // HSN/SAC code (for GST)
  description: String,
  applicableFrom: Date,
  applicableTo: Date,
  isDefault: Boolean,
  createdAt: Date
}

// taxTransactions table
{
  id: Auto-increment,
  transactionType: String, // INVOICE, PAYMENT, PURCHASE, EXPENSE
  transactionId: Number, // FK to invoice/payment/etc.
  partyId: Number (FK),
  projectId: Number (FK, nullable),
  transactionDate: Date,
  taxPeriod: String, // YYYY-MM (for monthly), YYYY-Q1 (for quarterly)
  financialYear: String, // FY2024-25

  // Tax Details
  taxableAmount: Number,
  taxes: Array [ // Multiple taxes can apply
    {
      taxTypeId: Number,
      taxName: String,
      taxRate: Number,
      taxAmount: Number,
      hsnCode: String
    }
  ],
  totalTaxAmount: Number,
  totalAmount: Number, // Taxable + Tax

  // GST Specific
  gstin: String, // GSTIN of party
  placeOfSupply: String, // State code
  supplyType: String, // INTRASTATE, INTERSTATE
  reverseCharge: Boolean,
  gstRate: Number,
  cgstAmount: Number,
  sgstAmount: Number,
  igstAmount: Number,
  cessAmount: Number,

  // TDS Specific
  tdsSection: String, // 194C, 194I, 194J, etc.
  tdsRate: Number,
  tdsAmount: Number,
  tdsPaid: Boolean,
  tdsPaidDate: Date,
  tdsPaymentReference: String,

  status: String, // RECORDED, FILED, PAID
  createdAt: Date,
  updatedAt: Date
}

// taxPayments table
{
  id: Auto-increment,
  paymentNumber: String (unique),
  taxType: String, // GST, TDS, VAT
  taxPeriod: String, // YYYY-MM or YYYY-Q1

  // Amount Details
  taxAmount: Number,
  interest: Number,
  penalty: Number,
  totalAmount: Number,

  // Payment Details
  paymentDate: Date,
  paymentMethod: String, // NEFT, CHALLAN, ONLINE
  challanNumber: String,
  bankName: String,
  transactionReference: String,

  // Status
  status: String, // PENDING, PAID, VERIFIED, FAILED
  verifiedDate: Date,

  notes: String,
  attachments: Array, // Challan receipts
  paidBy: Number (FK to users),
  createdAt: Date,
  updatedAt: Date
}

// gstrReturns table
{
  id: Auto-increment,
  returnType: String, // GSTR1, GSTR3B, GSTR9, etc.
  taxPeriod: String, // YYYY-MM
  financialYear: String,

  // Filing Status
  status: String, // DRAFT, COMPUTED, FILED, ACCEPTED, REJECTED
  filingDate: Date,
  acknowledgmentNumber: String,

  // Summary Data (for GSTR-3B)
  outwardTaxableSupplies: Number,
  outputTax: Object {
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number
  },
  inwardTaxableSupplies: Number,
  inputTax: Object {
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number
  },

  // ITC (Input Tax Credit)
  itcAvailable: Object {
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number
  },
  itcReversed: Object {
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number
  },
  netITC: Object {
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number
  },

  // Tax Liability
  taxPayable: Object {
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number
  },
  interest: Number,
  lateFee: Number,
  penalty: Number,

  // Payment Status
  paidAmount: Number,
  paidDate: Date,
  balanceAmount: Number,

  notes: String,
  attachments: Array,
  filedBy: Number (FK to users),
  createdAt: Date,
  updatedAt: Date
}

// tdsReturns table
{
  id: Auto-increment,
  returnType: String, // 24Q, 26Q, 27Q, etc.
  quarter: String, // Q1, Q2, Q3, Q4
  financialYear: String,

  // Summary
  totalDeductees: Number,
  totalTDSDeducted: Number,
  totalTDSDeposited: Number,
  shortfallAmount: Number,

  // Filing
  status: String, // DRAFT, FILED, ACCEPTED, REJECTED
  filingDate: Date,
  acknowledgmentNumber: String,
  tokenNumber: String,

  // Deductee Details (array)
  deductees: Array [
    {
      name: String,
      pan: String,
      section: String,
      tdsAmount: Number,
      depositDate: Date,
      challanNumber: String
    }
  ],

  notes: String,
  attachments: Array,
  filedBy: Number (FK to users),
  createdAt: Date,
  updatedAt: Date
}

// hsnCodes table
{
  id: Auto-increment,
  hsnCode: String (unique),
  sacCode: String,
  description: String,
  gstRate: Number,
  category: String, // GOODS, SERVICES
  isActive: Boolean,
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── TaxConfigurationPage.jsx   // Tax types & rates setup
│   ├── TaxTransactionsPage.jsx    // All tax transactions
│   ├── GSTReportsPage.jsx         // GSTR-1, GSTR-3B
│   ├── TDSReportsPage.jsx         // TDS reports
│   ├── TaxPaymentsPage.jsx        // Tax payment tracking
│   └── TaxCompliancePage.jsx      // Compliance dashboard
├── components/
│   ├── tax/
│   │   ├── TaxTypeForm.jsx
│   │   ├── TaxRateForm.jsx
│   │   ├── TaxCalculator.jsx      // Tax calculation component
│   │   ├── GSTR1Report.jsx        // GSTR-1 generation
│   │   ├── GSTR3BReport.jsx       // GSTR-3B generation
│   │   ├── TDSCertificate.jsx     // Form 16A
│   │   ├── TaxPaymentForm.jsx
│   │   ├── TaxPaymentList.jsx
│   │   ├── HSNSelector.jsx        // HSN/SAC code selector
│   │   ├── TaxSummaryCard.jsx
│   │   └── ComplianceChecklist.jsx
├── utils/
│   ├── taxCalculationUtils.js     // Tax calculations
│   ├── gstUtils.js                // GST-specific logic
│   ├── tdsUtils.js                // TDS calculations
│   ├── gstr1Generator.js          // GSTR-1 JSON generation
│   ├── gstr3bGenerator.js         // GSTR-3B JSON generation
│   └── tdsReturnGenerator.js      // TDS return generation
└── contexts/
    └── TaxContext.jsx             // Tax state management
```

### 🔧 Implementation Steps

#### **Phase 1: Tax Configuration (Week 1)**
1. Add tax schemas to Dexie
2. Create TaxConfigurationPage
3. Build tax types management
4. Add tax rates management
5. Create HSN/SAC code database
6. Implement tax applicability rules
7. Add effective date management
8. Create default tax templates (Indian GST rates: 0%, 5%, 12%, 18%, 28%)

#### **Phase 2: Tax Calculations (Week 1-2)**
1. Build tax calculator utility
2. Implement GST calculation:
   - Intrastate (CGST + SGST)
   - Interstate (IGST)
3. Implement TDS calculation by sections:
   - 194C (Contractors) - 1% or 2%
   - 194I (Rent) - 10%
   - 194J (Professional fees) - 10%
4. Add reverse charge mechanism
5. Implement composition scheme logic
6. Create tax breakdown component
7. Integrate with invoice generation
8. Integrate with payment recording

#### **Phase 3: Tax Transactions (Week 2-3)**
1. Add taxTransactions schema
2. Create TaxTransactionsPage
3. Auto-record tax on invoice creation
4. Auto-record tax on payment
5. Link tax to parties (GSTIN validation)
6. Add place of supply logic
7. Implement tax period classification
8. Create tax transaction history
9. Add tax filters (period, type, party)
10. Build tax summary dashboard

#### **Phase 4: GST Reports (Week 3-4)**
1. Add gstrReturns schema
2. Create GSTReportsPage
3. Implement GSTR-1 generation:
   - B2B invoices (4A, 4B, 6B, 6C)
   - B2C invoices (7)
   - Credit/Debit notes (9B)
   - HSN summary (12)
4. Implement GSTR-3B generation:
   - Table 3.1 (Outward supplies)
   - Table 4 (Input Tax Credit)
   - Table 5 (Tax liability)
5. Generate JSON files for GST portal upload
6. Add validation as per GST portal schema
7. Create GSTR-1 preview
8. Create GSTR-3B preview
9. Add reconciliation report
10. Export to Excel and JSON

#### **Phase 5: TDS Reports (Week 4)**
1. Add tdsReturns schema
2. Create TDSReportsPage
3. Implement TDS deduction tracking
4. Generate Form 16A (TDS certificates)
5. Create quarterly TDS return summary
6. Build 26Q return data
7. Add TDS payment tracking
8. Generate challan payment reports
9. Create TDS reconciliation

#### **Phase 6: Tax Payments (Week 4-5)**
1. Add taxPayments schema
2. Create TaxPaymentsPage
3. Build tax payment form
4. Link payment to tax period
5. Add challan details
6. Track payment status
7. Create payment reminders
8. Generate payment reports
9. Add late fee calculation
10. Add interest calculation

#### **Phase 7: Compliance Dashboard (Week 5)**
1. Create TaxCompliancePage
2. Build compliance checklist:
   - Monthly GSTR-3B due dates
   - Quarterly GSTR-1 due dates
   - Quarterly TDS due dates
   - Annual returns
3. Add compliance calendar
4. Create filing status tracker
5. Add overdue alerts
6. Build tax liability summary
7. Create tax payment schedule

#### **Phase 8: Integration (Week 5-6)**
1. Integrate tax with invoices
2. Integrate tax with payments
3. Integrate tax with expenses
4. Update dashboard with tax metrics:
   - Tax collected this month
   - Tax paid this month
   - Pending tax returns
   - Tax liability
5. Add tax widgets to relevant pages

#### **Phase 9: Testing (Week 6)**
1. Test tax calculations
2. Validate GSTR-1 JSON format
3. Validate GSTR-3B JSON format
4. Test TDS calculations
5. Test compliance alerts
6. Performance testing
7. Mobile responsiveness

### 🎨 UI/UX Features

- **Tax Dashboard:**
  - Tax collected (current month)
  - Tax paid (current month)
  - Pending returns count
  - Next filing due date
  - Tax liability summary

- **GSTR-1 Report:**
  - Tabular view of all invoices
  - Grouped by B2B and B2C
  - HSN summary
  - Validation status indicators
  - Download JSON button
  - Excel export button

- **GSTR-3B Report:**
  - Form layout matching GST portal
  - Auto-filled from transactions
  - Editable fields for adjustments
  - ITC calculation display
  - Tax liability summary
  - Download JSON button

- **Compliance Calendar:**
  - Monthly view with due dates
  - Color coding (upcoming, due today, overdue)
  - Click to file return
  - Filing status badges

### 🔐 Security & Validation

- GSTIN format validation (15 digits)
- PAN format validation
- HSN/SAC code validation
- Tax period cannot be future
- Cannot file return without approval
- Audit trail for all tax transactions
- Role-based access for filing

### 📊 Reports to Include

1. **Tax Summary Report** - Overall tax collected and paid
2. **GSTR-1 Report** - GST outward supplies
3. **GSTR-3B Report** - GST summary return
4. **GSTR-9 Report** - Annual GST return
5. **TDS Report** - TDS deducted and paid
6. **Form 16A** - TDS certificates
7. **26Q Return** - Quarterly TDS return
8. **Tax Payment Report** - All tax payments with challan details
9. **ITC Report** - Input tax credit summary
10. **Tax Reconciliation Report** - Books vs. Returns

### ✅ Acceptance Criteria

- [ ] Can configure tax types and rates
- [ ] Tax calculates correctly on invoices
- [ ] GSTR-1 generates accurate data
- [ ] GSTR-1 JSON validates on GST portal
- [ ] GSTR-3B generates accurate data
- [ ] GSTR-3B JSON validates on GST portal
- [ ] TDS calculations are correct
- [ ] Form 16A generates correctly
- [ ] Tax payments tracked accurately
- [ ] Compliance alerts work
- [ ] Reports export correctly
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **5-6 weeks**

---

## 3. AUDIT TRAIL & ACTIVITY LOG

### 📋 Overview
Comprehensive logging system to track all user actions, data changes, login/logout events, and generate audit reports for compliance and security.

### 🎯 Business Value
- Complete visibility into user actions
- Data change tracking for compliance
- Security monitoring
- Troubleshooting and debugging
- Regulatory compliance (SOX, GDPR, etc.)
- Fraud detection and prevention

### 🗂️ Database Schema

```javascript
// auditLog table
{
  id: Auto-increment,
  // Who
  userId: Number (FK),
  userName: String,
  userRole: String,

  // What
  action: String, // CREATE, UPDATE, DELETE, VIEW, EXPORT, IMPORT, LOGIN, LOGOUT, APPROVE, REJECT
  module: String, // PROJECT, INVOICE, PAYMENT, USER, SETTINGS, etc.
  recordType: String, // Specific table/entity
  recordId: Number, // ID of the record affected

  // Details
  description: String, // Human-readable description
  changes: Object { // For UPDATE actions
    field: String,
    oldValue: Any,
    newValue: Any
  }[],

  // When
  timestamp: Date,
  date: Date, // Date only for reporting
  time: String, // Time only

  // Where
  ipAddress: String,
  userAgent: String,
  deviceType: String, // DESKTOP, MOBILE, TABLET
  location: Object { // If available
    city: String,
    country: String
  },

  // Context
  sessionId: String,
  requestId: String, // For tracing related actions

  // Result
  status: String, // SUCCESS, FAILED, PARTIAL
  errorMessage: String, // If failed

  // Metadata
  duration: Number, // Action duration in ms
  dataSize: Number, // For export/import actions

  createdAt: Date
}

// loginHistory table
{
  id: Auto-increment,
  userId: Number (FK),
  userName: String,
  loginTime: Date,
  logoutTime: Date,
  sessionDuration: Number, // Minutes
  ipAddress: String,
  userAgent: String,
  deviceType: String,
  browser: String,
  os: String,
  location: Object {
    city: String,
    country: String
  },
  loginStatus: String, // SUCCESS, FAILED
  failureReason: String, // Invalid password, account locked, etc.
  logoutType: String, // MANUAL, AUTO_TIMEOUT, FORCED
  createdAt: Date
}

// dataAccessLog table (For sensitive data access)
{
  id: Auto-increment,
  userId: Number (FK),
  accessType: String, // VIEW, EXPORT, PRINT, DOWNLOAD
  resourceType: String, // INVOICE, PAYMENT, REPORT, etc.
  resourceId: Number,
  resourceName: String,
  accessTime: Date,
  accessReason: String, // Optional justification
  dataClassification: String, // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
  ipAddress: String,
  approved: Boolean, // For restricted data
  approvedBy: Number (FK),
  createdAt: Date
}

// securityEvents table
{
  id: Auto-increment,
  eventType: String, // FAILED_LOGIN, UNAUTHORIZED_ACCESS, PASSWORD_CHANGE, ROLE_CHANGE, SUSPICIOUS_ACTIVITY
  severity: String, // LOW, MEDIUM, HIGH, CRITICAL
  userId: Number (FK, nullable),
  userName: String,
  description: String,
  ipAddress: String,
  eventTime: Date,
  handled: Boolean,
  handledBy: Number (FK),
  handledTime: Date,
  notes: String,
  createdAt: Date
}

// changeHistory table (Detailed field-level tracking)
{
  id: Auto-increment,
  tableName: String,
  recordId: Number,
  fieldName: String,
  oldValue: String, // Serialized
  newValue: String, // Serialized
  changeType: String, // INSERT, UPDATE, DELETE
  changedBy: Number (FK),
  changedAt: Date,
  changeReason: String,
  approvalRequired: Boolean,
  approved: Boolean,
  approvedBy: Number (FK),
  approvedAt: Date,
  createdAt: Date
}

// complianceLog table
{
  id: Auto-increment,
  complianceType: String, // GDPR, SOX, HIPAA, etc.
  eventType: String, // DATA_EXPORT, DATA_DELETE, CONSENT_GIVEN, CONSENT_REVOKED
  userId: Number (FK),
  dataSubjectId: Number, // Person whose data is affected
  dataType: String,
  description: String,
  eventTime: Date,
  evidenceFile: String, // Path to evidence document
  notes: String,
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── AuditLogPage.jsx           // Main audit log viewer
│   ├── LoginHistoryPage.jsx       // Login/logout history
│   ├── DataAccessLogPage.jsx      // Sensitive data access
│   ├── SecurityEventsPage.jsx     // Security monitoring
│   └── AuditReportsPage.jsx       // Audit reports
├── components/
│   ├── audit/
│   │   ├── AuditLogTable.jsx      // Audit log display
│   │   ├── AuditLogFilters.jsx    // Filter component
│   │   ├── AuditLogDetail.jsx     // Detailed view
│   │   ├── ChangeHistoryModal.jsx // Show change history
│   │   ├── LoginHistoryChart.jsx  // Login analytics
│   │   ├── SecurityAlertCard.jsx  // Security alerts
│   │   ├── ComplianceReport.jsx   // Compliance reporting
│   │   └── AuditExport.jsx        // Export audit data
├── utils/
│   ├── auditLogger.js             // Core logging utility
│   ├── auditFilters.js            // Filter logic
│   ├── changeDetector.js          // Detect data changes
│   └── complianceReporter.js      // Compliance reporting
├── hooks/
│   ├── useAuditLog.js             // Audit logging hook
│   └── useChangeTracking.js       // Change tracking hook
└── contexts/
    └── AuditContext.jsx           // Audit state
```

### 🔧 Implementation Steps

#### **Phase 1: Core Logging Infrastructure (Week 1)**
1. Add audit schemas to Dexie
2. Create auditLogger utility
3. Implement logging wrapper functions:
   - logAction()
   - logChange()
   - logAccess()
   - logSecurityEvent()
4. Create useAuditLog hook
5. Capture user context (userId, IP, userAgent)
6. Implement error logging
7. Add performance logging (optional)

#### **Phase 2: Action Logging (Week 1-2)**
1. Integrate logging into all CRUD operations:
   - Projects (create, update, delete)
   - Invoices (create, update, delete, send)
   - Payments (create, update, delete)
   - Users (create, update, delete, role change)
   - Settings (update)
2. Log approval workflows
3. Log export operations
4. Log import operations
5. Log bulk actions
6. Add context-aware descriptions

#### **Phase 3: Change Tracking (Week 2)**
1. Add changeHistory schema
2. Create changeDetector utility
3. Implement field-level change tracking
4. Compare old vs. new values
5. Serialize complex objects
6. Track who changed what and when
7. Add change reasons (optional comments)
8. Create change history viewer

#### **Phase 4: Login History (Week 2-3)**
1. Add loginHistory schema
2. Log login attempts (success and failed)
3. Capture device information
4. Track session duration
5. Log logout events (manual and timeout)
6. Create LoginHistoryPage
7. Build login analytics:
   - Logins per day chart
   - Failed login attempts
   - Active users
8. Add suspicious activity detection

#### **Phase 5: Data Access Logging (Week 3)**
1. Add dataAccessLog schema
2. Log sensitive data access:
   - Invoice views
   - Payment views
   - Report exports
   - Financial data
3. Create DataAccessLogPage
4. Implement access justification (optional)
5. Add approval workflow for restricted data
6. Build access frequency reports

#### **Phase 6: Security Events (Week 3-4)**
1. Add securityEvents schema
2. Create SecurityEventsPage
3. Log security events:
   - Multiple failed login attempts
   - Password changes
   - Role changes
   - Unauthorized access attempts
   - Suspicious activity patterns
4. Implement security alerts
5. Add event severity levels
6. Create incident response workflow
7. Build security dashboard

#### **Phase 7: Audit Log Viewer (Week 4)**
1. Create AuditLogPage
2. Build comprehensive audit log table
3. Implement advanced filters:
   - Date range
   - User
   - Action type
   - Module
   - Status
4. Add search functionality
5. Create detailed audit log view
6. Add timeline visualization
7. Implement pagination and sorting

#### **Phase 8: Compliance Reporting (Week 4-5)**
1. Add complianceLog schema
2. Create compliance event logging
3. Build AuditReportsPage
4. Generate compliance reports:
   - User activity report
   - Data access report
   - Change history report
   - Security events report
   - Login history report
5. Add report templates
6. Implement date range selection
7. Export to PDF and Excel

#### **Phase 9: Integration (Week 5)**
1. Add audit logging to all existing modules
2. Create audit dashboard widget
3. Add recent activity feed
4. Integrate with notification system
5. Add audit alerts to dashboard:
   - Failed login attempts
   - Unauthorized access
   - Suspicious activity
6. Create audit summary metrics

#### **Phase 10: Testing & Optimization (Week 5-6)**
1. Test logging across all modules
2. Test change detection accuracy
3. Test filter and search performance
4. Optimize database queries
5. Implement log archival (move old logs)
6. Test export functionality
7. Performance testing with large logs
8. Mobile responsiveness

### 🎨 UI/UX Features

- **Audit Log Dashboard:**
  - Total actions logged today
  - Failed login attempts
  - Data exports count
  - Security alerts count
  - Recent activity feed

- **Audit Log Table:**
  - Time column with relative time (2 hours ago)
  - User column with avatar
  - Action column with color-coded badges
  - Module column
  - Description column
  - Status column (success/failed)
  - Quick action (view details)

- **Change History Modal:**
  - Side-by-side comparison (old vs. new)
  - Highlighted changes
  - Changed by user
  - Change timestamp
  - Change reason

- **Security Dashboard:**
  - Failed login attempts chart
  - Unauthorized access attempts
  - Active security events
  - User activity heatmap
  - Geographic login map (optional)

### 🔐 Security & Validation

- Audit logs are immutable (cannot be edited or deleted)
- Only Admin can view audit logs
- Sensitive data is masked in logs
- Log retention policy (e.g., 7 years)
- Encrypted storage for audit logs
- Regular log backups
- Access to audit logs is logged

### 📊 Reports to Include

1. **User Activity Report** - All actions by user
2. **Module Activity Report** - All actions by module
3. **Login History Report** - All login/logout events
4. **Failed Login Report** - Failed login attempts
5. **Data Access Report** - Sensitive data access
6. **Change History Report** - All data changes
7. **Security Events Report** - Security incidents
8. **Compliance Report** - Compliance events
9. **Export Activity Report** - All data exports
10. **Approval History Report** - All approvals

### ✅ Acceptance Criteria

- [ ] All CRUD operations are logged
- [ ] Login/logout events are tracked
- [ ] Data changes are captured accurately
- [ ] Security events are logged
- [ ] Audit log viewer displays all logs
- [ ] Filters and search work correctly
- [ ] Change history shows old vs. new
- [ ] Compliance reports generate correctly
- [ ] Reports export to PDF/Excel
- [ ] Performance is acceptable with 100k+ logs
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **5-6 weeks**

---

## 4. NOTIFICATIONS & ALERTS SYSTEM

### 📋 Overview
Multi-channel notification system supporting email, SMS, push notifications, and in-app alerts with user preferences and notification history.

### 🎯 Business Value
- Keep users informed of critical events
- Reduce missed deadlines
- Improve response times
- Enhance user engagement
- Automate communication
- Reduce manual follow-ups

### 🗂️ Database Schema

```javascript
// notificationTemplates table
{
  id: Auto-increment,
  templateName: String,
  templateCode: String (unique),
  category: String, // INVOICE, PAYMENT, PROJECT, USER, SYSTEM
  eventType: String, // INVOICE_OVERDUE, PAYMENT_RECEIVED, PROJECT_MILESTONE, etc.

  // Channels
  channels: Array, // ['EMAIL', 'SMS', 'PUSH', 'IN_APP']
  priority: String, // LOW, MEDIUM, HIGH, URGENT

  // Email Template
  emailSubject: String,
  emailBody: String, // HTML template with {{placeholders}}

  // SMS Template
  smsBody: String, // Plain text with {{placeholders}}

  // Push Notification Template
  pushTitle: String,
  pushBody: String,

  // In-App Template
  inAppTitle: String,
  inAppBody: String,
  inAppIcon: String,
  inAppColor: String,

  // Settings
  isActive: Boolean,
  isDefault: Boolean,

  createdAt: Date,
  updatedAt: Date
}

// notifications table
{
  id: Auto-increment,
  notificationId: String (unique),

  // Recipient
  userId: Number (FK),
  recipientEmail: String,
  recipientPhone: String,

  // Content
  templateId: Number (FK),
  templateCode: String,
  category: String,
  eventType: String,
  subject: String,
  body: String, // Rendered from template

  // Related Data
  relatedType: String, // INVOICE, PAYMENT, PROJECT, etc.
  relatedId: Number,
  data: Object, // Additional data for links, etc.

  // Channels & Status
  channels: Array, // Channels to send through
  priority: String,
  status: String, // PENDING, SENT, DELIVERED, READ, FAILED

  // Email Status
  emailSent: Boolean,
  emailSentAt: Date,
  emailDelivered: Boolean,
  emailDeliveredAt: Date,
  emailOpened: Boolean,
  emailOpenedAt: Date,
  emailClicked: Boolean,
  emailClickedAt: Date,
  emailFailed: Boolean,
  emailFailureReason: String,

  // SMS Status
  smsSent: Boolean,
  smsSentAt: Date,
  smsDelivered: Boolean,
  smsDeliveredAt: Date,
  smsFailed: Boolean,
  smsFailureReason: String,

  // Push Status
  pushSent: Boolean,
  pushSentAt: Date,
  pushDelivered: Boolean,
  pushClicked: Boolean,
  pushClickedAt: Date,

  // In-App Status
  inAppCreated: Boolean,
  inAppRead: Boolean,
  inAppReadAt: Date,
  inAppDismissed: Boolean,
  inAppDismissedAt: Date,

  // Scheduling
  scheduledFor: Date,
  sentAt: Date,

  // Actions
  actionUrl: String, // Link to related resource
  actionLabel: String, // "View Invoice", "View Payment"

  // Retry
  retryCount: Number,
  lastRetryAt: Date,
  maxRetries: Number,

  createdAt: Date,
  updatedAt: Date
}

// userNotificationPreferences table
{
  id: Auto-increment,
  userId: Number (FK),

  // Global Settings
  emailEnabled: Boolean,
  smsEnabled: Boolean,
  pushEnabled: Boolean,
  inAppEnabled: Boolean,

  // Frequency
  digestMode: Boolean, // Daily digest instead of real-time
  digestTime: String, // "09:00"
  quietHoursStart: String, // "22:00"
  quietHoursEnd: String, // "08:00"

  // Category Preferences (per event type)
  preferences: Object {
    INVOICE_CREATED: {
      email: Boolean,
      sms: Boolean,
      push: Boolean,
      inApp: Boolean
    },
    INVOICE_OVERDUE: {
      email: Boolean,
      sms: Boolean,
      push: Boolean,
      inApp: Boolean
    },
    PAYMENT_RECEIVED: {
      email: Boolean,
      sms: Boolean,
      push: Boolean,
      inApp: Boolean
    },
    // ... more event types
  },

  createdAt: Date,
  updatedAt: Date
}

// notificationSchedule table
{
  id: Auto-increment,
  scheduleName: String,
  eventType: String,

  // Trigger Rules
  triggerCondition: String, // IMMEDIATE, DELAYED, RECURRING
  delayMinutes: Number,
  recurringPattern: String, // DAILY, WEEKLY, MONTHLY
  recurringTime: String,

  // Filters
  filters: Object {
    projectId: Number,
    customerId: Number,
    amount: { min: Number, max: Number },
    // ... other filters
  },

  isActive: Boolean,
  lastTriggered: Date,
  nextTrigger: Date,

  createdAt: Date,
  updatedAt: Date
}

// notificationQueue table
{
  id: Auto-increment,
  notificationId: Number (FK),
  channel: String, // EMAIL, SMS, PUSH
  status: String, // QUEUED, PROCESSING, SENT, FAILED
  priority: Number,
  attempts: Number,
  maxAttempts: Number,
  scheduledFor: Date,
  processedAt: Date,
  errorMessage: String,
  createdAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── NotificationsPage.jsx      // View all notifications
│   ├── NotificationSettingsPage.jsx // User preferences
│   └── NotificationTemplatesPage.jsx // Admin template management
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.jsx   // Header notification icon
│   │   ├── NotificationDropdown.jsx // Dropdown list
│   │   ├── NotificationList.jsx   // Full list view
│   │   ├── NotificationCard.jsx   // Individual notification
│   │   ├── NotificationToast.jsx  // Toast notification
│   │   ├── PreferencesForm.jsx    // User preferences
│   │   ├── TemplateEditor.jsx     // Template editor
│   │   ├── TemplatePreview.jsx    // Preview notification
│   │   └── NotificationHistory.jsx // History view
├── utils/
│   ├── notificationService.js     // Core notification service
│   ├── emailService.js            // Email sending
│   ├── smsService.js              // SMS sending
│   ├── pushService.js             // Push notifications
│   ├── templateRenderer.js        // Render templates with data
│   └── notificationScheduler.js   // Scheduling logic
├── hooks/
│   ├── useNotifications.js        // Notification hook
│   └── useNotificationPreferences.js
└── contexts/
    └── NotificationContext.jsx    // Notification state
```

### 🔧 Implementation Steps

#### **Phase 1: Core Infrastructure (Week 1)**
1. Add notification schemas to Dexie
2. Create notification service
3. Implement notification context
4. Build notification API
5. Create template rendering engine
6. Implement placeholder replacement
7. Set up notification queue

#### **Phase 2: In-App Notifications (Week 1-2)**
1. Create notification bell icon
2. Build notification dropdown
3. Implement unread count badge
4. Create NotificationsPage
5. Build notification cards
6. Implement mark as read
7. Add dismiss functionality
8. Create notification toast
9. Add real-time updates (polling)
10. Implement notification sound (optional)

#### **Phase 3: Notification Templates (Week 2)**
1. Create NotificationTemplatesPage
2. Build template editor
3. Implement template categories
4. Create default templates:
   - Invoice created
   - Invoice overdue
   - Payment received
   - Milestone completed
   - Budget threshold
   - Document uploaded
5. Add template preview
6. Implement template variables
7. Add template versioning

#### **Phase 4: Email Notifications (Week 2-3)**
1. Set up email service (SMTP or API)
2. Create email templates (HTML)
3. Implement email sending
4. Add email tracking (opens, clicks)
5. Handle email failures
6. Implement retry logic
7. Add unsubscribe functionality
8. Create email delivery reports

#### **Phase 5: SMS Notifications (Week 3)**
1. Integrate SMS API (Twilio, AWS SNS, etc.)
2. Create SMS templates
3. Implement SMS sending
4. Handle SMS failures
5. Track SMS delivery
6. Add SMS cost tracking
7. Implement SMS rate limiting

#### **Phase 6: Push Notifications (Week 3-4)**
1. Set up push notification service (Firebase, OneSignal)
2. Implement browser push notifications
3. Handle push subscriptions
4. Create push notification templates
5. Implement push sending
6. Track push delivery and clicks
7. Handle push failures

#### **Phase 7: User Preferences (Week 4)**
1. Create NotificationSettingsPage
2. Build preferences form
3. Implement per-event preferences
4. Add digest mode option
5. Implement quiet hours
6. Add mute all option
7. Save and load preferences
8. Apply preferences to notifications

#### **Phase 8: Notification Triggers (Week 4-5)**
1. Implement notification triggers:
   - Invoice created → notify customer
   - Invoice overdue → notify admin
   - Payment received → notify admin
   - Milestone completed → notify stakeholders
   - Budget threshold → notify project manager
   - Low stock → notify admin
   - Payroll generated → notify workers
   - Document uploaded → notify team
2. Add trigger configuration
3. Implement conditional triggers
4. Add custom triggers

#### **Phase 9: Scheduling & Queue (Week 5)**
1. Implement notification scheduler
2. Create notification queue processor
3. Add priority-based processing
4. Implement batch sending
5. Add rate limiting
6. Create retry mechanism
7. Handle failed notifications
8. Build queue monitoring dashboard

#### **Phase 10: Integration (Week 5-6)**
1. Integrate with all modules:
   - Invoices
   - Payments
   - Projects
   - Budget
   - Payroll
   - Materials
2. Add notification widgets to dashboard
3. Create notification center
4. Add recent notifications feed
5. Implement notification filtering

#### **Phase 11: Reports & Analytics (Week 6)**
1. Create notification history report
2. Build delivery analytics
3. Add engagement metrics (opens, clicks)
4. Create failure analysis report
5. Build cost analysis (for SMS)
6. Add user engagement report

#### **Phase 12: Testing (Week 6)**
1. Test all notification triggers
2. Test email delivery
3. Test SMS delivery
4. Test push notifications
5. Test preferences enforcement
6. Test scheduling and queue
7. Performance testing
8. Mobile responsiveness

### 🎨 UI/UX Features

- **Notification Bell:**
  - Unread count badge
  - Red dot indicator
  - Click to open dropdown
  - Smooth animations

- **Notification Dropdown:**
  - List of recent notifications (5-10)
  - Mark all as read button
  - View all link
  - Grouped by date (Today, Yesterday, Earlier)
  - Empty state for no notifications

- **Notification Card:**
  - Icon based on type
  - Color-coded by category
  - Title and description
  - Timestamp (relative time)
  - Action button (if applicable)
  - Mark as read button
  - Dismiss button

- **Notification Toast:**
  - Appears on event trigger
  - Auto-dismiss after 5 seconds
  - Close button
  - Click to view full notification

- **Preferences Form:**
  - Toggle switches for each channel
  - Per-event preferences
  - Digest mode toggle
  - Quiet hours time picker
  - Save button

### 🔐 Security & Validation

- Email address validation
- Phone number validation
- Unsubscribe functionality
- Rate limiting to prevent spam
- GDPR compliance (consent, data deletion)
- Encrypted sensitive data
- Role-based notification access

### 📊 Reports to Include

1. **Notification History Report** - All notifications sent
2. **Delivery Report** - Delivery status by channel
3. **Engagement Report** - Opens, clicks, reads
4. **Failure Analysis Report** - Failed notifications
5. **Cost Report** - SMS costs
6. **User Engagement Report** - Per-user activity
7. **Template Performance Report** - Most effective templates

### ✅ Acceptance Criteria

- [ ] In-app notifications display correctly
- [ ] Email notifications send successfully
- [ ] SMS notifications send successfully
- [ ] Push notifications work
- [ ] User preferences apply correctly
- [ ] Notification triggers work
- [ ] Queue processing works
- [ ] Retry logic functions
- [ ] Templates render correctly
- [ ] Tracking works (opens, clicks)
- [ ] Reports display accurate data
- [ ] Mobile responsive

### 🚀 Estimated Timeline: **6 weeks**

---

## 5. TASK/WORK ORDER MANAGEMENT

### 📋 Overview
Comprehensive task management system with task creation, assignment, progress tracking, Gantt charts, and work order management for field operations.

### 🎯 Business Value
- Improve project planning
- Track task progress
- Assign responsibilities clearly
- Visualize project timeline
- Manage field work orders
- Improve team coordination

### 🗂️ Database Schema

```javascript
// tasks table
{
  id: Auto-increment,
  taskNumber: String (unique, auto-generated),
  projectId: Number (FK),
  parentTaskId: Number (FK, nullable), // For subtasks

  // Task Details
  title: String,
  description: String,
  taskType: String, // MILESTONE, TASK, SUBTASK, WORK_ORDER
  category: String, // DESIGN, PROCUREMENT, CONSTRUCTION, INSPECTION, etc.

  // Assignment
  assignedTo: Number (FK to users/workers),
  assignedBy: Number (FK to users),
  assignedDate: Date,
  departmentId: Number (FK, nullable),

  // Schedule
  startDate: Date,
  dueDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,
  estimatedHours: Number,
  actualHours: Number,

  // Dependencies
  dependencies: Array, // Array of task IDs that must complete first
  blockedBy: Array, // Array of task IDs blocking this task

  // Priority & Status
  priority: String, // LOW, MEDIUM, HIGH, URGENT
  status: String, // NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
  progress: Number, // 0-100

  // Work Order Specific
  location: String,
  equipmentRequired: Array,
  materialsRequired: Array,
  specialInstructions: String,
  safetyRequirements: String,

  // Completion
  completedBy: Number (FK),
  completedDate: Date,
  completionNotes: String,
  qualityCheck: Boolean,
  qualityCheckedBy: Number (FK),

  // Attachments
  attachments: Array,
  photos: Array, // Before/after photos

  // Time Tracking
  timeEntries: Array [
    {
      userId: Number,
      startTime: DateTime,
      endTime: DateTime,
      hours: Number,
      notes: String
    }
  ],

  // Recurring
  isRecurring: Boolean,
  recurrencePattern: String, // DAILY, WEEKLY, MONTHLY
  recurrenceEndDate: Date,

  tags: Array,
  notes: String,
  createdBy: Number (FK),
  createdAt: Date,
  updatedAt: Date
}

// taskComments table
{
  id: Auto-increment,
  taskId: Number (FK),
  userId: Number (FK),
  comment: String,
  commentType: String, // COMMENT, UPDATE, MENTION
  mentions: Array, // User IDs mentioned
  attachments: Array,
  isInternal: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// taskHistory table
{
  id: Auto-increment,
  taskId: Number (FK),
  userId: Number (FK),
  action: String, // CREATED, ASSIGNED, STARTED, UPDATED, COMPLETED, CANCELLED
  field: String, // Field changed
  oldValue: String,
  newValue: String,
  notes: String,
  timestamp: Date,
  createdAt: Date
}

// workOrders table (Extends tasks for field work)
{
  id: Auto-increment,
  taskId: Number (FK),
  workOrderNumber: String (unique),
  customerId: Number (FK, nullable),
  siteAddress: String,
  siteContact: String,
  sitePhone: String,

  // Schedule
  scheduledDate: Date,
  scheduledTime: String,
  estimatedDuration: Number, // Hours

  // Team
  teamLead: Number (FK),
  teamMembers: Array, // User/Worker IDs

  // Resources
  vehicleRequired: Boolean,
  vehicleNumber: String,
  toolsRequired: Array,
  materialsRequired: Array [
    {
      materialId: Number,
      quantity: Number,
      issued: Boolean
    }
  ],

  // Checklist
  checklist: Array [
    {
      item: String,
      completed: Boolean,
      completedBy: Number,
      completedAt: Date
    }
  ],

  // Sign-off
  customerSignature: String, // Base64
  customerName: String,
  signedAt: Date,
  customerFeedback: String,
  customerRating: Number, // 1-5

  // Billing
  billable: Boolean,
  billingRate: Number,
  totalBilled: Number,
  invoiceId: Number (FK, nullable),

  status: String, // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  createdAt: Date,
  updatedAt: Date
}

// taskTemplates table
{
  id: Auto-increment,
  templateName: String,
  category: String,
  description: String,
  tasks: Array [ // Pre-defined task list
    {
      title: String,
      description: String,
      estimatedHours: Number,
      dependencies: Array,
      assigneeRole: String
    }
  ],
  isActive: Boolean,
  createdBy: Number (FK),
  createdAt: Date,
  updatedAt: Date
}
```

### 📁 File Structure

```
src/
├── pages/
│   ├── TasksPage.jsx              // Main tasks page
│   ├── TaskDetailPage.jsx         // Task detail view
│   ├── GanttChartPage.jsx         // Gantt chart view
│   ├── WorkOrdersPage.jsx         // Work orders
│   └── TaskTemplatesPage.jsx      // Task templates
├── components/
│   ├── tasks/
│   │   ├── TaskForm.jsx
│   │   ├── TaskList.jsx
│   │   ├── TaskCard.jsx
│   │   ├── TaskBoard.jsx          // Kanban board
│   │   ├── TaskCalendar.jsx       // Calendar view
│   │   ├── GanttChart.jsx         // Gantt visualization
│   │   ├── TaskTimeline.jsx       // Timeline view
│   │   ├── TaskDependencies.jsx   // Dependency graph
│   │   ├── TaskComments.jsx       // Comments section
│   │   ├── TaskHistory.jsx        // Activity history
│   │   ├── TimeTracking.jsx       // Time tracking
│   │   ├── WorkOrderForm.jsx
│   │   ├── WorkOrderCard.jsx
│   │   ├── Checklist.jsx          // Task checklist
│   │   └── TaskTemplateForm.jsx
├── utils/
│   ├── taskUtils.js               // Task calculations
│   ├── ganttUtils.js              // Gantt chart logic
│   ├── dependencyResolver.js      // Dependency calculations
│   └── taskScheduler.js           // Task scheduling
└── contexts/
    └── TaskContext.jsx            // Task state
```

### 🔧 Implementation Steps (Brief - 4-5 weeks)
1. Database setup (Week 1)
2. Task CRUD operations (Week 1-2)
3. Task assignment and status tracking (Week 2)
4. Gantt chart implementation (Week 2-3)
5. Work order management (Week 3)
6. Task dependencies (Week 3-4)
7. Time tracking (Week 4)
8. Comments and collaboration (Week 4)
9. Templates (Week 4-5)
10. Integration and testing (Week 5)

### 🚀 Estimated Timeline: **4-5 weeks**

---

## 6. MULTI-CURRENCY SUPPORT

### 📋 Overview
Support for multiple currencies with real-time exchange rates, currency conversion, and multi-currency financial reporting.

### 🗂️ Database Schema (Brief)

```javascript
// currencies table
{
  id, code, name, symbol, exchangeRate, isBaseCurrency, isActive
}

// exchangeRates table
{
  id, fromCurrency, toCurrency, rate, date, source
}

// Updated invoices/payments tables
{
  // ... existing fields
  currency: String,
  exchangeRate: Number,
  amountInBaseCurrency: Number
}
```

### 🔧 Implementation Steps (Brief - 3-4 weeks)
1. Currency configuration (Week 1)
2. Exchange rate management (Week 1-2)
3. Multi-currency transactions (Week 2-3)
4. Currency conversion (Week 3)
5. Multi-currency reports (Week 3-4)
6. Integration (Week 4)

### 🚀 Estimated Timeline: **3-4 weeks**

---

## 📊 OVERALL MEDIUM PRIORITY FEATURES SUMMARY

| Feature | Timeline | Complexity | Impact |
|---------|----------|------------|--------|
| Recurring Invoices & Advanced Features | 5-6 weeks | Medium-High | High |
| Advanced Tax Management | 5-6 weeks | High | High |
| Audit Trail & Activity Log | 5-6 weeks | Medium | Medium-High |
| Notifications & Alerts | 6 weeks | Medium-High | High |
| Task/Work Order Management | 4-5 weeks | Medium | Medium |
| Multi-Currency Support | 3-4 weeks | Medium | Low-Medium |

**Total Estimated Timeline: 28-33 weeks (~7-8 months)**

**Recommended Implementation Order:**
1. **Notifications & Alerts** (Foundation for communication)
2. **Recurring Invoices & Advanced Features** (Revenue automation)
3. **Advanced Tax Management** (Compliance requirement)
4. **Audit Trail** (Governance and security)
5. **Task Management** (Project coordination)
6. **Multi-Currency** (If needed for business)

---

## 🚀 NEXT STEPS

After implementing critical features, proceed with medium priority features based on business needs and user feedback.

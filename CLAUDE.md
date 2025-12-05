# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000

# Production
npm run build            # Build for production (output: dist/)
npm run preview          # Preview production build

# Testing
npm test                 # Run tests with Vitest
npm run test:ui          # Run tests with UI interface
npm run test:coverage    # Run tests with coverage report
```

## Architecture Overview

### Tech Stack Core
- **Framework**: React 18 with Vite
- **UI Libraries**: Bootstrap 5, Tailwind CSS (hybrid approach)
- **Database**: Dexie.js (IndexedDB wrapper) with Firebase Firestore cloud sync
- **State Management**: Context API (AuthContext, DataContext, ThemeContext, NavigationContext)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + jsPDF-autotable
- **Icons**: lucide-react

### Data Architecture (Critical)

This application uses a **hybrid offline-first architecture**:

1. **Primary Storage**: Dexie.js (IndexedDB) via `src/db/dexieDB.js`
   - All user data stored locally in browser
   - Enables offline functionality
   - 14 database tables including: projects, invoices, quotations, paymentsIn, paymentsOut, departments, parties, users, settings, materials, workers, attendance, budgets, documents

2. **Cloud Sync**: Firebase Firestore via `src/services/syncService.js`
   - Bi-directional sync when online
   - Conflict resolution: last-write-wins based on `lastUpdated` timestamp
   - Each record has `synced` and `lastUpdated` fields
   - Firestore structure: `users/{firebaseUid}/{collectionName}/{docId}`

3. **Legacy Support**: localStorage via `src/utils/dataManager.jsx`
   - Backward compatibility layer
   - Auto-migrates old localStorage data to Dexie

### State Management Pattern

**DataContext** (`src/context/DataContext.jsx`) is the central data hub:
- Loads data from Dexie on mount
- Provides CRUD operations for all entities
- Auto-saves to localStorage for backward compatibility
- All pages consume data via `useData()` hook

**AuthContext** (`src/context/AuthContext.jsx`):
- Manages user authentication
- Role-based access control (Admin/User)
- Firebase authentication integration

### Critical Database Schema Notes

**Database Version**: Currently on version 6+ (see `dexieDB.js`)

Key indexed fields:
- All tables: `userId`, `synced`, `lastUpdated`
- Projects: `status`, `customerId`
- Invoices: `projectId`, `invoiceNumber`, `status`
- Parties: `type` (customer/supplier), `defaultProjectId`
- SupplierTransactions: `supplierId`, `projectId`, `type`, `paymentOutId`

**Migration Pattern**: When changing schema, increment `db.version()` and provide `.upgrade()` function for data migration.

### Utility Functions Architecture

All utility files follow this pattern:
- Export constants (e.g., `CHANGE_ORDER_STATUS`, `MATERIAL_CATEGORIES`)
- Export named functions for calculations
- Export a default object containing all exports
- Use Indian formatting conventions (₹ for currency, DD/MM/YYYY for dates)

Key utility files:
- `budgetUtils.js` - EVM (Earned Value Management) calculations, forecasting
- `changeOrderUtils.js` - Change order impact analysis
- `materialUtils.js` - Inventory, stock transactions, PO management
- `laborUtils.js` - Worker stats, attendance, payroll calculations
- `invoiceTemplates.jsx` - PDF invoice generation
- `exportUtils.js` - Excel/CSV export functionality
- `encryption.js` - Backup encryption/decryption

**Important**: Multiple utils have `formatCurrency()` - they format as Indian Rupees (₹).

### Navigation System

Navigation uses a **page-based routing** system without React Router DOM for main sections:

1. `App.jsx` manages `currentPage` state
2. `NavigationContext` provides navigation methods
3. `Layout.jsx` renders current page based on `currentPage`
4. Pages: Dashboard, Projects, PaymentsIn, PaymentsOut, Invoices, Quotations, Parties, Departments, Materials, Workers, Budget, Documents, etc.

Navigation config: `src/config/navigationConfig.jsx`

### File Extensions & Conventions

- **React Components**: `.jsx` extension (NOT `.js`)
- Vite configured to treat all `.js` files as JSX via `esbuild.loader: 'jsx'`
- Test files: `.test.jsx` or `.test.js`

### Critical Implementation Details

**Change Orders & Budget Tracking**:
- Change orders affect budget and schedule
- Aliases exist for backward compatibility:
  - `calculateCostImpact` → `calculateTotalCostImpact`
  - `calculateScheduleImpact` → `calculateTimeImpact`

**Material/Inventory System**:
- Transaction types: IN, OUT, ADJUSTMENT, RETURN
- Auto-generated codes: `MAT-YYYYMM-XXX`, `PO-YYYYMM-XXX`, `TXN-YYYYMM-XXX`
- Reorder level tracking for low stock alerts
- ABC analysis for material categorization

**Labor Management**:
- Worker types: PERMANENT, CONTRACT, DAILY_WAGE, PIECE_RATE
- Attendance tracking with status: PRESENT, ABSENT, HALF_DAY, LEAVE, OVERTIME
- Payroll with PF/ESI calculations
- Indian phone format: +91 XXXXX XXXXX

**Multi-Project Support**:
- User can switch between projects
- `currentProjectId` tracked in DataContext
- Most entities have `projectId` foreign key
- Suppliers can have `defaultProjectId`

## Common Patterns

### Adding a New Database Table

1. Update `dexieDB.js`:
   ```javascript
   db.version(X).stores({
     // ... existing tables
     newTable: '++id, userId, indexedField1, indexedField2, synced, lastUpdated'
   });
   ```

2. Add CRUD functions in `dexieDB.js`:
   ```javascript
   export const addNewEntity = async (entity) => { ... }
   export const updateNewEntity = async (id, updates) => { ... }
   export const deleteNewEntity = async (id) => { ... }
   export const getNewEntities = async (userId) => { ... }
   ```

3. Update `DataContext.jsx` to load and manage the new entity

4. Update `syncService.js` for cloud sync (if needed)

### Adding Export to Utility Function

When adding new utility functions, ALWAYS:
1. Export as named export: `export const myFunction = () => { ... }`
2. Add to default export object at bottom of file
3. Test that pages importing the function work correctly

### Handling User Context

All data operations MUST filter by `userId`:
```javascript
const { user } = useAuth();
const entities = await db.entities.where({ userId: user.id }).toArray();
```

## Advanced Features Roadmap

See `advancefeatures/` directory for detailed implementation plans:
- **CRITICAL_FEATURES_PLAN.md**: 6 critical features (6-7 months)
- **MEDIUM_PRIORITY_PLAN.md**: 6 medium priority features (7-8 months)
- **NICE_TO_HAVE_PLAN.md**: 12 enhancement features (13-18 months)
- **TASK_BREAKDOWN_DETAILED.md**: Granular task breakdowns

Current completion: ~55% as a comprehensive construction billing platform.

## Testing Strategy

Tests use Vitest + Testing Library:
- Component tests: `*.test.jsx`
- Utility tests: `*.test.js`
- Run individual test: `npm test -- fileName.test.js`

## Known Quirks

1. **Hybrid CSS**: Project uses both Bootstrap 5 AND Tailwind CSS. Bootstrap for components, Tailwind for utilities.

2. **File Extensions**: Vite config allows `.js` files to contain JSX, but convention is to use `.jsx` for React components.

3. **Database Migrations**: When schema changes, old data must be migrated in `.upgrade()` function. Test thoroughly.

4. **Sync Conflicts**: Last-write-wins based on `lastUpdated` timestamp. No manual conflict resolution UI.

5. **Number Formatting**: Use Indian numbering system (lakhs/crores) via `toLocaleString('en-IN')`.

6. **Date Formats**: Store as ISO strings in DB, display as DD/MM/YYYY for users.

7. **Authentication**: Currently uses simple password auth. NOT production-ready security (see README.md Security Notes).

## Debugging

Console logging patterns used throughout:
- 🔍 for navigation debugging
- ✅ for successful operations
- ❌ for errors
- 🔄 for sync operations
- 📄 for page renders

Diagnostic tools available: `src/utils/diagnostics.js` (loaded in App.jsx)

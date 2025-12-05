# ByCodez - Project Structure

## 📁 Complete File Structure

```
Expense-Tracker-Offline/
│
├── public/
│   └── vite.svg                    # Application icon
│
├── src/
│   ├── components/
│   │   └── Layout.jsx              # Main layout with sidebar navigation
│   │
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state management
│   │   └── DataContext.jsx         # Application data state management
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx           # Dashboard with analytics and charts
│   │   ├── PaymentsIn.jsx          # Revenue tracking page
│   │   ├── PaymentsOut.jsx         # Expense tracking page
│   │   ├── Departments.jsx         # Department management page
│   │   ├── Settings.jsx            # Settings and backup/restore page
│   │   └── Login.jsx               # Login page
│   │
│   ├── utils/
│   │   └── dataManager.js          # Data management utilities
│   │
│   ├── App.jsx                     # Main application component
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Global styles and Tailwind
│
├── .gitignore                      # Git ignore rules
├── index.html                      # HTML entry point
├── package.json                    # Project dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── vite.config.js                  # Vite build configuration
│
├── README.md                       # Main documentation
├── QUICKSTART.md                   # Quick start guide
├── INSTALLATION.md                 # Installation and testing guide
├── FEATURES.md                     # Complete feature list
└── PROJECT_STRUCTURE.md            # This file
```

## 📄 File Descriptions

### Configuration Files

#### `package.json`
- Project metadata
- Dependencies (React, Vite, Tailwind, Recharts, etc.)
- Scripts (dev, build, preview)
- Browser compatibility settings

#### `vite.config.js`
- Vite build tool configuration
- React plugin setup
- Development server settings
- Build output configuration

#### `tailwind.config.js`
- Tailwind CSS customization
- Custom color palette
- Theme extensions
- Content paths

#### `postcss.config.js`
- PostCSS configuration
- Tailwind and Autoprefixer plugins

#### `.gitignore`
- Node modules exclusion
- Build output exclusion
- Backup files exclusion
- Environment variables exclusion

### Source Files

#### `src/main.jsx`
- Application entry point
- React DOM rendering
- Root component mounting

#### `src/App.jsx`
- Main application component
- Context providers setup
- Page routing logic
- Authentication flow

#### `src/index.css`
- Tailwind directives
- Global styles
- Custom CSS classes
- Animations

### Components

#### `src/components/Layout.jsx`
**Purpose:** Main application layout
**Features:**
- Responsive sidebar navigation
- Mobile hamburger menu
- User profile display
- Logout functionality
- Active page highlighting

**Props:**
- `children`: Page content
- `currentPage`: Current active page
- `onNavigate`: Navigation handler

### Context Providers

#### `src/context/AuthContext.jsx`
**Purpose:** Authentication state management
**Exports:**
- `AuthProvider`: Context provider component
- `useAuth`: Hook to access auth context

**State:**
- `user`: Current logged-in user
- `loading`: Authentication loading state

**Methods:**
- `login(username, password)`: Authenticate user
- `logout()`: Clear user session
- `isAdmin()`: Check if user is admin

#### `src/context/DataContext.jsx`
**Purpose:** Application data state management
**Exports:**
- `DataProvider`: Context provider component
- `useData`: Hook to access data context

**State:**
- `data`: All application data
- `loading`: Data loading state

**Methods:**
- Department Management:
  - `addDepartment(name)`
  - `deleteDepartment(id)`
- Payments In:
  - `addPaymentIn(payment)`
  - `updatePaymentIn(id, updates)`
  - `deletePaymentIn(id)`
- Payments Out:
  - `addPaymentOut(payment)`
  - `updatePaymentOut(id, updates)`
  - `deletePaymentOut(id)`
- Projects:
  - `addProject(project)`
  - `updateProject(id, updates)`
  - `setCurrentProject(projectId)`
- Data:
  - `restoreData(newData)`

### Pages

#### `src/pages/Login.jsx`
**Purpose:** User authentication
**Features:**
- Username/password login
- Error handling
- Demo credentials display
- Responsive design

#### `src/pages/Dashboard.jsx`
**Purpose:** Financial overview and analytics
**Features:**
- Metric cards (Payments In/Out, Balance, Departments)
- Pie chart for expense distribution
- Bar chart for department spending
- Department summary table
- Payment reminder alerts

**Dependencies:**
- Recharts for visualizations
- Data context for metrics
- Utility functions for calculations

#### `src/pages/PaymentsIn.jsx`
**Purpose:** Revenue tracking
**Features:**
- Add/edit/delete payments
- Payment type selection (Advance/Installment)
- Client name tracking
- Payment history table
- Total payments summary

#### `src/pages/PaymentsOut.jsx`
**Purpose:** Expense tracking
**Features:**
- Add/edit/delete expenses
- Department selection
- Category selection (Material, Labor, etc.)
- Expense history table
- Total expenses summary

#### `src/pages/Departments.jsx`
**Purpose:** Department management
**Features:**
- View all departments
- Add custom departments (Admin only)
- Delete custom departments (Admin only)
- Department usage statistics
- Admin access control

#### `src/pages/Settings.jsx`
**Purpose:** Application settings and data management
**Features:**
- Create native backup (.ttf)
- Create compressed backup (.json.gz)
- Restore from backup
- Data statistics display
- Clear all data
- Best practices guide

### Utilities

#### `src/utils/dataManager.js`
**Purpose:** Data management and utility functions

**Constants:**
- `STORAGE_KEY`: localStorage key
- `BACKUP_FILE_EXTENSION`: .ttf extension

**Functions:**

**Data Structure:**
- `getDefaultData()`: Returns default data structure

**Storage:**
- `loadData()`: Load from localStorage
- `saveData(data)`: Save to localStorage
- `clearAllData()`: Clear all data

**Backup/Restore:**
- `createBackup(data)`: Create .ttf backup
- `createCompressedBackup(data)`: Create .json.gz backup
- `restoreFromBackup(file)`: Restore from backup file

**Calculations:**
- `calculateTotalPaymentsIn(paymentsIn)`: Sum all payments in
- `calculateTotalPaymentsOut(paymentsOut)`: Sum all payments out
- `calculateBalance(paymentsIn, paymentsOut)`: Calculate net balance
- `needsPaymentReminder(paymentsIn, paymentsOut)`: Check if reminder needed
- `getExpensesByDepartment(paymentsOut, departments)`: Group expenses by department

**Formatting:**
- `formatCurrency(amount, currency)`: Format as currency
- `formatDate(date, format)`: Format date string

**Validation:**
- `validateEmail(email)`: Email validation

**Utilities:**
- `generateId()`: Generate unique ID

## 🗄️ Data Structure

### Default Data Schema

```javascript
{
  users: [
    {
      id: string,
      username: string,
      password: string,
      role: 'admin' | 'user',
      name: string
    }
  ],
  projects: [],
  currentProject: null,
  departments: [
    {
      id: string,
      name: string,
      isDefault: boolean
    }
  ],
  paymentsIn: [
    {
      id: string,
      amount: number,
      date: ISO string,
      type: 'advance' | 'installment',
      description: string,
      clientName: string,
      createdAt: ISO string,
      updatedAt: ISO string
    }
  ],
  paymentsOut: [
    {
      id: string,
      amount: number,
      date: ISO string,
      departmentId: string,
      category: 'material' | 'labor' | 'equipment' | 'transport' | 'other',
      description: string,
      createdAt: ISO string,
      updatedAt: ISO string
    }
  ],
  settings: {
    currency: string,
    dateFormat: string,
    autoBackup: boolean,
    backupFrequency: string
  },
  metadata: {
    version: string,
    lastModified: ISO string,
    createdAt: ISO string
  }
}
```

## 🎨 Styling Architecture

### Tailwind Configuration
- Custom color palette (primary, success, danger, warning)
- Extended theme with construction-focused colors
- Responsive breakpoints
- Custom font family (Inter)

### CSS Classes
- `.btn`: Base button styles
- `.btn-primary`: Primary action button
- `.btn-secondary`: Secondary action button
- `.btn-success`: Success button
- `.btn-danger`: Danger button
- `.card`: Card container
- `.input`: Form input
- `.label`: Form label
- `.metric-card`: Dashboard metric card

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px

## 🔄 Data Flow

1. **User Authentication:**
   - Login → AuthContext → localStorage → App

2. **Data Operations:**
   - User Action → DataContext → dataManager → localStorage → UI Update

3. **Page Navigation:**
   - User Click → Layout → App → Page Component

4. **Backup/Restore:**
   - User Action → Settings → dataManager → File System

## 📦 Dependencies

### Production
- `react`: ^18.2.0 - UI library
- `react-dom`: ^18.2.0 - React DOM rendering
- `recharts`: ^2.10.3 - Chart library
- `lucide-react`: ^0.294.0 - Icon library
- `pako`: ^2.1.0 - Compression library

### Development
- `vite`: ^5.0.8 - Build tool
- `@vitejs/plugin-react`: ^4.2.1 - React plugin for Vite
- `tailwindcss`: ^3.3.6 - CSS framework
- `autoprefixer`: ^10.4.16 - CSS autoprefixer
- `postcss`: ^8.4.32 - CSS processor

## 🚀 Build Process

1. **Development:**
   - Vite dev server
   - Hot module replacement
   - Fast refresh

2. **Production:**
   - Code minification
   - Tree shaking
   - Asset optimization
   - Source maps generation

## 📱 Responsive Breakpoints

- **Mobile:** < 768px
  - Hamburger menu
  - Stacked layout
  - Full-width cards

- **Tablet:** 768px - 1024px
  - 2-column grid
  - Collapsible sidebar

- **Desktop:** > 1024px
  - Fixed sidebar
  - Multi-column layout
  - Optimal spacing

---

This structure provides a scalable, maintainable foundation for the ByCodez application!


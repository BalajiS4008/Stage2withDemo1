---
description: Initialize and run the ByCodez Construction Billing Software
---

# ByCodez Initialization Workflow

This workflow will help you get the ByCodez Construction Expense Tracker up and running.

## Prerequisites Check

- Node.js (v16 or higher) installed
- npm or yarn package manager

## Initialization Steps

### 1. Navigate to Project Directory
```bash
cd "e:\Tech\Solutions\Construction_Billing Software\Stage2"
```

// turbo
### 2. Install Dependencies (if not already installed)
```bash
npm install
```

// turbo
### 3. Start Development Server
```bash
npm run dev
```

### 4. Open Application in Browser
Navigate to: `http://localhost:3000`

### 5. Login with Default Credentials

**Admin Account (Full Access):**
- Username: `admin`
- Password: `admin123`

**User Account (Limited Access):**
- Username: `user`
- Password: `user123`

## Project Overview

### Technology Stack
- **Frontend:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth

### Key Features
✅ Payment-In Management (Revenue Tracking)
✅ Payment-Out Management (Expense Tracking)
✅ Interactive Dashboard with Charts
✅ User Authentication & Role-Based Access
✅ Department Management
✅ Invoice & Quotation Generation
✅ Backup & Restore Functionality
✅ Parties Management (Suppliers/Customers)
✅ File Attachments
✅ Export to Excel

### Application Structure
```
Stage2/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context providers
│   ├── pages/           # Application pages
│   ├── utils/           # Utility functions
│   └── App.jsx          # Main app component
├── public/              # Static assets
├── dist/                # Production build output
└── Documentation files  # Extensive MD files
```

## Quick Tasks

### View Current Status
Check which features are implemented:
- Read: `COMPLETED_FEATURES_SUMMARY.md`
- Read: `CRITICAL_FEATURES_IMPLEMENTATION_STATUS.md`

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Important Notes

1. **Data Storage:** Application uses Firebase Firestore for data persistence
2. **Environment Variables:** Check `.env.local` for Firebase configuration
3. **Backup Data:** Regular backups available through Settings page
4. **Documentation:** Extensive documentation files in root directory

## Next Steps

After initialization:
1. Explore the Dashboard to see financial overview
2. Add sample Payment-In entries
3. Add sample Payment-Out entries
4. Test invoice/quotation generation
5. Review the Parties module
6. Try the export to Excel feature
7. Create a backup from Settings

## Common Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code

## Support Documentation

For detailed information, refer to:
- `README.md` - Main documentation
- `QUICKSTART.md` - Quick start guide
- `INSTALLATION.md` - Detailed installation guide
- `GET_STARTED_CHECKLIST.md` - Step-by-step checklist
- `RUN_APPLICATION.md` - Running the application guide

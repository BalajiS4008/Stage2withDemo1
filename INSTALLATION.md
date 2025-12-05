# ByCodez - Installation & Testing Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **npm** (comes with Node.js) or **yarn**
  - Verify npm: `npm --version`
  - Or install yarn: `npm install -g yarn`

- **Modern Web Browser**
  - Chrome (recommended)
  - Firefox
  - Safari
  - Edge

## 🚀 Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd e:\Tech\Expense-Tracker-Offline
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

**Expected Output:**
- Installation of React, Vite, Tailwind CSS, Recharts, Lucide React, Pako
- Creation of `node_modules` folder
- Generation of `package-lock.json` or `yarn.lock`

**Installation Time:** Approximately 1-3 minutes depending on internet speed

### Step 3: Verify Installation

Check if all dependencies are installed:
```bash
npm list --depth=0
```

You should see:
- react@^18.2.0
- react-dom@^18.2.0
- react-router-dom@^6.20.0
- recharts@^2.10.3
- lucide-react@^0.294.0
- pako@^2.1.0
- vite@^5.0.8
- tailwindcss@^3.3.6

## 🏃 Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

**Expected Output:**
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h to show help
```

### Access the Application

1. Open your browser
2. Navigate to: `http://localhost:3000`
3. You should see the ByCodez login page

### Production Build

Create an optimized production build:
```bash
npm run build
```

**Expected Output:**
- Creation of `dist` folder
- Optimized and minified files
- Build size information

Preview the production build:
```bash
npm run preview
```

## ✅ Testing Checklist

### 1. Authentication Testing

#### Test Admin Login
- [ ] Navigate to login page
- [ ] Enter username: `admin`
- [ ] Enter password: `admin123`
- [ ] Click "Sign In"
- [ ] Verify successful login
- [ ] Verify "Administrator" name displayed
- [ ] Verify "Admin" role shown

#### Test User Login
- [ ] Logout from admin account
- [ ] Enter username: `user`
- [ ] Enter password: `user123`
- [ ] Click "Sign In"
- [ ] Verify successful login
- [ ] Verify "Regular User" name displayed
- [ ] Verify "User" role shown

#### Test Invalid Login
- [ ] Enter invalid credentials
- [ ] Verify error message appears
- [ ] Verify login fails

### 2. Dashboard Testing

- [ ] Navigate to Dashboard
- [ ] Verify all metric cards display:
  - Total Payments In
  - Total Payments Out
  - Net Balance
  - Active Departments
- [ ] Verify charts render (initially empty)
- [ ] Verify department summary table displays

### 3. Payments In Testing

#### Add Payment
- [ ] Navigate to "Payments In"
- [ ] Click "Add Payment"
- [ ] Select payment type: "Advance Payment"
- [ ] Enter amount: 100000
- [ ] Select today's date
- [ ] Enter client name: "Test Client"
- [ ] Enter description: "Initial advance payment"
- [ ] Click "Add Payment"
- [ ] Verify payment appears in table
- [ ] Verify total updates

#### Edit Payment
- [ ] Click edit icon on a payment
- [ ] Modify amount to 150000
- [ ] Click "Update Payment"
- [ ] Verify changes saved
- [ ] Verify total updates

#### Delete Payment
- [ ] Click delete icon on a payment
- [ ] Confirm deletion
- [ ] Verify payment removed
- [ ] Verify total updates

### 4. Payments Out Testing

#### Add Expense
- [ ] Navigate to "Payments Out"
- [ ] Click "Add Expense"
- [ ] Select department: "Mason"
- [ ] Select category: "Material"
- [ ] Enter amount: 25000
- [ ] Select today's date
- [ ] Enter description: "Cement and bricks"
- [ ] Click "Add Expense"
- [ ] Verify expense appears in table
- [ ] Verify total updates

#### Test All Departments
- [ ] Add expenses for each default department:
  - Mason
  - Plumbing
  - Electrical
  - Interior
  - Painting
  - Miscellaneous
- [ ] Verify all appear in table

#### Edit Expense
- [ ] Click edit icon on an expense
- [ ] Modify amount
- [ ] Click "Update Expense"
- [ ] Verify changes saved

#### Delete Expense
- [ ] Click delete icon on an expense
- [ ] Confirm deletion
- [ ] Verify expense removed

### 5. Department Management Testing (Admin Only)

#### Add Department
- [ ] Login as admin
- [ ] Navigate to "Departments"
- [ ] Click "Add Department"
- [ ] Enter name: "Carpentry"
- [ ] Click "Add Department"
- [ ] Verify new department appears

#### Try to Delete Default Department
- [ ] Try to delete "Mason" department
- [ ] Verify error message (cannot delete default)

#### Delete Custom Department
- [ ] Delete "Carpentry" department
- [ ] Confirm deletion
- [ ] Verify department removed

#### Test User Restrictions
- [ ] Login as regular user
- [ ] Navigate to "Departments"
- [ ] Verify "Add Department" button not visible
- [ ] Verify warning message about admin access

### 6. Dashboard Analytics Testing

- [ ] Add multiple payments in and out
- [ ] Navigate to Dashboard
- [ ] Verify pie chart displays expense distribution
- [ ] Verify bar chart shows department spending
- [ ] Verify department summary table shows correct data
- [ ] Verify percentages calculate correctly

### 7. Payment Reminder Testing

- [ ] Add payments in totaling 100000
- [ ] Add payments out totaling 150000
- [ ] Navigate to Dashboard
- [ ] Verify warning alert appears
- [ ] Verify alert shows correct amounts
- [ ] Verify alert suggests requesting payment

### 8. Backup & Restore Testing

#### Create Native Backup
- [ ] Navigate to Settings
- [ ] Click "Create Backup"
- [ ] Verify .ttf file downloads
- [ ] Check file contains JSON data

#### Create Compressed Backup
- [ ] Click "Compressed" button
- [ ] Verify .json.gz file downloads
- [ ] Verify file is smaller than .ttf

#### Restore from Backup
- [ ] Add some test data
- [ ] Create a backup
- [ ] Add more data
- [ ] Click "Restore"
- [ ] Select the backup file
- [ ] Confirm restoration
- [ ] Verify data restored to backup state
- [ ] Verify page reloads

#### Test Invalid Backup File
- [ ] Try to restore a non-backup file
- [ ] Verify error message appears

### 9. Data Persistence Testing

- [ ] Add various payments and expenses
- [ ] Close browser tab
- [ ] Reopen application
- [ ] Login again
- [ ] Verify all data persists

### 10. Responsive Design Testing

#### Mobile View (< 768px)
- [ ] Resize browser to mobile width
- [ ] Verify hamburger menu appears
- [ ] Verify sidebar toggles correctly
- [ ] Verify tables are scrollable
- [ ] Verify forms are usable
- [ ] Verify charts resize properly

#### Tablet View (768px - 1024px)
- [ ] Resize to tablet width
- [ ] Verify layout adjusts
- [ ] Verify all features accessible

#### Desktop View (> 1024px)
- [ ] Verify sidebar always visible
- [ ] Verify optimal layout
- [ ] Verify charts display well

### 11. Browser Compatibility Testing

Test in each browser:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Verify:
- [ ] Login works
- [ ] All pages load
- [ ] Charts render
- [ ] Forms submit
- [ ] Backup/restore works

### 12. Performance Testing

- [ ] Add 50+ payment records
- [ ] Navigate between pages
- [ ] Verify smooth performance
- [ ] Check chart rendering speed
- [ ] Verify no lag in UI

### 13. Error Handling Testing

#### Form Validation
- [ ] Try to submit empty payment form
- [ ] Try to submit negative amount
- [ ] Try to submit without selecting department
- [ ] Verify appropriate error messages

#### Data Validation
- [ ] Try to add duplicate department name
- [ ] Verify error message appears

### 14. Session Management Testing

- [ ] Login
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Logout
- [ ] Try to access pages
- [ ] Verify redirected to login

## 🐛 Common Issues & Solutions

### Issue: Dependencies won't install
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3001
```

### Issue: Charts not displaying
**Solution:**
- Ensure recharts is installed
- Check browser console for errors
- Verify data exists for charts

### Issue: Backup/restore not working
**Solution:**
- Check browser localStorage is enabled
- Verify file format is .ttf or .json.gz
- Check browser console for errors

### Issue: Styles not loading
**Solution:**
```bash
# Rebuild Tailwind
npm run dev
```

## 📊 Test Data Suggestions

### Sample Payments In
1. Advance Payment: ₹500,000 - Initial project advance
2. Installment 1: ₹200,000 - First milestone payment
3. Installment 2: ₹150,000 - Second milestone payment

### Sample Payments Out
1. Mason - Material: ₹75,000 - Cement and bricks
2. Mason - Labor: ₹50,000 - Mason wages
3. Plumbing - Material: ₹35,000 - Pipes and fittings
4. Electrical - Material: ₹40,000 - Wires and switches
5. Interior - Material: ₹60,000 - Tiles and fixtures
6. Painting - Material: ₹25,000 - Paint and supplies
7. Miscellaneous - Other: ₹15,000 - Tea and snacks

## ✅ Final Verification

After completing all tests:
- [ ] All features work as expected
- [ ] No console errors
- [ ] Data persists correctly
- [ ] Backup/restore functional
- [ ] Responsive on all devices
- [ ] Works in all browsers
- [ ] Performance is acceptable

## 🎉 Success Criteria

Your installation is successful if:
1. ✅ Application loads without errors
2. ✅ Login works for both admin and user
3. ✅ All CRUD operations work
4. ✅ Charts display correctly
5. ✅ Backup and restore functional
6. ✅ Responsive design works
7. ✅ Data persists across sessions

---

**Congratulations!** Your ByCodez application is now fully installed and tested! 🚀


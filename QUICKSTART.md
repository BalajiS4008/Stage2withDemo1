# ByCodez - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to `http://localhost:3000`

## 🔐 Login

Use these credentials to get started:

**Admin Account** (Full Access)
- Username: `admin`
- Password: `admin123`

**User Account** (Limited Access)
- Username: `user`
- Password: `user123`

## 📊 Quick Tour

### 1. Dashboard
- View financial overview
- See charts and metrics
- Check payment alerts

### 2. Payments In
- Click "Add Payment"
- Select type: Advance or Installment
- Enter amount and details
- Submit

### 3. Payments Out
- Click "Add Expense"
- Choose department (Mason, Plumbing, etc.)
- Select category (Material, Labor, etc.)
- Enter amount and description
- Submit

### 4. Departments (Admin Only)
- View all departments
- Add custom departments
- Delete custom departments

### 5. Settings
- Create backups (.ttf or .json.gz)
- Restore from backup
- View data statistics
- Clear all data (use with caution!)

## 💾 Backup Your Data

**Important:** Create regular backups!

1. Go to Settings
2. Click "Create Backup" or "Compressed"
3. Save the downloaded file safely
4. Store in multiple locations

## 🔄 Restore Data

1. Go to Settings
2. Click "Restore"
3. Select your backup file
4. Confirm restoration
5. App will reload automatically

## 📱 Mobile Access

The app is fully responsive! Access it from:
- Smartphones
- Tablets
- Desktop computers

## ⚡ Key Features

✅ Track payments received from clients
✅ Record all project expenses
✅ Automatic payment reminders
✅ Visual charts and analytics
✅ Department-wise expense tracking
✅ Backup and restore functionality
✅ Offline capable (no internet needed)
✅ Mobile responsive design

## 🎯 Common Tasks

### Add Initial Advance Payment
1. Go to "Payments In"
2. Click "Add Payment"
3. Select "Advance Payment"
4. Enter the advance amount
5. Add client name and description
6. Submit

### Record Daily Expenses
1. Go to "Payments Out"
2. Click "Add Expense"
3. Select appropriate department
4. Choose expense category
5. Enter amount and details
6. Submit

### Check Financial Status
1. Go to Dashboard
2. View "Net Balance" card
3. Check if balance is positive or negative
4. Look for payment reminder alerts

### Add Custom Department
1. Login as Admin
2. Go to "Departments"
3. Click "Add Department"
4. Enter department name
5. Submit

## 🛠️ Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## 📞 Need Help?

- Check the full README.md for detailed documentation
- Review the troubleshooting section
- Ensure browser localStorage is enabled

## 🎨 Customization

Want to customize the app?

- **Colors:** Edit `tailwind.config.js`
- **Currency:** Modify `src/utils/dataManager.js`
- **Default Departments:** Update `getDefaultData()` in `src/utils/dataManager.js`

## ⚠️ Important Notes

1. **Data Storage:** All data is stored in browser localStorage
2. **Backups:** Create regular backups to prevent data loss
3. **Security:** Change default passwords in production
4. **Browser:** Use modern browsers for best experience

---

**Happy Tracking! 🎉**

Start managing your construction project finances efficiently with ByCodez!


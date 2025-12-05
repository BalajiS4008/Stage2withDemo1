# ByCodez - Construction Expense Tracker

A comprehensive web application for tracking construction project expenses, designed specifically for construction site owners and managers.

## Features

### 🎯 Core Functionality

- **Payment-In Management (Revenue Tracking)**
  - Track initial advance payments and periodic installments
  - Automatic comparison of expenses vs. payments received
  - Smart payment reminders when expenses exceed payments
  - Running balance display

- **Payment-Out Management (Expense Tracking)**
  - Categorized expense tracking by department
  - Default departments: Mason, Plumbing, Electrical, Interior, Painting, Miscellaneous
  - Custom department creation (Admin only)
  - Detailed expense categorization (Material, Labor, Equipment, etc.)

- **Interactive Dashboard**
  - Real-time financial overview
  - Visual charts and graphs (Pie charts, Bar charts)
  - Department-wise expense breakdown
  - Key metrics cards (Total Revenue, Expenses, Balance)
  - Payment alerts and reminders

- **User Authentication**
  - Role-based access control (Admin/User)
  - Secure login system
  - Admin privileges for department management

- **Data Management**
  - JSON-based data storage with .ttf extension
  - Native backup format (.ttf files)
  - Compressed backup support (.json.gz)
  - Easy restore functionality
  - Data integrity validation

### 🎨 User Interface

- Fully responsive design (mobile, tablet, desktop)
- Modern, professional theming
- Intuitive navigation
- Clean and accessible interface
- Smooth animations and transitions

## Tech Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Compression:** Pako (for .json.gz backups)

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone or download the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## Default Login Credentials

### Admin Account
- **Username:** admin
- **Password:** admin123
- **Permissions:** Full access including department management

### User Account
- **Username:** user
- **Password:** user123
- **Permissions:** Can add expenses and payments, view all data

## Usage Guide

### Getting Started

1. **Login** with one of the default accounts
2. **Navigate** to Dashboard to see the overview
3. **Add Payments In** to track revenue from clients
4. **Add Payments Out** to record expenses
5. **Manage Departments** (Admin only) to customize categories
6. **Create Backups** regularly from Settings page

### Payment-In Workflow

1. Go to "Payments In" page
2. Click "Add Payment"
3. Select payment type (Advance/Installment)
4. Enter amount, date, client name, and description
5. Submit to record the payment

### Payment-Out Workflow

1. Go to "Payments Out" page
2. Click "Add Expense"
3. Select department and category
4. Enter amount, date, and description
5. Submit to record the expense

### Backup & Restore

#### Creating a Backup

1. Go to Settings page
2. Choose backup format:
   - **Native (.ttf):** Full JSON backup
   - **Compressed (.json.gz):** Smaller, portable format
3. Click the respective backup button
4. File will be downloaded to your device

#### Restoring from Backup

1. Go to Settings page
2. Click "Restore" button
3. Select your backup file (.ttf or .json.gz)
4. Confirm the restoration
5. Application will reload with restored data

## Data Storage

- All data is stored in browser's localStorage
- Data persists across sessions
- Automatic save on every change
- No server required - fully offline capable

## File Structure

```
bycodez-expense-tracker/
├── src/
│   ├── components/
│   │   └── Layout.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── DataContext.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── PaymentsIn.jsx
│   │   ├── PaymentsOut.jsx
│   │   ├── Departments.jsx
│   │   ├── Settings.jsx
│   │   └── Login.jsx
│   ├── utils/
│   │   └── dataManager.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Notes

⚠️ **Important:** This application stores data in browser localStorage and uses simple password authentication. For production use:

1. Implement proper password hashing (bcrypt, argon2)
2. Add server-side authentication
3. Use secure backend storage
4. Implement HTTPS
5. Add input sanitization
6. Implement rate limiting

## Best Practices

1. **Regular Backups:** Create backups weekly or after significant data entry
2. **Multiple Backup Locations:** Store backups in cloud storage and local drives
3. **Test Restores:** Periodically test backup restoration
4. **Data Validation:** Review entries regularly for accuracy
5. **Access Control:** Use appropriate user roles

## Troubleshooting

### Data Not Saving
- Check browser localStorage is enabled
- Clear browser cache and reload
- Try a different browser

### Backup/Restore Issues
- Ensure file format is .ttf or .json.gz
- Check file is not corrupted
- Try creating a new backup

### Charts Not Displaying
- Ensure there is data to display
- Check browser console for errors
- Refresh the page

## Future Enhancements

- Multi-project support
- Export to Excel/PDF
- Email notifications
- Cloud sync
- Mobile app version
- Advanced reporting
- Budget forecasting
- Invoice generation

## License

This project is provided as-is for educational and commercial use.

## Support

For issues, questions, or feature requests, please contact the development team.

---

**ByCodez** - Simplifying Construction Finance Management


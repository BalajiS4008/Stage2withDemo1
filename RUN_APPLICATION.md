# 🚀 How to Run ByCodez Application

## Quick Start (For Beginners)

### Step 1: Open Terminal/Command Prompt

**Windows:**
- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter

**Mac/Linux:**
- Press `Cmd + Space` (Mac) or `Ctrl + Alt + T` (Linux)
- Type `terminal`
- Press Enter

### Step 2: Navigate to Project Folder

```bash
cd e:\Tech\Expense-Tracker-Offline
```

### Step 3: Install Dependencies (First Time Only)

```bash
npm install
```

**Wait for installation to complete** (1-3 minutes)

You should see:
```
added XXX packages in XXs
```

### Step 4: Start the Application

```bash
npm run dev
```

You should see:
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:3000/
```

### Step 5: Open in Browser

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Go to: `http://localhost:3000`
3. You should see the ByCodez login page

### Step 6: Login

Use these credentials:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**User Account:**
- Username: `user`
- Password: `user123`

### Step 7: Start Using!

You're now ready to track your construction expenses! 🎉

---

## Detailed Instructions

### Prerequisites Check

Before running, ensure you have:

1. **Node.js installed**
   ```bash
   node --version
   ```
   Should show: `v16.0.0` or higher

2. **npm installed**
   ```bash
   npm --version
   ```
   Should show: `8.0.0` or higher

If not installed, download from: https://nodejs.org/

### Installation Process

#### 1. Clean Installation

If you encounter issues, try a clean install:

```bash
# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

#### 2. Verify Installation

Check if all packages are installed:

```bash
npm list --depth=0
```

You should see all dependencies listed without errors.

### Running the Application

#### Development Mode (Recommended)

```bash
npm run dev
```

**Features:**
- Hot Module Replacement (instant updates)
- Fast refresh
- Development tools enabled
- Source maps for debugging

**Access at:** `http://localhost:3000`

#### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

**Features:**
- Optimized and minified code
- Smaller file sizes
- Better performance

**Access at:** `http://localhost:4173`

### Troubleshooting

#### Issue 1: Port Already in Use

**Error:**
```
Port 3000 is already in use
```

**Solution 1 - Use Different Port:**
```bash
npm run dev -- --port 3001
```

**Solution 2 - Kill Process (Windows):**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**Solution 2 - Kill Process (Mac/Linux):**
```bash
lsof -ti:3000 | xargs kill -9
```

#### Issue 2: Dependencies Not Installing

**Error:**
```
npm ERR! code ENOENT
```

**Solution:**
```bash
# Update npm
npm install -g npm@latest

# Try again
npm install
```

#### Issue 3: Module Not Found

**Error:**
```
Cannot find module 'react'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Issue 4: Vite Not Starting

**Error:**
```
'vite' is not recognized
```

**Solution:**
```bash
# Install vite globally
npm install -g vite

# Or use npx
npx vite
```

#### Issue 5: Browser Not Opening

**Solution:**
- Manually open browser
- Navigate to `http://localhost:3000`
- Check if firewall is blocking

### Stopping the Application

**To stop the development server:**
- Press `Ctrl + C` in the terminal
- Confirm with `Y` if prompted

### Restarting the Application

```bash
# Stop the server (Ctrl + C)
# Then start again
npm run dev
```

### Accessing from Other Devices

To access from mobile/tablet on same network:

1. **Find your IP address:**

   **Windows:**
   ```bash
   ipconfig
   ```
   Look for `IPv4 Address`

   **Mac/Linux:**
   ```bash
   ifconfig
   ```
   Look for `inet`

2. **Start with host flag:**
   ```bash
   npm run dev -- --host
   ```

3. **Access from other device:**
   ```
   http://YOUR_IP_ADDRESS:3000
   ```
   Example: `http://192.168.1.100:3000`

### Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
VITE_APP_NAME=ByCodez
VITE_PORT=3000
```

### Browser Compatibility

**Recommended Browsers:**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Not Recommended:**
- ❌ Internet Explorer
- ❌ Very old browser versions

### Performance Tips

1. **Close Unnecessary Tabs:** Free up browser memory
2. **Clear Browser Cache:** If experiencing issues
3. **Use Incognito Mode:** For testing fresh state
4. **Disable Extensions:** If experiencing conflicts

### Development Tips

#### Hot Reload

Changes to code automatically refresh the browser:
- Edit any `.jsx` or `.css` file
- Save the file
- Browser updates instantly

#### Console Logs

Open browser developer tools:
- **Windows/Linux:** `F12` or `Ctrl + Shift + I`
- **Mac:** `Cmd + Option + I`

Check console for any errors or warnings.

#### React DevTools

Install React Developer Tools extension:
- Chrome: https://chrome.google.com/webstore
- Firefox: https://addons.mozilla.org

### Data Management

#### Where is Data Stored?

Data is stored in browser's localStorage:
- **Chrome:** `Application > Local Storage`
- **Firefox:** `Storage > Local Storage`
- **Safari:** `Storage > Local Storage`

#### Clearing Data

**Option 1 - Through App:**
- Go to Settings
- Click "Clear Data"
- Confirm

**Option 2 - Browser:**
- Open Developer Tools
- Go to Application/Storage
- Clear localStorage

#### Backing Up Data

**Important:** Create backups regularly!

1. Go to Settings page
2. Click "Create Backup"
3. Save the `.ttf` file
4. Store in safe location

### Common Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for updates
npm outdated

# Update dependencies
npm update

# Clean install
rm -rf node_modules package-lock.json && npm install
```

### Keyboard Shortcuts

**In Browser:**
- `Ctrl/Cmd + R` - Refresh page
- `Ctrl/Cmd + Shift + R` - Hard refresh (clear cache)
- `F12` - Open developer tools
- `Ctrl/Cmd + W` - Close tab

**In Terminal:**
- `Ctrl + C` - Stop server
- `Ctrl + L` - Clear terminal
- `↑` - Previous command

### Next Steps

After successfully running the application:

1. ✅ **Explore the Dashboard** - See the overview
2. ✅ **Add Sample Data** - Try adding payments and expenses
3. ✅ **Test Features** - Explore all pages
4. ✅ **Create Backup** - Practice backup/restore
5. ✅ **Read Documentation** - Check README.md for details

### Getting Help

If you encounter issues:

1. **Check Documentation:**
   - README.md
   - INSTALLATION.md
   - TROUBLESHOOTING section

2. **Check Browser Console:**
   - Look for error messages
   - Note any warnings

3. **Verify Setup:**
   - Node.js version
   - npm version
   - All dependencies installed

4. **Try Clean Install:**
   - Delete node_modules
   - Reinstall dependencies

### Success Checklist

Your setup is successful if:
- ✅ `npm run dev` starts without errors
- ✅ Browser opens to login page
- ✅ Login works with demo credentials
- ✅ All pages are accessible
- ✅ Data persists after refresh
- ✅ No console errors

---

## 🎉 Congratulations!

You've successfully set up and run ByCodez!

**Start tracking your construction expenses now!**

For detailed features and usage, see:
- **QUICKSTART.md** - Quick start guide
- **README.md** - Full documentation
- **FEATURES.md** - Complete feature list

---

**Happy Tracking! 🏗️💰**


const puppeteer = require('puppeteer');

(async () => {
  console.log('🌱 Seeding user into IndexedDB...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    console.log('📍 Navigating to localhost:3003...');
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('⏳ Waiting for page to stabilize...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('📝 Creating admin user in IndexedDB...');

    // Execute script in browser context to add user to IndexedDB
    await page.evaluate(() => {
      return new Promise(async (resolve, reject) => {
        try {
          // Open IndexedDB
          const request = indexedDB.open('ConstructionBillingDB', 6);

          request.onerror = () => reject(request.error);

          request.onsuccess = async () => {
            const db = request.result;

            // Check if user already exists
            const userTx = db.transaction(['users'], 'readonly');
            const userStore = userTx.objectStore('users');
            const getAllUsers = userStore.getAll();

            getAllUsers.onsuccess = async () => {
              const existingUsers = getAllUsers.result;
              console.log('Existing users:', existingUsers.length);

              if (existingUsers.length > 0) {
                console.log('✅ Users already exist');
                resolve({ success: true, message: 'Users already exist' });
                return;
              }

              // Create admin and user accounts
              const users = [
                {
                  id: 1,
                  username: 'admin',
                  password: 'admin123',
                  name: 'Administrator',
                  role: 'admin',
                  email: 'admin@bycodez.com',
                  phone: '',
                  synced: false,
                  lastUpdated: new Date().toISOString()
                },
                {
                  id: 2,
                  username: 'user',
                  password: 'user123',
                  name: 'Regular User',
                  role: 'user',
                  email: 'user@bycodez.com',
                  phone: '',
                  synced: false,
                  lastUpdated: new Date().toISOString()
                }
              ];

              const tx = db.transaction(['users'], 'readwrite');
              const store = tx.objectStore('users');

              for (const user of users) {
                store.add(user);
              }

              tx.oncomplete = () => {
                console.log('✅ Users seeded successfully');
                resolve({ success: true, users });
              };

              tx.onerror = () => {
                reject(tx.error);
              };
            };
          };
        } catch (error) {
          reject(error);
        }
      });
    });

    console.log('✅ Users seeded successfully!');
    console.log('👤 Admin: username = admin, password = admin123');
    console.log('👤 User: username = user, password = user123');

    await new Promise(r => setTimeout(r, 2000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();

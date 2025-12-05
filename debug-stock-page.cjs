const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Debugging Stock Transactions Page...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[Browser ${type.toUpperCase()}]:`, text);
  });

  // Capture all errors
  page.on('pageerror', error => {
    console.error('[Browser ERROR]:', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.error('[Request FAILED]:', request.url());
  });

  try {
    console.log('📍 Navigating to localhost:3003...');
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('⏳ Waiting for page to load...');
    await new Promise(r => setTimeout(r, 2000));

    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Check page title
    const title = await page.title();
    console.log('📄 Page Title:', title);

    // Take screenshot of current state
    await page.screenshot({ path: 'debug-initial-state.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-initial-state.png');

    // Try to navigate to stock transactions
    console.log('🔍 Looking for navigation to Stock Transactions...');

    // Try clicking on Inventory/Materials menu
    const inventoryMenu = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const found = elements.find(el => {
        const text = el.textContent;
        return text && (text.includes('Inventory') || text.includes('Material'));
      });
      if (found) {
        found.click();
        return true;
      }
      return false;
    });

    if (inventoryMenu) {
      console.log('✅ Clicked Inventory menu');
      await new Promise(r => setTimeout(r, 1000));
    }

    // Try clicking Stock Transactions
    const stockTransMenu = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const found = elements.find(el => {
        const text = el.textContent;
        return text && text.includes('Stock Transaction');
      });
      if (found) {
        found.click();
        return true;
      }
      return false;
    });

    if (stockTransMenu) {
      console.log('✅ Clicked Stock Transactions menu');
      await new Promise(r => setTimeout(r, 2000));

      // Take screenshot after navigation
      await page.screenshot({ path: 'debug-stock-page.png', fullPage: true });
      console.log('📸 Screenshot saved: debug-stock-page.png');

      // Check if page content loaded
      const pageContent = await page.evaluate(() => {
        return {
          hasAddButton: !!document.querySelector('button:contains("Add Transaction")') ||
                        Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Add Transaction')),
          hasTable: !!document.querySelector('table'),
          hasError: !!document.querySelector('.alert-danger, .error'),
          bodyText: document.body.textContent.substring(0, 500)
        };
      });

      console.log('📊 Page Content Analysis:');
      console.log('  - Has Add Transaction Button:', pageContent.hasAddButton);
      console.log('  - Has Table:', pageContent.hasTable);
      console.log('  - Has Error:', pageContent.hasError);
      console.log('  - Body Text (first 500 chars):', pageContent.bodyText);

    } else {
      console.log('⚠️ Could not find Stock Transactions menu item');
    }

    console.log('\n⏳ Keeping browser open for 15 seconds for manual inspection...');
    await new Promise(r => setTimeout(r, 15000));

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
})();

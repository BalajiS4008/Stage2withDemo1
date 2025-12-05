const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting browser test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Listen to console messages from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔍') || text.includes('✅') || text.includes('❌') || text.includes('⚠️')) {
      console.log('Browser Console:', text);
    }
  });

  try {
    console.log('📍 Navigating to localhost:3003...');
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('⏳ Waiting for page to load...');
    await new Promise(r => setTimeout(r, 2000));

    // Check if we need to login
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      console.log('🔐 Login page detected, attempting to login...');

      // Fill in login form
      const usernameInput = await page.$('input[type="text"]');
      if (usernameInput) {
        await usernameInput.click({ clickCount: 3 }); // Select all existing text
        await usernameInput.type('admin', { delay: 50 });
      }

      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.click({ clickCount: 3 }); // Select all existing text
        await passwordInput.type('admin123', { delay: 50 });
      }

      // Solve the captcha dynamically
      try {
        // Get all text on the page and find the captcha
        const pageText = await page.evaluate(() => document.body.textContent);
        const match = pageText.match(/(\d+)\s*([+×x*×\-])\s*(\d+)\s*=\s*\?/);

        if (match) {
          const num1 = parseInt(match[1]);
          const operator = match[2];
          const num2 = parseInt(match[3]);
          let answer;

          if (operator === '+') {
            answer = num1 + num2;
          } else if (operator === '×' || operator === 'x' || operator === '*') {
            answer = num1 * num2;
          } else if (operator === '-') {
            answer = num1 - num2;
          }

          console.log(`🧮 Solving captcha: ${num1} ${operator} ${num2} = ${answer}`);

          const captchaInput = await page.$('input[placeholder="Answer"]');
          if (captchaInput) {
            await captchaInput.type(String(answer), { delay: 50 });
            console.log('✅ Captcha solved:', answer);
          }
        } else {
          console.log('⚠️ Could not parse captcha, entering default answer 8');
          const captchaInput = await page.$('input[placeholder="Answer"]');
          if (captchaInput) {
            await captchaInput.type('8', { delay: 50 });
          }
        }
      } catch (captchaError) {
        console.log('⚠️ Captcha error:', captchaError.message);
      }

      await new Promise(r => setTimeout(r, 500));
      await page.click('button[type="submit"]');
      console.log('🔄 Waiting after login...');
      await new Promise(r => setTimeout(r, 3000));
    }

    // Navigate to Stock Transactions page
    console.log('📍 Looking for Stock Transactions link...');

    // Try to find Materials or Stock link in the navigation
    const navLinks = await page.$$('a, button');
    let foundLink = false;

    for (const link of navLinks) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text && (text.includes('Material') || text.includes('Stock') || text.includes('Inventory'))) {
        console.log('🔗 Found link:', text);
        await link.click();
        foundLink = true;
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }

    if (!foundLink) {
      console.log('⚠️ Could not find Stock/Materials link, checking if already on correct page...');
    }

    // Look for "Add Transaction" or "New Stock Transaction" button
    console.log('🔍 Looking for Add Transaction button...');
    await new Promise(r => setTimeout(r, 2000));

    const buttons = await page.$$('button');
    let addButtonFound = false;

    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Add Transaction') || text.includes('New Transaction'))) {
        console.log('🎯 Found button:', text);
        await button.click();
        addButtonFound = true;
        console.log('⏳ Waiting for modal to open...');
        await new Promise(r => setTimeout(r, 3000));
        break;
      }
    }

    if (!addButtonFound) {
      console.log('⚠️ Could not find Add Transaction button');
      await page.screenshot({ path: 'screenshot-page.png', fullPage: true });
      console.log('📸 Saved screenshot of current page as screenshot-page.png');
    } else {
      // Wait for modal to be visible
      await new Promise(r => setTimeout(r, 2000));

      // Capture screenshot of the modal
      console.log('📸 Capturing screenshot...');
      await page.screenshot({ path: 'screenshot-modal.png', fullPage: true });
      console.log('✅ Screenshot saved as screenshot-modal.png');

      // Try to find and log the transaction number value
      const transactionNumberInput = await page.$('input[value*="TXN"], input[readonly][class*="form-control"]');
      if (transactionNumberInput) {
        const value = await page.evaluate(el => el.value, transactionNumberInput);
        console.log('📋 Transaction Number value:', value || '(empty)');
      }
    }

    console.log('⏳ Keeping browser open for 10 seconds for manual inspection...');
    await new Promise(r => setTimeout(r, 10000));

  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as screenshot-error.png');
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
})();

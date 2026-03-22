import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    console.log('BROWSER ERROR:', err.message);
  });

  try {
    console.log("Navigating to localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Try PIN if exists
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes("Enter your PIN")) {
      console.log("Entering PIN...");
      await page.keyboard.press('1');
      await page.keyboard.press('2');
      await page.keyboard.press('3');
      await page.keyboard.press('4');
      await page.waitForTimeout(500);

      const confirmText = await page.evaluate(() => document.body.innerText);
      if (confirmText.includes("Confirm new PIN")) {
          await page.keyboard.press('1');
          await page.keyboard.press('2');
          await page.keyboard.press('3');
          await page.keyboard.press('4');
      }
      await page.waitForTimeout(1000);
    }

    console.log("Clicking 'Verify Drug'...");
    await page.getByText('Verify Drug', { exact: false }).first().click();
    await page.waitForTimeout(1000);

    console.log("Clicking 'Switch to manual entry'...");
    await page.getByText('Switch to manual entry', { exact: false }).click();
    await page.waitForTimeout(500);

    console.log("Typing 'C1-1876'...");
    await page.locator('input[type="text"]').fill('C1-1876');
    await page.keyboard.press('Enter');
    
    console.log("Waiting for 9ja Checkr result...");
    await page.waitForTimeout(5000);
    
    const resultText = await page.evaluate(() => document.body.innerText);
    if (resultText.includes("MR. V PREMIUM WATER")) {
       console.log("RESULT SUCCESS! Found MR. V PREMIUM WATER!");
    } else {
       console.log("RESULT FAILED! Did not see the drug.");
       console.log(resultText);
    }

    console.log("Clicking 'Add to Stock'...");
    await page.getByText('Add to Stock', { exact: false }).click();
    await page.waitForTimeout(1000);

    console.log("Filling out Quantity...");
    await page.locator('input[type="number"]').fill('50');
    
    // Note: page.fill on date inputs is yyyy-mm-dd
    console.log("Filling out Expiry...");
    await page.locator('input[type="date"]').fill('2028-12-12');
    
    console.log("Saving Batch...");
    await page.getByText('Save Batch', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log("Checking if modal closed...");
    const modalVisible = await page.locator('text=Save Batch').isVisible();
    if (modalVisible) {
       console.log("ERROR: Modal is still visible! Something failed silently.");
    } else {
       console.log("SUCCESS: Modal closed!");
    }

    console.log("Navigating to Inventory List...");
    const invText = await page.evaluate(() => document.body.innerText);
    if (invText.includes("MR. V") || invText.includes("Active Stock")) {
       console.log("SUCCESS: Reached Inventory list and saw item!");
    } else {
       console.log("ERROR: Failed to see inventory list");
    }

  } catch (err) {
    console.error("Test script error:", err);
  } finally {
    await browser.close();
  }
})();

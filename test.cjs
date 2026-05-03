const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    else console.log('BROWSER LOG:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log("Navigating to http://localhost:8080/");
  await page.goto('http://localhost:8080/');

  try {
    console.log("Waiting for Guest Mode button...");
    await page.waitForSelector("button", { timeout: 10000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const guest = btns.find(b => b.textContent && b.textContent.includes('PROCEED AS GUEST'));
      if (guest) guest.click();
    });
    console.log("Clicked Guest Mode");
  } catch (e) {
    console.log("Guest mode button error:", e.message);
  }

  await new Promise(r => setTimeout(r, 2000));

  try {
    // Type name
    await page.type('input', 'Test Commander');
    console.log("Typed name");
  } catch(e) {}

  try {
    console.log("Waiting for Next / Finalize button...");
    for (let i = 0; i < 5; i++) {
      const clickedFinalize = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const finalize = btns.find(b => b.textContent && b.textContent.includes('Finalize'));
        const next = btns.find(b => b.textContent && b.textContent.includes('Next') && !b.disabled);
        
        if (finalize) {
          finalize.click();
          return true;
        } else if (next) {
          next.click();
          return false;
        }
        return false;
      });
      if (clickedFinalize) {
        console.log("Clicked Finalize Identity");
        break;
      }
      console.log("Clicked Next");
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch(e) {
    console.log("Error clicking through onboarding:", e.message);
  }

  console.log("Waiting 5 seconds to see if error occurs...");
  await new Promise(r => setTimeout(r, 5000));

  await browser.close();
})();

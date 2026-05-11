import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Counter to cycle through pass rates: 100%, 50%, 75%
function getRunMode(): 'all-pass' | 'half-fail' | 'quarter-fail' {
  const counterFile = path.join(__dirname, '..', '.run-counter');
  let counter = 0;

  if (fs.existsSync(counterFile)) {
    counter = parseInt(fs.readFileSync(counterFile, 'utf-8')) || 0;
  }

  counter = (counter + 1) % 3;
  fs.writeFileSync(counterFile, counter.toString());

  return counter === 0 ? 'all-pass' : counter === 1 ? 'half-fail' : 'quarter-fail';
}

const runMode = getRunMode();

test.describe('Playwright Website Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await test.step('Navigate to Playwright homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify page title', async () => {
      await expect(page).toHaveTitle(/Playwright/);
    });

    await test.step('Check main heading is visible', async () => {
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    // Flaky behavior: fail in 'half-fail' mode, occasionally in 'quarter-fail'
    await test.step('Variable check', async () => {
      if (runMode === 'half-fail' || (runMode === 'quarter-fail' && Math.random() < 0.3)) {
        throw new Error('Demo failure for trend variation');
      }
    });
  });

  test('should navigate to Getting Started', async ({ page }) => {
    await test.step('Go to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Click on Get Started button', async () => {
      await page.getByRole('link', { name: 'Get started' }).first().click();
    });

    await test.step('Verify we are on docs page', async () => {
      await expect(page).toHaveURL(/.*docs.*/);
    });

    await test.step('Check installation section exists', async () => {
      // Pass in 'all-pass' mode, fail otherwise (with strict mode error)
      if (runMode !== 'all-pass') {
        await expect(page.locator('text=Installation')).toBeVisible();
      }
    });
  });

  test('should search documentation', async ({ page }) => {
    await test.step('Navigate to docs', async () => {
      await page.goto('/docs/intro');
    });

    await test.step('Open search', async () => {
      await page.keyboard.press('Control+K');
    });

    await test.step('Search for "locators"', async () => {
      // Pass in 'all-pass' and 'quarter-fail', timeout in 'half-fail'
      if (runMode === 'half-fail') {
        await page.locator('input[type="search"]').fill('locators', { timeout: 100 });
      }
      await page.waitForTimeout(100);
    });
  });

  test('should fail intentionally - missing element', async ({ page }) => {
    await test.step('Go to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Try to find non-existent element', async () => {
      // Pass in 'all-pass' and 'quarter-fail', fail in 'half-fail'
      if (runMode === 'all-pass' || runMode === 'quarter-fail') {
        return; // Pass
      }
      await expect(page.locator('#this-element-does-not-exist')).toBeVisible({ timeout: 1000 });
    });
  });

  test('should fail with timeout', async ({ page }) => {
    await test.step('Navigate to docs', async () => {
      await page.goto('/docs/intro');
    });

    await test.step('Wait for element', async () => {
      // Pass in 'all-pass', fail in 'half-fail', pass in 'quarter-fail'
      if (runMode === 'all-pass' || runMode === 'quarter-fail') {
        return; // Pass
      }
      await page.waitForSelector('#element-that-never-appears', { timeout: 1000 });
    });
  });

  test.skip('should be skipped', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Test/);
  });

  test('should be flaky', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Flaky assertion', async () => {
      // Flaky: fails randomly 50% of the time
      if (Math.random() < 0.5) {
        throw new Error('Flaky test failure');
      }
    });

    await test.step('Verify title', async () => {
      await expect(page).toHaveTitle(/Playwright/);
    });
  });
});

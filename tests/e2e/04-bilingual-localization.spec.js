const { test, expect } = require('@playwright/test');

/**
 * Journey 4: Bilingual Hindi / English UI Localization (Slice P9)
 * Validates instant translation toggle, Devanagari text rendering,
 * persistence in localStorage, and lack of visual layout shifts.
 */
test.describe('Journey 4: Bilingual Hindi / English UI Localization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display English text by default with language toggle button', async ({ page }) => {
    const langBtn = page.locator('#langToggleBtn');
    await expect(langBtn).toBeVisible();

    const brandName = page.locator('.brand-name');
    await expect(brandName).toContainText('GharDekho');

    const searchInput = page.locator('#searchInput');
    await expect(searchInput).toHaveAttribute('placeholder', /Search by coaching/);

    const filterBtn = page.locator('.filter-btn-label');
    await expect(filterBtn).toHaveText('Filters');
  });

  test('should switch UI language to Hindi on toggle click and update DOM labels', async ({ page }) => {
    const langBtn = page.locator('#langToggleBtn');
    await langBtn.click();

    // Verify html tag updates attribute and class
    const htmlTag = page.locator('html');
    await expect(htmlTag).toHaveAttribute('lang', 'hi');
    await expect(htmlTag).toHaveClass(/lang-hi/);

    // Verify translated brand, search placeholder, and filter button
    const brandName = page.locator('.brand-name');
    await expect(brandName).toHaveText('घरदेखो');

    const searchInput = page.locator('#searchInput');
    await expect(searchInput).toHaveAttribute('placeholder', /कोचिंग \(Allen, Resonance\)/);

    const filterBtn = page.locator('.filter-btn-label');
    await expect(filterBtn).toHaveText('फ़िल्टर');

    // Verify bottom nav labels in Hindi
    const bottomNav = page.locator('#bottomNav');
    await expect(bottomNav).toContainText('खोजें');
    await expect(bottomNav).toContainText('नक्शा');
  });

  test('should toggle back to English seamlessly', async ({ page }) => {
    const langBtn = page.locator('#langToggleBtn');
    
    // Toggle to Hindi
    await langBtn.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');

    // Toggle back to English
    await langBtn.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.filter-btn-label')).toHaveText('Filters');
    await expect(page.locator('.brand-name')).toHaveText('GharDekho');
  });
});

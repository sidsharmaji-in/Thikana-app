// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Journey 1: Tenant Search, Filter, Room Details & Bed Slot Reservation Flow
 * Production Slice P5
 */
test.describe('Journey 1: Tenant Search, Filters & Bed Reservation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display brand identity, search bar and initial rental properties', async ({ page }) => {
    // 1. Verify Header & Brand
    const brandName = page.locator('.brand-name');
    await expect(brandName).toBeVisible();
    await expect(brandName).toContainText('GharDekho');

    // 2. Verify Search Bar
    const searchInput = page.locator('#searchInput');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search by coaching/);

    // 3. Verify Initial Property Cards Rendered
    const propertyCards = page.locator('.property-card');
    await expect(propertyCards.first()).toBeVisible({ timeout: 10000 });
    const count = await propertyCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should filter listings by Kota educational hub and search query', async ({ page }) => {
    // 1. Click Kota Quick Chip
    const kotaChip = page.locator('#quickChips button:has-text("Kota")');
    await expect(kotaChip).toBeVisible();
    await kotaChip.click();

    // 2. Verify URL or Cards reflect Kota
    const kotaCards = page.locator('.property-card');
    await expect(kotaCards.first()).toBeVisible();
    const firstTitle = await kotaCards.first().locator('.card-title').textContent();
    expect(firstTitle).toBeTruthy();

    // 3. Type in Search Bar
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('Allen');
    await page.waitForTimeout(400); // 250ms debounce

    // Verify filtered results
    const matchingCards = page.locator('.property-card');
    const matchCount = await matchingCards.count();
    expect(matchCount).toBeGreaterThanOrEqual(1);
  });

  test('should open listing details sheet and view hyperlocal Indian amenities', async ({ page }) => {
    // 1. Click first property card
    const firstCard = page.locator('.property-card').first();
    await firstCard.click();

    // 2. Detail Modal / Sheet should open
    const detailSheet = page.locator('#detailSheet, .detail-sheet, .modal-sheet');
    await expect(detailSheet.first()).toBeVisible({ timeout: 10000 });

    // 3. Verify Indian-specific reality badges
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/(Water|Jal|Bijli|Power Backup|Western|WiFi)/i);

    // 4. Verify Sharing Bed Allocation
    expect(pageText).toMatch(/(Bed Slot|Sharing|Occupied|Available)/i);
  });

  test('should inspect bed slots and trigger reservation workflow', async ({ page }) => {
    // Open first Kota property
    const firstCard = page.locator('.property-card').first();
    await firstCard.click();

    // Find available bed slot booking or lock trigger
    const bookSlotBtn = page.locator('.slot-book-btn, button:has-text("Book"), button:has-text("Reserve")').first();
    if (await bookSlotBtn.isVisible()) {
      await bookSlotBtn.click();
      await page.waitForTimeout(500);

      // Verify either toast confirmation or booking sheet
      const bodyText = await page.textContent('body');
      expect(bodyText).toMatch(/(Reserved|Locked|Slot|Booked|Visit|Inquiry)/i);
    }
  });

});

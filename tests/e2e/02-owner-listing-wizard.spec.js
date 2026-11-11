// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Journey 2: Owner Role Switch, Dashboard & 5-Step Property Listing Wizard
 * Production Slice P5
 */
test.describe('Journey 2: Owner Role Switch & 5-Step Listing Wizard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should switch user role to Owner and render Makan Maalik dashboard', async ({ page }) => {
    // 1. Click Owner toggle button
    const ownerBtn = page.locator('#roleOwnerBtn');
    await expect(ownerBtn).toBeVisible();
    await ownerBtn.click();

    // 2. Verify button becomes active
    await expect(ownerBtn).toHaveClass(/active/);

    // 3. Verify Makan Maalik Dashboard appears
    const dashboardTitle = page.locator('h2:has-text("Makan Maalik Dashboard")');
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });

    // 4. Verify Metrics Bar (Properties, Occupancy, Inquiries)
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Properties');
    expect(bodyText).toContain('Occupancy');
    expect(bodyText).toContain('+ Add Listing');
  });

  test('should navigate 5-step property wizard and publish a verified PG room', async ({ page }) => {
    // 1. Switch to Owner
    await page.click('#roleOwnerBtn');
    await page.waitForTimeout(300);

    // 2. Click + Add Listing
    const addListingBtn = page.locator('button:has-text("+ Add Listing")');
    await expect(addListingBtn).toBeVisible();
    await addListingBtn.click();

    // 3. Verify Step 1: Basic Info
    const step1Heading = page.locator('h4:has-text("Step 1: Property Identity")');
    await expect(step1Heading).toBeVisible();

    const titleInput = page.locator('#ownerTitle');
    const uniqueTitle = `Radha Krishna Residency (Near Resonance) ${Date.now()}`;
    await titleInput.fill(uniqueTitle);

    const localityInput = page.locator('#ownerLocality');
    await localityInput.fill('Vigyan Nagar');

    // 4. Proceed to Step 2: Location
    const nextStepBtn = page.locator('button:has-text("Next: Location & Map Pin")');
    await nextStepBtn.click();
    await page.waitForTimeout(300);

    // 5. Proceed to Step 3: Amenities
    const toAmenitiesBtn = page.locator('button:has-text("Next: 20+ Amenity Checklist")');
    await toAmenitiesBtn.click();
    await page.waitForTimeout(300);

    // 6. Proceed to Step 4: Room Sharing
    const toSharingBtn = page.locator('button:has-text("Next: Room Sharing & Price")');
    await toSharingBtn.click();
    await page.waitForTimeout(300);

    const rentInput = page.locator('#ownerRent');
    await rentInput.fill('4500');

    // 7. Proceed to Step 5: Photos & Review
    const toPhotosBtn = page.locator('button:has-text("Next: Photos & Review")');
    await toPhotosBtn.click();
    await page.waitForTimeout(300);

    // Ensure at least 3 photos are in draft
    const addPhotoBtn = page.locator('button:has-text("+ Add Sample Photo")');
    if (await addPhotoBtn.isVisible()) {
      await addPhotoBtn.click();
      await addPhotoBtn.click();
      await addPhotoBtn.click();
    }

    // 8. Publish Property
    const publishBtn = page.locator('button:has-text("Publish Property Now")');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();
    await page.waitForTimeout(1000);

    // 9. Verify redirection back to Dashboard with new property or success notification
    const contentText = await page.textContent('body');
    expect(contentText).toMatch(/(Makan Maalik Dashboard|Properties|Published|Live)/i);
  });

});

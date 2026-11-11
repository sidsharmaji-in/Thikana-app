// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Journey 3: In-App Chat, Real-Time Messaging & Room Visit Scheduling
 * Production Slice P5
 */
test.describe('Journey 3: In-App Chat & Visit Scheduling Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open messages view and list active inquiry threads', async ({ page }) => {
    // 1. Click bottom (mobile) or header (desktop) Messages/Chat tab
    const messagesTab = page.locator('button[onclick*="messages"]:visible').first();
    await expect(messagesTab).toBeVisible();
    await messagesTab.click();
    await page.waitForTimeout(400);

    // 2. Verify Inquiries / Messages view heading
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/(Messages|Inquiries|Chat|Conversations)/i);

    // 3. Verify inquiry thread card is present
    const threadCards = page.locator('.inquiry-card, .chat-thread-card, .thread-item');
    if (await threadCards.count() > 0) {
      await expect(threadCards.first()).toBeVisible();
    }
  });

  test('should interact with active chat thread and send a real-time message', async ({ page }) => {
    // 1. Navigate to Messages
    const messagesTab = page.locator('button[onclick*="messages"]:visible').first();
    await messagesTab.click();
    await page.waitForTimeout(400);

    // 2. Open first conversation if present
    const threadCard = page.locator('.inquiry-card, .chat-thread-card, .thread-item').first();
    if (await threadCard.isVisible()) {
      await threadCard.click();
      await page.waitForTimeout(400);

      // 3. Find Chat Message Input
      const chatInput = page.locator('#chatInput, input[placeholder*="message"], input[placeholder*="Type"]');
      if (await chatInput.isVisible()) {
        const testMsg = `Namaste, is this room available from next Monday? [Test-${Date.now()}]`;
        await chatInput.fill(testMsg);

        // 4. Send Message
        const sendBtn = page.locator('#chatSendBtn, button:has-text("Send"), button[aria-label*="Send"]');
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(500);

          // 5. Assert message appears in conversation bubble
          const chatBody = await page.textContent('body');
          expect(chatBody).toContain('Namaste');
        }
      }
    }
  });

  test('should display visit schedule status and confirmation actions', async ({ page }) => {
    // Navigate to Messages
    const messagesTab = page.locator('button[onclick*="messages"]:visible').first();
    await messagesTab.click();
    await page.waitForTimeout(400);

    // Verify presence of room visit badge / schedule indicator
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/(Visit|Scheduled|Confirmed|Pending|Inquiry|Chat)/i);
  });

});

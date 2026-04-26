import { test, expect } from '../../src/fixtures/naukri.js';

test('bump profile to top by saving resume headline', async ({ naukriProfile }) => {
  // Click edit on Resume headline
  await naukriProfile.headlineEditBtn.click();

  // Save without changing anything — this updates "Profile last updated" timestamp
  await naukriProfile.saveBtn.click();

  // Verify profile was touched
  await expect(naukriProfile.lastUpdatedText).toContainText(/Today/i, { timeout: 10_000 });
});

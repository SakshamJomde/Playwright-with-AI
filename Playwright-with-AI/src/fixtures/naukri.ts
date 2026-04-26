import 'dotenv/config';
import { test as base, type Page } from '@playwright/test';

const BASE = process.env.BASE_NAUKRI_URL ?? 'https://www.naukri.com';
const EMAIL = process.env.NAUKRI_USERNAME ?? '';
const PASSWORD = process.env.NAUKRI_PASSWORD ?? '';

class NaukriLoginPage {
  constructor(private page: Page) {}

  async login() {
    await this.page.goto(`${BASE}/nlogin/login`);
    await this.page.locator('input[placeholder="Enter Email ID / Username"]').waitFor({ timeout: 15_000 });
    await this.page.locator('input[placeholder="Enter Email ID / Username"]').fill(EMAIL);
    await this.page.locator('input[type="password"]').first().fill(PASSWORD);
    await this.page.locator('button[type="submit"]').first().click();
    await this.page.waitForURL(/naukri\.com\/(?!nlogin)/, { timeout: 15_000 });
  }
}

export class NaukriProfilePage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto(`${BASE}/mnjuser/profile`);
    // Wait for profile to fully load — "Profile last updated" is a reliable signal
    await this.page.getByText(/Profile last updated/i).waitFor({ timeout: 15_000 });
  }

  // Edit icon next to "Resume headline" section — from snapshot ref=e196
  get headlineEditBtn() {
    return this.page.locator('text=Resume headline')
      .locator('..')
      .locator('[class*="edit"], [cursor="pointer"]')
      .first();
  }

  // Save button inside the open edit modal/inline form
  get saveBtn() {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  // Confirmation that profile was updated
  get lastUpdatedText() {
    return this.page.getByText(/Profile last updated/i);
  }
}

type Fixtures = {
  naukriProfile: NaukriProfilePage;
};

export const test = base.extend<Fixtures>({
  naukriProfile: async ({ page }, use) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const login = new NaukriLoginPage(page);
    await login.login();

    const profile = new NaukriProfilePage(page);
    await profile.goto();
    await use(profile);
  },
});

export { expect } from '@playwright/test';

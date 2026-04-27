import 'dotenv/config';
import { test as base, type Page, type BrowserContext } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

const BASE = process.env.BASE_NAUKRI_URL ?? 'https://www.naukri.com';
const EMAIL = process.env.NAUKRI_USERNAME ?? '';
const PASSWORD = process.env.NAUKRI_PASSWORD ?? '';
const AUTH_STATE_B64 = process.env.NAUKRI_AUTH_STATE ?? '';
const AUTH_FILE = path.resolve('auth-state.json');

async function prepareAuthState(): Promise<string | undefined> {
  // CI: decode base64 secret → write temp file → use as storageState
  if (AUTH_STATE_B64) {
    const decoded = Buffer.from(AUTH_STATE_B64, 'base64');
    await fs.writeFile(AUTH_FILE, decoded);
    console.log('[Auth] Using saved session from NAUKRI_AUTH_STATE secret');
    return AUTH_FILE;
  }

  // Local: check if auth-state.json exists from a previous save-auth run
  try {
    await fs.access(AUTH_FILE);
    console.log('[Auth] Using local auth-state.json');
    return AUTH_FILE;
  } catch {
    return undefined;
  }
}

async function loginWithCredentials(page: Page): Promise<void> {
  console.log('[Auth] Logging in with credentials...');
  await page.goto(`${BASE}/nlogin/login`);
  await page.locator('input[placeholder="Enter Email ID / Username"]').waitFor({ timeout: 15_000 });
  await page.locator('input[placeholder="Enter Email ID / Username"]').fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/naukri\.com\/(?!nlogin)/, { timeout: 15_000 });
}

export class NaukriProfilePage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto(`${BASE}/mnjuser/profile`);
    await this.page.getByText(/Profile last updated/i).waitFor({ timeout: 15_000 });
  }

  get headlineEditBtn() {
    return this.page.locator('text=Resume headline')
      .locator('..')
      .locator('[class*="edit"], [cursor="pointer"]')
      .first();
  }

  get saveBtn() {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  get lastUpdatedText() {
    return this.page.getByText(/Profile last updated/i);
  }
}

type Fixtures = {
  naukriProfile: NaukriProfilePage;
};

export const test = base.extend<Fixtures>({
  naukriProfile: async ({ browser }, use) => {
    await browser.newPage(); // warm up

    const authFile = await prepareAuthState();

    let context: BrowserContext;

    if (authFile) {
      // Reuse saved session — no login needed, bypasses bot detection in CI
      context = await browser.newContext({ storageState: authFile });
    } else {
      // First run locally — login with credentials
      context = await browser.newContext();
      const loginPage = await context.newPage();
      await loginPage.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });
      await loginWithCredentials(loginPage);
      await loginPage.close();
    }

    const page = await context.newPage();
    const profile = new NaukriProfilePage(page);
    await profile.goto();
    await use(profile);
    await context.close();
  },
});

export { expect } from '@playwright/test';

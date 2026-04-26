import { test as base, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://showtimenow.contentstackapps.com';

// ── Page action objects ───────────────────────────────────────────────────────

class HomePage {
  readonly heading = this.page.getByRole('heading', { name: 'Recommended Movie' });
  readonly bookNowLinks = this.page.getByRole('link', { name: 'Book Now' });
  readonly searchBox = this.page.getByRole('textbox', { name: 'Search for movies...' });

  constructor(private page: Page) {}

  movieTitle(name: string) {
    return this.page.getByRole('heading', { name, level: 3 });
  }

  movieGenre(genre: string) {
    return this.page.getByText(genre);
  }

  async clickFirstBookNow() {
    await this.bookNowLinks.first().click();
  }
}

class MovieDetailPage {
  readonly movieTitle = this.page.getByRole('heading', { level: 1 });
  readonly selectShowtimeHeading = this.page.getByRole('heading', { name: 'Select Showtime' });
  readonly backToHome = this.page.getByRole('link', { name: '← Back to Home' });
  readonly bookNowButton = this.page.getByRole('button', { name: '🎬 Book Now' });
  readonly showtimeButtons = this.page.getByRole('button', { name: /\d+:\d+\s*(AM|PM)/i });

  constructor(private page: Page) {}

  theatre(name: string) {
    return this.page.getByRole('heading', { name, level: 3 });
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

type Fixtures = {
  homePage: HomePage;
  movieDetailPage: MovieDetailPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await page.goto(BASE_URL);
    const home = new HomePage(page);
    await expect(home.heading).toBeVisible({ timeout: 10000 });
    await use(home);
  },

  movieDetailPage: async ({ page }, use) => {
    await page.goto(`${BASE_URL}/movies/f1themovie`);
    const detail = new MovieDetailPage(page);
    await expect(detail.selectShowtimeHeading).toBeVisible({ timeout: 10000 });
    await use(detail);
  },
});

export { expect };

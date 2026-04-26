import { test, expect } from '../src/fixtures/showtimenow.js';

test('clicking Book Now navigates to movie detail page', async ({ homePage, page }) => {
  await homePage.clickFirstBookNow();
  await expect(page).toHaveURL(/\/movies\//, { timeout: 8000 });
  await expect(page.getByRole('heading', { name: 'F1 : The Movie' })).toBeVisible();
});

test('movie detail page shows showtimes and theatres', async ({ movieDetailPage }) => {
  await expect(movieDetailPage.selectShowtimeHeading).toBeVisible();
  await expect(movieDetailPage.theatre('PVR')).toBeVisible();
  await expect(movieDetailPage.showtimeButtons.first()).toBeVisible();
  await expect(movieDetailPage.bookNowButton).toBeVisible();
});

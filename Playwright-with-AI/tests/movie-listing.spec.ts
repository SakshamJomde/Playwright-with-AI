import { test, expect } from '../src/fixtures/showtimenow.js';

test('movie listing page loads with recommended movies', async ({ homePage }) => {
  await expect(homePage.heading).toBeVisible();
  await expect(homePage.bookNowLinks.first()).toBeVisible();
  expect(await homePage.bookNowLinks.count()).toBeGreaterThan(0);
});

test('movie cards show title, genre and rating', async ({ homePage }) => {
  await expect(homePage.movieTitle('F1 : The Movie')).toBeVisible();
  await expect(homePage.movieGenre('Action/Drama/Sports')).toBeVisible();
  await expect(homePage.bookNowLinks.first()).toBeVisible();
});

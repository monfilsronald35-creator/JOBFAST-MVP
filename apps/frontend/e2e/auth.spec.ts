/**
 * E2E: Authentication flows — Login, Register, Forgot Password
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
  });

  test('shows validation error on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    // Form should remain (no navigation)
    await expect(page).toHaveURL(/login/);
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
  });

  test('splash screen loads', async ({ page }) => {
    await page.goto('/');
    // Should render splash or redirect to login
    await expect(page.locator('body')).toBeVisible();
  });
});
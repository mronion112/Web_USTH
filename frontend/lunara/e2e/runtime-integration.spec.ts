import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const API_ORIGIN = 'http://localhost:8080';

async function tokenFor(request: APIRequestContext, email: string): Promise<string> {
  const response = await request.post(`${API_ORIGIN}/api/auth/dev-login`, { data: { email } });
  expect(response.ok()).toBe(true);
  const body = await response.json();
  return body.data.accessToken;
}

async function authenticate(page: Page, request: APIRequestContext, email: string): Promise<void> {
  const token = await tokenFor(request, email);
  await page.addInitScript((accessToken) => {
    window.localStorage.setItem('lunara_access_token', accessToken);
  }, token);
}

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('response', (response) => {
    if (response.url().startsWith(API_ORIGIN) && [401, 403, 404].includes(response.status())) {
      errors.push(`http ${response.status()}: ${response.url()}`);
    }
  });
  return errors;
}

test('public landing and booking render data from the backend', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');
  await expect(page.getByText('Lunara', { exact: true }).first()).toBeVisible();
  await page.goto('/booking');
  await expect(page.getByRole('heading', { name: 'ĐẶT LỊCH SPA LUNARA' })).toBeVisible();
  await expect(page.getByText('Relaxing Body Massage').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('direct URL guards redirect every restricted role to its own workspace', async ({ page, request }) => {
  const cases = [
    ['customer29@lunara-spa.demo', '/admin/dashboard', '/booking'],
    ['therapist10@lunara-spa.demo', '/admin/dashboard', '/staff/my-work'],
    ['reception6@lunara-spa.demo', '/admin/staff', '/admin/live'],
    ['accountant26@lunara-spa.demo', '/admin/booking', '/admin/payments'],
  ] as const;

  for (const [email, target, expected] of cases) {
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    const token = await tokenFor(request, email);
    await page.evaluate((accessToken) => window.localStorage.setItem('lunara_access_token', accessToken), token);
    await page.goto(target);
    await expect(page).toHaveURL(new RegExp(`${expected.replaceAll('/', '\\/')}$`));
  }
});

test('owner dashboard and notifications load without API authorization errors', async ({ page, request }) => {
  await authenticate(page, request, 'owner1@lunara-spa.demo');
  const errors = collectRuntimeErrors(page);
  const requests: string[] = [];
  page.on('request', (entry) => requests.push(entry.url()));
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: /Tổng quan hoạt động/i })).toBeVisible();
  await expect.poll(() => requests.some((url) => url.includes('/api/manager/notifications'))).toBe(true);
  expect(errors).toEqual([]);
});

test('accountant loads payments without starting notification polling', async ({ page, request }) => {
  await authenticate(page, request, 'accountant26@lunara-spa.demo');
  const errors = collectRuntimeErrors(page);
  const requests: string[] = [];
  page.on('request', (entry) => requests.push(entry.url()));
  await page.goto('/admin/payments');
  await expect(page.getByRole('heading', { name: /Thanh toán/i })).toBeVisible();
  await page.waitForTimeout(500);
  expect(requests.some((url) => url.includes('/api/manager/notifications'))).toBe(false);
  expect(errors).toEqual([]);
});

test('therapist work page consumes bookingId tasks without undefined endpoints', async ({ page, request }) => {
  await authenticate(page, request, 'therapist10@lunara-spa.demo');
  const errors = collectRuntimeErrors(page);
  const requests: string[] = [];
  page.on('request', (entry) => requests.push(entry.url()));
  await page.goto('/staff/my-work');
  await expect(page.getByRole('heading', { name: /Công việc hôm nay/i })).toBeVisible();
  expect(requests.some((url) => url.includes('/undefined'))).toBe(false);
  expect(errors).toEqual([]);
});

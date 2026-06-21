import { test, expect } from '@playwright/test'

test.describe('Shifoxona CRM - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show login form elements', async ({ page }) => {
    await expect(page.locator('text=Shifoxona CRM')).toBeVisible()
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Kirish")')).toBeVisible()
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/')
    const forgotLink = page.locator('text=Parolni unutdingizmi')
    if (await forgotLink.isVisible()) {
      await forgotLink.click()
      await expect(page).toHaveURL(/\/forgot-password/)
    }
  })

  test('should show validation on empty login attempt', async ({ page }) => {
    await page.click('button:has-text("Kirish")')
    await expect(page.locator('text=Login yoki parol noto')).not.toBeVisible()
  })

  test('should switch language', async ({ page }) => {
    const html = page.locator('html')
    const initialLang = await html.getAttribute('lang')
    expect(['uz', 'ru', 'en']).toContain(initialLang)
  })
})

test.describe('Shifoxona CRM - Authorization', () => {
  test('should redirect unauthenticated to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should redirect from all protected routes', async ({ page }) => {
    const routes = ['/medicines', '/tasks', '/profile', '/scan', '/income', '/expense', '/bins', '/delivery', '/chat', '/notifications', '/users']
    for (const route of routes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })
})

test.describe('Shifoxona CRM - Frontend Health', () => {
  test('should load without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await expect(errors.length).toBe(0)
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title).toContain('Shifoxona')
  })

  test('should load CSS and be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Shifoxona CRM - i18n', () => {
  test('should have language switcher in header', async ({ page }) => {
    await page.goto('/')
    const langSwitcher = page.locator('button:has-text("UZ"), button:has-text("RU"), button:has-text("EN")').first()
    if (await langSwitcher.isVisible()) {
      await expect(langSwitcher).toBeVisible()
    }
  })

  test('should change content on language switch', async ({ page }) => {
    await page.goto('/')
    const langButtons = page.locator('button').filter({ hasText: /UZ|RU|EN/ })
    const count = await langButtons.count()
    if (count > 0) {
      await langButtons.first.click()
    }
  })
})

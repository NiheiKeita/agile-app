import { test, expect } from '@playwright/test'

test.describe('Application Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/')

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/toilet/i)
  })

  test('spring page loads successfully', async ({ page }) => {
    // Springページにアクセス
    await page.goto('/spring')

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/spring/i)
  })

  test('toilet page loads successfully', async ({ page }) => {
    // Toiletページにアクセス
    await page.goto('/toilet')

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/toilet/i)
  })
}) 
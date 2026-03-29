import { chromium } from "playwright";
import "dotenv/config";

function buildFileName() {
  return new Date()
    .toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/[/]/g, '-')
    .replace(/\s/g, '_')
    .replace('T', '_')
    .replace(/[:]/g, '-')
    .split('.')[0] + '.png';
}

export async function captureSchedule(){
  console.log("capureSchedule");
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    await page.goto(process.env.SCHOOL_RESERVE_URL!);

    await page.locator('iframe[name="mainf"]').contentFrame().locator('input[name="SEITONO"]').fill(process.env.SCHOOL_NO!);
    await page.locator('iframe[name="mainf"]').contentFrame().locator('input[name="ANSYONO"]').fill(process.env.SCHOOL_PW!);

    await page.locator('iframe[name="mainf"]').contentFrame().getByRole('button', { name: '認 証' }).click();
    await page.locator('iframe[name="mainf"]').contentFrame().getByRole('combobox').click();

    await page.locator('iframe[name="mainf"]').contentFrame().getByRole('combobox').selectOption('04111');
    await page.locator('iframe[name="mainf"]').contentFrame().getByRole('button', { name: '車種選択' }).click();

    const table = page.locator('iframe[name="mainf"]').contentFrame().getByRole('table').filter({ hasText: /時　限/ });

    await table.waitFor({ state: 'visible' });
    await table.screenshot({ path: `./data/${buildFileName()}` });
  } finally {
    await browser.close();
  }
}

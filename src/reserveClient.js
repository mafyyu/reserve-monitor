
/**
 * Playwrightでログインし、スクリーンショットを保存
 */
 
import { chromium } from "playwright";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { getLessonTypeByKey } from "./constants/lessonType.js";

const dataDir = "./data";
const defaultTimeoutMs = 30_000;

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalPositiveIntEnv(name, defaultValue) {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid environment variable: ${name} must be a positive integer`);
  }

  return parsed;
}

function buildFileName() {
  return new Date()
    .toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/[/]/g, "-")
    .replace(/\s/g, "_")
    .replace(/[:]/g, "-")
    .split(".")[0] + ".png";
}

async function captureTableScreenshot(table) {
  fs.mkdirSync(dataDir, { recursive: true });

  const screenshotPath = path.join(dataDir, buildFileName());
  await table.screenshot({ path: screenshotPath });

  return screenshotPath;
}

export async function fetchSchedule(lessonTypeKey, options = {}) {
  const { screenshot = true } = options;
  const lessonType = getLessonTypeByKey(lessonTypeKey);

  console.log("fetchSchedule");

  const reserveUrl = requiredEnv("SCHOOL_RESERVE_URL");
  const schoolNo = requiredEnv("SCHOOL_NO");
  const schoolPw = requiredEnv("SCHOOL_PW");
  const timeoutMs = optionalPositiveIntEnv("CAPTURE_TIMEOUT_MS", defaultTimeoutMs);

  const browser = await chromium.launch({ headless: true, timeout: timeoutMs });
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();
    
    page.setDefaultTimeout(timeoutMs);
    page.setDefaultNavigationTimeout(timeoutMs);

    await page.goto(reserveUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });

    const mainFrame = page.locator('iframe[name="mainf"]').contentFrame();

    await mainFrame.locator('input[name="SEITONO"]').fill(schoolNo);
    await mainFrame.locator('input[name="ANSYONO"]').fill(schoolPw);

    await mainFrame.getByRole("button", { name: "認 証" }).click();
    await mainFrame.getByRole("combobox").click();
    await mainFrame.getByRole("combobox").selectOption(lessonType.code);
    await mainFrame.getByRole("button", { name: "車種選択" }).click();

    const table = mainFrame.getByRole("table").filter({ hasText: /時　限/ });

    await table.waitFor({ state: "visible" });

    const tableHtml = table.locator('td.Aki');

    const availableCells = await tableHtml.evaluateAll((cells) =>
      cells.map((cell) => ({
        id: cell.id,
        period: cell.textContent?.trim()
      }))
    )
    
    const screenshotPath = screenshot
      ? await captureTableScreenshot(table)
      : null;

    return {
      checkedAt: new Date(),
      lessonTypeKey,
      screenshotPath,
      availableSlots: availableCells,
    };
  } finally {
    await browser.close();
  }
}

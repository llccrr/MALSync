// Run after building: node test/headless/extension-smoke.cjs
// Uses a temporary Chrome profile, without the user's accounts or settings.
const assert = require('node:assert/strict');
const path = require('node:path');
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : { channel: 'chrome' }),
    headless: true,
    pipe: true,
    enableExtensions: true,
  });
  try {
    const id = await browser.installExtension(path.resolve(__dirname, '../../dist/webextension'));
    const errors = [];
    for (const entry of ['window.html', 'popup.html']) {
      const page = await browser.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && message.text().includes('Invalid Version')) {
          errors.push(message.text());
        }
      });
      await page.goto(`chrome-extension://${id}/${entry}#/book/anime/1`);
      // Installation opens a welcome tab. Keep the tested page active for rendering.
      await page.bringToFront();
      await page.waitForSelector('.bookmarks', { visible: true });
      await page.evaluate(() => {
        location.hash = '/settings';
      });
      await page.waitForSelector('.settings-block', { visible: true });

      for (const [animeId, title, englishTitle, visible] of [
        [52991, 'Sousou no Frieren', "Frieren: Beyond Journey's End", true],
        [52992, 'Same title', 'Same title', false],
        [52993, 'Japanese title only', undefined, false],
      ]) {
        await page.evaluate(
          ({ animeId, title, englishTitle }) => {
            // Local entries exercise the real overview without API credentials.
            const url = `local://smoke/anime/${animeId}`;
            const locale = chrome.i18n.getMessage('locale');
            localStorage.setItem(
              `v5/${locale}/${url}`,
              JSON.stringify({
                timestamp: Date.now(),
                data: {
                  title,
                  englishTitle,
                  alternativeTitle: [],
                  description: '',
                  image: '',
                  imageLarge: '',
                  characters: [],
                  statistics: [],
                  info: [],
                  openingSongs: [],
                  endingSongs: [],
                  related: [],
                },
              }),
            );
            location.hash = `/anime/l:smoke::${animeId}`;
          },
          { animeId, title, englishTitle },
        );
        await page.waitForFunction(
          expected => document.querySelector('.header-title')?.textContent.includes(expected),
          {},
          title,
        );
        assert.equal(
          await page.$eval('.overview', element =>
            Boolean(element.querySelector('.english-title')),
          ),
          visible,
        );
        if (visible) {
          assert.equal(
            await page.$eval('.english-title', element => element.textContent.trim()),
            englishTitle,
          );
          await page.waitForFunction(() => {
            const overview = document.querySelector('.overview');
            return overview && Number(getComputedStyle(overview).opacity) === 1;
          });
          await page.screenshot({
            path: path.resolve(__dirname, `../../dist/smoke-${entry}.png`),
            waitForFonts: false,
          });
        }
      }
      console.log(
        `${entry}: bookmarks, settings, English title, duplicate and missing title passed`,
      );
      await page.close();
    }
    assert.deepEqual(errors, [], 'No uncaught page errors or version parsing errors');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

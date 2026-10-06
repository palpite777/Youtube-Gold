import asyncio
import os

from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=os.getenv("HEADLESS", "false").lower() == "true")

        context = await browser.new_context(
            proxy={"server": os.getenv("PROXY")} if os.getenv("PROXY") else None,
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
        )

        page = await context.new_page()

        youtube_url = os.getenv("YOUTUBE_URL", "https://www.youtube.com")
        query = os.getenv("SEARCH_QUERY", "lofi hip hop radio")

        print(f"[INFO] Opening {youtube_url}")
        await page.goto(youtube_url, wait_until="domcontentloaded", timeout=60000)

        print(f"[INFO] Searching for: {query}")
        await page.fill("input#search", query)
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(3000)

        try:
            await page.click("ytd-video-renderer a#thumbnail")
        except Exception:
            await page.click("a[href*='watch?v=']")

        watch_seconds = int(os.getenv("MIN_WATCH_SECONDS", "15"))
        print(f"[INFO] Watching video for {watch_seconds} seconds...")
        await page.wait_for_timeout(watch_seconds * 1000)
        await browser.close()


asyncio.run(run())

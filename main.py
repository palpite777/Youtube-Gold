import asyncio
import os

from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()


async def run():
    async with async_playwright() as p:
        headless = os.getenv("HEADLESS", "false").lower() in {"true", "1", "yes"}
        browser = await p.chromium.launch(headless=headless)

        proxy = os.getenv("PROXY") or None
        context = await browser.new_context(
            proxy={"server": proxy} if proxy else None,
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
            user_agent=os.getenv("USER_AGENT") or None,
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

        min_watch = int(os.getenv("MIN_WATCH_SECONDS", "15"))
        max_watch = int(os.getenv("MAX_WATCH_SECONDS", "45"))
        wait_seconds = min_watch if max_watch <= min_watch else min_watch + (abs(hash(asyncio.get_running_loop())) % (max_watch - min_watch + 1))

        print(f"[INFO] Watching video for {wait_seconds} seconds...")
        await page.wait_for_timeout(wait_seconds * 1000)
        await browser.close()


asyncio.run(run())

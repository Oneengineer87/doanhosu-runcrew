import json
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE = "http://127.0.0.1:8015/r15"
VIEWPORTS = [
    ("mobile-320", 320, 568),
    ("mobile-360", 360, 800),
    ("mobile-390", 390, 844),
    ("mobile-430", 430, 932),
    ("desktop-1440", 1440, 900),
]


def visible_small_text(page):
    return page.eval_on_selector_all(
        "body *",
        """els => els.flatMap(el => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const hasOwnText = [...el.childNodes].some(
            node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
          );
          if (!hasOwnText || style.display === 'none' || style.visibility === 'hidden' ||
              rect.width === 0 || rect.height === 0) return [];
          const size = parseFloat(style.fontSize);
          return size < 12 ? [{tag: el.tagName, text: el.textContent.trim().slice(0, 45), size}] : [];
        })""",
    )


results = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    for name, width, height in VIEWPORTS:
        context = browser.new_context(viewport={"width": width, "height": height})
        page = context.new_page()
        console_errors = []
        failed_requests = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("requestfailed", lambda req: failed_requests.append(f"{req.url}: {req.failure}"))

        response = page.goto(f"{BASE}/index.html", wait_until="networkidle")
        assert response and response.status == 200, f"{name}: page status"
        page.wait_for_function("document.fonts.status === 'loaded'")

        metrics = page.evaluate(
            """() => ({
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth: window.innerWidth,
              h1Right: document.querySelector('h1').getBoundingClientRect().right,
              h1Left: document.querySelector('h1').getBoundingClientRect().left,
              fontReady: document.fonts.check('16px "Pretendard Variable"')
            })"""
        )
        assert metrics["scrollWidth"] <= metrics["innerWidth"] + 1, f"{name}: horizontal overflow {metrics}"
        assert metrics["h1Left"] >= -1 and metrics["h1Right"] <= width + 1, f"{name}: hero title clipped"
        assert metrics["fontReady"], f"{name}: Pretendard did not load"

        small_text = visible_small_text(page)
        assert not small_text, f"{name}: text below 12px: {small_text[:5]}"
        assert not console_errors, f"{name}: console errors {console_errors}"
        assert not failed_requests, f"{name}: failed requests {failed_requests}"

        if name == "mobile-390":
            toggle = page.locator(".menu-toggle")
            toggle.click()
            assert toggle.get_attribute("aria-expanded") == "true", "menu did not open"
            assert page.locator("#site-menu").get_attribute("aria-hidden") == "false", "menu aria state"
            page.keyboard.press("Escape")
            assert toggle.get_attribute("aria-expanded") == "false", "menu did not close with Escape"

            faq = page.locator(".faq-list details").nth(1)
            faq.locator("summary").click()
            assert faq.get_attribute("open") is not None, "FAQ did not open"

            page.locator(".schedule-stage").scroll_into_view_if_needed()
            page.wait_for_timeout(450)
            assert page.locator(".schedule-stage").evaluate("el => el.classList.contains('route-active')")

        if name in {"mobile-390", "desktop-1440"}:
            page.evaluate(
                """async () => {
                  const step = Math.max(window.innerHeight * .72, 360);
                  const max = document.documentElement.scrollHeight - window.innerHeight;
                  for (let y = 0; y <= max; y += step) {
                    window.scrollTo(0, y);
                    await new Promise(resolve => setTimeout(resolve, 120));
                  }
                  window.scrollTo(0, max);
                  await new Promise(resolve => setTimeout(resolve, 250));
                  window.scrollTo(0, 0);
                  await new Promise(resolve => setTimeout(resolve, 180));
                }"""
            )
            hidden_reveals = page.locator("[data-reveal]").evaluate_all(
                """els => els.flatMap(el => {
                  const style = getComputedStyle(el);
                  return parseFloat(style.opacity) <= .005 || style.visibility === 'hidden'
                    ? [{tag: el.tagName, cls: el.className, text: el.textContent.trim().slice(0, 36), top: el.getBoundingClientRect().top}]
                    : [];
                })"""
            )
            assert not hidden_reveals, f"{name}: content became invisible after fast scroll: {hidden_reveals}"
            page.add_style_tag(content="""
              [data-reveal] {
                opacity: 1 !important;
                transform: none !important;
                animation: none !important;
              }
            """)
            page.screenshot(path=f"/tmp/r15-{name}.png", full_page=True)

        results.append({
            "viewport": name,
            "status": response.status,
            "overflow": metrics["scrollWidth"] - metrics["innerWidth"],
            "font": metrics["fontReady"],
            "smallText": len(small_text),
            "consoleErrors": len(console_errors),
            "failedRequests": len(failed_requests),
        })
        context.close()

    preview_context = browser.new_context(viewport={"width": 1440, "height": 1000})
    preview = preview_context.new_page()
    preview_errors = []
    preview.on("console", lambda msg: preview_errors.append(msg.text) if msg.type == "error" else None)
    response = preview.goto(f"{BASE}/preview.html", wait_until="networkidle")
    assert response and response.status == 200
    assert preview.locator("iframe").count() == 2
    assert preview.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
    assert not preview_errors, f"preview console errors: {preview_errors}"
    preview.screenshot(path="/tmp/r15-preview.png", full_page=True)
    preview_context.close()

    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
print("screenshots=/tmp/r15-mobile-390.png,/tmp/r15-desktop-1440.png,/tmp/r15-preview.png")

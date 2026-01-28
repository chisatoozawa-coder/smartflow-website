"""
ウェブスクレイピングモジュール
Playwrightを使用して企業のウェブサイトから情報を抽出
"""

import asyncio
import re
from typing import Optional
from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeout

import sys
sys.path.append("..")
from config import SCRAPING_TIMEOUT, SCRAPING_HEADLESS

from .list_manager import Company


class CompanyScraper:
    """企業ウェブサイトをスクレイピングするクラス"""

    # 会社概要ページを見つけるためのキーワード
    ABOUT_KEYWORDS = [
        "会社概要",
        "about",
        "企業情報",
        "会社情報",
        "私たちについて",
        "company",
        "corporate",
    ]

    # ニュースページを見つけるためのキーワード
    NEWS_KEYWORDS = [
        "ニュース",
        "news",
        "お知らせ",
        "新着情報",
        "プレスリリース",
        "topics",
        "information",
    ]

    def __init__(self):
        self.browser = None
        self.context = None

    async def __aenter__(self):
        """コンテキストマネージャーの開始"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=SCRAPING_HEADLESS)
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """コンテキストマネージャーの終了"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def scrape_company(self, company: Company) -> Company:
        """
        企業のウェブサイトから情報をスクレイピング

        取得する情報:
        - 事業内容（business_description）
        - ミッション/理念（mission）
        - 最新のニュース（recent_news）
        """
        print(f"\n[スクレイピング] {company.name}: {company.url}")

        page = await self.context.new_page()

        try:
            # メインページにアクセス
            await page.goto(company.url, timeout=SCRAPING_TIMEOUT)
            await page.wait_for_load_state("domcontentloaded")

            # トップページから基本情報を取得
            main_content = await self._extract_main_content(page)

            # 会社概要ページを探して情報を取得
            about_info = await self._find_and_scrape_about_page(page, company.url)

            # ニュースページを探して最新情報を取得
            news_info = await self._find_and_scrape_news(page, company.url)

            # 情報を統合
            company.business_description = about_info.get("description") or main_content
            company.mission = about_info.get("mission")
            company.recent_news = news_info

            print(f"  ✓ スクレイピング完了: {company.name}")

        except PlaywrightTimeout:
            print(f"  ✗ タイムアウト: {company.name}")
        except Exception as e:
            print(f"  ✗ エラー: {company.name} - {str(e)}")
        finally:
            await page.close()

        return company

    async def _extract_main_content(self, page: Page) -> str:
        """ページのメインコンテンツを抽出"""
        try:
            # メタディスクリプションを取得
            meta_desc = await page.query_selector('meta[name="description"]')
            if meta_desc:
                content = await meta_desc.get_attribute("content")
                if content:
                    return content.strip()

            # OGP descriptionを取得
            og_desc = await page.query_selector('meta[property="og:description"]')
            if og_desc:
                content = await og_desc.get_attribute("content")
                if content:
                    return content.strip()

            # メインコンテンツエリアからテキストを取得
            main_selectors = ["main", "article", "#main", "#content", ".main", ".content"]
            for selector in main_selectors:
                element = await page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    # テキストをクリーンアップして最初の500文字を返す
                    text = self._clean_text(text)
                    if len(text) > 100:
                        return text[:500]

            # bodyからテキストを取得（最後の手段）
            body = await page.query_selector("body")
            if body:
                text = await body.inner_text()
                return self._clean_text(text)[:500]

        except Exception:
            pass

        return ""

    async def _find_and_scrape_about_page(self, page: Page, base_url: str) -> dict:
        """会社概要ページを見つけてスクレイピング"""
        result = {"description": None, "mission": None}

        try:
            # 会社概要ページへのリンクを探す
            links = await page.query_selector_all("a")

            about_url = None
            for link in links:
                text = await link.inner_text()
                href = await link.get_attribute("href")

                if not href:
                    continue

                text_lower = text.lower()
                href_lower = href.lower()

                for keyword in self.ABOUT_KEYWORDS:
                    if keyword in text_lower or keyword in href_lower:
                        about_url = self._resolve_url(base_url, href)
                        break

                if about_url:
                    break

            if about_url:
                await page.goto(about_url, timeout=SCRAPING_TIMEOUT)
                await page.wait_for_load_state("domcontentloaded")

                # ページ全体のテキストを取得
                body = await page.query_selector("body")
                if body:
                    text = await body.inner_text()
                    text = self._clean_text(text)

                    # 事業内容を抽出
                    result["description"] = self._extract_section(
                        text, ["事業内容", "事業概要", "サービス", "business", "service"]
                    )

                    # ミッション/理念を抽出
                    result["mission"] = self._extract_section(
                        text, ["理念", "ミッション", "ビジョン", "mission", "vision", "philosophy"]
                    )

        except Exception:
            pass

        return result

    async def _find_and_scrape_news(self, page: Page, base_url: str) -> Optional[str]:
        """ニュースページから最新情報を取得"""
        try:
            # 現在のページでニュースセクションを探す
            news_selectors = [
                ".news",
                "#news",
                ".topics",
                "#topics",
                ".information",
                'section[class*="news"]',
            ]

            for selector in news_selectors:
                news_section = await page.query_selector(selector)
                if news_section:
                    items = await news_section.query_selector_all("li, article, .item")
                    if items and len(items) > 0:
                        # 最新の3件を取得
                        news_texts = []
                        for item in items[:3]:
                            text = await item.inner_text()
                            text = self._clean_text(text)
                            if text:
                                news_texts.append(text[:200])

                        if news_texts:
                            return " / ".join(news_texts)

            # ニュースページへのリンクを探す
            links = await page.query_selector_all("a")
            for link in links:
                text = await link.inner_text()
                href = await link.get_attribute("href")

                if not href:
                    continue

                text_lower = text.lower()
                href_lower = href.lower()

                for keyword in self.NEWS_KEYWORDS:
                    if keyword in text_lower or keyword in href_lower:
                        news_url = self._resolve_url(base_url, href)
                        await page.goto(news_url, timeout=SCRAPING_TIMEOUT)
                        await page.wait_for_load_state("domcontentloaded")

                        # 最新のニュースアイテムを取得
                        items = await page.query_selector_all(
                            "article, .news-item, .post, li"
                        )
                        news_texts = []
                        for item in items[:3]:
                            text = await item.inner_text()
                            text = self._clean_text(text)
                            if len(text) > 20:
                                news_texts.append(text[:200])

                        if news_texts:
                            return " / ".join(news_texts)

                        break

        except Exception:
            pass

        return None

    def _resolve_url(self, base_url: str, href: str) -> str:
        """相対URLを絶対URLに変換"""
        if href.startswith("http"):
            return href
        elif href.startswith("/"):
            # ドメインを取得
            from urllib.parse import urlparse

            parsed = urlparse(base_url)
            return f"{parsed.scheme}://{parsed.netloc}{href}"
        else:
            return f"{base_url.rstrip('/')}/{href}"

    def _clean_text(self, text: str) -> str:
        """テキストをクリーンアップ"""
        # 余分な空白・改行を削除
        text = re.sub(r"\s+", " ", text)
        text = text.strip()
        return text

    def _extract_section(self, text: str, keywords: list) -> Optional[str]:
        """テキストから特定のセクションを抽出"""
        text_lower = text.lower()

        for keyword in keywords:
            keyword_lower = keyword.lower()
            pos = text_lower.find(keyword_lower)

            if pos != -1:
                # キーワードの後の300文字を抽出
                start = pos
                end = min(pos + 300, len(text))
                section = text[start:end]

                # 次のセクションの開始点で切る
                section_markers = ["。\n", "■", "●", "【", "━"]
                for marker in section_markers:
                    marker_pos = section.find(marker, len(keyword))
                    if marker_pos != -1 and marker_pos > 50:
                        section = section[:marker_pos]
                        break

                return section.strip()

        return None

    async def scrape_companies(self, companies: list[Company]) -> list[Company]:
        """複数の企業を順次スクレイピング"""
        results = []
        for company in companies:
            result = await self.scrape_company(company)
            results.append(result)
            # サーバーに負荷をかけないよう少し待機
            await asyncio.sleep(2)
        return results


# スタンドアロン実行用
async def main():
    """テスト用のメイン関数"""
    from .list_manager import CompanyListManager

    manager = CompanyListManager()
    manager.add_company("テスト企業", "https://example.com")

    async with CompanyScraper() as scraper:
        await scraper.scrape_companies(manager.get_companies())

    manager.summary()


if __name__ == "__main__":
    asyncio.run(main())

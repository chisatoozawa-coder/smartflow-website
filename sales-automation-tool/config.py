"""
設定管理モジュール
環境変数から設定を読み込み、アプリケーション全体で使用
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# .env ファイルを読み込み
load_dotenv()

# プロジェクトルート
PROJECT_ROOT = Path(__file__).parent

# Claude API 設定
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-sonnet-4-20250514"  # 使用するモデル

# Gmail API 設定
GMAIL_CREDENTIALS_PATH = PROJECT_ROOT / os.getenv("GMAIL_CREDENTIALS_PATH", "credentials.json")
GMAIL_TOKEN_PATH = PROJECT_ROOT / os.getenv("GMAIL_TOKEN_PATH", "token.json")
GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]

# 送信者情報
SENDER_NAME = os.getenv("SENDER_NAME", "")
SENDER_COMPANY = os.getenv("SENDER_COMPANY", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")

# スクレイピング設定
SCRAPING_TIMEOUT = int(os.getenv("SCRAPING_TIMEOUT", "30000"))
SCRAPING_HEADLESS = os.getenv("SCRAPING_HEADLESS", "true").lower() == "true"

# メール設定
EMAIL_SUBJECT_PREFIX = os.getenv("EMAIL_SUBJECT_PREFIX", "[ご提案]")

# データディレクトリ
DATA_DIR = PROJECT_ROOT / "data"
TEMPLATES_DIR = PROJECT_ROOT / "templates"


def validate_config():
    """設定の検証"""
    errors = []

    if not ANTHROPIC_API_KEY:
        errors.append("ANTHROPIC_API_KEY が設定されていません")

    if not SENDER_NAME:
        errors.append("SENDER_NAME が設定されていません")

    if not SENDER_COMPANY:
        errors.append("SENDER_COMPANY が設定されていません")

    if not SENDER_EMAIL:
        errors.append("SENDER_EMAIL が設定されていません")

    return errors


def print_config():
    """現在の設定を表示（デバッグ用）"""
    print("=== 現在の設定 ===")
    print(f"Claude Model: {CLAUDE_MODEL}")
    print(f"Sender: {SENDER_NAME} ({SENDER_COMPANY})")
    print(f"Email: {SENDER_EMAIL}")
    print(f"Scraping Timeout: {SCRAPING_TIMEOUT}ms")
    print(f"Headless Mode: {SCRAPING_HEADLESS}")
    print("==================")

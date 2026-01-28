"""
Gmail連携モジュール
Google Gmail APIを使用して下書きを作成・保存
"""

import os
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import sys
sys.path.append("..")
from config import GMAIL_CREDENTIALS_PATH, GMAIL_TOKEN_PATH, GMAIL_SCOPES, SENDER_EMAIL

from .list_manager import Company


class GmailClient:
    """Gmail APIクライアント"""

    def __init__(self):
        self.creds = None
        self.service = None

    def authenticate(self) -> bool:
        """
        Gmail APIの認証を行う

        初回実行時はブラウザが開き、Googleアカウントでの認証が必要。
        認証情報はtoken.jsonに保存され、次回以降は自動的に使用される。
        """
        print("[Gmail] 認証を開始します...")

        # 既存のトークンを確認
        if os.path.exists(GMAIL_TOKEN_PATH):
            self.creds = Credentials.from_authorized_user_file(
                str(GMAIL_TOKEN_PATH), GMAIL_SCOPES
            )

        # 有効な認証情報がない場合
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                # トークンをリフレッシュ
                print("[Gmail] トークンをリフレッシュしています...")
                self.creds.refresh(Request())
            else:
                # 新規認証
                if not os.path.exists(GMAIL_CREDENTIALS_PATH):
                    print(f"[Gmail] エラー: {GMAIL_CREDENTIALS_PATH} が見つかりません")
                    print("[Gmail] Google Cloud ConsoleからOAuth認証情報をダウンロードしてください")
                    return False

                print("[Gmail] ブラウザで認証してください...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(GMAIL_CREDENTIALS_PATH), GMAIL_SCOPES
                )
                self.creds = flow.run_local_server(port=0)

            # トークンを保存
            with open(GMAIL_TOKEN_PATH, "w") as token:
                token.write(self.creds.to_json())
            print(f"[Gmail] トークンを {GMAIL_TOKEN_PATH} に保存しました")

        # Gmail APIサービスを構築
        self.service = build("gmail", "v1", credentials=self.creds)
        print("[Gmail] 認証完了")
        return True

    def create_draft(
        self,
        to: str,
        subject: str,
        body: str,
        sender: str = None,
    ) -> Optional[dict]:
        """
        Gmailの下書きを作成

        Args:
            to: 送信先メールアドレス
            subject: 件名
            body: 本文
            sender: 送信元メールアドレス（デフォルトは設定のSENDER_EMAIL）

        Returns:
            作成された下書きの情報（dict）またはNone
        """
        if not self.service:
            print("[Gmail] エラー: 認証されていません")
            return None

        sender = sender or SENDER_EMAIL

        # MIMEメッセージを作成
        message = MIMEMultipart()
        message["to"] = to
        message["from"] = sender
        message["subject"] = subject

        # 本文を追加（UTF-8でエンコード）
        msg_body = MIMEText(body, "plain", "utf-8")
        message.attach(msg_body)

        # Base64エンコード
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

        try:
            draft = (
                self.service.users()
                .drafts()
                .create(userId="me", body={"message": {"raw": raw_message}})
                .execute()
            )

            print(f"  ✓ 下書き作成: ID={draft['id']}")
            return draft

        except HttpError as e:
            print(f"  ✗ 下書き作成エラー: {e}")
            return None

    def create_draft_for_company(self, company: Company) -> Optional[dict]:
        """
        企業情報から下書きを作成

        Args:
            company: 企業情報（生成されたメールを含む）

        Returns:
            作成された下書きの情報またはNone
        """
        if not company.email:
            print(f"  ⚠ スキップ: {company.name} (メールアドレスなし)")
            return None

        if not company.generated_email_subject or not company.generated_email_body:
            print(f"  ⚠ スキップ: {company.name} (メール未生成)")
            return None

        print(f"[Gmail下書き] {company.name}")

        return self.create_draft(
            to=company.email,
            subject=company.generated_email_subject,
            body=company.generated_email_body,
        )

    def create_drafts_for_companies(self, companies: list[Company]) -> list[dict]:
        """
        複数の企業に対して下書きを作成

        Returns:
            作成された下書きのリスト
        """
        if not self.service:
            if not self.authenticate():
                return []

        drafts = []
        for company in companies:
            draft = self.create_draft_for_company(company)
            if draft:
                drafts.append(draft)

        print(f"\n[Gmail] {len(drafts)} 件の下書きを作成しました")
        return drafts

    def list_drafts(self, max_results: int = 10) -> list[dict]:
        """
        下書き一覧を取得

        Args:
            max_results: 取得する最大件数

        Returns:
            下書きのリスト
        """
        if not self.service:
            print("[Gmail] エラー: 認証されていません")
            return []

        try:
            results = (
                self.service.users()
                .drafts()
                .list(userId="me", maxResults=max_results)
                .execute()
            )

            drafts = results.get("drafts", [])
            print(f"[Gmail] {len(drafts)} 件の下書きがあります")
            return drafts

        except HttpError as e:
            print(f"[Gmail] エラー: {e}")
            return []

    def delete_draft(self, draft_id: str) -> bool:
        """
        下書きを削除

        Args:
            draft_id: 削除する下書きのID

        Returns:
            成功した場合True
        """
        if not self.service:
            print("[Gmail] エラー: 認証されていません")
            return False

        try:
            self.service.users().drafts().delete(userId="me", id=draft_id).execute()
            print(f"[Gmail] 下書き削除: ID={draft_id}")
            return True
        except HttpError as e:
            print(f"[Gmail] 削除エラー: {e}")
            return False

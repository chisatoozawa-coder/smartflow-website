"""
リスト管理モジュール
CSVファイルから企業リストを読み込み、管理する
"""

import pandas as pd
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class Company:
    """企業情報を保持するデータクラス"""

    name: str
    url: str
    email: Optional[str] = None
    industry: Optional[str] = None
    # スクレイピングで取得する情報
    business_description: Optional[str] = None
    mission: Optional[str] = None
    recent_news: Optional[str] = None
    # 生成されたメール
    generated_email_subject: Optional[str] = None
    generated_email_body: Optional[str] = None

    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "name": self.name,
            "url": self.url,
            "email": self.email,
            "industry": self.industry,
            "business_description": self.business_description,
            "mission": self.mission,
            "recent_news": self.recent_news,
            "generated_email_subject": self.generated_email_subject,
            "generated_email_body": self.generated_email_body,
        }


class CompanyListManager:
    """企業リストを管理するクラス"""

    def __init__(self):
        self.companies: list[Company] = []

    def load_from_csv(self, csv_path: str | Path) -> list[Company]:
        """
        CSVファイルから企業リストを読み込む

        CSVファイルの必須カラム:
        - name: 企業名
        - url: 企業のウェブサイトURL

        オプションカラム:
        - email: 連絡先メールアドレス
        - industry: 業種
        """
        csv_path = Path(csv_path)

        if not csv_path.exists():
            raise FileNotFoundError(f"CSVファイルが見つかりません: {csv_path}")

        df = pd.read_csv(csv_path)

        # 必須カラムの確認
        required_columns = ["name", "url"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"必須カラムがありません: {missing_columns}")

        self.companies = []
        for _, row in df.iterrows():
            company = Company(
                name=row["name"],
                url=row["url"],
                email=row.get("email"),
                industry=row.get("industry"),
            )
            self.companies.append(company)

        print(f"{len(self.companies)} 社の企業データを読み込みました")
        return self.companies

    def add_company(self, name: str, url: str, email: str = None, industry: str = None):
        """企業を手動で追加"""
        company = Company(name=name, url=url, email=email, industry=industry)
        self.companies.append(company)
        return company

    def get_companies(self) -> list[Company]:
        """現在の企業リストを取得"""
        return self.companies

    def get_company_by_name(self, name: str) -> Optional[Company]:
        """企業名で検索"""
        for company in self.companies:
            if company.name == name:
                return company
        return None

    def export_to_csv(self, output_path: str | Path):
        """結果をCSVファイルにエクスポート"""
        output_path = Path(output_path)

        data = [company.to_dict() for company in self.companies]
        df = pd.DataFrame(data)
        df.to_csv(output_path, index=False, encoding="utf-8-sig")

        print(f"結果を {output_path} にエクスポートしました")

    def summary(self):
        """企業リストのサマリーを表示"""
        print(f"\n=== 企業リストサマリー ===")
        print(f"総企業数: {len(self.companies)}")

        scraped = sum(1 for c in self.companies if c.business_description)
        print(f"スクレイピング完了: {scraped}")

        email_generated = sum(1 for c in self.companies if c.generated_email_body)
        print(f"メール生成完了: {email_generated}")
        print("=" * 26)

#!/usr/bin/env python3
"""
中小企業向け営業自動化ツール - メインスクリプト

使い方:
    python main.py --csv data/companies.csv

処理の流れ:
    1. CSVから企業リストを読み込み
    2. 各企業のウェブサイトをスクレイピングして情報を収集
    3. 収集した情報を元にパーソナライズされたメールを生成
    4. 生成したメールをGmailの下書きに保存
"""

import argparse
import asyncio
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent))

from config import validate_config, print_config, DATA_DIR
from src.list_manager import CompanyListManager
from src.scraper import CompanyScraper
from src.email_generator import EmailGenerator
from src.gmail_client import GmailClient


async def run_pipeline(
    csv_path: str,
    service_description: str,
    value_proposition: str,
    skip_scraping: bool = False,
    skip_email_generation: bool = False,
    skip_gmail: bool = False,
    output_csv: str = None,
):
    """
    営業自動化パイプラインを実行

    Args:
        csv_path: 企業リストのCSVファイルパス
        service_description: 自社サービスの説明
        value_proposition: 提供価値の説明
        skip_scraping: スクレイピングをスキップ
        skip_email_generation: メール生成をスキップ
        skip_gmail: Gmail下書き保存をスキップ
        output_csv: 結果を出力するCSVパス
    """
    print("=" * 50)
    print("営業自動化ツール")
    print("=" * 50)

    # 設定の検証
    errors = validate_config()
    if errors and not skip_email_generation:
        print("\n[エラー] 設定に問題があります:")
        for error in errors:
            print(f"  - {error}")
        print("\n.env ファイルを確認してください")
        return

    print_config()

    # 1. 企業リストの読み込み
    print("\n" + "=" * 50)
    print("ステップ 1: 企業リストの読み込み")
    print("=" * 50)

    manager = CompanyListManager()
    try:
        companies = manager.load_from_csv(csv_path)
    except FileNotFoundError as e:
        print(f"[エラー] {e}")
        return
    except ValueError as e:
        print(f"[エラー] {e}")
        return

    if not companies:
        print("[エラー] 企業リストが空です")
        return

    # 2. ウェブスクレイピング
    if not skip_scraping:
        print("\n" + "=" * 50)
        print("ステップ 2: ウェブスクレイピング")
        print("=" * 50)

        async with CompanyScraper() as scraper:
            companies = await scraper.scrape_companies(companies)
    else:
        print("\n[スキップ] ウェブスクレイピング")

    # 3. メール生成
    if not skip_email_generation:
        print("\n" + "=" * 50)
        print("ステップ 3: メール生成")
        print("=" * 50)

        generator = EmailGenerator(
            service_description=service_description,
            value_proposition=value_proposition,
        )
        companies = generator.generate_emails_for_companies(companies)
    else:
        print("\n[スキップ] メール生成")

    # 4. Gmail下書き保存
    if not skip_gmail:
        print("\n" + "=" * 50)
        print("ステップ 4: Gmail下書き保存")
        print("=" * 50)

        gmail = GmailClient()
        if gmail.authenticate():
            gmail.create_drafts_for_companies(companies)
        else:
            print("[警告] Gmail認証に失敗しました。下書きは作成されていません。")
    else:
        print("\n[スキップ] Gmail下書き保存")

    # 5. 結果のエクスポート
    if output_csv:
        print("\n" + "=" * 50)
        print("ステップ 5: 結果のエクスポート")
        print("=" * 50)
        manager.export_to_csv(output_csv)

    # サマリー表示
    manager.summary()

    print("\n" + "=" * 50)
    print("処理完了")
    print("=" * 50)


def main():
    """コマンドライン引数を処理してパイプラインを実行"""
    parser = argparse.ArgumentParser(
        description="中小企業向け営業自動化ツール",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # 基本的な使い方
  python main.py --csv data/companies.csv

  # サービス説明をカスタマイズ
  python main.py --csv data/companies.csv \\
    --service "クラウド型会計ソフト" \\
    --value "経理作業を80%削減"

  # スクレイピングのみ実行（テスト用）
  python main.py --csv data/companies.csv --skip-email --skip-gmail

  # 結果をCSVに出力
  python main.py --csv data/companies.csv --output results.csv
        """,
    )

    parser.add_argument(
        "--csv",
        required=True,
        help="企業リストのCSVファイルパス",
    )

    parser.add_argument(
        "--service",
        default="業務効率化ソリューション",
        help="自社サービスの説明（デフォルト: 業務効率化ソリューション）",
    )

    parser.add_argument(
        "--value",
        default="御社の業務効率を大幅に改善",
        help="提供価値の説明（デフォルト: 御社の業務効率を大幅に改善）",
    )

    parser.add_argument(
        "--skip-scraping",
        action="store_true",
        help="ウェブスクレイピングをスキップ",
    )

    parser.add_argument(
        "--skip-email",
        action="store_true",
        help="メール生成をスキップ",
    )

    parser.add_argument(
        "--skip-gmail",
        action="store_true",
        help="Gmail下書き保存をスキップ",
    )

    parser.add_argument(
        "--output",
        help="結果を出力するCSVファイルパス",
    )

    args = parser.parse_args()

    # 非同期処理を実行
    asyncio.run(
        run_pipeline(
            csv_path=args.csv,
            service_description=args.service,
            value_proposition=args.value,
            skip_scraping=args.skip_scraping,
            skip_email_generation=args.skip_email,
            skip_gmail=args.skip_gmail,
            output_csv=args.output,
        )
    )


if __name__ == "__main__":
    main()

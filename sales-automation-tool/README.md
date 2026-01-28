# 中小企業向け営業自動化ツール

CSVファイルから企業リストを読み込み、ウェブサイトから情報を収集し、パーソナライズされた営業メールを自動生成してGmailの下書きに保存するツールです。

## 機能

- **リスト管理**: CSVファイルから企業情報（名前、URL、メールアドレス）を読み込み
- **企業調査**: Playwrightを使用してウェブサイトから事業内容・理念・ニュースを自動収集
- **メール生成**: Claude APIを使用して、各企業に特化したパーソナライズされた営業メールを生成
- **Gmail連携**: 生成したメールをGmailの下書きに自動保存

## ディレクトリ構造

```
sales-automation-tool/
├── src/
│   ├── __init__.py
│   ├── list_manager.py      # CSV読み込み・リスト管理
│   ├── scraper.py           # Playwrightでのスクレイピング
│   ├── email_generator.py   # Claude APIでメール生成
│   └── gmail_client.py      # Gmail API連携
├── data/
│   └── sample_companies.csv # サンプルCSV
├── templates/               # メールテンプレート（オプション）
├── .env.example             # 環境変数のサンプル
├── config.py                # 設定ファイル
├── main.py                  # メインスクリプト
├── requirements.txt         # 依存ライブラリ
└── README.md                # このファイル
```

## セットアップ

### 1. 依存ライブラリのインストール

```bash
cd sales-automation-tool
pip install -r requirements.txt

# Playwrightのブラウザをインストール
playwright install chromium
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して、必要な値を設定してください。

### 3. Claude API キーの取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. API Keys から新しいキーを作成
3. `.env` ファイルの `ANTHROPIC_API_KEY` に設定

### 4. Gmail API の設定

#### 4.1 Google Cloud プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成

#### 4.2 Gmail API の有効化

1. 「APIとサービス」→「ライブラリ」を選択
2. 「Gmail API」を検索して有効化

#### 4.3 OAuth 同意画面の設定

1. 「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプ「外部」を選択
3. アプリ名、ユーザーサポートメール、デベロッパー連絡先を入力
4. スコープの追加で `https://www.googleapis.com/auth/gmail.compose` を追加
5. テストユーザーに自分のGmailアドレスを追加

#### 4.4 認証情報の作成

1. 「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「OAuthクライアントID」を選択
3. アプリケーションの種類「デスクトップアプリ」を選択
4. JSONファイルをダウンロード
5. ファイル名を `credentials.json` に変更して、プロジェクトルートに配置

### 5. 企業リストCSVの準備

以下の形式でCSVファイルを作成してください：

```csv
name,url,email,industry
サンプル株式会社,https://example.com,contact@example.com,IT・ソフトウェア
テスト商事,https://example.org,info@example.org,商社
```

**必須カラム:**
- `name`: 企業名
- `url`: 企業のウェブサイトURL

**オプションカラム:**
- `email`: 連絡先メールアドレス（Gmail下書き作成に必要）
- `industry`: 業種

## 使い方

### 基本的な使い方

```bash
python main.py --csv data/companies.csv
```

### オプション

```bash
# サービス説明と提供価値をカスタマイズ
python main.py --csv data/companies.csv \
  --service "クラウド型会計ソフト" \
  --value "経理作業を80%削減"

# スクレイピングのみ実行（テスト用）
python main.py --csv data/companies.csv --skip-email --skip-gmail

# メール生成まで実行（Gmail連携なし）
python main.py --csv data/companies.csv --skip-gmail

# 結果をCSVに出力
python main.py --csv data/companies.csv --output results.csv
```

### コマンドラインオプション

| オプション | 説明 |
|-----------|------|
| `--csv` | 企業リストのCSVファイルパス（必須） |
| `--service` | 自社サービスの説明 |
| `--value` | 提供価値の説明 |
| `--skip-scraping` | ウェブスクレイピングをスキップ |
| `--skip-email` | メール生成をスキップ |
| `--skip-gmail` | Gmail下書き保存をスキップ |
| `--output` | 結果を出力するCSVファイルパス |

## 注意事項

### スクレイピングについて

- 対象サイトの利用規約と `robots.txt` を必ず確認してください
- 過度なリクエストを避けるため、リクエスト間に2秒の待機時間を設けています
- 企業サイトの構造は多様なため、情報が正確に取得できない場合があります

### メール送信について

- このツールはGmailの**下書き**に保存するのみで、自動送信は行いません
- 送信前に必ず内容を確認してください
- [特定電子メール法](https://www.soumu.go.jp/main_sosiki/joho_tsusin/d_syohi/m_mail.html)を遵守してください
  - 送信者情報の明記
  - 配信停止方法の案内
  - 受信者の同意なく広告メールを送信しない

### APIの利用料金

- **Claude API**: 使用量に応じた課金（[料金表](https://www.anthropic.com/pricing)）
- **Gmail API**: 無料（日次クォータあり）

## トラブルシューティング

### 「ANTHROPIC_API_KEY が設定されていません」

`.env` ファイルに `ANTHROPIC_API_KEY` が正しく設定されているか確認してください。

### 「credentials.json が見つかりません」

Google Cloud ConsoleからOAuth認証情報をダウンロードし、プロジェクトルートに `credentials.json` として配置してください。

### スクレイピングがタイムアウトする

`.env` の `SCRAPING_TIMEOUT` の値を増やしてください（ミリ秒単位）。

### メールの内容が期待通りでない

`--service` と `--value` オプションでより具体的な説明を指定してください。

## ライセンス

MIT License

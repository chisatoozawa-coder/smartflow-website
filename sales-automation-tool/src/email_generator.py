"""
メール生成モジュール
Claude APIを使用してパーソナライズされた営業メールを生成
"""

import anthropic
from typing import Optional

import sys
sys.path.append("..")
from config import (
    ANTHROPIC_API_KEY,
    CLAUDE_MODEL,
    SENDER_NAME,
    SENDER_COMPANY,
    EMAIL_SUBJECT_PREFIX,
)

from .list_manager import Company


class EmailGenerator:
    """Claude APIを使ってパーソナライズされたメールを生成するクラス"""

    def __init__(self, service_description: str = None, value_proposition: str = None):
        """
        Args:
            service_description: 自社のサービス説明
            value_proposition: 提供できる価値の説明
        """
        if not ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY が設定されていません")

        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.service_description = service_description or "業務効率化ソリューション"
        self.value_proposition = value_proposition or "御社の業務効率を大幅に改善"

    def generate_email(self, company: Company) -> tuple[str, str]:
        """
        企業情報に基づいてパーソナライズされたメールを生成

        Returns:
            tuple: (件名, 本文)
        """
        print(f"[メール生成] {company.name}")

        # プロンプトを構築
        prompt = self._build_prompt(company)

        try:
            response = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            # レスポンスをパース
            content = response.content[0].text
            subject, body = self._parse_response(content, company)

            company.generated_email_subject = subject
            company.generated_email_body = body

            print(f"  ✓ メール生成完了: {company.name}")
            return subject, body

        except Exception as e:
            print(f"  ✗ エラー: {company.name} - {str(e)}")
            raise

    def _build_prompt(self, company: Company) -> str:
        """メール生成用のプロンプトを構築"""
        company_info = f"""
【ターゲット企業情報】
- 企業名: {company.name}
- URL: {company.url}
- 業種: {company.industry or '不明'}
"""

        if company.business_description:
            company_info += f"- 事業内容: {company.business_description}\n"

        if company.mission:
            company_info += f"- 企業理念/ミッション: {company.mission}\n"

        if company.recent_news:
            company_info += f"- 最新のニュース: {company.recent_news}\n"

        prompt = f"""あなたは優秀な営業担当者です。以下の企業に対して、パーソナライズされた営業メールを作成してください。

{company_info}

【送信者情報】
- 送信者名: {SENDER_NAME}
- 会社名: {SENDER_COMPANY}
- 提供サービス: {self.service_description}
- 提供価値: {self.value_proposition}

【メール作成のガイドライン】
1. 件名は相手のメリットが伝わり、思わずクリックしたくなるものにする
2. いかにもAIが書いたような定型文ではなく、誠実で人間味のあるトーンにする
3. 相手企業の情報（事業内容、理念、ニュースなど）を自然に盛り込み、リサーチしていることを示す
4. 具体的なメリットや数字があれば入れる
5. 押し売りにならず、まずは情報提供やご相談という姿勢
6. 300文字程度の簡潔なメールにする
7. 特定電子メール法に準拠し、配信停止方法の案内を含める

【出力形式】
以下の形式で出力してください（タグは含めないこと）:

件名: [ここに件名]

本文:
[ここに本文]
"""
        return prompt

    def _parse_response(self, response: str, company: Company) -> tuple[str, str]:
        """Claude APIのレスポンスから件名と本文を抽出"""
        lines = response.strip().split("\n")

        subject = ""
        body_lines = []
        in_body = False

        for line in lines:
            if line.startswith("件名:") or line.startswith("件名："):
                subject = line.replace("件名:", "").replace("件名：", "").strip()
            elif line.startswith("本文:") or line.startswith("本文："):
                in_body = True
            elif in_body:
                body_lines.append(line)

        body = "\n".join(body_lines).strip()

        # 件名にプレフィックスを追加
        if EMAIL_SUBJECT_PREFIX and not subject.startswith(EMAIL_SUBJECT_PREFIX):
            subject = f"{EMAIL_SUBJECT_PREFIX} {subject}"

        # フォールバック
        if not subject:
            subject = f"{EMAIL_SUBJECT_PREFIX} {company.name}様へのご提案"
        if not body:
            body = response

        return subject, body

    def generate_emails_for_companies(self, companies: list[Company]) -> list[Company]:
        """複数の企業に対してメールを生成"""
        results = []
        for company in companies:
            # スクレイピング情報がある企業のみ処理
            if company.business_description or company.url:
                self.generate_email(company)
            else:
                print(f"  ⚠ スキップ: {company.name} (情報なし)")
            results.append(company)
        return results


# テンプレートを使用したシンプルなメール生成（API不使用）
class SimpleEmailGenerator:
    """テンプレートベースのシンプルなメール生成クラス（API不使用）"""

    def __init__(self, template_path: str = None):
        self.template = self._default_template()
        if template_path:
            self._load_template(template_path)

    def _default_template(self) -> str:
        return """
{company_name}
ご担当者様

突然のご連絡失礼いたします。
{sender_company}の{sender_name}と申します。

貴社のウェブサイトを拝見し、{business_hint}に取り組まれていることを知り、
ぜひ一度お話をさせていただきたくご連絡いたしました。

弊社では{service_description}を提供しており、
{value_proposition}のお手伝いができればと考えております。

もしよろしければ、15分程度のオンラインミーティングで
貴社の課題やお取り組みについてお聞かせいただけないでしょうか。

ご多忙のところ恐縮ですが、ご検討いただけますと幸いです。

━━━━━━━━━━━━━━━━━━━━━━━
{sender_name}
{sender_company}
Email: {sender_email}

※このメールは配信専用です。
配信停止をご希望の場合は、このメールにその旨ご返信ください。
━━━━━━━━━━━━━━━━━━━━━━━
"""

    def _load_template(self, path: str):
        with open(path, "r", encoding="utf-8") as f:
            self.template = f.read()

    def generate_email(
        self,
        company: Company,
        service_description: str,
        value_proposition: str,
    ) -> tuple[str, str]:
        """テンプレートベースでメールを生成"""
        business_hint = company.business_description[:50] if company.business_description else "事業"

        body = self.template.format(
            company_name=company.name,
            sender_company=SENDER_COMPANY,
            sender_name=SENDER_NAME,
            sender_email=company.email or "",
            business_hint=business_hint,
            service_description=service_description,
            value_proposition=value_proposition,
        )

        subject = f"{EMAIL_SUBJECT_PREFIX} {company.name}様へのご提案"

        company.generated_email_subject = subject
        company.generated_email_body = body

        return subject, body

"""
Email HTML Template Formatter

Converts plain text email bodies to professionally styled HTML emails
with proper formatting, signatures, and unsubscribe links.
"""

from typing import Optional
import html


class EmailTemplate:
    """Generate HTML email templates from plain text content"""

    @staticmethod
    def format_email(
        body: str,
        signature: Optional[str] = None,
        recipient_email: Optional[str] = None,
        unsubscribe_url: Optional[str] = None
    ) -> str:
        """
        Format plain text email body into HTML template

        Args:
            body: Plain text email body
            signature: Optional email signature
            recipient_email: Recipient email for unsubscribe link
            unsubscribe_url: Custom unsubscribe URL

        Returns:
            Formatted HTML email
        """
        # Escape HTML in body and preserve line breaks
        escaped_body = html.escape(body)
        formatted_body = escaped_body.replace("\n", "<br>")

        # Build signature HTML
        signature_html = ""
        if signature:
            escaped_signature = html.escape(signature)
            formatted_signature = escaped_signature.replace("\n", "<br>")
            signature_html = f"""
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
                {formatted_signature}
            </div>
            """

        # Build unsubscribe link
        unsubscribe_html = ""
        if unsubscribe_url:
            unsubscribe_html = f"""
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
                <p>
                    Don't want to receive these emails?
                    <a href="{unsubscribe_url}" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a>
                </p>
            </div>
            """

        # Combine everything into HTML template
        html_template = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
                    <tr>
                        <td style="padding: 40px;">
                            <div style="font-size: 15px; line-height: 24px; color: #374151;">
                                {formatted_body}
                            </div>
                            {signature_html}
                        </td>
                    </tr>
                </table>
                {unsubscribe_html}
            </td>
        </tr>
    </table>
</body>
</html>
        """

        return html_template.strip()

    @staticmethod
    def format_simple(body: str) -> str:
        """
        Format body with minimal HTML (no signature or unsubscribe)

        Args:
            body: Plain text email body

        Returns:
            Simple HTML formatted email
        """
        return EmailTemplate.format_email(body=body)

    @staticmethod
    def create_test_email(to_email: str, from_name: str) -> str:
        """
        Create a test email body

        Args:
            to_email: Recipient email
            from_name: Sender name

        Returns:
            HTML test email
        """
        body = f"""
Hi there!

This is a test email from {from_name} to verify your email connection is working correctly.

If you're receiving this, your email integration is set up properly and ready to send follow-up emails.

Best regards,
Project Loom
        """.strip()

        return EmailTemplate.format_email(
            body=body,
            signature=f"Sent via Project Loom\nEmail Marketing Automation"
        )

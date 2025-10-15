"""
Email Service Abstraction Layer

Provides a unified interface for sending emails through different providers
(Resend, Gmail OAuth) with automatic provider selection based on connection type.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


class EmailSendResult:
    """Result of an email send operation"""

    def __init__(
        self,
        success: bool,
        message_id: Optional[str] = None,
        error: Optional[str] = None,
        provider: Optional[str] = None
    ):
        self.success = success
        self.message_id = message_id
        self.error = error
        self.provider = provider
        self.sent_at = datetime.utcnow() if success else None


class EmailProvider(ABC):
    """Abstract base class for email providers"""

    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        from_email: str,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        **kwargs
    ) -> EmailSendResult:
        """Send an email through the provider"""
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """Validate that the provider connection is working"""
        pass


class ResendProvider(EmailProvider):
    """Resend email provider implementation"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    def _get_client(self):
        """Lazy load Resend client"""
        if self._client is None:
            try:
                import resend
                resend.api_key = self.api_key
                self._client = resend
            except ImportError:
                raise ImportError("resend package is not installed. Install with: pip install resend")
        return self._client

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        from_email: str,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        **kwargs
    ) -> EmailSendResult:
        """Send email via Resend API"""
        try:
            client = self._get_client()

            # Format from address
            from_address = f"{from_name} <{from_email}>" if from_name else from_email

            params = {
                "from": from_address,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            }

            if reply_to:
                params["reply_to"] = reply_to

            # Send email
            response = client.Emails.send(params)

            logger.info(f"Email sent via Resend to {to_email}, message_id: {response.get('id')}")

            return EmailSendResult(
                success=True,
                message_id=response.get("id"),
                provider="resend"
            )

        except Exception as e:
            logger.error(f"Resend send failed: {str(e)}")
            return EmailSendResult(
                success=False,
                error=str(e),
                provider="resend"
            )

    def validate_connection(self) -> bool:
        """Validate Resend API key"""
        try:
            client = self._get_client()
            # Try to access the API to validate key
            # Resend doesn't have a dedicated validation endpoint,
            # so we just check if the client initializes
            return True
        except Exception as e:
            logger.error(f"Resend validation failed: {str(e)}")
            return False


class GmailProvider(EmailProvider):
    """Gmail API provider implementation with OAuth"""

    def __init__(
        self,
        access_token: str,
        refresh_token: str,
        client_id: str,
        client_secret: str,
        token_expiry: Optional[datetime] = None
    ):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_expiry = token_expiry
        self._service = None

    def _refresh_access_token(self) -> bool:
        """Refresh the access token using refresh token"""
        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request

            credentials = Credentials(
                token=self.access_token,
                refresh_token=self.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret
            )

            credentials.refresh(Request())

            self.access_token = credentials.token
            self.token_expiry = credentials.expiry

            logger.info("Gmail access token refreshed successfully")
            return True

        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            return False

    def _get_service(self):
        """Get or create Gmail API service"""
        if self._service is None:
            try:
                from googleapiclient.discovery import build
                from google.oauth2.credentials import Credentials

                # Check if token needs refresh
                if self.token_expiry and datetime.utcnow() >= self.token_expiry:
                    self._refresh_access_token()

                credentials = Credentials(
                    token=self.access_token,
                    refresh_token=self.refresh_token,
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=self.client_id,
                    client_secret=self.client_secret
                )

                self._service = build("gmail", "v1", credentials=credentials)

            except ImportError:
                raise ImportError(
                    "Google API packages not installed. Install with: "
                    "pip install google-auth-oauthlib google-api-python-client"
                )

        return self._service

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        from_email: str,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        **kwargs
    ) -> EmailSendResult:
        """Send email via Gmail API"""
        try:
            import base64
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            service = self._get_service()

            # Create message
            message = MIMEMultipart("alternative")
            message["To"] = to_email
            message["Subject"] = subject

            if from_name:
                message["From"] = f"{from_name} <{from_email}>"
            else:
                message["From"] = from_email

            if reply_to:
                message["Reply-To"] = reply_to

            # Add HTML body
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)

            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

            # Send message
            result = service.users().messages().send(
                userId="me",
                body={"raw": raw_message}
            ).execute()

            logger.info(f"Email sent via Gmail to {to_email}, message_id: {result.get('id')}")

            return EmailSendResult(
                success=True,
                message_id=result.get("id"),
                provider="gmail"
            )

        except Exception as e:
            logger.error(f"Gmail send failed: {str(e)}")
            return EmailSendResult(
                success=False,
                error=str(e),
                provider="gmail"
            )

    def validate_connection(self) -> bool:
        """Validate Gmail connection"""
        try:
            service = self._get_service()
            # Try to get user profile to validate connection
            service.users().getProfile(userId="me").execute()
            return True
        except Exception as e:
            logger.error(f"Gmail validation failed: {str(e)}")
            return False


class EmailService:
    """
    Main email service that routes to the appropriate provider
    based on connection type
    """

    @staticmethod
    def create_provider(connection) -> EmailProvider:
        """
        Create appropriate email provider based on connection type

        Args:
            connection: Connection model instance with provider and credentials

        Returns:
            EmailProvider instance
        """
        provider_type = connection.provider.lower()

        if provider_type == "resend":
            # Parse credentials JSON
            creds = json.loads(connection.credentials) if isinstance(connection.credentials, str) else connection.credentials
            api_key = creds.get("api_key")

            if not api_key:
                raise ValueError("Resend API key not found in connection credentials")

            return ResendProvider(api_key=api_key)

        elif provider_type == "gmail":
            # Parse credentials JSON
            creds = json.loads(connection.credentials) if isinstance(connection.credentials, str) else connection.credentials

            access_token = creds.get("access_token")
            refresh_token = creds.get("refresh_token")
            client_id = creds.get("client_id")
            client_secret = creds.get("client_secret")

            if not all([access_token, refresh_token, client_id, client_secret]):
                raise ValueError("Gmail OAuth credentials incomplete")

            # Parse token expiry if present
            token_expiry = None
            if creds.get("token_expiry"):
                token_expiry = datetime.fromisoformat(creds["token_expiry"])

            return GmailProvider(
                access_token=access_token,
                refresh_token=refresh_token,
                client_id=client_id,
                client_secret=client_secret,
                token_expiry=token_expiry
            )

        else:
            raise ValueError(f"Unsupported email provider: {provider_type}")

    @staticmethod
    def send_email(
        connection,
        to_email: str,
        subject: str,
        html_body: str,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> EmailSendResult:
        """
        Send email using the appropriate provider

        Args:
            connection: Connection model instance
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            from_name: Optional sender name
            reply_to: Optional reply-to address

        Returns:
            EmailSendResult with success status and details
        """
        try:
            provider = EmailService.create_provider(connection)

            # Use connection email as from_email
            from_email = connection.email

            result = provider.send_email(
                to_email=to_email,
                subject=subject,
                html_body=html_body,
                from_email=from_email,
                from_name=from_name,
                reply_to=reply_to
            )

            return result

        except Exception as e:
            logger.error(f"Email service error: {str(e)}")
            return EmailSendResult(
                success=False,
                error=str(e)
            )

    @staticmethod
    def validate_connection(connection) -> bool:
        """Validate an email connection"""
        try:
            provider = EmailService.create_provider(connection)
            return provider.validate_connection()
        except Exception as e:
            logger.error(f"Connection validation error: {str(e)}")
            return False

# Email Sending Integration

This document explains how email sending works in Project Loom, including setup, usage, and architecture.

## Overview

Project Loom supports two email providers:
- **Resend** - Simple API-based sending with API keys
- **Gmail** - OAuth-based sending through Gmail API

## Architecture

### Components

1. **Email Service Layer** (`app/services/email_service.py`)
   - Abstract `EmailProvider` base class
   - `ResendProvider` - Sends via Resend API
   - `GmailProvider` - Sends via Gmail API with OAuth
   - `EmailService` - Routes to correct provider based on connection

2. **Email Templates** (`app/services/email_template.py`)
   - Converts plain text to professional HTML emails
   - Adds signatures and unsubscribe links
   - Responsive email design with inline CSS

3. **Follow-Up Sender** (`app/services/followup_sender.py`)
   - Sends scheduled follow-up emails
   - Retry logic with exponential backoff (1min, 5min, 15min)
   - Error handling and status tracking

4. **Background Worker** (`worker.py`)
   - Processes pending follow-ups every 5 minutes
   - Can run continuously or once (cron mode)
   - Detailed logging to `worker.log`

## Setup

### 1. Install Dependencies

```bash
cd apps/api
pip install -r requirements.txt
```

Required packages:
- `resend` - Resend API client
- `google-api-python-client` - Gmail API
- `google-auth-oauthlib` - OAuth for Gmail

### 2. Update Database Schema

The `connections` table supports email provider credentials:

```python
# For Resend
credentials = {
    "api_key": "re_..."
}

# For Gmail OAuth
credentials = {
    "access_token": "ya29...",
    "refresh_token": "1//...",
    "client_id": "xxx.apps.googleusercontent.com",
    "client_secret": "xxx",
    "token_expiry": "2025-01-15T10:00:00"  # ISO format
}
```

Run database migration:
```bash
python init_db.py
```

### 3. Add Email Connection

#### Option A: Resend

1. Get API key from [resend.com/api-keys](https://resend.com/api-keys)
2. Add connection via API or frontend:

```bash
POST /v1/connections
{
  "provider": "resend",
  "provider_email": "noreply@yourdomain.com",
  "credentials": {
    "api_key": "re_xxxxxxxxxxxxx"
  }
}
```

#### Option B: Gmail OAuth

1. Create OAuth credentials in Google Cloud Console
2. Implement OAuth flow (frontend integration)
3. Store tokens in connection credentials

### 4. Start the Background Worker

```bash
cd apps/api
python worker.py
```

Options:
- `--once` - Run once and exit (useful for cron)
- `--interval 300` - Check interval in seconds (default: 300 = 5 minutes)

Example with custom interval:
```bash
python worker.py --interval 60  # Check every minute
```

## API Endpoints

### Send Test Email

```bash
POST /v1/test/send-email
{
  "connection_id": 1,
  "to_email": "test@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Test email sent successfully to test@example.com",
  "provider": "resend"
}
```

### Send Follow-Up Immediately

```bash
POST /v1/followups/{job_id}/send-now
```

Immediately sends a scheduled follow-up (bypasses scheduled_at).

### Retry Failed Follow-Up

```bash
POST /v1/followups/{job_id}/retry
```

Retries a failed follow-up job.

## Email Templates

### Plain Text to HTML

```python
from app.services.email_template import EmailTemplate

html = EmailTemplate.format_email(
    body="Hello!\n\nThis is a follow-up email.",
    signature="Best regards,\nJohn Doe",
    unsubscribe_url="https://example.com/unsubscribe"
)
```

Generates responsive HTML with:
- Professional styling
- Proper line break handling
- Email signature section
- Unsubscribe footer

## Worker Behavior

### Retry Logic

Failed sends are automatically retried with exponential backoff:

1. **1st failure** - Retry in 1 minute
2. **2nd failure** - Retry in 5 minutes
3. **3rd failure** - Retry in 15 minutes
4. **4th failure** - Mark as failed permanently

### Processing Flow

```
1. Worker wakes up (every 5 minutes)
2. Query for followup_jobs WHERE status='pending' AND scheduled_at <= NOW()
3. For each job:
   - Get user's active email connection
   - Format email HTML
   - Send via EmailService
   - Update status to 'sent' with sent_at timestamp
   - OR schedule retry if failed
4. Sleep until next interval
```

### Logs

Worker logs to both console and `worker.log`:

```
2025-01-14 10:00:00 - INFO - Worker iteration #1 - 2025-01-14T10:00:00
2025-01-14 10:00:01 - INFO - Found 3 pending follow-ups to process
2025-01-14 10:00:02 - INFO - Processing follow-up 42: to=user@example.com
2025-01-14 10:00:03 - INFO - Email sent via Resend, message_id: abc123
2025-01-14 10:00:03 - INFO - ✓ Successfully sent follow-up 42
```

## Error Handling

### Provider Errors

- **Invalid API key** - Connection marked as error, user notified
- **Network timeout** - Automatic retry with backoff
- **Rate limits** - Respects provider limits, retries later

### OAuth Token Refresh

Gmail tokens automatically refresh when expired:

```python
# GmailProvider checks token_expiry before each send
if token_expiry and datetime.utcnow() >= token_expiry:
    _refresh_access_token()  # Gets new access token
```

Updated tokens should be saved back to connection credentials.

## Development vs Production

### Development

```bash
# Terminal 1: API Server
uvicorn main:app --reload --port 8000

# Terminal 2: Worker (frequent checks for testing)
python worker.py --interval 10  # Check every 10 seconds
```

### Production

Use a process manager like systemd or supervisord:

```ini
# /etc/supervisor/conf.d/loom-worker.conf
[program:loom-worker]
command=/path/to/venv/bin/python /path/to/worker.py
directory=/path/to/apps/api
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/loom-worker.log
```

Or use cron for simpler deployments:

```cron
*/5 * * * * cd /path/to/apps/api && /path/to/venv/bin/python worker.py --once >> /var/log/loom-worker.log 2>&1
```

## Security Considerations

1. **Credentials Encryption** - Store connection credentials encrypted in production
2. **API Keys** - Never log API keys or tokens
3. **OAuth Tokens** - Refresh tokens are sensitive, protect them
4. **Unsubscribe Links** - Include in all marketing emails (legal requirement)

## Monitoring

Monitor these metrics:

- Follow-ups sent per hour
- Send success rate
- Average retry count
- Failed sends (investigate if > 5%)
- Worker processing time

Logging includes:
- Success/failure counts per iteration
- Individual send results
- Error messages with stack traces

## Troubleshooting

### Worker not sending emails

1. Check worker is running: `ps aux | grep worker.py`
2. Check logs: `tail -f worker.log`
3. Verify connection is active in database
4. Test connection manually via API

### Emails not being received

1. Check spam folder
2. Verify DNS records (SPF, DKIM for Resend)
3. Test with `/test/send-email` endpoint
4. Check provider dashboard for delivery status

### OAuth tokens expired

1. Gmail tokens expire after 1 week (if not refreshed)
2. Implement token refresh in connection management
3. User must re-authenticate if refresh token invalid

## Future Enhancements

- [ ] SendGrid provider support
- [ ] Email open/click tracking
- [ ] Reply detection and auto-stop
- [ ] A/B testing for subject lines
- [ ] Send time optimization
- [ ] Bounce handling
- [ ] Email warmup schedules

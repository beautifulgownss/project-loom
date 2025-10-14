# Project Loom - FastAPI Backend

FastAPI backend for Project Loom's AI-powered email follow-up automation.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Queue**: Redis + Celery
- **AI**: OpenAI API
- **Email**: Resend API, Gmail API

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL (or Supabase)
- Redis (for job queue)

### Installation

1. Create and activate virtual environment:

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Run database migrations:

```bash
alembic upgrade head
```

### Development

Start the development server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/v1/docs
- **OpenAPI**: http://localhost:8000/v1/openapi.json

## Project Structure

```
apps/api/
├── app/
│   ├── core/              # Core configuration
│   │   ├── config.py      # Settings management
│   │   └── database.py    # Database setup
│   ├── models/            # SQLAlchemy models
│   │   ├── user.py
│   │   ├── connection.py
│   │   └── followup_job.py
│   ├── schemas/           # Pydantic schemas
│   │   ├── user.py
│   │   ├── connection.py
│   │   └── followup_job.py
│   └── routes/            # API endpoints
│       └── health.py
├── main.py               # FastAPI app
├── requirements.txt      # Python dependencies
└── .env.example         # Environment variables template
```

## API Endpoints

### Health
- `GET /v1/health` - Health check with database status

### Planned Endpoints (MVP)
- `POST /v1/auth/token-exchange` - Exchange auth token
- `POST /v1/accounts/email/connect` - Connect email account
- `POST /v1/followups` - Create follow-up job
- `GET /v1/followups` - List follow-up jobs
- `POST /v1/ai/generate` - Generate email draft

## Database Models

### User
- Manages user accounts from Clerk/Supabase
- Links to connections and follow-up jobs

### Connection
- Email service integrations (Resend/Gmail)
- Stores encrypted credentials

### FollowUpJob
- Automated email follow-up jobs
- Tracks status, scheduling, and AI-generated drafts

## Environment Variables

Required variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for draft generation
- `RESEND_API_KEY` - Resend API key (optional)
- `GMAIL_CLIENT_ID` - Gmail OAuth client ID (optional)
- `GMAIL_CLIENT_SECRET` - Gmail OAuth client secret (optional)
- `REDIS_URL` - Redis connection URL

## Coding Standards

- Type hints required for all functions
- Pydantic v2 for all schemas
- SQLAlchemy 2.0 ORM style
- Follow conventional commits
- Black for code formatting
- Flake8 for linting

## Testing

```bash
pytest
```

## Database Migrations

Create a new migration:

```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:

```bash
alembic upgrade head
```

Rollback:

```bash
alembic downgrade -1
```

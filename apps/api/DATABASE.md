# Database Setup

## Quick Start (SQLite)

For development, we use SQLite for simplicity. The database is already configured and initialized!

### Database Location

```
apps/api/project_loom.db
```

### Existing Test Data

The database has been initialized with:
- **Test User**: `dev@example.com` (ID: 1)
- **Test Connection**: Resend provider (ID: 1)

## Re-initialize Database

If you need to reset the database, run:

```bash
cd apps/api
source venv/bin/activate
python init_db.py
```

This will:
1. Create all tables (users, connections, followup_jobs)
2. Create a test user
3. Create a test connection

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `full_name` - User's full name
- `auth_provider` - Auth provider (dev, clerk, supabase)
- `auth_id` - External auth ID
- `created_at` / `updated_at` - Timestamps

### Connections Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `provider` - Email provider (resend, gmail)
- `provider_email` - Email address for this connection
- `status` - Connection status (active, disabled, error)
- `credentials` - JSON with API keys/tokens
- `created_at` / `updated_at` - Timestamps

### Follow-Up Jobs Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `connection_id` - Foreign key to connections
- `original_recipient` - Recipient email
- `original_subject` - Original email subject
- `original_body` - Original email content
- `delay_hours` - Hours to wait before follow-up
- `tone` - AI tone (professional, friendly, urgent)
- `status` - Job status (pending, scheduled, sent, etc.)
- `draft_subject` / `draft_body` - AI-generated draft
- `scheduled_at` / `sent_at` / `reply_received_at` - Timestamps
- `created_at` / `updated_at` - Timestamps

## Switching to PostgreSQL

For production, update `.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/project_loom
```

Then run migrations:

```bash
# Install PostgreSQL driver (already in requirements.txt)
pip install psycopg[binary]

# Run initialization
python init_db.py
```

## Viewing Database

To inspect the SQLite database:

```bash
# Using sqlite3 CLI
sqlite3 project_loom.db

# Common queries
.tables                          # List all tables
.schema users                    # Show users table schema
SELECT * FROM users;             # View all users
SELECT * FROM connections;       # View all connections
SELECT * FROM followup_jobs;     # View all follow-up jobs
```

## Troubleshooting

### "Table already exists" error
The init script is idempotent and will skip existing data. Delete `project_loom.db` to start fresh.

### "OPENAI_API_KEY" error
Set your OpenAI API key in `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Foreign key constraint errors
SQLite foreign key enforcement is enabled. Ensure users and connections exist before creating follow-up jobs.

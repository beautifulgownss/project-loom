# Project Loom API Endpoints

Base URL: `http://localhost:8000`
API Version: `/v1`

## Authentication

Currently uses a development user placeholder. Will be replaced with Clerk/Supabase JWT validation.

## Endpoints

### Health Check

#### GET `/v1/health`

Check API and database health status.

**Response:** 200 OK
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "0.1.0",
  "database": "healthy"
}
```

---

### Follow-Up Jobs

#### POST `/v1/followups`

Create a new follow-up job.

**Request Body:**
```json
{
  "connection_id": 1,
  "original_recipient": "client@example.com",
  "original_subject": "Project Proposal",
  "original_body": "Hi, I wanted to follow up on our proposal...",
  "original_message_id": "msg_123",
  "delay_hours": 48,
  "tone": "professional",
  "max_followups": 2,
  "stop_on_reply": true
}
```

**Validation:**
- `original_recipient`: Valid email (required)
- `original_subject`: String (required)
- `original_body`: String (optional)
- `delay_hours`: Integer 1-168 (default: 24)
- `tone`: Enum ["professional", "friendly", "urgent"] (default: "professional")
- `max_followups`: Integer 1-5 (default: 1)
- `stop_on_reply`: Boolean (default: true)
- `connection_id`: Integer (required, must exist and be active)

**Response:** 201 Created
```json
{
  "id": 123,
  "user_id": 1,
  "connection_id": 1,
  "original_recipient": "client@example.com",
  "original_subject": "Project Proposal",
  "original_body": "Hi, I wanted to follow up...",
  "delay_hours": 48,
  "tone": "professional",
  "max_followups": 2,
  "stop_on_reply": true,
  "status": "pending",
  "draft_subject": null,
  "draft_body": null,
  "scheduled_at": "2024-01-17T10:30:00Z",
  "sent_at": null,
  "reply_received_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": null
}
```

**Errors:**
- `404`: Connection not found or doesn't belong to user
- `400`: Connection is not active

---

#### GET `/v1/followups`

List all follow-up jobs for the current user.

**Query Parameters:**
- `status_filter` (optional): Filter by status ["pending", "scheduled", "sent", "replied", "cancelled", "failed"]
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
GET /v1/followups?status_filter=pending&limit=10&offset=0
```

**Response:** 200 OK
```json
[
  {
    "id": 123,
    "user_id": 1,
    "connection_id": 1,
    "original_recipient": "client@example.com",
    "original_subject": "Project Proposal",
    "status": "pending",
    ...
  }
]
```

**Errors:**
- `400`: Invalid status filter

---

#### GET `/v1/followups/{job_id}`

Get a specific follow-up job by ID.

**Path Parameters:**
- `job_id`: Integer (required)

**Response:** 200 OK
```json
{
  "id": 123,
  "user_id": 1,
  "connection_id": 1,
  "original_recipient": "client@example.com",
  "original_subject": "Project Proposal",
  "status": "pending",
  ...
}
```

**Errors:**
- `404`: Follow-up job not found

---

#### POST `/v1/followups/{job_id}/cancel`

Cancel a scheduled follow-up job.

**Path Parameters:**
- `job_id`: Integer (required)

**Response:** 200 OK
```json
{
  "id": 123,
  "status": "cancelled",
  ...
}
```

**Errors:**
- `404`: Follow-up job not found
- `400`: Cannot cancel job (already sent, replied, or already cancelled)

---

### AI Draft Generation

#### POST `/v1/ai/generate`

Generate an AI-powered follow-up email draft using OpenAI.

**Request Body:**
```json
{
  "original_subject": "Project Proposal",
  "original_body": "Hi John, I sent over our proposal last week...",
  "recipient_name": "John",
  "tone": "friendly"
}
```

**Validation:**
- `original_subject`: String (required)
- `original_body`: String (required)
- `recipient_name`: String (optional)
- `tone`: Enum ["professional", "friendly", "urgent"] (default: "professional")

**Response:** 200 OK
```json
{
  "subject": "Re: Project Proposal - Following Up",
  "body": "Hi John,\n\nI wanted to follow up on the proposal I sent last week. I understand you're busy, but I'd love to hear your thoughts when you have a moment.\n\nWould you be available for a quick call this week to discuss?\n\nBest regards"
}
```

**Errors:**
- `500`: OpenAI API error or failed to parse response

---

## Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Interactive Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/v1/docs
- **ReDoc**: http://localhost:8000/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/v1/openapi.json

"""AI-powered endpoints for draft generation."""
from fastapi import APIRouter, Depends, HTTPException, status
from openai import OpenAI
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.followup_job import GenerateDraftRequest, GenerateDraftResponse

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_followup_draft(
    original_subject: str,
    original_body: str,
    recipient_name: str | None,
    tone: str,
) -> tuple[str, str]:
    """
    Generate a follow-up email draft using OpenAI.

    Args:
        original_subject: Subject of the original email
        original_body: Body of the original email
        recipient_name: Optional recipient name
        tone: Tone for the follow-up (professional, friendly, urgent)

    Returns:
        Tuple of (subject, body) for the follow-up email
    """
    # Prepare tone instructions
    tone_instructions = {
        "professional": "professional and polite",
        "friendly": "warm and friendly, but still professional",
        "urgent": "polite but with a sense of urgency"
    }

    tone_instruction = tone_instructions.get(tone, "professional and polite")

    # Construct the prompt
    recipient_context = f" to {recipient_name}" if recipient_name else ""

    system_prompt = f"""You are an expert email assistant helping write follow-up emails.
Your task is to generate a {tone_instruction} follow-up email based on the context provided.

Guidelines:
- Keep the follow-up concise (2-3 short paragraphs max)
- Reference the original email naturally
- Be respectful of the recipient's time
- Include a clear call-to-action
- Match the {tone} tone requested
- Don't be pushy or aggressive
"""

    user_prompt = f"""Write a follow-up email{recipient_context} for this original email:

Subject: {original_subject}
Body: {original_body}

Generate a follow-up that:
1. Politely reminds them about the original email
2. Provides value or context
3. Has a clear next step

Return ONLY the follow-up email in this exact format:
SUBJECT: [follow-up subject line]
BODY: [follow-up email body]
"""

    try:
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using gpt-4o-mini for cost efficiency
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500,
        )

        # Parse the response
        content = response.choices[0].message.content.strip()

        # Extract subject and body
        lines = content.split('\n')
        subject = ""
        body = ""

        in_body = False
        for line in lines:
            if line.startswith("SUBJECT:"):
                subject = line.replace("SUBJECT:", "").strip()
            elif line.startswith("BODY:"):
                body = line.replace("BODY:", "").strip()
                in_body = True
            elif in_body:
                body += "\n" + line

        # Clean up
        body = body.strip()

        if not subject or not body:
            raise ValueError("Failed to parse AI response")

        return subject, body

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate draft: {str(e)}"
        )


@router.post("/ai/generate", response_model=GenerateDraftResponse)
async def generate_draft(
    request: GenerateDraftRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate an AI-powered follow-up email draft.

    Args:
        request: Draft generation request with original email context
        current_user: Authenticated user

    Returns:
        Generated follow-up email with subject and body

    Raises:
        HTTPException: If OpenAI API fails or response is invalid
    """
    try:
        subject, body = generate_followup_draft(
            original_subject=request.original_subject,
            original_body=request.original_body,
            recipient_name=request.recipient_name,
            tone=request.tone,
        )

        return GenerateDraftResponse(
            subject=subject,
            body=body,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error generating draft: {str(e)}"
        )

"""AI-powered endpoints for draft generation."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from openai import OpenAI
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.user_settings import UserSettings
from app.schemas.followup_job import GenerateDraftRequest, GenerateDraftResponse

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_followup_draft(
    original_subject: str,
    original_body: str,
    recipient_name: str | None,
    tone: str,
    brand_voice: dict | None = None,
    email_signature: str | None = None,
) -> tuple[str, str]:
    """
    Generate a follow-up email draft using OpenAI.

    Args:
        original_subject: Subject of the original email
        original_body: Body of the original email
        recipient_name: Optional recipient name
        tone: Tone for the follow-up (professional, friendly, urgent)
        brand_voice: Brand voice settings from user preferences
        email_signature: Email signature to append

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

    # Build brand voice context
    brand_voice_context = ""
    if brand_voice:
        personality = brand_voice.get("personality", "professional")
        target_audience = brand_voice.get("target_audience")
        key_messaging = brand_voice.get("key_messaging_points", [])
        tone_guidelines = brand_voice.get("tone_guidelines", {})
        example_phrases = brand_voice.get("example_phrases", [])

        brand_voice_context = f"\n\nBRAND VOICE GUIDELINES:"
        brand_voice_context += f"\n- Personality: {personality}"

        if target_audience:
            brand_voice_context += f"\n- Target Audience: {target_audience}"

        if key_messaging:
            brand_voice_context += f"\n- Key Messaging Points: {', '.join(key_messaging)}"

        if tone_guidelines.get("dos"):
            brand_voice_context += f"\n- Use these phrases/words: {', '.join(tone_guidelines['dos'])}"

        if tone_guidelines.get("donts"):
            brand_voice_context += f"\n- Avoid these phrases/words: {', '.join(tone_guidelines['donts'])}"

        if example_phrases:
            brand_voice_context += f"\n- Example phrases that match our voice: {', '.join(example_phrases)}"

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
- Don't be pushy or aggressive{brand_voice_context}
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

        # Append email signature if provided
        if email_signature:
            body += f"\n\n{email_signature}"

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
    db: Session = Depends(get_db),
):
    """
    Generate an AI-powered follow-up email draft.

    Args:
        request: Draft generation request with original email context
        current_user: Authenticated user
        db: Database session

    Returns:
        Generated follow-up email with subject and body

    Raises:
        HTTPException: If OpenAI API fails or response is invalid
    """
    try:
        # Get user settings for brand voice and signature
        user_settings = db.query(UserSettings).filter(
            UserSettings.user_id == current_user.id
        ).first()

        brand_voice = user_settings.brand_voice if user_settings else None
        email_signature = user_settings.email_signature if user_settings else None

        subject, body = generate_followup_draft(
            original_subject=request.original_subject,
            original_body=request.original_body,
            recipient_name=request.recipient_name,
            tone=request.tone,
            brand_voice=brand_voice,
            email_signature=email_signature,
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

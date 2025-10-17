"""Prospect research services including pain point analysis."""
from __future__ import annotations

import html
import logging
import re
from collections import OrderedDict
from dataclasses import dataclass
from typing import Iterable, List, Optional

import httpx

from app.schemas.prospect import PainPointAnalysis

logger = logging.getLogger(__name__)

# Industry-specific patterns curated for quick wins (focus on top customer segments).
INDUSTRY_PAIN_POINT_LIBRARY: dict[str, dict[str, List[str]]] = {
    "saas": {
        "general": [
            "Trial-to-paid conversion is below industry benchmark (~20%) leading to rising churn.",
            "Customer onboarding requires manual walkthroughs which slows activation and expansions.",
            "Integration backlog keeps piling up, creating friction for enterprise deals.",
        ],
        "revops": [
            "Revenue reporting is built on brittle spreadsheets, creating week-long closes.",
            "Lead routing depends on manual rules causing slow handoffs to AEs.",
        ],
        "marketing": [
            "Paid acquisition costs keep increasing while demo-to-SQL conversion stagnates.",
            "Content personalization is inconsistent, hurting nurture sequence performance.",
        ],
    },
    "manufacturing": {
        "general": [
            "Unplanned downtime is eroding margins because maintenance is still reactive.",
            "Supply chain visibility stops at tier-1 suppliers, delaying customer delivery dates.",
            "Quality escapes are costing rework due to manual inspection steps.",
        ],
        "operations": [
            "Production schedules live in spreadsheets so reprioritizing orders takes hours.",
            "Line supervisors have no real-time throughput dashboard to adjust staffing.",
        ],
        "procurement": [
            "Vendor performance metrics are scattered, making quarterly reviews manual.",
            "Expedited freight spending spikes each quarter to hit committed ship dates.",
        ],
    },
    "healthcare": {
        "general": [
            "Patient intake still involves clipboards which inflates wait times and no-shows.",
            "Compliance reporting drains operational staff because data is scattered across systems.",
            "Care teams lack a single view of the patient journey, hurting satisfaction scores.",
        ],
        "it": [
            "EHR change requests stack up because integrations require vendor tickets.",
            "Security reviews for each new application delay clinical rollouts by months.",
        ],
        "finance": [
            "Denied claims sit in work queues for weeks, straining revenue cycle KPIs.",
            "Physician compensation reporting takes weeks due to manual data pulls.",
        ],
    },
}

# Keyword heuristics from public company data. Keeps rates low by avoiding extra LLM calls.
WEBSITE_KEYWORD_PAIN_POINTS: dict[str, dict[str, str]] = {
    "manual process": {
        "pain_point": "Teams still rely on manual workflows, leaving room for human error and throughput issues.",
        "signal": "Site copy references manual steps or spreadsheets.",
    },
    "compliance": {
        "pain_point": "Regulatory compliance is heavy, signaling need for automation that preserves audit trails.",
        "signal": "Compliance requirements highlighted on site.",
    },
    "integration": {
        "pain_point": "Integration gaps slow down onboarding for new customers and partners.",
        "signal": "Mentions of integration partners or backlog.",
    },
    "hiring": {
        "pain_point": "Rapid hiring suggests processes are strained and new hires need faster ramp.",
        "signal": "Careers page focused on scaling teams.",
    },
    "data silo": {
        "pain_point": "Data silos block leadership visibility which hurts decision making.",
        "signal": "Messaging references fragmented data or disconnected tools.",
    },
    "churn": {
        "pain_point": "Churn is a concern, so customer lifecycle automation is likely under review.",
        "signal": "Churn reduction initiatives surfaced publicly.",
    },
}


@dataclass
class ProspectResearchContext:
    """Representation of a prospect used by the research service."""

    name: str
    company: str
    role: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None


class PainPointService:
    """Encapsulates the heuristics used to generate verifiable pain points quickly."""

    def __init__(self, timeout_seconds: float = 6.0):
        self.timeout_seconds = timeout_seconds

    def analyze(self, context: ProspectResearchContext) -> PainPointAnalysis:
        """Combine industry patterns with lightweight public signals."""
        candidate_points: List[str] = []
        signals: List[dict[str, str]] = []
        sources: List[str] = []

        industry_points = self._from_industry_library(context)
        if industry_points:
            candidate_points.extend(industry_points)
            signals.append(
                {
                    "source": "industry_library",
                    "detail": f"Matched {context.industry} benchmarks",
                }
            )
            sources.append("industry_library")

        website_result = self._website_analysis(context.website)
        if website_result:
            candidate_points.extend(website_result["pain_points"])
            signals.extend(website_result["signals"])
            sources.append(website_result["source"])

        notes_result = self._notes_analysis(context.notes)
        if notes_result:
            candidate_points.extend(notes_result["pain_points"])
            signals.extend(notes_result["signals"])
            sources.append(notes_result["source"])

        deduped_points = self._dedupe(candidate_points)

        # Ensure we always return between 3-5 pain points.
        if len(deduped_points) < 3:
            fallback = self._fallback_points(context)
            for point in fallback:
                if point.lower() not in {p.lower() for p in deduped_points}:
                    deduped_points.append(point)
                if len(deduped_points) >= 3:
                    break

        limited_points = deduped_points[:5]

        analysis = PainPointAnalysis(
            pain_points=limited_points,
            industry_insights={
                "industry": context.industry,
                "role": context.role,
                "signals": signals,
            },
            research_source=", ".join(OrderedDict.fromkeys(sources)) if sources else "industry_library",
        )
        return analysis

    # Internal helpers -----------------------------------------------------

    def _from_industry_library(self, context: ProspectResearchContext) -> List[str]:
        """Pull role-aware patterns for the prospect's industry."""
        if not context.industry:
            return []

        industry_key = context.industry.lower()
        library = INDUSTRY_PAIN_POINT_LIBRARY.get(industry_key)
        if not library:
            return []

        points: List[str] = list(library.get("general", []))

        if context.role:
            role_key = context.role.lower()
            # Attempt exact role match; also check if role contains the category key.
            for category, role_points in library.items():
                if category == "general":
                    continue
                if role_key == category or category in role_key:
                    points.extend(role_points)

        return points

    def _website_analysis(self, website: Optional[str]) -> Optional[dict[str, List[str]]]:
        """Fetch website copy and infer pain points from keywords."""
        if not website:
            return None

        try:
            with httpx.Client(timeout=self.timeout_seconds, follow_redirects=True) as client:
                response = client.get(website, headers={"User-Agent": "OutreachStudioBot/1.0"})

            if response.status_code >= 400:
                logger.debug("Website fetch failed for %s: %s", website, response.status_code)
                return None

            text = self._normalize_text(response.text)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Unable to fetch %s: %s", website, exc)
            return None

        detected: List[str] = []
        signals: List[dict[str, str]] = []

        for keyword, metadata in WEBSITE_KEYWORD_PAIN_POINTS.items():
            if keyword in text:
                detected.append(metadata["pain_point"])
                signals.append(
                    {
                        "source": "website",
                        "keyword": keyword,
                        "detail": metadata["signal"],
                    }
                )

        if not detected:
            return None

        return {
            "pain_points": detected,
            "signals": signals,
            "source": "website",
        }

    def _notes_analysis(self, notes: Optional[str]) -> Optional[dict[str, List[str]]]:
        """Extract pain signals from any existing research notes."""
        if not notes:
            return None

        text = notes.lower()
        detected: List[str] = []
        signals: List[dict[str, str]] = []

        for keyword, metadata in WEBSITE_KEYWORD_PAIN_POINTS.items():
            if keyword in text:
                detected.append(metadata["pain_point"])
                signals.append(
                    {
                        "source": "notes",
                        "keyword": keyword,
                        "detail": f"Imported from existing notes: {metadata['signal']}",
                    }
                )

        if not detected:
            return None

        return {
            "pain_points": detected,
            "signals": signals,
            "source": "notes",
        }

    def _fallback_points(self, context: ProspectResearchContext) -> List[str]:
        """Fallback generic pains when limited data is available."""
        generic = [
            f"{context.company} is investing heavily in growth, so onboarding efficiency matters.",
            "Leadership teams want more visibility across funnel metrics without manual spreadsheets.",
            "Buyer expectations for personalization keep rising and strain current outreach workflows.",
        ]
        return generic

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Strip markup and normalize whitespace."""
        no_html = re.sub(r"<(script|style).*?>.*?</\\1>", " ", text, flags=re.DOTALL | re.IGNORECASE)
        no_tags = re.sub(r"<[^>]+>", " ", no_html)
        unescaped = html.unescape(no_tags)
        normalized = re.sub(r"\\s+", " ", unescaped).lower()
        return normalized

    @staticmethod
    def _dedupe(points: Iterable[str]) -> List[str]:
        """Deduplicate pain points while keeping original order."""
        unique: "OrderedDict[str, None]" = OrderedDict()
        for point in points:
            unique.setdefault(point, None)
        return list(unique.keys())


class ProspectResearchService:
    """Entry point for the rest of the system to run research."""

    def __init__(self, pain_point_service: Optional[PainPointService] = None):
        self.pain_point_service = pain_point_service or PainPointService()

    def run_pain_point_analysis(self, context: ProspectResearchContext) -> PainPointAnalysis:
        """Run the pain point service and return structured output."""
        return self.pain_point_service.analyze(context)

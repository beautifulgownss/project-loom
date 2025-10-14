/**
 * Email Templates Library
 * Pre-built follow-up scenarios for various use cases
 */

export type TemplateCategory = "sales" | "networking" | "customer-success" | "recruiting";

export interface EmailTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  scenario: string;
  subject: string;
  tone: "professional" | "friendly" | "urgent";
  delayHours: number;
  icon: string;
}

export const templates: EmailTemplate[] = [
  // SALES
  {
    id: "sales-cold-outreach",
    title: "Cold Outreach Follow-Up",
    description: "Follow up on an initial cold email to a prospect",
    category: "sales",
    scenario: "Hi [Name],\n\nI wanted to follow up on my previous email about how [Your Product] can help [Their Company] achieve [specific goal]. I understand you're busy, but I'd love to share some success stories from similar companies in your industry.\n\nWould you be open to a quick 15-minute call this week?",
    subject: "Quick Follow-Up: [Your Product] for [Their Company]",
    tone: "professional",
    delayHours: 72,
    icon: "📧",
  },
  {
    id: "sales-demo-follow-up",
    title: "Demo Follow-Up",
    description: "Check in after a product demo or presentation",
    category: "sales",
    scenario: "Hi [Name],\n\nThank you for taking the time to join our demo yesterday. I hope you found it valuable and got a clear picture of how our solution can address your needs around [specific pain point].\n\nI'd love to answer any questions that came up and discuss next steps. Are you available for a brief call this week?",
    subject: "Following Up on Yesterday's Demo",
    tone: "friendly",
    delayHours: 24,
    icon: "🎯",
  },
  {
    id: "sales-proposal-follow-up",
    title: "Proposal Follow-Up",
    description: "Follow up on a sent proposal or quote",
    category: "sales",
    scenario: "Hi [Name],\n\nI wanted to check in regarding the proposal I sent last week for [Project/Service]. I'm confident our solution aligns well with your goals for [specific objective].\n\nDo you have any questions about the pricing, timeline, or deliverables? I'm happy to adjust anything to better fit your needs.",
    subject: "Following Up: Proposal for [Project Name]",
    tone: "professional",
    delayHours: 96,
    icon: "📊",
  },
  {
    id: "sales-closing",
    title: "Closing Follow-Up",
    description: "Final push before closing a deal",
    category: "sales",
    scenario: "Hi [Name],\n\nI wanted to reach out one more time regarding our conversation about [Product/Service]. I know making a decision like this requires careful consideration.\n\nWe're currently offering [special offer/incentive] for clients who sign by [date]. I'd hate for you to miss out on this opportunity to [achieve specific benefit].\n\nCan we schedule a quick call to address any final concerns?",
    subject: "Final Opportunity: [Product/Service] for [Their Company]",
    tone: "urgent",
    delayHours: 48,
    icon: "🎁",
  },

  // NETWORKING
  {
    id: "networking-conference",
    title: "Conference Follow-Up",
    description: "Reach out after meeting someone at a conference or event",
    category: "networking",
    scenario: "Hi [Name],\n\nIt was great meeting you at [Conference Name] last week! I really enjoyed our conversation about [topic discussed].\n\nI'd love to stay connected and explore potential ways we could collaborate. Perhaps we could grab a virtual coffee sometime?\n\nLooking forward to staying in touch!",
    subject: "Great Meeting You at [Conference Name]!",
    tone: "friendly",
    delayHours: 48,
    icon: "🤝",
  },
  {
    id: "networking-linkedin",
    title: "LinkedIn Connection Follow-Up",
    description: "Follow up after connecting on LinkedIn",
    category: "networking",
    scenario: "Hi [Name],\n\nThanks for connecting with me on LinkedIn! I noticed we share an interest in [shared interest/industry].\n\nI'd love to learn more about your work at [Their Company] and explore how we might be able to help each other. Would you be open to a brief introductory call?",
    subject: "Following Up on Our LinkedIn Connection",
    tone: "friendly",
    delayHours: 72,
    icon: "💼",
  },
  {
    id: "networking-introduction",
    title: "Introduction Follow-Up",
    description: "Follow up after being introduced by a mutual connection",
    category: "networking",
    scenario: "Hi [Name],\n\n[Mutual Connection] mentioned that you're working on [project/initiative], and suggested we connect. I have experience in [relevant area] and would be happy to share insights.\n\nWould you be interested in a quick call to discuss how I might be able to help?",
    subject: "[Mutual Connection] Suggested We Connect",
    tone: "professional",
    delayHours: 48,
    icon: "🌟",
  },

  // CUSTOMER SUCCESS
  {
    id: "cs-onboarding",
    title: "Onboarding Check-In",
    description: "Check in with a new customer during onboarding",
    category: "customer-success",
    scenario: "Hi [Name],\n\nI wanted to check in and see how your onboarding experience has been going with [Product]. We want to make sure you're getting the most value from your investment.\n\nAre there any features you'd like to explore further, or any questions I can answer? I'm here to help ensure your success!",
    subject: "How's Your [Product] Onboarding Going?",
    tone: "friendly",
    delayHours: 120,
    icon: "🚀",
  },
  {
    id: "cs-feature-adoption",
    title: "Feature Adoption Follow-Up",
    description: "Encourage adoption of a specific feature",
    category: "customer-success",
    scenario: "Hi [Name],\n\nI noticed you haven't tried [Feature Name] yet. This feature could really help you achieve [specific benefit] based on your use case.\n\nI'd love to walk you through it in a quick 10-minute call. Would that be helpful?",
    subject: "Unlock More Value with [Feature Name]",
    tone: "friendly",
    delayHours: 168,
    icon: "✨",
  },
  {
    id: "cs-renewal",
    title: "Renewal Reminder",
    description: "Remind customer about upcoming renewal",
    category: "customer-success",
    scenario: "Hi [Name],\n\nYour [Product] subscription is coming up for renewal on [Date]. We've loved having you as a customer and hope you've been getting great value from the platform.\n\nBefore your renewal, I'd love to schedule a quick call to review your usage, address any concerns, and discuss any new features that could benefit you.\n\nLooking forward to continuing our partnership!",
    subject: "Your [Product] Renewal is Coming Up",
    tone: "professional",
    delayHours: 336,
    icon: "🔄",
  },
  {
    id: "cs-feedback",
    title: "Feedback Request",
    description: "Request feedback from a satisfied customer",
    category: "customer-success",
    scenario: "Hi [Name],\n\nI hope you're enjoying [Product]! We're always looking to improve and would love to hear your thoughts on your experience so far.\n\nWould you be willing to share a brief testimonial or review? It would help other companies like yours discover how [Product] can help them achieve [benefit].\n\nThank you for being a valued customer!",
    subject: "Quick Feedback Request",
    tone: "friendly",
    delayHours: 240,
    icon: "💬",
  },

  // RECRUITING
  {
    id: "recruiting-candidate",
    title: "Candidate Follow-Up",
    description: "Follow up with a potential candidate",
    category: "recruiting",
    scenario: "Hi [Name],\n\nI wanted to follow up on the [Position] opportunity at [Company] that I reached out about. I think your background in [relevant experience] would be a great fit for our team.\n\nWould you be interested in learning more about the role and our company culture? I'd love to schedule a brief introductory call.",
    subject: "Following Up: [Position] Opportunity at [Company]",
    tone: "professional",
    delayHours: 96,
    icon: "👥",
  },
  {
    id: "recruiting-interview-scheduling",
    title: "Interview Scheduling Follow-Up",
    description: "Follow up to schedule an interview",
    category: "recruiting",
    scenario: "Hi [Name],\n\nThank you for your interest in the [Position] role! We'd love to move forward with the interview process.\n\nWould you be available for a [duration]-minute conversation with [Interviewer Name] sometime this week? Please let me know your availability, and I'll send over a calendar invite.",
    subject: "Next Steps: Scheduling Your Interview",
    tone: "professional",
    delayHours: 48,
    icon: "📅",
  },
  {
    id: "recruiting-offer",
    title: "Offer Follow-Up",
    description: "Follow up after extending a job offer",
    category: "recruiting",
    scenario: "Hi [Name],\n\nI wanted to check in regarding the offer we extended for the [Position] role. I hope you had a chance to review the details.\n\nDo you have any questions about the compensation, benefits, or anything else? I'm here to help clarify anything that would help you make your decision.\n\nWe're excited about the possibility of you joining our team!",
    subject: "Following Up on Your [Position] Offer",
    tone: "friendly",
    delayHours: 72,
    icon: "🎉",
  },
];

export const categories = [
  { id: "sales" as const, name: "Sales", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "networking" as const, name: "Networking", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "customer-success" as const, name: "Customer Success", color: "bg-green-100 text-green-800 border-green-200" },
  { id: "recruiting" as const, name: "Recruiting", color: "bg-orange-100 text-orange-800 border-orange-200" },
];

export function getCategoryColor(category: TemplateCategory): string {
  const cat = categories.find(c => c.id === category);
  return cat?.color || "bg-gray-100 text-gray-800 border-gray-200";
}

export function getCategoryName(category: TemplateCategory): string {
  const cat = categories.find(c => c.id === category);
  return cat?.name || category;
}

# Voice Studio - Brand & Content Intelligence Module

## 🎯 Vision

**Voice Studio** is Project Loom's brand and content intelligence module that helps teams maintain consistent, authentic brand voices across all marketing channels. It combines AI-powered analysis with structured brand management to ensure every piece of content—from email sequences to social posts—sounds distinctly "you."

---

## 🌟 Core Value Proposition

### The Problem
- Marketing teams struggle to maintain consistent brand voice across channels
- New team members don't know how to "sound like the brand"
- Content feels generic and indistinguishable from competitors
- Scaling content production often means losing brand authenticity
- No systematic way to check if content matches brand voice

### Our Solution
Voice Studio provides:
1. **Structured Brand Definition** - Build comprehensive brand voice profiles beyond simple "professional/friendly" labels
2. **Persona Management** - Create detailed buyer personas that inform content strategy
3. **AI-Powered Content Generation** - Generate topic ideas that resonate with specific personas
4. **Voice Consistency Scoring** - Automated analysis to ensure brand alignment
5. **Seamless Integration** - Brand voices flow into Outreach Studio for email automation

### Key Differentiators

| Feature | Voice Studio | Competitors |
|---------|-------------|-------------|
| **Multi-Dimensional Voice** | 8+ voice attributes (tone, vocabulary, pacing, etc.) | Usually 3-5 basic traits |
| **Persona-Content Mapping** | AI generates topics matched to persona pain points | Generic topic generators |
| **Voice Consistency AI** | Real-time scoring with specific improvement suggestions | Manual review or simple keyword matching |
| **Integration Depth** | Brand voices auto-apply to email sequences | Separate, disconnected tools |
| **Example Library** | Store approved content examples for reference | Limited or no examples |
| **Competitive Analysis** | Analyze competitor voices to differentiate | Not available |

---

## 📊 User Journey

### Phase 1: Brand Creation
```
[Create New Brand]
  → Name & Description
  → Industry Selection
  → Brand Personality Quiz (optional)
  → Voice Attributes Definition
  → Example Content Upload
  → [Brand Profile Created ✓]
```

### Phase 2: Persona Development
```
[Add Persona]
  → Choose Template (SaaS Founder, Marketing Manager, etc.)
  → Demographics & Firmographics
  → Pain Points & Goals
  → Communication Preferences
  → Content Consumption Habits
  → [Persona Created ✓]
```

### Phase 3: Content Strategy
```
[Generate Topic Ideas]
  → Select Brand + Persona
  → Choose Content Type (Email, Blog, Social, etc.)
  → Set Campaign Goals
  → AI generates 20-30 relevant topics
  → Save favorites to library
  → [Topics Ready ✓]
```

### Phase 4: Consistency Management
```
[Check Content]
  → Paste draft content
  → Select brand voice
  → AI analyzes alignment
  → Receive score (0-100) + suggestions
  → Apply improvements
  → [Content Approved ✓]
```

### Phase 5: Integration & Execution
```
[Use in Outreach Studio]
  → Compose email
  → Select brand voice
  → AI draft matches brand
  → Send with confidence
  → [Campaign Launched ✓]
```

---

## 🏗️ Architecture Recommendation

### **Option A: Integrated Module (RECOMMENDED)**

**Approach**: Build Voice Studio as an integrated section within the existing Next.js app.

**Pros:**
- ✅ Seamless user experience - no context switching
- ✅ Shared authentication and data models
- ✅ Easy cross-module integration (use brand in emails immediately)
- ✅ Single deployment pipeline
- ✅ Unified navigation and design system
- ✅ Lower infrastructure costs

**Cons:**
- ⚠️ Larger app bundle size (mitigated by route-based code splitting)
- ⚠️ Need careful state management across modules

**Implementation:**
```
apps/web/app/
  ├── (outreach)/          # Outreach Studio
  │   ├── composer/
  │   ├── sequences/
  │   └── analytics/
  │
  ├── (voice)/             # Voice Studio (new)
  │   ├── brands/
  │   ├── personas/
  │   ├── topics/
  │   └── checker/
  │
  └── layout.tsx           # Shared layout with module switcher
```

**Navigation Design:**
```typescript
// Top-level module switcher
<ModulePicker>
  <Module icon="📧" name="Outreach" />
  <Module icon="🎨" name="Voice" />
  <Module icon="📊" name="Analytics" /> // Future
</ModulePicker>

// Within Voice Studio
<VoiceNav>
  <NavItem>Brands</NavItem>
  <NavItem>Personas</NavItem>
  <NavItem>Topics</NavItem>
  <NavItem>Checker</NavItem>
</VoiceNav>
```

---

### **Option B: Separate Application**

**Approach**: Create standalone app at `apps/voice-studio/`.

**Pros:**
- ✅ Complete separation of concerns
- ✅ Independent scaling and deployment
- ✅ Smaller bundle per app
- ✅ Team can work independently

**Cons:**
- ❌ Complex cross-app data sharing
- ❌ Need separate auth flow or SSO
- ❌ Users must switch between apps
- ❌ Duplicate UI components
- ❌ More complex deployment

**Verdict**: Not recommended until Voice Studio reaches significant scale (1M+ users).

---

## 🗄️ Database Schema

### Core Tables

#### **brands**
```sql
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),

    -- Basic Info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    industry VARCHAR(50),
    website VARCHAR(255),
    logo_url VARCHAR(500),

    -- Voice Attributes (JSON for flexibility)
    voice_profile JSON NOT NULL,
    /* Example structure:
    {
        "tone": "professional yet approachable",
        "vocabulary": "clear, jargon-free, conversational",
        "sentence_structure": "mix of short and medium sentences",
        "pacing": "moderate, with strategic pauses",
        "emotion": "optimistic and encouraging",
        "authority_level": "expert but not condescending",
        "humor": "light touches, never forced",
        "storytelling": "uses relatable examples"
    }
    */

    -- Guidelines
    do_use TEXT[],              -- Array of approved phrases/patterns
    dont_use TEXT[],            -- Array of banned phrases/patterns
    examples TEXT[],            -- Array of example content URLs or text

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_user ON brands(user_id);
CREATE INDEX idx_brands_active ON brands(user_id, is_active);
```

#### **personas**
```sql
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),

    -- Basic Info
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),                    -- "VP of Marketing"
    industry VARCHAR(50),
    company_size VARCHAR(50),             -- "50-200 employees"

    -- Demographics
    age_range VARCHAR(20),
    location VARCHAR(100),
    education VARCHAR(100),

    -- Psychographics
    goals TEXT[],                         -- What they want to achieve
    pain_points TEXT[],                   -- Problems they face
    motivations TEXT[],                   -- What drives decisions
    objections TEXT[],                    -- Common concerns

    -- Behavior
    content_preferences JSON,
    /* Example:
    {
        "channels": ["email", "linkedin", "podcasts"],
        "content_types": ["case studies", "how-to guides"],
        "reading_time": "5-7 minutes",
        "tone_preference": "data-driven with storytelling"
    }
    */

    buying_journey JSON,
    /* Example:
    {
        "awareness_triggers": ["budget cuts", "team growth"],
        "consideration_factors": ["ROI", "ease of use"],
        "decision_criteria": ["security", "support quality"],
        "typical_timeline": "3-6 months"
    }
    */

    -- Templates
    template_name VARCHAR(100),           -- If created from template

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personas_brand ON personas(brand_id);
CREATE INDEX idx_personas_user ON personas(user_id);
```

#### **content_topics**
```sql
CREATE TABLE content_topics (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),

    -- Topic Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50),             -- "email", "blog", "social", "video"
    category VARCHAR(50),                 -- "educational", "promotional", "thought leadership"

    -- Generation Context
    generation_prompt TEXT,               -- What prompt generated this
    persona_pain_point VARCHAR(255),      -- Which pain point it addresses
    campaign_goal VARCHAR(100),           -- "awareness", "consideration", "decision"

    -- AI Metadata
    relevance_score FLOAT,                -- 0-100, how relevant to persona
    difficulty_level VARCHAR(20),         -- "beginner", "intermediate", "advanced"
    estimated_engagement VARCHAR(20),     -- "high", "medium", "low"
    keywords TEXT[],

    -- Organization
    is_favorite BOOLEAN DEFAULT false,
    is_used BOOLEAN DEFAULT false,
    used_in_campaign_id INTEGER,          -- Reference to where it was used

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topics_brand ON content_topics(brand_id);
CREATE INDEX idx_topics_persona ON content_topics(persona_id);
CREATE INDEX idx_topics_favorites ON content_topics(user_id, is_favorite);
```

#### **voice_checks**
```sql
CREATE TABLE voice_checks (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),

    -- Content Being Checked
    content_text TEXT NOT NULL,
    content_type VARCHAR(50),             -- "email", "blog", "social"
    content_title VARCHAR(255),

    -- Analysis Results
    overall_score FLOAT NOT NULL,         -- 0-100

    analysis_details JSON NOT NULL,
    /* Example:
    {
        "tone_match": {
            "score": 85,
            "feedback": "Tone is appropriately professional...",
            "suggestions": ["Consider softening line 3"]
        },
        "vocabulary_match": {
            "score": 90,
            "feedback": "Vocabulary aligns well...",
            "flagged_words": ["synergy", "leverage"]
        },
        "structure_match": {
            "score": 78,
            "feedback": "Sentences are too uniform...",
            "suggestions": ["Vary sentence length in paragraph 2"]
        },
        "emotion_match": {
            "score": 82,
            "feedback": "Good balance of optimism..."
        }
    }
    */

    -- Improvements
    suggested_edits JSON,
    /* Example:
    [
        {
            "original": "We're excited to leverage synergies",
            "suggested": "We're excited to work together",
            "reason": "Avoid corporate jargon"
        }
    ]
    */

    -- Usage Tracking
    user_accepted BOOLEAN,
    final_score_after_edits FLOAT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checks_brand ON voice_checks(brand_id);
CREATE INDEX idx_checks_user ON voice_checks(user_id);
CREATE INDEX idx_checks_date ON voice_checks(created_at);
```

#### **brand_examples**
```sql
CREATE TABLE brand_examples (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

    -- Example Content
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50),             -- "email", "blog", "landing_page"
    content_text TEXT NOT NULL,
    content_url VARCHAR(500),             -- Optional external link

    -- Classification
    quality_rating VARCHAR(20),           -- "excellent", "good", "okay"
    use_case VARCHAR(100),                -- "welcome email", "feature announcement"

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_examples_brand ON brand_examples(brand_id);
```

---

## 🎨 Feature Specifications

### 1. Brand Builder

**Page**: `/voice/brands/new`

**Flow:**
1. **Basic Info** - Name, industry, website
2. **Voice Quiz** (Optional) - 10-15 questions to define voice
   - "How formal should your brand sound?" (1-5 scale)
   - "Do you use industry jargon?" (Yes/Sometimes/No)
   - "Are you funny?" (Serious → Playful scale)
3. **Voice Attributes** - 8 detailed fields with examples
4. **Do's and Don'ts** - Add phrases/patterns to use or avoid
5. **Upload Examples** - Paste or link to existing content

**Components:**
```typescript
<BrandWizard>
  <Step1_BasicInfo />
  <Step2_VoiceQuiz />          // Optional, generates voice_profile
  <Step3_VoiceAttributes />    // Manual editing
  <Step4_Guidelines />         // Do/Don't lists
  <Step5_Examples />           // Upload reference content
</BrandWizard>
```

**AI Features:**
- Analyze uploaded examples to suggest voice attributes
- Generate initial do/don't lists from examples
- Competitive voice analysis (analyze competitor content)

---

### 2. Persona Builder

**Page**: `/voice/personas/new`

**Templates Available:**
- SaaS Founder (Technical)
- SaaS Founder (Non-Technical)
- VP of Marketing
- Marketing Manager
- Sales Leader
- Customer Success Manager
- HR Director
- CFO/Finance Leader

**Flow:**
1. **Choose Template** or start from scratch
2. **Demographics** - Role, company size, location
3. **Psychographics** - Goals, pain points, motivations
4. **Behavior** - Content preferences, buying journey
5. **Review & Save**

**Components:**
```typescript
<PersonaBuilder>
  <TemplateSelector templates={templates} />
  <PersonaForm>
    <DemographicsSection />
    <PsychographicsSection />
    <BehaviorSection />
  </PersonaForm>
  <PersonaPreview persona={draft} />
</PersonaBuilder>
```

---

### 3. Topic Generator

**Page**: `/voice/topics/generate`

**Inputs:**
- Brand (dropdown)
- Persona (dropdown)
- Content Type (email, blog, social, video)
- Campaign Goal (awareness, consideration, decision)
- Quantity (10, 20, 30 topics)

**AI Prompt Structure:**
```
Generate {quantity} {content_type} topic ideas for {brand.name}.

Brand Voice: {brand.voice_profile}
Target Persona: {persona.name} - {persona.role}
Pain Points: {persona.pain_points}
Goals: {persona.goals}
Campaign Goal: {campaign_goal}

For each topic, provide:
1. Catchy title
2. 2-sentence description
3. Relevance score (0-100)
4. Primary pain point addressed
5. 3-5 relevant keywords
6. Estimated engagement (high/medium/low)

Output JSON array.
```

**UI Features:**
- Grid view with filtering/sorting
- Favorite topics
- Copy to clipboard
- Export to CSV
- "Generate more like this" button

---

### 4. Voice Consistency Checker

**Page**: `/voice/checker`

**Flow:**
1. **Select Brand** - Which brand voice to check against
2. **Paste Content** - Or connect to Google Docs
3. **Analyze** - AI runs 8-point analysis
4. **Review Score** - Overall + breakdown by attribute
5. **Apply Suggestions** - One-click or manual edits

**Scoring Algorithm:**
```
Overall Score = Average of:
- Tone Match (0-100)
- Vocabulary Match (0-100)
- Sentence Structure Match (0-100)
- Pacing Match (0-100)
- Emotion Match (0-100)
- Authority Level Match (0-100)
- Humor Match (0-100)
- Storytelling Match (0-100)
```

**AI Prompt:**
```
Analyze this content against the brand voice profile.

Brand Voice:
{voice_profile}

Do Use: {do_use}
Don't Use: {dont_use}

Content:
{content_text}

Provide:
1. Score (0-100) for each voice attribute
2. Specific feedback for each attribute
3. Flagged words/phrases that violate guidelines
4. Suggested edits with reasoning
5. Overall score and summary

Output JSON.
```

**Components:**
```typescript
<VoiceChecker>
  <BrandSelector />
  <ContentInput />
  <AnalysisResults>
    <OverallScore score={85} />
    <AttributeScores scores={breakdown} />
    <SuggestedEdits edits={suggestions} />
    <BeforeAfterPreview />
  </AnalysisResults>
</VoiceChecker>
```

---

## 🔗 Integration with Outreach Studio

### Seamless Brand Application

**In Email Composer:**
```typescript
<Composer>
  <BrandSelector
    brands={userBrands}
    onChange={updateDraftTone}
  />
  <EmailForm brand={selectedBrand} />
</Composer>
```

**In Sequence Builder:**
```typescript
<SequenceStep>
  <BrandSelector />
  <PersonaSelector />  // New: Target specific persona
  <EmailDraft
    brand={selectedBrand}
    persona={selectedPersona}
  />
</SequenceStep>
```

**AI Prompt Enhancement:**
```
Generate follow-up email:

Original Email: {original}
Recipient: {recipient}

Brand Voice Profile:
{brand.voice_profile}

Guidelines:
Do: {brand.do_use}
Don't: {brand.dont_use}

Target Persona: {persona.name}
Pain Points: {persona.pain_points}
Goals: {persona.goals}

Generate an email that:
1. Matches the brand voice exactly
2. Addresses persona's pain points
3. Uses vocabulary from "Do" list
4. Avoids phrases from "Don't" list
```

---

## 📊 Analytics & Insights

### Voice Studio Dashboard

**Metrics:**
- Total brands created
- Personas per brand
- Topics generated this month
- Voice checks run
- Average consistency score
- Most used brand
- Most targeted persona

**Insights:**
- "Your B2B SaaS brand voice is 12% more formal than competitors"
- "Emails using Persona #3 have 23% higher reply rates"
- "Your consistency scores improved 15% this month"

**Reports:**
- Brand voice evolution over time
- Persona performance comparison
- Topic generation trends
- Voice consistency trends

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Database migrations for 5 new tables
- [ ] Backend API routes for brands CRUD
- [ ] Basic brand creation UI
- [ ] Voice attributes form

### Phase 2: Personas (Weeks 3-4)
- [ ] Persona templates library
- [ ] Persona builder UI
- [ ] Persona-brand association
- [ ] Persona card components

### Phase 3: Content Generation (Weeks 5-6)
- [ ] Topic generator API with OpenAI
- [ ] Topic generation UI
- [ ] Topic library/favorites
- [ ] Export functionality

### Phase 4: Voice Checking (Weeks 7-8)
- [ ] Voice consistency API
- [ ] Checker UI with scoring
- [ ] Suggested edits interface
- [ ] Before/after comparison

### Phase 5: Integration (Weeks 9-10)
- [ ] Brand selector in Composer
- [ ] Enhanced AI prompts with brand context
- [ ] Persona selector in Sequences
- [ ] Cross-module navigation

### Phase 6: Polish & Launch (Weeks 11-12)
- [ ] Voice Studio dashboard
- [ ] Analytics & insights
- [ ] Onboarding flow
- [ ] Documentation
- [ ] Beta testing

---

## 🎯 Success Metrics

**Adoption:**
- 80%+ of users create at least 1 brand within 7 days
- Average 2.5 personas per brand
- 50+ topics generated per user per month

**Engagement:**
- 3+ voice checks per week per user
- 70%+ of users apply suggested edits
- Average consistency score improvement: 10+ points

**Integration:**
- 60%+ of email sequences use brand voices
- 30%+ improvement in reply rates for brand-matched emails

**Retention:**
- 50%+ MAU return rate
- NPS score: 40+

---

## 💡 Future Enhancements

### v2 Features
- **Collaborative editing** - Team members can contribute to brand profiles
- **Version control** - Track brand voice evolution
- **Multi-language support** - Brand voices in different languages
- **Voice cloning** - Upload existing content, AI extracts voice
- **Chrome extension** - Check voice consistency anywhere
- **Slack integration** - Generate content from Slack
- **Brand asset library** - Store logos, colors, fonts
- **Compliance checking** - Ensure legal/regulatory compliance

### v3 Features
- **Voice training** - Interactive lessons on maintaining brand voice
- **Competitor monitoring** - Track competitor content and positioning
- **A/B testing** - Test different voice variations
- **Voice marketplace** - Share/sell successful brand voice profiles
- **API access** - Let others integrate with Voice Studio
- **White-label option** - Agencies can rebrand for clients

---

## 🏁 Conclusion

Voice Studio transforms brand voice from a vague concept into a systematic, measurable asset. By combining structured brand management with AI-powered generation and checking, we help teams maintain authentic voices at scale.

**Why This Matters:**
- Consistent brand voice → Higher trust → Better conversions
- Systematic persona targeting → More relevant content → Higher engagement
- AI-powered assistance → Faster content creation → Lower costs
- Integration with Outreach → Seamless workflow → Actual adoption

**Next Steps:**
1. Review and approve this spec
2. Create database migration scripts
3. Start Phase 1 implementation
4. Design Voice Studio UI in Figma (optional)
5. Build and iterate!

---

**Document Status:** Draft v1.0
**Last Updated:** 2025-10-16
**Owner:** Project Loom Team

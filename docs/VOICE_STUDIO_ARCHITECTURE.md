# Voice Studio - Architecture Decision Record (ADR)

## Context

We're building Voice Studio as the second major module of Project Loom. We need to decide on the technical architecture that balances user experience, development velocity, maintainability, and scalability.

---

## Decision

**We will build Voice Studio as an integrated module within the existing Next.js application, not as a separate app.**

---

## Rationale

### ✅ Why Integrated Module

#### 1. **Seamless User Experience**
- Users can switch between Outreach and Voice without logging in again
- Shared navigation and global state
- Brand voices instantly available in email composer
- Single mental model for the entire product

#### 2. **Technical Efficiency**
- Shared authentication (already implemented)
- Single database connection pool
- Reuse existing UI components
- One deployment pipeline
- Shared API client and utilities

#### 3. **Development Velocity**
- Team doesn't context-switch between repos
- Easier to implement cross-module features
- Faster iteration on integration points
- Simpler testing (no cross-app E2E complexity)

#### 4. **Cost Efficiency**
- Single hosting environment
- Shared infrastructure (CDN, databases)
- Lower operational overhead
- Unified monitoring and logging

### ❌ Why Not Separate Apps

#### Issues with Microservices Frontend
1. **Data Synchronization**: Keeping brands/personas in sync between apps is complex
2. **Authentication**: Need SSO or duplicate auth flow
3. **Shared State**: Can't easily share selected brand across apps
4. **Bundle Duplication**: UI components duplicated = larger total download
5. **Development Overhead**: Two package.json, two build processes, two deployments
6. **User Friction**: Opening new tabs/windows, losing context

#### When to Split?
Consider separate apps only when:
- Voice Studio has 1M+ active users with different scale needs
- Teams are completely independent with no shared code
- Performance requires dedicated infrastructure
- Regulatory needs force separation

**We're not there yet.**

---

## Implementation Strategy

### File Structure

```
apps/web/
├── app/
│   ├── (auth)/                    # Auth pages (existing)
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── (outreach)/                # Outreach Studio Module
│   │   ├── layout.tsx             # Outreach-specific layout
│   │   ├── composer/
│   │   ├── sequences/
│   │   ├── analytics/
│   │   ├── replies/
│   │   ├── settings/
│   │   └── templates/
│   │
│   ├── (voice)/                   # Voice Studio Module (NEW)
│   │   ├── layout.tsx             # Voice-specific layout
│   │   ├── brands/
│   │   │   ├── page.tsx           # List brands
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Brand details
│   │   │       ├── edit/
│   │   │       └── examples/
│   │   │
│   │   ├── personas/
│   │   │   ├── page.tsx           # List personas
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   │
│   │   ├── topics/
│   │   │   ├── page.tsx           # Topic library
│   │   │   ├── generate/          # Generator UI
│   │   │   └── [id]/
│   │   │
│   │   └── checker/
│   │       └── page.tsx           # Voice consistency checker
│   │
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing/dashboard
│
├── components/
│   ├── outreach/                  # Outreach-specific components
│   ├── voice/                     # Voice-specific components (NEW)
│   │   ├── brand-selector.tsx
│   │   ├── brand-wizard/
│   │   ├── persona-builder/
│   │   ├── topic-generator/
│   │   ├── voice-checker/
│   │   └── shared/
│   └── shared/                    # Shared across modules
│       ├── navigation/
│       ├── module-switcher.tsx    # Switch between modules
│       └── layouts/
│
└── lib/
    ├── api/
    │   ├── outreach.ts            # Outreach API calls
    │   ├── voice.ts               # Voice API calls (NEW)
    │   └── shared.ts              # Shared API client
    └── stores/
        ├── outreach-store.ts
        └── voice-store.ts         # (NEW)
```

### Route Groups Strategy

Next.js 14 [route groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) allow us to:

1. **Organize by feature** without affecting URL structure
2. **Apply different layouts** per module
3. **Co-locate related files** logically
4. **Share common layouts** where needed

**Example URL structure:**
```
/composer              → Outreach Studio
/sequences             → Outreach Studio
/brands                → Voice Studio
/personas              → Voice Studio
/checker               → Voice Studio
```

Notice: No `/outreach/` or `/voice/` prefix in URLs. Clean!

---

## Module Switching

### Top Navigation Design

```tsx
// components/shared/navigation/module-switcher.tsx

export function ModuleSwitcher() {
  const pathname = usePathname();
  const currentModule = pathname.startsWith('/brands') ||
                        pathname.startsWith('/personas') ||
                        pathname.startsWith('/topics') ||
                        pathname.startsWith('/checker')
    ? 'voice'
    : 'outreach';

  return (
    <nav className="flex items-center gap-2 px-4 py-2 border-b">
      {/* Logo */}
      <Link href="/">
        <Logo />
      </Link>

      {/* Module Tabs */}
      <div className="flex gap-1 ml-8">
        <ModuleTab
          icon="📧"
          label="Outreach"
          href="/composer"
          active={currentModule === 'outreach'}
        />
        <ModuleTab
          icon="🎨"
          label="Voice"
          href="/brands"
          active={currentModule === 'voice'}
        />
        <ModuleTab
          icon="📊"
          label="Analytics"
          href="/analytics"
          active={false}
          badge="Soon"
        />
      </div>

      {/* Right side: Profile, Settings, etc */}
      <div className="ml-auto flex items-center gap-4">
        <NotificationBell />
        <UserMenu />
      </div>
    </nav>
  );
}
```

### Context-Aware Layout

```tsx
// app/(voice)/layout.tsx

export default function VoiceLayout({ children }) {
  return (
    <>
      <ModuleSwitcher />
      <div className="flex">
        {/* Voice Studio Sidebar */}
        <VoiceSidebar />

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
```

```tsx
// app/(outreach)/layout.tsx

export default function OutreachLayout({ children }) {
  return (
    <>
      <ModuleSwitcher />
      <div className="flex">
        {/* Outreach Studio Sidebar */}
        <OutreachSidebar />

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
```

---

## State Management

### Approach: Zustand + React Query

**Why not Redux?**
- Too verbose for our needs
- Boilerplate overhead
- Learning curve for new devs

**Why Zustand?**
- Minimal boilerplate
- TypeScript-first
- Small bundle size (3KB)
- Simple API

**Why React Query?**
- Perfect for server state
- Built-in caching
- Automatic refetching
- Optimistic updates

### Store Structure

```typescript
// lib/stores/voice-store.ts

interface VoiceState {
  // Selected brand (global state)
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;

  // Selected persona (for topic generation)
  selectedPersona: Persona | null;
  setSelectedPersona: (persona: Persona | null) => void;

  // Current voice check
  currentCheck: VoiceCheck | null;
  setCurrentCheck: (check: VoiceCheck | null) => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  selectedBrand: null,
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),

  selectedPersona: null,
  setSelectedPersona: (persona) => set({ selectedPersona: persona }),

  currentCheck: null,
  setCurrentCheck: (check) => set({ currentCheck: check }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

```typescript
// lib/api/voice.ts - React Query hooks

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => apiClient.get('/voice/brands'),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBrandRequest) =>
      apiClient.post('/voice/brands', data),
    onSuccess: () => {
      // Invalidate and refetch brands list
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function usePersonas(brandId: number) {
  return useQuery({
    queryKey: ['personas', brandId],
    queryFn: () => apiClient.get(`/voice/brands/${brandId}/personas`),
    enabled: !!brandId, // Only fetch if brandId exists
  });
}

export function useGenerateTopics() {
  return useMutation({
    mutationFn: (data: GenerateTopicsRequest) =>
      apiClient.post('/voice/topics/generate', data),
  });
}

export function useCheckVoice() {
  return useMutation({
    mutationFn: (data: VoiceCheckRequest) =>
      apiClient.post('/voice/checker/analyze', data),
  });
}
```

### Usage in Components

```tsx
// app/(voice)/brands/page.tsx

export default function BrandsPage() {
  const { data: brands, isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const { selectedBrand, setSelectedBrand } = useVoiceStore();

  const handleCreate = async (data: BrandForm) => {
    const brand = await createBrand.mutateAsync(data);
    setSelectedBrand(brand);
    router.push(`/brands/${brand.id}`);
  };

  return (
    <div>
      <BrandList
        brands={brands}
        selected={selectedBrand}
        onSelect={setSelectedBrand}
      />
      <CreateBrandButton onClick={handleCreate} />
    </div>
  );
}
```

---

## Database Design Decisions

### JSON vs. Separate Tables

**Using JSON for `voice_profile`:**

✅ **Pros:**
- Flexibility: Easy to add new voice attributes
- Simplicity: Single row query gets all voice data
- Versioning: Can evolve schema without migrations
- Denormalization: Faster reads

❌ **Cons:**
- Can't query individual attributes efficiently
- No database-level validation
- Harder to aggregate (e.g., "average formality across all brands")

**Decision: Use JSON** because:
1. Voice profiles are always retrieved together
2. Attributes are tightly coupled
3. Schema is still evolving
4. Individual attribute queries aren't a primary use case

### Arrays vs. Junction Tables

**Using arrays for `do_use`, `dont_use`, `goals`, etc:**

✅ **Pros:**
- Simple for small lists (<100 items)
- Atomic updates
- Native PostgreSQL array support

❌ **Cons:**
- Limited querying (no full-text search on array elements in SQLite)
- Size limits
- No metadata per item

**Decision: Use arrays** for now because:
1. Lists are typically 10-50 items
2. We don't need complex queries on individual items
3. Can migrate to junction tables if needed

---

## API Design

### RESTful Structure

```
Voice Studio Endpoints:
========================

Brands:
GET    /v1/voice/brands                    List all brands
POST   /v1/voice/brands                    Create brand
GET    /v1/voice/brands/{id}               Get brand details
PATCH  /v1/voice/brands/{id}               Update brand
DELETE /v1/voice/brands/{id}               Delete brand
POST   /v1/voice/brands/{id}/analyze       Analyze uploaded content
GET    /v1/voice/brands/{id}/examples      List examples

Personas:
GET    /v1/voice/brands/{id}/personas      List personas for brand
POST   /v1/voice/brands/{id}/personas      Create persona
GET    /v1/voice/personas/{id}             Get persona details
PATCH  /v1/voice/personas/{id}             Update persona
DELETE /v1/voice/personas/{id}             Delete persona
GET    /v1/voice/personas/templates        List templates

Topics:
POST   /v1/voice/topics/generate           Generate topics
GET    /v1/voice/topics                    List saved topics
POST   /v1/voice/topics/{id}/favorite      Toggle favorite
DELETE /v1/voice/topics/{id}               Delete topic

Voice Checker:
POST   /v1/voice/checker/analyze           Analyze content
GET    /v1/voice/checker/history           Check history
GET    /v1/voice/checker/history/{id}      Get specific check

Integration:
GET    /v1/voice/integration/brands        Brands for dropdown (lightweight)
```

### Request/Response Examples

**Create Brand:**
```json
POST /v1/voice/brands

Request:
{
  "name": "Acme SaaS",
  "industry": "B2B SaaS",
  "voice_profile": {
    "tone": "professional yet approachable",
    "vocabulary": "clear, jargon-free",
    "sentence_structure": "mix of short and medium",
    "pacing": "moderate",
    "emotion": "optimistic",
    "authority_level": "expert but not condescending",
    "humor": "light touches",
    "storytelling": "uses relatable examples"
  },
  "do_use": [
    "help you succeed",
    "simple solution",
    "proven results"
  ],
  "dont_use": [
    "synergy",
    "leverage",
    "game-changing"
  ]
}

Response: 201 Created
{
  "id": 1,
  "name": "Acme SaaS",
  "industry": "B2B SaaS",
  "voice_profile": { ... },
  "do_use": [ ... ],
  "dont_use": [ ... ],
  "is_active": true,
  "created_at": "2025-10-16T10:00:00Z"
}
```

**Generate Topics:**
```json
POST /v1/voice/topics/generate

Request:
{
  "brand_id": 1,
  "persona_id": 2,
  "content_type": "email",
  "campaign_goal": "awareness",
  "quantity": 20
}

Response: 200 OK
{
  "topics": [
    {
      "id": 101,
      "title": "5 Marketing Metrics Every VP Should Track",
      "description": "Help marketing leaders focus on what matters...",
      "relevance_score": 92,
      "persona_pain_point": "Overwhelmed by data",
      "keywords": ["metrics", "KPIs", "analytics"],
      "estimated_engagement": "high"
    },
    // ... 19 more
  ],
  "generation_metadata": {
    "model": "gpt-4",
    "tokens_used": 1250,
    "duration_ms": 3200
  }
}
```

**Voice Check:**
```json
POST /v1/voice/checker/analyze

Request:
{
  "brand_id": 1,
  "content_text": "We're excited to leverage synergies...",
  "content_type": "email"
}

Response: 200 OK
{
  "id": 201,
  "overall_score": 67,
  "analysis_details": {
    "tone_match": {
      "score": 75,
      "feedback": "Tone is mostly professional but slightly too corporate"
    },
    "vocabulary_match": {
      "score": 45,
      "feedback": "Using banned corporate jargon",
      "flagged_words": ["leverage", "synergies"]
    },
    // ... other attributes
  },
  "suggested_edits": [
    {
      "original": "leverage synergies",
      "suggested": "work together",
      "reason": "Avoid corporate jargon from Don't list"
    }
  ]
}
```

---

## Performance Considerations

### Code Splitting

Next.js 14 automatically code-splits by route. Voice Studio pages won't load until user navigates there.

**Bundle Size Estimates:**
- Outreach Studio: ~200KB (gzipped)
- Voice Studio: ~180KB (gzipped)
- Shared: ~150KB (gzipped)
- Total on first load: ~350KB
- Total with Voice: ~530KB

**Optimization:**
- Lazy load Monaco Editor (for content input) on demand
- Lazy load Recharts only on analytics pages
- Dynamic imports for heavy components

### Caching Strategy

**React Query defaults:**
- Cache time: 5 minutes
- Stale time: 0 seconds
- Refetch on window focus: Yes

**Voice Studio overrides:**
```typescript
// Brands change infrequently
useBrands({
  staleTime: 1000 * 60 * 10, // 10 minutes
  cacheTime: 1000 * 60 * 30, // 30 minutes
});

// Personas also fairly stable
usePersonas({
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Topic generation results are fresh
useGenerateTopics({
  // Use defaults
});
```

### Database Indexes

Already included in schema, but key ones:
```sql
-- Critical for performance
CREATE INDEX idx_brands_user_active ON brands(user_id, is_active);
CREATE INDEX idx_personas_brand ON personas(brand_id);
CREATE INDEX idx_topics_brand_persona ON content_topics(brand_id, persona_id);
CREATE INDEX idx_topics_favorites ON content_topics(user_id, is_favorite);
CREATE INDEX idx_checks_brand_date ON voice_checks(brand_id, created_at DESC);
```

---

## Security Considerations

### Row-Level Security

All queries must filter by `user_id`:

```python
# ❌ BAD - No user filtering
@router.get("/voice/brands")
def list_brands(db: Session):
    return db.query(Brand).all()

# ✅ GOOD - User filtering
@router.get("/voice/brands")
def list_brands(
    db: Session,
    current_user: User = Depends(get_current_user)
):
    return db.query(Brand).filter(
        Brand.user_id == current_user.id
    ).all()
```

### Input Validation

Use Pydantic for all requests:

```python
class CreateBrandRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    industry: str = Field(..., max_length=50)
    voice_profile: dict  # Validated separately
    do_use: List[str] = Field(default_factory=list, max_items=100)
    dont_use: List[str] = Field(default_factory=list, max_items=100)

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
```

### Rate Limiting

Voice checker and topic generator are AI-heavy:

```python
# Rate limit: 10 topic generations per minute
@router.post("/voice/topics/generate")
@limiter.limit("10/minute")
async def generate_topics(...):
    ...

# Rate limit: 20 voice checks per minute
@router.post("/voice/checker/analyze")
@limiter.limit("20/minute")
async def check_voice(...):
    ...
```

---

## Testing Strategy

### Unit Tests

```typescript
// components/voice/brand-wizard/voice-attributes.test.tsx
describe('VoiceAttributesForm', () => {
  it('renders all 8 voice attributes', () => {
    render(<VoiceAttributesForm />);
    expect(screen.getByLabelText('Tone')).toBeInTheDocument();
    expect(screen.getByLabelText('Vocabulary')).toBeInTheDocument();
    // ... 6 more
  });

  it('validates required fields', async () => {
    render(<VoiceAttributesForm />);
    fireEvent.click(screen.getByText('Next'));
    expect(await screen.findByText('Tone is required')).toBeInTheDocument();
  });
});
```

### Integration Tests

```python
# tests/test_voice_api.py
def test_create_brand(client, auth_headers):
    response = client.post(
        "/v1/voice/brands",
        json={
            "name": "Test Brand",
            "industry": "SaaS",
            "voice_profile": {...},
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Brand"

def test_user_cannot_access_others_brands(client, auth_headers):
    # Create brand as user A
    brand = create_test_brand(user_id=1)

    # Try to access as user B
    response = client.get(
        f"/v1/voice/brands/{brand.id}",
        headers=get_auth_headers(user_id=2)
    )
    assert response.status_code == 404
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/voice-studio/brand-creation.spec.ts
test('user can create a brand', async ({ page }) => {
  await page.goto('/brands');
  await page.click('text=Create Brand');

  await page.fill('[name="name"]', 'Test Brand');
  await page.selectOption('[name="industry"]', 'SaaS');

  await page.click('text=Next');

  // Fill voice attributes
  await page.fill('[name="tone"]', 'Professional yet approachable');
  await page.click('text=Next');

  await page.click('text=Create Brand');

  await expect(page.locator('text=Brand created successfully')).toBeVisible();
  await expect(page).toHaveURL(/\/brands\/\d+/);
});
```

---

## Migration Path

### From Monolith to Modules (if needed)

If Voice Studio grows too large:

1. **Extract shared components** to `packages/ui`
2. **Move Voice to separate app** but keep shared package
3. **Implement SSO** using NextAuth or similar
4. **Set up API gateway** to route between services
5. **Use shared database** or event-driven sync

**This is future work. Start integrated.**

---

## Deployment

### Single Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy Project Loom

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: pnpm install

      - name: Build frontend (includes Voice Studio)
        run: pnpm --filter @loom/web build

      - name: Deploy to Vercel
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Deploy backend
        run: |
          # Deploy FastAPI (includes Voice endpoints)
          fly deploy ./apps/api
```

---

## Conclusion

**We're building Voice Studio as an integrated module** because:

1. ✅ Better UX - seamless switching, shared state
2. ✅ Faster development - shared code, single deployment
3. ✅ Lower costs - shared infrastructure
4. ✅ Easier integration - brands immediately available in emails

**We're using:**
- Next.js 14 route groups for organization
- Zustand + React Query for state
- JSON columns for flexibility
- PostgreSQL-compatible schema

**We'll split later if:**
- Massive scale requires it (1M+ users)
- Teams become completely independent
- Different tech stacks are needed

**But for now: One app, multiple modules, great UX.**

---

**Document Status:** Final v1.0
**Last Updated:** 2025-10-16
**Approved By:** Architecture Team

# NutriCoach Pro - Frontend Codemap

**Generated:** 2026-02-01
**Version:** 0.1.0
**Scope:** React Components, Pages, UI Elements

---

## Overview

The frontend is built with Next.js 14 App Router, React 19, TypeScript, and Tailwind CSS. It follows a component-based architecture with shadcn/ui for the design system.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND ARCHITECTURE                              │
│                      (Next.js App Router + React)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   (auth)      │           │  (dashboard)  │           │   Components  │
│   Routes      │           │   Routes      │           │               │
│               │           │               │           │ - Layout      │
│ - login       │           │ - clients     │           │ - Forms       │
│ - register    │           │ - analysis    │           │ - Display     │
└───────────────┘           │ - recommend   │           │ - PDF         │
                            └───────────────┘           └───────────────┘
```

---

## Page Structure (App Router)

```
app/
├── layout.tsx                        # Root layout (fonts, metadata)
├── page.tsx                          # Home/landing page
│
├── (auth)/                           # Auth route group
│   ├── layout.tsx                    # Auth layout (no navbar)
│   ├── login/
│   │   └── page.tsx                 # Login form
│   └── register/
│       └── page.tsx                 # Registration form
│
├── (dashboard)/                      # Dashboard route group
│   ├── layout.tsx                    # Dashboard layout (navbar + sidebar)
│   ├── dashboard/
│   │   └── page.tsx                 # Dashboard home with stats
│   ├── settings/
│   │   └── page.tsx                 # User settings
│   │
│   ├── clients/
│   │   ├── page.tsx                 # Client list view
│   │   ├── new/
│   │   │   └── page.tsx             # Create new client
│   │   └── [id]/
│   │       ├── page.tsx             # Client detail view
│   │       ├── edit/
│   │       │   └── page.tsx         # Edit client
│   │       └── consultations/
│   │           ├── page.tsx         # Consultation list
│   │           ├── new/
│   │           │   └── page.tsx     # Create consultation
│   │           └── [consultationId]/
│   │               ├── page.tsx     # Consultation detail
│   │               └── edit/
│   │                   └── page.tsx # Edit consultation
│   │
│   ├── analysis/
│   │   ├── page.tsx                 # Analysis list
│   │   ├── new/
│   │   │   └── page.tsx             # Upload & analyze report
│   │   └── [id]/
│   │       ├── page.tsx             # Analysis detail
│   │       └── edit/
│   │           └── page.tsx         # Edit analysis
│   │
│   └── recommendations/
│       ├── page.tsx                 # Recommendation list
│       ├── new/
│       │   └── page.tsx             # Generate recommendation
│       └── [id]/
│           ├── page.tsx             # Recommendation detail
│           ├── food-guide/
│           │   └── page.tsx         # Food guide view
│           ├── exercise-plan/
│           │   └── page.tsx         # Exercise plan view
│           └── intervention/
│               └── page.tsx         # Intervention summary
```

---

## Layout Components

### Root Layout (`app/layout.tsx`)
**Responsibilities:**
- Global font configuration (Noto Sans SC for Chinese)
- Metadata management
- Session provider wrapper
- Toast notifications

**Dependencies:**
- `components/providers/AuthProvider.tsx`
- `next/font/google` - Font loading

---

### Auth Layout (`app/(auth)/layout.tsx`)
**Responsibilities:**
- Clean layout without navigation
- Centered content container
- Consistent auth page styling

---

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
**Responsibilities:**
- Navigation bar (top)
- Sidebar navigation
- Responsive design (mobile drawer)
- Breadcrumb display

**Dependencies:**
- `components/layout/DashboardNav.tsx` - Sidebar
- `components/layout/DashboardNavbar.tsx` - Top bar

---

## Page Components Detail

### Authentication Pages

#### Login Page (`app/(auth)/login/page.tsx`)
**Features:**
- Email/password form
- "Remember me" checkbox
- Link to registration
- Error display from NextAuth

**Dependencies:**
- `next-auth/react` - `signIn()` function
- React Hook Form
- Zod validation

---

#### Registration Page (`app/(auth)/register/page.tsx`)
**Features:**
- Name, email, password fields
- Password confirmation
- Client-side validation
- Redirect to login after success

**API:** `POST /api/auth/register`

---

### Dashboard Pages

#### Dashboard Home (`app/(dashboard)/dashboard/page.tsx`)
**Features:**
- Weekly statistics cards
- Action items (todos)
- Quick links to common actions
- Recent activity list

**Dependencies:**
- `components/dashboard/WeeklyStats.tsx`
- `components/dashboard/TodoList.tsx`
- API: `/api/dashboard/todos`, `/api/dashboard/weekly-stats`

---

### Client Pages

#### Client List (`app/(dashboard)/clients/page.tsx`)
**Features:**
- Searchable client table
- Filter by health concerns
- Sort by name, date, BMI
- Pagination
- Quick actions (view, edit, delete)

**Dependencies:**
- API: `GET /api/clients`
- Client data display components

---

#### Client Detail (`app/(dashboard)/clients/[id]/page.tsx`)
**Features:**
- Client profile header
- Health concerns display
- BMI calculator
- Tabs: Reports, Recommendations, Diet Photos, Consultations
- Quick action buttons

**Dependencies:**
- `ClientReportsList.tsx`
- `ClientRecommendationsList.tsx`
- `DietPhotoCard.tsx`
- API: `GET /api/clients/[id]`

---

#### Client Create/Edit (`app/(dashboard)/clients/new/page.tsx`, `edit/page.tsx`)
**Features:**
- Multi-step form:
  1. Basic info (name, gender, birthdate)
  2. Body metrics (height, weight, activity level)
  3. Health data (allergies, medical history, concerns)
  4. Preferences (dietary preferences, requirements)
- Real-time BMI calculation
- Tag input for allergies/concerns

**Dependencies:**
- React Hook Form
- Zod validation
- API: `POST /api/clients`, `PATCH /api/clients/[id]`

---

### Consultation Pages

#### Consultation List (`app/(dashboard)/clients/[id]/consultations/page.tsx`)
**Features:**
- Timeline view of consultations
- Filter by date range
- Summary cards with key findings
- Add new consultation button

**Dependencies:**
- API: `GET /api/clients/[id]/consultations`

---

#### Consultation Detail (`app/(dashboard)/clients/[id]/consultations/[consultationId]/page.tsx`)
**Features:**
- Consultation metadata
- Uploaded images gallery
- Text file contents display
- AI analysis results:
  - Diet changes
  - Physical condition feedback
  - Implementation progress
  - Action items
- Notes display

**Dependencies:**
- API: `GET /api/clients/[id]/consultations/[consultationId]`

---

#### Consultation Create/Edit (`app/(dashboard)/clients/[id]/consultations/new/page.tsx`)
**Features:**
- Consultation type selector
- Session notes textarea
- Image upload (drag & drop)
- Text file upload (.txt, .md, .doc, .docx)
- Real-time file size validation
- Submit and analyze button

**Dependencies:**
- `components/consultation/FileUploader.tsx`
- `components/consultation/ConsultationForm.tsx`
- API: `POST /api/clients/[id]/consultations`
- File validation: `lib/utils/fileUtils.ts`

---

### Analysis Pages

#### Analysis List (`app/(dashboard)/analysis/page.tsx`)
**Features:**
- Table of uploaded reports
- Filter by client
- Status badges (analyzed/pending)
- Quick actions (view, delete)

**Dependencies:**
- API: `GET /api/reports`

---

#### Upload Report (`app/(dashboard)/analysis/new/page.tsx`)
**Features:**
- Client selector
- File upload (drag & drop)
- Image preview
- Progress indicator during upload
- Real-time AI analysis

**Dependencies:**
- API: `POST /api/reports/upload`

---

#### Analysis Detail (`app/(dashboard)/analysis/[id]/page.tsx`)
**Features:**
- Health summary card
- Abnormal indicators table
- BMI & health score display
- Nutrient deficiencies list
- Risk factors list
- Generate recommendation button

**Dependencies:**
- `components/analysis/HealthSummaryCard.tsx`
- `components/analysis/OCRDataDisplay.tsx`
- API: `GET /api/reports/[id]`

---

### Recommendation Pages

#### Recommendation List (`app/(dashboard)/recommendations/page.tsx`)
**Features:**
- Filter by type (diet/exercise/lifestyle/comprehensive)
- Filter by client
- Sort by date
- Cards with summary preview

**Dependencies:**
- API: `GET /api/recommendations`

---

#### Generate Recommendation (`app/(dashboard)/recommendations/new/page.tsx`)
**Features:**
- Client selector
- Report selector (optional)
- Type selector
- Generate button with loading state
- Success message with link to view

**Dependencies:**
- API: `POST /api/recommendations/generate`

---

#### Recommendation Detail (`app/(dashboard)/recommendations/[id]/page.tsx`)
**Features:**
- Tabbed interface:
  - Overview (health score, summary)
  - Health Analysis (indicators, risks)
  - Food Guide (traffic lights, meal plan)
  - Exercise Plan (2-week schedule)
  - Action Plan (supplements, lifestyle)
- Export PDF button
- Share button

**Dependencies:**
- `components/recommendations/RecommendationNav.tsx`
- `components/recommendations/RecommendationTabs.tsx`
- `components/recommendations/RecommendationOverview.tsx`
- `components/recommendations/HealthAnalysisTab.tsx`
- `components/recommendations/FoodGuideTab.tsx`
- `components/recommendations/ExercisePlanTab.tsx`
- `components/recommendations/ActionPlanTab.tsx`
- API: `GET /api/recommendations/[id]`

---

## Component Library

### Layout Components (`components/layout/`)

#### DashboardNav (`DashboardNav.tsx`)
**Responsibilities:**
- Sidebar navigation
- Menu items with icons
- Active route highlighting
- Mobile drawer toggle

**Menu Items:**
- Dashboard
- Clients
- Analysis
- Recommendations
- Settings

---

#### DashboardNavbar (`DashboardNavbar.tsx`)
**Responsibilities:**
- Top navigation bar
- User menu (dropdown)
- Notifications badge
- Breadcrumb display
- Mobile menu toggle

---

#### ProtectedLayout (`ProtectedLayout.tsx`)
**Responsibilities:**
- Authentication check
- Redirect to login if unauthenticated
- Loading state during auth check
- Child component rendering

**Usage:** Wraps all dashboard pages

---

### Provider Components (`components/providers/`)

#### AuthProvider (`AuthProvider.tsx`)
**Responsibilities:**
- NextAuth session provider
- User context throughout app
- Session refresh handling

**Usage:** Wraps root layout

---

### Display Components

#### HealthSummaryCard (`components/analysis/HealthSummaryCard.tsx`)
**Props:**
- `healthAnalysis: HealthAnalysis`
- `clientInfo: ClientInfo`

**Displays:**
- Health score (0-100) with color coding
- BMI with category badge
- Abnormal indicators count
- Summary text
- Risk factors tags

---

#### OCRDataDisplay (`components/analysis/OCRDataDisplay.tsx`)
**Props:**
- `extractedData: any`
- `analysis: HealthAnalysis | null`

**Displays:**
- Table of all indicators
- Status badges (normal/high/low)
- Normal ranges
- Export JSON button

---

#### DietPhotoCard (`components/DietPhotoCard.tsx`)
**Props:**
- `photo: DietPhoto`
- `onAnalyze?: () => void`
- `onDelete?: () => void`

**Displays:**
- Image thumbnail
- Upload date
- Meal type badge
- Analysis score with color
- Compliance rating
- Action buttons

---

#### MealGroupCard (`components/MealGroupCard.tsx`)
**Props:**
- `mealGroup: DietPhotoMealGroup`
- ` onViewDetails: () => void`

**Displays:**
- Date and meal type
- Photo count
- Average score
- Overall rating
- Preview thumbnails

---

#### WeeklyDietSummaryCard (`components/weekly-diet-summary/WeeklyDietSummaryCard.tsx`)
**Props:**
- `summary: WeeklyDietSummary`
- ` onViewDetails: () => void`

**Displays:**
- Week range
- Average score
- Overall rating
- Key highlights
- Concerns count

---

#### TrafficLightGuide (`components/TrafficLightGuide.tsx`)
**Props:**
- `greenFoods: FoodItem[]`
- `yellowFoods: FoodItem[]`
- `redFoods: FoodItem[]`

**Displays:**
- Three sections with color coding
- Food items with reasons
- Expandable sections
- Print-friendly layout

---

#### HeartRateZones (`components/HeartRateZones.tsx`)
**Props:**
- `age: number`
- `restingHeartRate?: number`

**Calculates:**
- Maximum heart rate (220 - age)
- Target zones (50-60%, 60-70%, 70-80%)
- Karvonen formula if RHR provided

**Displays:**
- Zone cards with BPM ranges
- Visual zone chart
- Exercise recommendations per zone

---

#### ExercisePrescription (`components/ExercisePrescription.tsx`)
**Props:**
- `prescription: DetailedExercisePrescription`

**Displays:**
- Overview text
- Equipment list
- Weekly schedule (accordion)
- Day-by-day exercises
- Precautions list
- Success criteria

---

#### TwoWeekPlan (`components/TwoWeekPlan.tsx`)
**Props:**
- `schedule: WeeklySchedule[]`

**Displays:**
- Week tabs
- Day-by-day workout cards
- Exercise details (sets, reps, rest)
- Notes and precautions

---

#### NutritionInterventionSummary (`components/NutritionInterventionSummary.tsx`)
**Props:**
- `intervention: any` (ComprehensiveRecommendation content)

**Displays:**
- Daily targets (calories, macros)
- Traffic light foods summary
- Biomarker interventions
- Meal plan preview
- Supplements list

---

### Form Components

#### ConsultationForm (`components/consultation/ConsultationForm.tsx`)
**Fields:**
- Consultation type (select)
- Session notes (textarea)
- Image upload (drag & drop)
- Text file upload

**Validation:**
- Required: type, notes
- File size limits

---

#### FileUploader (`components/consultation/FileUploader.tsx`)
**Features:**
- Drag and drop zone
- File type icons
- File size display
- Remove button
- Progress indicator

**Validation:**
- Image: Max 5MB, JPG/PNG/WEBP
- Audio: Max 20MB, MP3/M4A/WAV
- Text: Max 10MB, TXT/MD/DOC/DOCX

---

#### DietPhotoUpload (`components/DietPhotoUpload.tsx`)
**Features:**
- Client selector
- Photo capture (camera)
- Gallery upload
- Meal type selector
- Notes field
- Real-time preview

---

#### MealGroupUpload (`components/MealGroupUpload.tsx`)
**Features:**
- Date picker
- Meal type selector
- Multi-photo upload
- Text description option
- Notes field

---

### Dashboard Components

#### WeeklyStats (`components/dashboard/WeeklyStats.tsx`)
**API:** `/api/dashboard/weekly-stats`

**Displays:**
- Stat cards:
  - New clients
  - Reports analyzed
  - Recommendations generated
  - Diet photos analyzed
- Trend indicators (up/down arrows)
- Week range display

---

#### TodoList (`components/dashboard/TodoList.tsx`)
**API:** `/api/dashboard/todos`

**Displays:**
- Action items grouped by priority
- Client names with links
- Action buttons
- Empty state

---

### PDF Components (`components/pdf/`)

#### PDFDocument (`PDFDocument.tsx`)
**Wrapper:** `@react-pdf/renderer` Document

**Sections:**
- Cover page
- Health analysis
- Food guide
- Exercise plan
- Supplements

---

#### PDFFoodGuide (`PDFFoodGuide.tsx`)
**Content:**
- Traffic light foods
- One-day meal plan
- Portion sizes
- Cooking tips

**Features:**
- Chinese font support
- Color-coded sections
- Tables for meal plans

---

#### PDFExercisePlan (`PDFExercisePlan.tsx`)
**Content:**
- 2-week schedule
- Exercise details
- Target heart rates
- Precautions

**Features:**
- Weekly breakdown
- Day-by-day tables
- Exercise descriptions

---

#### PDFFoodGuideMobile (`PDFFoodGuideMobile.tsx`)
**Purpose:** Mobile-optimized food guide

**Features:**
- Smaller page size
- Condensed layout
- Quick reference

---

#### PDFRecommendationSummary (`PDFRecommendationSummary.tsx`)
**Content:**
- Health score
- Summary
- Key recommendations

---

#### PDFPlanEvaluation (`PDFPlanEvaluation.tsx`)
**Content:**
- Safety score
- Concerns list
- Suggestions
- Optimized plan

---

#### PDFOptimizedPlan (`PDFOptimizedPlan.tsx`)
**Content:**
- Optimized diet plan
- Optimized exercise plan
- Adjustment notes

---

### Recommendation Display Components

#### RecommendationNav (`RecommendationNav.tsx`)
**Tabs:**
- Overview
- Health Analysis
- Food Guide
- Exercise Plan
- Action Plan

**Features:**
- Active tab highlight
- Smooth scrolling
- Mobile-friendly

---

#### RecommendationTabs (`RecommendationTabs.tsx`)
**Responsibilities:**
- Tab content rendering
- Active state management
- Lazy loading

---

#### RecommendationOverview (`RecommendationOverview.tsx`)
**Content:**
- Client info card
- Health score gauge
- Summary text
- Quick stats

---

#### HealthAnalysisTab (`HealthAnalysisTab.tsx`)
**Content:**
- Indicators table
- Charts:
  - Macro distribution
  - Health indicator trends
- Nutrient deficiencies
- Risk factors

**Dependencies:**
- `recharts` - Data visualization
- `MacroDistributionChart.tsx`
- `HealthIndicatorChart.tsx`

---

#### FoodGuideTab (`FoodGuideTab.tsx`)
**Content:**
- Traffic light foods
- One-day meal plan
- Biomarker interventions
- Print button

---

#### ExercisePlanTab (`ExercisePlanTab.tsx`)
**Content:**
- 2-week schedule
- Exercise videos (links)
- Heart rate zones
- Precautions

**Dependencies:**
- `TwoWeekPlan.tsx`
- `HeartRateZones.tsx`
- `lib/exercise-videos.ts`

---

#### ActionPlanTab (`ActionPlanTab.tsx`)
**Content:**
- Supplements list
- Lifestyle modifications
- Follow-up plan
- Export buttons

**Dependencies:**
- `SupplementsTab.tsx`
- `CollapsibleSection.tsx`

---

### UI Components (`components/ui/`)

From shadcn/ui:
- `button.tsx` - Button variants
- `card.tsx` - Card container
- `badge.tsx` - Status badges
- `tabs.tsx` - Tab navigation
- `alert.tsx` - Alert banners
- `progress.tsx` - Progress bars

**Customization:**
- Tailwind CSS styling
- Theme-agnostic (can add dark mode)

---

## State Management

### Client State
- **React Context:** Auth session (NextAuth)
- **URL Params:** Client ID, recommendation ID
- **Local State:** Form data, UI state

### Server State
- **Server Actions:** Future (Next.js 14+)
- **API Routes:** Current approach
- **SWR/React Query:** Recommended for future

---

## Styling Strategy

### Tailwind CSS
- Utility-first approach
- Responsive design (mobile-first)
- Custom colors in `tailwind.config.ts`
- Chinese font: `@fontsource/noto-sans-sc`

### Component Styling
```tsx
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  {/* Content */}
</div>
```

### Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

---

## Data Fetching Patterns

### Client-Side Fetching
```typescript
const [data, setData] = useState(null);
useEffect(() => {
  fetch(`/api/clients/${id}`)
    .then(res => res.json())
    .then(data => setData(data));
}, [id]);
```

### Server-Side Fetching (Recommended for future)
```typescript
async function getClient(id: string) {
  const res = await fetch(`/api/clients/${id}`, {
    cache: 'no-store'
  });
  return res.json();
}
```

---

## Performance Optimizations

### Code Splitting
- Route-based (automatic with App Router)
- Dynamic imports for heavy components

### Image Optimization
- `next/image` for automatic optimization
- Lazy loading for galleries
- Thumbnail generation

### Font Loading
- `next/font/google` for automatic optimization
- Self-hosting for Chinese fonts

---

## Accessibility

### Semantic HTML
- Proper heading hierarchy
- ARIA labels where needed
- Keyboard navigation support

### Focus Management
- Visible focus indicators
- Logical tab order
- Modal focus traps

### Color Contrast
- WCAG AA compliant (planned)
- Color-blind friendly considerations

---

## Mobile Responsiveness

### Responsive Navigation
- Desktop: Sidebar + top bar
- Mobile: Hamburger menu + drawer

### Touch Targets
- Minimum 44x44px
- Adequate spacing

### Forms
- Full-width inputs on mobile
- Large touch-friendly buttons
- Native date pickers

---

## Component Count Summary

| Category | Components | Purpose |
|----------|------------|---------|
| Layout | 4 | Navigation, structure |
| Providers | 1 | Auth context |
| Display | 15+ | Data presentation |
| Forms | 6 | Data input |
| Dashboard | 2 | Stats & todos |
| PDF | 8 | Document generation |
| Recommendations | 8 | Recommendation display |
| UI | 6 | Base components (shadcn/ui) |
| **Total** | **50+** | Complete frontend |

---

## Future Enhancements

1. **Real-time Updates:** WebSocket for AI analysis progress
2. **Offline Support:** Service worker for PWA
3. **Dark Mode:** Theme toggle
4. **Internationalization:** i18n for multi-language
5. **Advanced Charts:** Interactive health trend visualizations
6. **Drag & Drop:** Meal planning interface
7. **Mobile Apps:** React Native wrapper

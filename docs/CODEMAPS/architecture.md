# NutriCoach Pro - System Architecture Codemap

**Generated:** 2026-02-01
**Version:** 0.1.0
**Analysis Scope:** Complete codebase structure

---

## Overview

NutriCoach Pro is a comprehensive AI-powered nutrition coaching platform built with Next.js 14, designed for professional nutritionists to manage clients, analyze health reports, and generate personalized dietary and exercise recommendations.

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                     NUTRICOACH PRO                          │
                    │                 Nutritionist Intelligence Platform         │
                    └─────────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
│   Frontend    │                   │   Backend     │                   │     AI       │
│   (Next.js)   │◄──────────────────►│   (API Routes)│◄──────────────────►│  (Gemini)    │
│               │                   │               │                   │               │
│ - Dashboard   │                   │ - REST APIs   │                   │ - Analysis   │
│ - Client Mgmt │                   │ - Auth        │                   │ - Generation │
│ - Reports     │                   │ - Validation  │                   │ - Vision     │
└───────────────┘                   └───────────────┘                   └───────────────┘
        │                                     │                                     │
        └─────────────────────────────────────┼─────────────────────────────────────┘
                                              │
                                              ▼
                                    ┌───────────────┐
                                    │  Data Layer   │
                                    │               │
                                    │ - Prisma ORM  │
                                    │ - SQLite      │
                                    │ - File Storage│
                                    └───────────────┘
```

---

## Technology Stack

### Frontend Framework
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library (Radix UI primitives)

### Backend & API
- **Next.js API Routes** - Serverless endpoints
- **NextAuth.js 4.24.13** - Authentication (Credentials provider)
- **Prisma 6.19.1** - ORM for database operations
- **Zod 4.3.4** - Schema validation

### Database
- **SQLite** - Development database (via Prisma)
- **Prisma Client** - Type-safe database queries

### AI & ML
- **Google Gemini 2.5 Pro** - Primary AI model for analysis
- **Google Gemini 2.5 Flash** - Vision model for image analysis
- **AI SDK 6.0.49** - Unified AI integration (@ai-sdk/google)
- **@google/generative-ai 0.24.1** - Alternative Gemini client

### PDF Generation
- **@react-pdf/renderer 4.3.2** - PDF document generation
- **@react-pdf/fontkit 2.1.2** - Font support for Chinese
- **@fontsource/noto-sans-sc 5.2.9** - Chinese font

### File Processing
- **mammoth 1.11.0** - Word document (.docx) processing
- **bcrypt 6.0.0** - Password hashing

### Testing
- **Vitest 4.0.18** - Unit testing framework
- **@testing-library/react 16.3.2** - React component testing
- **@testing-library/user-event 14.6.1** - User interaction simulation
- **jsdom 27.4.0** - DOM simulation for tests

---

## System Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        App Router Pages (Next.js)                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   (auth)    │  │ (dashboard) │  │   Clients   │  │ Analysis    │    │ │
│  │  │  - login    │  │  - home     │  │  - list     │  │  - upload   │    │ │
│  │  │  - register │  │  - nav      │  │  - detail   │  │  - results  │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           React Components                              │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐     │ │
│  │  │ Layout/Nav    │  │   Forms       │  │ Display/Cards            │     │ │
│  │  │ - Navbar      │  │ - ClientForm  │  │ - HealthSummary          │     │ │
│  │  │ - Sidebar     │  │ - UploadForm  │  │ - RecommendationView     │     │ │
│  │  │ - Protected   │  │ - ConsultForm │  │ - DietPhotoCard          │     │ │
│  │  └───────────────┘  └───────────────┘  └─────────────────────────┘     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER (Next.js)                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          Authentication                                 │ │
│  │  /api/auth/[...nextauth] - NextAuth.js session management              │ │
│  │  /api/auth/register - User registration with bcrypt hashing             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          Client Management                              │ │
│  │  /api/clients - CRUD operations for clients                             │ │
│  │  /api/clients/[id] - Individual client operations                        │ │
│  │  /api/clients/[id]/reports - Client health reports                      │ │
│  │  /api/clients/[id]/recommendations - Client recommendations             │ │
│  │  /api/clients/[id]/consultations - Consultation records                │ │
│  │  /api/clients/[id]/diet-photos - Diet photo tracking                   │ │
│  │  /api/clients/[id]/meal-groups - Meal grouping                        │ │
│  │  /api/clients/[id]/weekly-diet-summary - Weekly summaries              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          AI & Analysis                                  │ │
│  │  /api/ai/analyze - Health report analysis                               │ │
│  │  /api/ai/recommend - Generate recommendations                           │ │
│  │  /api/ai/analyze-image - Image-based OCR                                │ │
│  │  /api/reports/upload - Upload and analyze reports                       │ │
│  │  /api/recommendations/generate - AI-powered generation                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          PDF Export                                     │ │
│  │  /api/recommendations/[id]/export/pdf - Full recommendation PDF         │ │
│  │  /api/clients/[id]/weekly-diet-summary/[summaryId]/export/pdf - Weekly  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BUSINESS LOGIC LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        AI Services (lib/ai/)                            │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐│ │
│  │  │ gemini.ts - AI model orchestration                                  ││ │
│  │  │  - analyzeHealthReport() - Health analysis from indicators          ││ │
│  │  │  - generateDietRecommendation() - Diet plans                        ││ │
│  │  │  - generateExerciseRecommendation() - Exercise plans               ││ │
│  │  │  - evaluateDietPhotoCompliance() - Photo-based compliance check      ││ │
│  │  │  - analyzeConsultation() - Consultation record analysis             ││ │
│  │  │  - evaluateNutritionistPlan() - Plan safety evaluation              ││ │
│  │  │  - generateWeeklyDietSummary() - Weekly meal aggregation           ││ │
│  │  └────────────────────────────────────────────────────────────────────┘│ │
│  │  ┌────────────────────────────────────────────────────────────────────┐│ │
│  │  │ prompts.ts - Structured prompt templates                           ││ │
│  │  │  - HEALTH_ANALYSIS_PROMPT - Medical nutrition therapy analysis     ││ │
│  │  │  - DIET_RECOMMENDATION_PROMPT - Personalized diet plans            ││ │
│  │  │  - DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT - Food photo analysis   ││ │
│  │  │  - CONSULTATION_ANALYSIS_PROMPT - Consultation insights            ││ │
│  │  │  - EVALUATE_NUTRITIONIST_PLAN_PROMPT - Plan safety check           ││ │
│  │  │  - WEEKLY_DIET_SUMMARY_PROMPT - Weekly aggregation                ││ │
│  │  └────────────────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      Utility Libraries (lib/)                           │ │
│  │  - db/prisma.ts - Database client singleton                            │ │
│  │  - auth.ts, auth-options.ts - Authentication configuration            │ │
│  │  - auth/client-access.ts - Client access control                      │ │
│  │  - storage/file-storage.ts - File system operations                   │ │
│  │  - utils/fileUtils.ts - File validation & conversion                  │ │
│  │  - utils/textFileUtils.ts - Text file processing                     │ │
│  │  - utils/jsonUtils.ts - JSON parsing helpers                          │ │
│  │  - logger.ts - Structured logging                                     │ │
│  │  - exercise-videos.ts - Exercise video links                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Prisma ORM (lib/db/)                             │ │
│  │  prisma.ts - Singleton PrismaClient instance                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      Database Models (Prisma)                           │ │
│  │  User - Nutritionists using the platform                               │ │
│  │  Client - Client profiles with health data                             │ │
│  │  Report - Uploaded health reports (PDF/images)                         │ │
│  │  Recommendation - AI-generated diet/exercise plans                     │ │
│  │  DietPhoto - Individual meal photos with analysis                      │ │
│  │  DietPhotoMealGroup - Grouped meals for comprehensive analysis        │ │
│  │  Consultation - Consultation records with multimedia                   │ │
│  │  PlanEvaluation - Nutritionist plan safety checks                      │ │
│  │  WeeklyDietSummary - Aggregated weekly meal analysis                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐     │
│  │  Google Gemini   │  │   File System    │  │    Browser/Client      │     │
│  │  - gemini-2.5-pro│  │   - Public/      │  │    - Base64 upload     │     │
│  │  - gemini-2.5-flash│ │   - Uploads/    │  │    - Image capture     │     │
│  └──────────────────┘  └──────────────────┘  └────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Patterns

### 1. Repository Pattern (via Prisma)
- Centralized database access through `lib/db/prisma.ts`
- Singleton pattern prevents connection pool exhaustion
- Type-safe queries with generated Prisma types

### 2. Service Layer Pattern
- Business logic isolated in `lib/ai/` for AI operations
- Utility functions grouped by domain in `lib/`
- API routes act as thin controllers, delegating to services

### 3. Strategy Pattern (AI Models)
- Multiple AI models for different use cases:
  - `gemini-2.5-pro` for complex analysis
  - `gemini-2.5-flash` for quick vision tasks
- Model selection based on task requirements

### 4. Builder Pattern (PDF Generation)
- Complex PDF documents built using `@react-pdf/renderer`
- Component-based PDF structure (Document, Page, View, Text)
- Reusable PDF components in `components/pdf/`

### 5. Factory Pattern (Prompts)
- Template functions in `lib/ai/prompts.ts` generate structured prompts
- Parameterized prompts for consistent AI interactions
- Type-safe prompt construction

---

## Data Flow

### Client Registration & Analysis Flow

```
User Input              Frontend                API Layer               AI Service              Database
   │                        │                       │                       │                       │
   ├─► Client Form          │                       │                       │                       │
   │                        │                       │                       │                       │
   │                        ├─► POST /api/clients  │                       │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► Validate (Zod)      │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► prisma.client.create│                       │
   │                        │                       │                       │                       │
   │                        │                       │                       ├─► SQLite DB           │
   │                        │                       │                       │                       │
   │◄───────────────────────┴───────────────────────┴───────────────────────┴───────────────────────┘
   │                        │                       │                       │                       │
   ├─► Upload Report        │                       │                       │                       │
   │                        │                       │                       │                       │
   │                        ├─► POST /api/reports/upload                     │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► Convert to Base64   │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► prisma.report.create│                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► gemini.analyze()───► Gemini API             │
   │                        │                       │                       │                       │
   │                        │                       │◄──────────────────────┤ Analysis Result        │
   │                        │                       │                       │                       │
   │                        │                       ├─► prisma.report.update│                       │
   │                        │                       │                       │                       │
   │◄───────────────────────┴───────────────────────┴───────────────────────┴───────────────────────┘
```

### Diet Photo Compliance Evaluation Flow

```
User Upload              Frontend                API Layer               AI Service              Database
   │                        │                       │                       │                       │
   ├─► Meal Photo           │                       │                       │                       │
   │                        │                       │                       │                       │
   │                        ├─► POST /api/clients/[id]/diet-photos        │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► Get Recommendation  │                       │
   │                        │                       │   from DB             │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► evaluateDietPhoto()│                       │
   │                        │                       │   ───────────────────► Gemini Vision API      │
   │                        │                       │                       │                       │
   │                        │                       │◄──────────────────────┤ Compliance Evaluation  │
   │                        │                       │                       │                       │
   │                        │                       ├─► prisma.dietPhoto.update                      │
   │                        │                       │                       │                       │
   │◄───────────────────────┴───────────────────────┴───────────────────────┴───────────────────────┘
```

### Weekly Summary Generation Flow

```
User Request            Frontend                API Layer               AI Service              Database
   │                        │                       │                       │                       │
   ├─► Generate Summary     │                       │                       │                       │
   │                        │                       │                       │                       │
   │                        ├─► POST /api/clients/[id]/weekly-diet-summary │                   │
   │                        │                       │                       │                       │
   │                        │                       ├─► Get MealGroups      │                       │
   │                        │                       │   (week's data)       │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► Get Recommendation  │                       │
   │                        │                       │   & HealthAnalysis    │                       │
   │                        │                       │                       │                       │
   │                        │                       ├─► generateWeeklySummary()                   │
   │                        │                       │   ───────────────────► Gemini Pro API         │
   │                        │                       │                       │                       │
   │                        │                       │◄──────────────────────┤ Weekly Analysis       │
   │                        │                       │                       │                       │
   │                        │                       ├─► prisma.weeklySummary.create                  │
   │                        │                       │                       │                       │
   │◄───────────────────────┴───────────────────────┴───────────────────────┴───────────────────────┘
```

---

## Security Architecture

### Authentication Flow
```
Client                  Browser                 Server
  │                        │                      │
  ├─► Login Request        │                      │
  │                        │                      │
  │                        ├─► POST /api/auth/[...nextauth]
  │                        │                      │
  │                        │                      ├─► Validate Credentials
  │                        │                      │   (bcrypt.compare)
  │                        │                      │
  │                        │                      ├─► Generate JWT Token
  │                        │                      │
  │                        │◄─ Set Cookie (next-auth.session-token)
  │                        │                      │
  │◄─ Redirect to Dashboard│                      │
```

### Authorization
- **Middleware**: NextAuth.js session validation
- **Access Control**: `lib/auth/client-access.ts` ensures users can only access their own clients
- **Route Protection**: `components/layout/ProtectedLayout.tsx` wraps authenticated pages

---

## Module Dependencies

### Core Dependencies
```
app/
├── Depends on: lib/, types/, components/
└── Exports: Next.js pages, API routes

lib/
├── Depends on: types/, external packages
├── ai/
│   ├── gemini.ts → @ai-sdk/google, types/
│   └── prompts.ts → (pure functions)
├── db/
│   └── prisma.ts → @prisma/client
├── auth*.ts → next-auth, bcrypt
├── storage/ → fs/promises
└── utils/ → (utility functions)

components/
├── Depends on: lib/, types/, ui/, react-pdf
├── layout/ → Dashboard navigation
├── recommendations/ → Recommendation display
├── pdf/ → PDF generation components
└── ui/ → shadcn/ui components

types/
├── Depends on: (none - pure types)
└── Exports: All TypeScript interfaces
```

---

## Deployment Architecture

### Development
```
Local Machine
├── Next.js Dev Server (localhost:3000)
├── SQLite Database (prisma/dev.db)
└── File System (public/uploads/)
```

### Production (Recommended)
```
Vercel / Node.js Host
├── Next.js Production Build
├── PostgreSQL Database (Supabase/Railway)
└── Object Storage (Vercel Blob / AWS S3)
```

---

## Scalability Considerations

### Current Limitations
- **File Storage**: Local filesystem (should migrate to object storage)
- **Database**: SQLite for development (PostgreSQL for production)
- **AI Rate Limits**: Gemini API quotas

### Scaling Strategies
1. **Horizontal Scaling**: Serverless API routes auto-scale on Vercel
2. **Database**: Connection pooling via Prisma Accelerate
3. **CDN**: Static asset delivery via Vercel Edge Network
4. **Caching**: Redis for session data (future enhancement)

---

## Monitoring & Observability

### Logging
- **Structured Logging**: `lib/logger.ts`
- **Error Tracking**: Console.error with context
- **Future**: Sentry integration recommended

### Performance
- **AI Response Times**: Logged in AI service functions
- **Database Queries**: Prisma query logging in development
- **Future**: Vercel Analytics integration

---

## File Count Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| app/ | 47+ | Next.js pages & API routes |
| components/ | 50+ | React components |
| lib/ | 17+ | Utility libraries & AI services |
| types/ | 1 | TypeScript type definitions |
| prisma/ | 1 | Database schema |
| tests/ | 30+ | Unit & integration tests |

**Total Analyzed Files:** 145+ source files

---

## Next Steps

1. **Database Migration**: Migrate from SQLite to PostgreSQL
2. **File Storage**: Implement Vercel Blob or AWS S3
3. **Error Handling**: Centralized error tracking (Sentry)
4. **Testing**: Complete E2E test coverage
5. **Documentation**: API documentation (OpenAPI/Swagger)

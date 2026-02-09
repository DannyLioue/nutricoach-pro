# NutriCoach Pro - Backend Codemap

**Generated:** 2026-02-01
**Version:** 0.1.0
**Scope:** API Routes, Server-side Logic, AI Services

---

## Overview

The backend is built on Next.js API Routes (App Router), providing RESTful endpoints for client management, health report analysis, AI-powered recommendations, and PDF export functionality.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND ARCHITECTURE                               │
│                     (Next.js API Routes + Services)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  Auth APIs    │           │ Client APIs   │           │   AI APIs     │
│               │           │               │           │               │
│ - Register    │           │ - CRUD        │           │ - Analyze     │
│ - Session     │           │ - Reports     │           │ - Recommend   │
│ - Login       │           │ - Consults    │           │ - OCR         │
└───────────────┘           │ - Diet Photos │           └───────────────┘
                            │ - Meal Groups │
                            └───────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ Service Layer │
                            │               │
                            │ - AI (Gemini) │
                            │ - Prisma ORM  │
                            │ - File Store  │
                            │ - Validation  │
                            └───────────────┘
```

---

## API Routes Structure

```
app/api/
├── auth/
│   ├── [...nextauth]/route.ts          # NextAuth.js session management
│   └── register/route.ts               # User registration with password hashing
│
├── clients/
│   ├── route.ts                        # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                    # GET, PATCH, DELETE
│       ├── reports/route.ts            # Client health reports
│       ├── recommendations/route.ts    # Client recommendations
│       ├── consultations/
│       │   ├── route.ts                # Consultation list/create
│       │   ├── [consultationId]/
│       │   │   ├── route.ts            # GET, UPDATE, DELETE
│       │   │   └── analyze/route.ts    # AI analysis of consultation
│       ├── diet-photos/
│       │   ├── route.ts                # Diet photo list/create
│       │   └── [photoId]/
│       │       ├── route.ts            # GET, UPDATE, DELETE
│       │       └── analyze/route.ts    # AI compliance evaluation
│       ├── meal-groups/
│       │   ├── route.ts                # Meal group operations
│       │   └── [groupId]/route.ts      # Individual meal group
│       ├── weekly-diet-summary/
│       │   ├── route.ts                # Create weekly summary
│       │   └── [summaryId]/
│       │       ├── route.ts            # GET, UPDATE, DELETE
│       │       └── export/pdf/route.ts # Export summary as PDF
│       ├── diet-analysis/route.ts      # Aggregated diet analysis
│       ├── plan-evaluations/
│       │   ├── route.ts                # Plan evaluation list/create
│       │   └── [evaluationId]/
│       │       ├── export/route.ts     # Export evaluation
│       │       └── export/optimized/route.ts # Export optimized plan
│       └── evaluate-plan/route.ts      # Evaluate nutritionist plan
│
├── reports/
│   ├── route.ts                        # Report list/create
│   ├── [id]/route.ts                   # Individual report
│   └── upload/route.ts                 # Upload & analyze report
│
├── recommendations/
│   ├── route.ts                        # Recommendation list/create
│   ├── [id]/route.ts                   # Individual recommendation
│   ├── generate/route.ts               # Generate AI recommendations
│   └── [id]/
│       └── export/
│           ├── pdf/route.ts            # Full PDF export
│           └── pdf/mobile/
│               └── food-guide/route.ts # Mobile-optimized food guide
│
├── ai/
│   ├── analyze/route.ts                # Health analysis
│   ├── recommend/route.ts              # Generate recommendations
│   └── analyze-image/route.ts          # Image OCR
│
├── dashboard/
│   ├── todos/route.ts                  # Dashboard todo items
│   └── weekly-stats/route.ts           # Weekly statistics
│
├── convert-heic/route.ts               # HEIC image conversion
│
└── test/
    └── gemini/route.ts                 # Gemini API testing
```

---

## Authentication APIs

### `/api/auth/register`
**Purpose:** User registration with password hashing

**Method:** `POST`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Dependencies:**
- `bcrypt` - Password hashing
- `prisma.user.create()` - Database persistence
- `zod` - Input validation

---

### `/api/auth/[...nextauth]`
**Purpose:** NextAuth.js session management

**Provider:** Credentials (email/password)

**Callbacks:**
- `jwt()` - Token creation with user data
- `session()` - Session data exposure

**Pages:**
- Sign In: `/login`
- Error: `/login`

**Strategy:** JWT (sessionless)

---

## Client Management APIs

### `/api/clients`
**Purpose:** Client CRUD operations

**GET** - List all clients for authenticated user
- Authentication: Required (NextAuth session)
- Response: Array of clients with demographics

**POST** - Create new client
- Validation: Zod schema (name, gender, birthDate, height, weight, activityLevel)
- Fields:
  - Basic: name, gender, birthDate, height, weight, activityLevel
  - Health: allergies (JSON), medicalHistory (JSON), healthConcerns (JSON)
  - Optional: preferences, userRequirements, exerciseDetails, phone, email

**Dependencies:**
- `lib/auth.ts` - Session validation
- `lib/db/prisma.ts` - Database operations
- `zod` - Schema validation

---

### `/api/clients/[id]`
**Purpose:** Individual client operations

**GET** - Retrieve client details
- Authorization: User must own the client

**PATCH** - Update client information
- Validation: Same schema as create
- Partial updates supported

**DELETE** - Delete client
- Cascading: Reports, recommendations, photos deleted via Prisma relations

---

### `/api/clients/[id]/reports`
**Purpose:** Health report management for client

**GET** - List all reports
- Ordered by upload date (newest first)

**POST** - Create new report reference
- Links to uploaded file data

---

### `/api/clients/[id]/recommendations`
**Purpose:** Recommendation CRUD for client

**GET** - List all recommendations
- Includes diet, exercise, lifestyle, comprehensive types

**POST** - Create new recommendation
- Stores AI-generated content as JSON

---

### `/api/clients/[id]/consultations`
**Purpose:** Consultation record management

**GET** - List consultations
- Ordered by date (newest first)

**POST** - Create consultation
- Supports: images (Base64), text files (.txt, .md, .doc, .docx)
- File processing: `mammoth` for .docx

**Dependencies:**
- `lib/utils/textFileUtils.ts` - Text file extraction
- `lib/utils/fileUtils.ts` - File validation

---

### `/api/clients/[id]/consultations/[consultationId]/analyze`
**Purpose:** AI analysis of consultation content

**POST** - Analyze consultation
- Extracts: diet changes, physical feedback, implementation progress
- Generates: action items, recommendations for adjustment
- AI Model: Gemini 2.5 Pro

**Dependencies:**
- `lib/ai/gemini.ts` - `analyzeConsultation()`
- `lib/ai/prompts.ts` - `CONSULTATION_ANALYSIS_PROMPT`

---

### `/api/clients/[id]/diet-photos`
**Purpose:** Diet photo tracking & compliance evaluation

**GET** - List diet photos
- Includes analysis results if available

**POST** - Upload & analyze photo
- Image: Base64 encoded
- AI Model: Gemini 2.5 Flash (vision)
- Evaluation: Compliance with nutrition plan

**Dependencies:**
- `lib/ai/gemini.ts` - `evaluateDietPhotoCompliance()`
- `lib/storage/file-storage.ts` - File persistence

---

### `/api/clients/[id]/diet-photos/[photoId]/analyze`
**Purpose:** Re-analyze existing photo

**POST** - Re-analyze
- Useful after recommendation updates
- Updates photo analysis in-place

---

### `/api/clients/[id]/meal-groups`
**Purpose:** Meal grouping for comprehensive analysis

**GET** - List meal groups
- Filterable by date range

**POST** - Create meal group
- Supports multiple photos per meal
- Optional: text description (when no photos)
- AI: Aggregates analysis across all photos

**Dependencies:**
- `lib/ai/gemini.ts` - Batch analysis
- `prisma.dietPhotoMealGroup` - Group storage

---

### `/api/clients/[id]/weekly-diet-summary`
**Purpose:** Generate weekly diet summaries

**POST** - Create summary
- Aggregates: meal groups for a week
- AI Model: Gemini 2.5 Pro
- Output: Compliance scoring, nutrition analysis, improvement recommendations

**Dependencies:**
- `lib/ai/gemini.ts` - `generateWeeklyDietSummary()`
- `lib/ai/prompts.ts` - `WEEKLY_DIET_SUMMARY_PROMPT`

---

### `/api/clients/[id]/plan-evaluations`
**Purpose:** Evaluate nutritionist-created plans

**POST** - Evaluate plan
- Input: Plan file (text) + client health data
- AI Checks: Safety, allergies, medical contraindications
- Output: Safety score, concerns, optimized plan

**Dependencies:**
- `lib/ai/gemini.ts` - `parseNutritionistPlan()`, `evaluateNutritionistPlan()`
- `lib/utils/textFileUtils.ts` - File content extraction

---

## Report Analysis APIs

### `/api/reports/upload`
**Purpose:** Upload & analyze health reports

**Method:** `POST`

**Request:** `FormData`
- `file`: Report image (PDF, JPG, PNG)
- `clientId`: Target client ID
- `fileName`: Original filename
- `fileType`: MIME type

**Process:**
1. Validate ownership (client belongs to user)
2. Convert file to Base64
3. Create `prisma.report` record
4. Call Gemini Vision API
5. Store analysis result
6. Return extracted indicators

**AI Prompt:** Extract health indicators with:
- Indicator name, value, unit
- Normal range, status (normal/high/low)
- Associated health risks

**Dependencies:**
- `@ai-sdk/google` - Gemini 2.5 Flash
- `lib/db/prisma.ts` - Database operations

---

### `/api/ai/analyze`
**Purpose:** Health analysis from extracted data

**Method:** `POST`

**Request:**
```json
{
  "clientInfo": {
    "name": "John Doe",
    "age": 35,
    "height": 175,
    "weight": 70,
    ...
  },
  "reportData": {
    "indicators": [...]
  }
}
```

**Response:**
```json
{
  "summary": "Overall health status",
  "bmi": 22.9,
  "bmiCategory": "正常",
  "abnormalIndicators": [...],
  "nutrientDeficiencies": [...],
  "riskFactors": [...],
  "overallHealthScore": 85
}
```

**Dependencies:**
- `lib/ai/gemini.ts` - `analyzeHealthReport()`
- `lib/ai/prompts.ts` - `HEALTH_ANALYSIS_PROMPT`

---

### `/api/ai/recommend`
**Purpose:** Generate personalized recommendations

**Method:** `POST`

**Types:**
- `diet` - Meal plans, macro targets, food lists
- `exercise` - Workout plans, precautions
- `lifestyle` - Sleep, hydration, stress management
- `comprehensive` - All of the above

**Dependencies:**
- `lib/ai/gemini.ts` - Recommendation generators
- `lib/ai/prompts.ts` - Recommendation prompts

---

### `/api/ai/analyze-image`
**Purpose:** OCR for health report images

**Method:** `POST`

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "indicators": [
    {
      "name": "总胆固醇",
      "value": "5.2",
      "unit": "mmol/L",
      "normalRange": "<5.2"
    }
  ]
}
```

**Dependencies:**
- `@ai-sdk/google` - Gemini Vision API
- `lib/ai/gemini.ts` - `analyzeReportImage()`

---

## Recommendation APIs

### `/api/recommendations/generate`
**Purpose:** Generate comprehensive nutrition intervention

**Method:** `POST`

**Request:**
```json
{
  "clientId": "cuid",
  "reportId": "cuid",
  "type": "COMPREHENSIVE"
}
```

**Process:**
1. Fetch client data + health analysis
2. Generate all recommendation types
3. Compile into comprehensive plan
4. Store in database

**Output Sections:**
- Daily targets (calories, macros)
- Traffic light foods (green/yellow/red)
- One-day meal plan
- Biomarker interventions
- Exercise prescription (2-week detailed plan)
- Lifestyle modifications
- Supplements

**Dependencies:**
- `lib/ai/gemini.ts` - All recommendation generators
- `lib/ai/prompts.ts` - All prompts including `DETAILED_EXERCISE_PRESCRIPTION_PROMPT`

---

### `/api/recommendations/[id]/export/pdf`
**Purpose:** Export recommendation as PDF

**Method:** `POST`

**Process:**
1. Fetch recommendation + client data
2. Generate PDF using `@react-pdf/renderer`
3. Stream PDF response

**PDF Sections:**
- Cover page with client info
- Health analysis summary
- Traffic light food guide
- Biomarker interventions
- One-day meal plan
- Exercise prescription (2-week)
- Lifestyle recommendations

**Dependencies:**
- `@react-pdf/renderer` - PDF generation
- `components/pdf/*` - PDF components
- `@fontsource/noto-sans-sc` - Chinese font support

---

## Dashboard APIs

### `/api/dashboard/todos`
**Purpose:** Action items for nutritionist

**Method:** `GET`

**Response:**
```json
{
  "todos": [
    {
      "id": "1",
      "title": "Review client diet photos",
      "priority": "high",
      "clientId": "cuid",
      "clientName": "John Doe",
      "actionUrl": "/clients/cuid/diet-photos"
    }
  ]
}
```

**Sources:**
- Unanalyzed diet photos
- Unanalyzed consultations
- Clients without recommendations
- Pending weekly summaries

---

### `/api/dashboard/weekly-stats`
**Purpose:** Weekly statistics for dashboard

**Method:** `GET`

**Response:**
```json
{
  "weekStart": "2026-01-26",
  "newClients": 3,
  "reportsAnalyzed": 5,
  "recommendationsGenerated": 4,
  "dietPhotosAnalyzed": 12,
  "consultationsCompleted": 2
}
```

---

## Utility APIs

### `/api/convert-heic`
**Purpose:** Convert HEIC images to JPEG

**Method:** `POST`

**Use Case:** iOS photos compatibility

**Note:** Implementation placeholder (HEIC conversion requires additional libraries)

---

### `/api/test/gemini`
**Purpose:** Test Gemini API connectivity

**Method:** `POST`

**Use Case:** Development/Debugging

---

## Service Layer

### AI Services (`lib/ai/`)

#### `gemini.ts`
**Exports:**
- `analyzeHealthReport()` - Medical nutrition therapy analysis
- `generateDietRecommendation()` - Personalized diet plans
- `generateExerciseRecommendation()` - Exercise prescriptions
- `generateLifestyleRecommendation()` - Lifestyle advice
- `analyzeReportImage()` - OCR for health reports
- `evaluateDietPhotoCompliance()` - Food photo compliance
- `evaluateTextDescriptionCompliance()` - Text-based meal analysis
- `analyzeConsultation()` - Consultation insights
- `parseNutritionistPlan()` - Extract plan data
- `evaluateNutritionistPlan()` - Plan safety evaluation
- `generateWeeklyDietSummary()` - Weekly aggregation

**Models Used:**
- `google('gemini-2.5-pro')` - Complex analysis, recommendations
- `google('gemini-2.5-flash')` - Quick vision tasks

**Error Handling:**
- JSON parse recovery with `tryFixMalformedJson()`
- Graceful degradation for AI failures
- Structured logging via `lib/logger.ts`

#### `prompts.ts`
**Exports:** 10+ structured prompt templates
- All prompts parameterized for consistency
- JSON output format enforcement
- Context injection (client info, health data)
- Professional nutritionist persona

---

### Database Services (`lib/db/`)

#### `prisma.ts`
**Singleton Pattern:**
```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

**Purpose:** Prevent connection pool exhaustion in development

---

### Authentication Services (`lib/auth/`)

#### `auth.ts`
**Exports:**
- `auth()` - NextAuth instance

**Configuration:**
- Credentials provider
- JWT strategy
- Prisma adapter

#### `auth-options.ts`
**NextAuth Configuration:**
- Credentials provider with bcrypt password verification
- Custom pages (sign in, error)
- JWT/session callbacks

#### `client-access.ts`
**Purpose:** Verify client ownership
- Used in all client-specific API routes
- Prevents cross-user data access

---

### Storage Services (`lib/storage/`)

#### `file-storage.ts`
**Functions:**
- `saveImageFile()` - Save Base64 image to filesystem
- `deleteFile()` - Remove file
- `saveAudioFile()` - Save consultation audio
- `saveReportFile()` - Save health report

**Directory Structure:**
```
public/uploads/
└── clients/
    └── [clientId]/
        ├── diet-photos/
        ├── consultations/
        │   └── audio/
        └── reports/
```

**Note:** Production should use object storage (S3, Vercel Blob)

---

### Utility Libraries (`lib/utils/`)

#### `fileUtils.ts`
**Functions:**
- `validateAudioFile()` - Check audio file format/size
- `validateImageFile()` - Check image file format/size
- `fileToBase64()` - Convert File to Base64
- `formatFileSize()` - Human-readable file size
- `isAudioFile()`, `isImageFile()` - Type detection

**Constants:**
- `MAX_AUDIO_SIZE_MB = 20`
- `MAX_IMAGE_SIZE_MB = 5`

#### `textFileUtils.ts`
**Functions:**
- `extractTextFromFile()` - Extract text from .txt, .md, .doc, .docx
- `mammoth.extractRawText()` for .docx files

#### `jsonUtils.ts`
**Functions:**
- `safeJsonParse()` - Parse with error recovery
- `tryFixMalformedJson()` - Fix common AI JSON errors

#### `logger.ts`
**Structured Logging:**
- `logger.info()`, `logger.error()`, `logger.warn()`
- Context preservation
- Console output with metadata

#### `exercise-videos.ts`
**Data:** Exercise video links by category
- Used in exercise prescription display

---

## Error Handling Strategy

### Validation Errors
```typescript
if (error instanceof z.ZodError) {
  return NextResponse.json({
    error: 'Data validation failed',
    details: error.issues
  }, { status: 400 });
}
```

### Authentication Errors
```typescript
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Authorization Errors
```typescript
if (client.userId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### AI Service Errors
- Graceful degradation
- Store partial results
- Log error for debugging
- Return user-friendly message

---

## API Endpoint Summary

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| Authentication | 2 | Login, registration |
| Clients | 25+ | Client management & related data |
| Reports | 3 | Upload & analyze health reports |
| Recommendations | 4 | Generate & export recommendations |
| AI | 3 | Analysis & OCR |
| Dashboard | 2 | Statistics & todos |
| Utility | 2 | HEIC conversion, testing |
| **Total** | **41+** | Complete backend functionality |

---

## Security Measures

1. **Authentication:** NextAuth.js with bcrypt password hashing
2. **Authorization:** User ownership verification on all client data
3. **Validation:** Zod schema validation on all inputs
4. **File Size:** Limits on uploads (images 5MB, audio 20MB)
5. **SQL Injection:** Prevented via Prisma parameterized queries
6. **Rate Limiting:** Recommended for production (not implemented)

---

## Performance Considerations

1. **Database:** Connection pooling via Prisma singleton
2. **AI Caching:** Recommendation results stored in database
3. **File Storage:** Static file delivery via Next.js public dir
4. **PDF Generation:** On-demand, not cached
5. **Future:** Redis caching for AI responses

---

## Testing Coverage

### Unit Tests
- `lib/ai/gemini.test.ts` - AI service functions
- `lib/utils/*.test.ts` - Utility functions
- `lib/auth/*.test.ts` - Authentication logic

### Integration Tests
- `tests/api/clients.test.ts` - Client API endpoints
- `tests/api/reports.test.ts` - Report upload & analysis
- `tests/api/recommendations.test.ts` - Recommendation generation

### E2E Tests
- `tests/e2e/` - Playwright tests for critical flows

---

## Future Enhancements

1. **API Versioning:** `/api/v2/...` for breaking changes
2. **Rate Limiting:** Per-user request limits
3. **Webhooks:** Notify clients of new recommendations
4. **Batch Operations:** Bulk client imports
5. **GraphQL Alternative:** For complex data queries
6. **Background Jobs:** PDF generation, AI analysis
7. **Caching Layer:** Redis for expensive AI calls
8. **API Documentation:** OpenAPI/Swagger specs

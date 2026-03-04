import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mockAuth = vi.fn();
const mockAnalyzeHealthReport = vi.fn();
const mockAnalyzeReportImage = vi.fn();
const mockGenerateDietRecommendation = vi.fn();
const mockGenerateExerciseRecommendation = vi.fn();
const mockGenerateLifestyleRecommendation = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/ai/gemini', () => ({
  analyzeHealthReport: mockAnalyzeHealthReport,
  analyzeReportImage: mockAnalyzeReportImage,
  generateDietRecommendation: mockGenerateDietRecommendation,
  generateExerciseRecommendation: mockGenerateExerciseRecommendation,
  generateLifestyleRecommendation: mockGenerateLifestyleRecommendation,
  generateWeeklyDietSummary: vi.fn(),
}));

let aiAnalyzePOST: any;
let aiAnalyzeImagePOST: any;
let aiRecommendPOST: any;
let testGeminiGET: any;

describe('API Auth Guards', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    ({ POST: aiAnalyzePOST } = await import('@/app/api/ai/analyze/route'));
    ({ POST: aiAnalyzeImagePOST } = await import('@/app/api/ai/analyze-image/route'));
    ({ POST: aiRecommendPOST } = await import('@/app/api/ai/recommend/route'));
    ({ GET: testGeminiGET } = await import('@/app/api/test/gemini/route'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv || 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('rejects unauthorized /api/ai/analyze', async () => {
    mockAuth.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientInfo: {}, reportData: {} }),
    });

    const res = await aiAnalyzePOST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('未授权');
    expect(mockAnalyzeHealthReport).not.toHaveBeenCalled();
  });

  it('rejects unauthorized /api/ai/analyze-image', async () => {
    mockAuth.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'data:image/png;base64,abc' }),
    });

    const res = await aiAnalyzeImagePOST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('未授权');
    expect(mockAnalyzeReportImage).not.toHaveBeenCalled();
  });

  it('rejects unauthorized /api/ai/recommend', async () => {
    mockAuth.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/ai/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'diet', healthAnalysis: {} }),
    });

    const res = await aiRecommendPOST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('未授权');
    expect(mockGenerateDietRecommendation).not.toHaveBeenCalled();
  });

  it('returns 404 for /api/test/gemini in production', async () => {
    process.env.NODE_ENV = 'production';
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });

    const req = new Request('http://localhost:3000/api/test/gemini', {
      method: 'GET',
    });

    const res = await testGeminiGET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Not Found');
  });

  it('rejects unauthorized /api/test/gemini outside production', async () => {
    process.env.NODE_ENV = 'test';
    mockAuth.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/test/gemini', {
      method: 'GET',
    });

    const res = await testGeminiGET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('未授权');
  });
});

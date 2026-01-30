/**
 * Tests for Re-transcription API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/clients/[id]/consultations/[consultationId]/audio/[audioId]/retranscribe/route';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { verifyClientAccess } from '@/lib/auth/client-access';
import { transcribeAudioWithGemini } from '@/lib/audio/transcribeWithGemini';

// Mock dependencies
vi.mock('@/lib/auth');
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    consultation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock('@/lib/auth/client-access');
vi.mock('@/lib/audio/transcribeWithGemini');
vi.mock('@/lib/logger');

describe('POST /api/clients/[id]/consultations/[consultationId]/audio/[audioId]/retranscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = {} as NextRequest;
    const params = Promise.resolve({ id: 'client-1', consultationId: 'consultation-1', audioId: 'audio-1' });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: '未授权' });
  });

  it('should return 404 when consultation does not exist', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } });

    vi.mocked(verifyClientAccess).mockResolvedValue({
      exists: true,
      client: { name: 'Test Client', birthDate: new Date('1990-01-01') },
    });

    vi.mocked(prisma.consultation.findFirst).mockResolvedValue(null);

    const request = {} as NextRequest;
    const params = Promise.resolve({ id: 'client-1', consultationId: 'consultation-1', audioId: 'audio-1' });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('咨询记录不存在');
  });

  it('should return 400 when consultation has no audio files', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } });

    vi.mocked(verifyClientAccess).mockResolvedValue({
      exists: true,
      client: { name: 'Test Client', birthDate: new Date('1990-01-01') },
    });

    vi.mocked(prisma.consultation.findFirst).mockResolvedValue({
      audioFiles: null,
    });

    const request = {} as NextRequest;
    const params = Promise.resolve({ id: 'client-1', consultationId: 'consultation-1', audioId: 'audio-1' });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('没有音频文件');
  });

  it('should return 404 when audio file not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } });

    vi.mocked(verifyClientAccess).mockResolvedValue({
      exists: true,
      client: { name: 'Test Client', birthDate: new Date('1990-01-01') },
    });

    const mockAudioFiles = [
      { id: 'audio-2', audioUrl: 'data:audio/mp3;base64,test', transcriptionStatus: 'failed' },
    ];

    vi.mocked(prisma.consultation.findFirst).mockResolvedValue({
      audioFiles: JSON.stringify(mockAudioFiles),
    });

    const request = {} as NextRequest;
    const params = Promise.resolve({ id: 'client-1', consultationId: 'consultation-1', audioId: 'audio-1' });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('音频文件不存在');
  });

  it('should successfully retranscribe audio file', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } });

    vi.mocked(verifyClientAccess).mockResolvedValue({
      exists: true,
      client: { name: 'Test Client', birthDate: new Date('1990-01-01') },
    });

    const mockAudioFiles = [
      {
        id: 'audio-1',
        audioUrl: 'data:audio/mp3;base64,test-audio',
        transcriptionStatus: 'failed',
      },
    ];

    vi.mocked(prisma.consultation.findFirst).mockResolvedValue({
      audioFiles: JSON.stringify(mockAudioFiles),
    });

    vi.mocked(prisma.consultation.update).mockResolvedValue({});

    vi.mocked(transcribeAudioWithGemini).mockResolvedValue({
      success: true,
      text: 'Transcription result',
      structuredTranscript: [
        { speaker: 'nutritionist', text: 'Hello' },
        { speaker: 'client', text: 'Hi there' },
      ],
    });

    const request = {} as NextRequest;
    const params = Promise.resolve({ id: 'client-1', consultationId: 'consultation-1', audioId: 'audio-1' });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transcript).toBe('Transcription result');
    expect(data.structuredTranscript).toEqual([
      { speaker: 'nutritionist', text: 'Hello' },
      { speaker: 'client', text: 'Hi there' },
    ]);

    // Verify the audio file was updated twice (transcribing -> completed)
    expect(prisma.consultation.update).toHaveBeenCalledTimes(2);
  });

  it('should handle transcription failure', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } });

    vi.mocked(verifyClientAccess).mockResolvedValue({
      exists: true,
      client: { name: 'Test Client', birthDate: new Date('1990-01-01') },
    });

    const mockAudioFiles = [
      {
        id: 'audio-1',
        audioUrl: 'data:audio/mp3;base64,test-audio',
        transcriptionStatus: 'failed',
      },
    ];

    vi.mocked(prisma.consultation.findFirst).mockResolvedValue({
      audioFiles: JSON.stringify(mockAudioFiles),
    });

    vi.mocked(prisma.consultation.update).mockResolvedValue({});

    vi.mocked(transcribeAudioWithGemini).mockResolvedValue({
      success: false,
      error: 'Transcription failed',
    });

    const request = {} as NextRequest;
    const params = Promise.resolve({ id: 'client-1', consultationId: 'consultation-1', audioId: 'audio-1' });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('转录失败');

    // Verify update was called twice (transcribing -> failed)
    expect(prisma.consultation.update).toHaveBeenCalledTimes(2);

    // Verify the second update call set the status back to failed
    const secondCall = vi.mocked(prisma.consultation.update).mock.calls[1];
    expect(secondCall).toBeDefined();
    const updateData = secondCall[0];
    expect(updateData).toBeDefined();
    expect(updateData.data).toBeDefined();
    const audioFiles = JSON.parse(updateData.data.audioFiles);
    expect(audioFiles[0].transcriptionStatus).toBe('failed');
  });

  it('should handle partial structured transcript', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } });

    vi.mocked(verifyClientAccess).mockResolvedValue({
      exists: true,
      client: { name: 'Test Client', birthDate: new Date('1990-01-01') },
    });

    const mockAudioFiles = [
      {
        id: 'audio-1',
        audioUrl: 'data:audio/mp3;base64,test-audio',
        transcriptionStatus: 'failed',
      },
    ];

    vi.mocked(prisma.consultation.findFirst).mockResolvedValue({
      audioFiles: JSON.stringify(mockAudioFiles),
    });

    vi.mocked(prisma.consultation.update).mockResolvedValue({});

    // Mock successful transcription without structured transcript
    vi.mocked(transcribeAudioWithGemini).mockResolvedValue({
      success: true,
      text: 'Plain transcription text',
    });

    const request = {} as NextRequest;
    const params = Promise.resolve({ id: 'client-1', consultationId: 'consultation-1', audioId: 'audio-1' });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transcript).toBe('Plain transcription text');
    expect(data.structuredTranscript).toBeUndefined();
  });
});

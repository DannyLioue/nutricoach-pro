/**
 * Audio Transcription with Gemini
 *
 * Converts audio files to structured text using Gemini's multimodal capabilities.
 * This replaces OpenAI Whisper with Gemini for audio processing.
 */

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  structuredTranscript?: Array<{ speaker: 'nutritionist' | 'client'; text: string }>;
  error?: string;
}

/**
 * Transcribes an audio file using Gemini and optionally structures it by speakers.
 * This is a one-stop solution that combines transcription and speaker identification.
 *
 * @param audioBase64 - Base64-encoded audio data (with or without data URL prefix)
 * @param clientInfo - Client information for speaker identification context
 * @returns Promise resolving to transcription result with optional structured transcript
 */
export async function transcribeAudioWithGemini(
  audioBase64: string,
  clientInfo: { name: string; age?: number }
): Promise<TranscriptionResult> {
  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'Gemini API密钥未配置，请设置 GEMINI_API_KEY 环境变量',
    };
  }

  try {
    // Clean up the base64 string - remove data URL prefix if present
    const base64Data = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;

    // Detect MIME type from data URL if available
    let mimeType = 'audio/mp3'; // Default to MP3
    if (audioBase64.includes('data:')) {
      const match = audioBase64.match(/data:([^;]+)/);
      if (match && match[1]) {
        mimeType = match[1];
      }
    }

    const prompt = buildTranscriptionPrompt(clientInfo);

    // Prepare the request body
    const requestBody = {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192, // 增加输出 token 限制以支持长音频
      },
    };

    // Call Gemini API
    // Using gemini-2.5-flash which supports audio input and is actively maintained
    // Note: gemini-2.0-flash-exp is experimental and may have availability issues
    console.log('[Transcribe] Starting transcription with audio size:', base64Data.length, 'bytes');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('[Transcribe] API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      console.error('[Transcribe] API error:', errorData);
      return {
        success: false,
        error: errorData.error?.message || `转录失败: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('[Transcribe] Response text length:', responseText?.length || 0);

    if (!responseText) {
      return {
        success: false,
        error: 'AI返回空响应',
      };
    }

    // Try to parse as JSON first (structured format)
    let structuredTranscript: Array<{ speaker: 'nutritionist' | 'client'; text: string }> | undefined;
    let transcriptText = responseText;

    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed) && parsed.every(item => item.speaker && item.text)) {
          structuredTranscript = parsed;
          console.log('[Transcribe] Parsed structured transcript with', structuredTranscript.length, 'lines');
          // Build plain text from structured transcript
          transcriptText = parsed.map(line => {
            const speaker = line.speaker === 'nutritionist' ? '营养师' : '客户';
            return `${speaker}: ${line.text}`;
          }).join('\n');
        }
      } else {
        // Try parsing the whole response as JSON
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed) && parsed.every(item => item.speaker && item.text)) {
          structuredTranscript = parsed;
          console.log('[Transcribe] Parsed structured transcript with', structuredTranscript.length, 'lines');
          transcriptText = parsed.map(line => {
            const speaker = line.speaker === 'nutritionist' ? '营养师' : '客户';
            return `${speaker}: ${line.text}`;
          }).join('\n');
        }
      }
    } catch (e) {
      // Not JSON, use as plain text
      console.log('[Transcribe] Could not parse as JSON, using as plain text');
      transcriptText = responseText;
    }

    console.log('[Transcribe] Final transcript text length:', transcriptText.length);
    console.log('[Transcribe] Structured transcript lines:', structuredTranscript?.length || 0);

    return {
      success: true,
      text: transcriptText,
      structuredTranscript,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转录过程中发生未知错误',
    };
  }
}

/**
 * Builds the prompt for Gemini to transcribe and structure the audio.
 */
function buildTranscriptionPrompt(clientInfo: { name: string; age?: number }): string {
  return `你是一位专业的会议记录员和营养师助手。请完整转录以下音频。

**客户信息：**
- 姓名：${clientInfo.name}
${clientInfo.age ? `- 年龄：${clientInfo.age}岁` : ''}

**重要任务（按优先级）：**
1. **完整转录** - 这是最重要的！请转录音频中的所有对话内容，不要遗漏任何有意义的句子
2. **识别说话人** - 区分"营养师"（专业人士，通常是提问者）和"客户"（${clientInfo.name}，通常是回答者）
3. **结构化输出** - 按说话人分段，每段标注说话人

**转录要求：**
- 保留所有完整的对话内容
- 只删除真正的噪音（如背景杂音、咳嗽、长时间的停顿）
- 保留所有填充词如果它们是表达的一部分（如犹豫时的"嗯..."）
- 必须保留所有医学信息、数值、专业术语

**输出格式（必须是纯JSON数组，不要使用markdown代码块）：**
[
  {"speaker": "nutritionist", "text": "完整的对话内容..."},
  {"speaker": "client", "text": "完整的回答内容..."},
  ...
]

**示例：**
如果音频中营养师说："你好，今天感觉怎么样？最近有什么变化吗？"
客户回答："挺好的，最近血糖控制得不错，都在7以下了。饮食方面我按照你说的，减少了米饭的量。"

正确输出：
[
  {"speaker": "nutritionist", "text": "你好，今天感觉怎么样？最近有什么变化吗？"},
  {"speaker": "client", "text": "挺好的，最近血糖控制得不错，都在7以下了。饮食方面我按照你说的，减少了米饭的量。"}
]

**现在请转录音频并输出JSON：**`;
}

/**
 * Batch transcribes multiple audio files.
 *
 * @param audioFiles - Array of base64-encoded audio files with client info
 * @returns Promise resolving to array of transcription results
 */
export async function transcribeMultipleAudioFilesWithGemini(
  audioFiles: Array<{ audioBase64: string; clientInfo: { name: string; age?: number } }>
): Promise<TranscriptionResult[]> {
  const results = await Promise.allSettled(
    audioFiles.map(({ audioBase64, clientInfo }) =>
      transcribeAudioWithGemini(audioBase64, clientInfo)
    )
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || '转录失败',
      };
    }
  });
}

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { Modality } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  AnalyzeRequestSchema,
  RiskReportData,
  ScamType,
  UserActionType,
} from './src/lib/schemas.js';
import { rateLimiter } from './src/lib/rate-limit.js';
import {
  validateBase64Image,
  ALLOWED_IMAGE_MIME_TYPES,
  AllowedImageMimeType,
} from './src/lib/image-validation.js';
import { verifyEvidence, evaluateEvidenceDowngrade } from './src/lib/evidence.js';
import { inspectUrlsInText } from './src/lib/url-inspection.js';
import { FIXED_DISCLAIMER } from './src/lib/prompt.js';
import { gemmaService } from './src/lib/gemma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

const ENABLE_SCREENSHOTS = true;

// Enable CORS so external deployments (e.g. Netlify, custom domains, mobile webviews) can call /api/*
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: '6mb' }));

// Health / status check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    model: gemmaService.getModelName(),
    aiConfigured: gemmaService.isConfigured(),
    screenshotsEnabled: ENABLE_SCREENSHOTS,
    timestamp: new Date().toISOString(),
  });
});

function crc32Buffer(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildZipBuffer(files: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const dataBuf = file.data;
    const crc = crc32Buffer(dataBuf);
    const size = dataBuf.length;

    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    localParts.push(localHeader, dataBuf);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

// Serve complete standalone Manifest V3 Chrome Extension (.zip)
app.get('/api/extension-zip', (_req: Request, res: Response) => {
  try {
    const extFileNames = [
      'manifest.json',
      'popup.html',
      'popup-bundle.js',
      'popup-bundle.css',
      'background.js',
      'content.js',
      'icon16.png',
      'icon48.png',
      'icon128.png',
    ];

    const zipEntries: Array<{ name: string; data: Buffer }> = [];
    for (const fileName of extFileNames) {
      const rootFile = path.resolve(__dirname, fileName);
      const publicFile = path.resolve(__dirname, 'public', fileName);
      if (fs.existsSync(rootFile)) {
        zipEntries.push({ name: fileName, data: fs.readFileSync(rootFile) });
      } else if (fs.existsSync(publicFile)) {
        zipEntries.push({ name: fileName, data: fs.readFileSync(publicFile) });
      }
    }

    const zipBuffer = buildZipBuffer(zipEntries);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="scamlens-ai-chrome-extension.zip"'
    );
    res.setHeader('Content-Length', String(zipBuffer.length));
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: { message: err?.message || 'Failed to build extension zip' } });
  }
});

// Single analysis endpoint
app.post('/api/analyze', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || '127.0.0.1';

  // 1. Rate limit (10 req/min)
  const rateResult = rateLimiter.check(clientIp);
  if (!rateResult.allowed) {
    res.setHeader('Retry-After', String(rateResult.retryAfter));
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many analysis requests. Rate limit is 10 requests per minute. Please wait ${rateResult.retryAfter}s.`,
      },
    });
    return;
  }

  // 2. Fast payload validations
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Request body must be a valid JSON object.',
      },
    });
    return;
  }

  if (typeof req.body.text === 'string' && req.body.text.length > 5000) {
    res.status(413).json({
      error: {
        code: 'TOO_LARGE',
        message: `Message text exceeds maximum length of 5,000 characters (received ${req.body.text.length}).`,
      },
    });
    return;
  }

  if (req.body.imageBase64) {
    if (!req.body.imageMimeType) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'imageMimeType is required when imageBase64 is provided.',
        },
      });
      return;
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(req.body.imageMimeType as AllowedImageMimeType)) {
      res.status(415).json({
        error: {
          code: 'UNSUPPORTED_IMAGE',
          message: `Unsupported image MIME type: ${req.body.imageMimeType}. Supported: PNG, JPEG, WebP.`,
        },
      });
      return;
    }

    const imageValidation = validateBase64Image(req.body.imageBase64, req.body.imageMimeType);
    if (!imageValidation.valid) {
      res.status(415).json({
        error: {
          code: 'UNSUPPORTED_IMAGE',
          message: imageValidation.error || 'Invalid or corrupt image file.',
        },
      });
      return;
    }
  }

  const parsed = AnalyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: issue?.message || 'Invalid request parameters.',
      },
    });
    return;
  }

  const { text, imageBase64, imageMimeType, userAction, language, model } = parsed.data;

  // 3. Call Gemma / Gemini AI
  try {
    const rawResult = await gemmaService.analyzeMessage({
      messageText: text,
      imageBase64,
      imageMimeType,
      userAction: userAction as UserActionType,
      language,
      model,
      timeoutMs: 25000,
    });

    // 4. Post-processing & Verification
    const textToVerify = (text || rawResult.extractedText || '').trim();
    const { verifiedEvidence, droppedEvidence } = verifyEvidence(textToVerify, rawResult.evidence);
    const { finalRisk, isDowngraded, downgradeReason } = evaluateEvidenceDowngrade(
      rawResult.risk,
      verifiedEvidence.length
    );
    const inspectedLinks = inspectUrlsInText(textToVerify);

    const report: RiskReportData = {
      risk: finalRisk,
      scamType: rawResult.scamType || ScamType.UNCERTAIN,
      scamTypeName: rawResult.scamTypeName || 'Scam Assessment',
      summary: rawResult.summary,
      evidence: verifiedEvidence,
      actionChecklist: rawResult.actionChecklist,
      links: inspectedLinks,
      extractedText: rawResult.extractedText,
      disclaimer: FIXED_DISCLAIMER,
      originalRiskDowngraded: isDowngraded,
      downgradeReason,
      analyzedAt: new Date().toISOString(),
      modelUsed: rawResult.modelUsed || gemmaService.getModelName(),
      language: language || 'English',
    };

    const latencyMs = Date.now() - startTime;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: text ? 'text' : 'image',
        charLength: textToVerify.length,
        risk: finalRisk,
        scamType: report.scamType,
        modelUsed: report.modelUsed,
        verifiedEvidenceCount: verifiedEvidence.length,
        droppedEvidenceCount: droppedEvidence.length,
        urlsFound: inspectedLinks.length,
        latencyMs,
        status: 200,
      })
    );

    res.status(200).json({ report });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errMsg = err?.message || String(err);

    let statusCode = 502;
    let errorCode:
      | 'AI_TIMEOUT'
      | 'AI_ERROR'
      | 'INVALID_AI_OUTPUT'
      | 'SERVICE_UNAVAILABLE' = 'AI_ERROR';

    if (errMsg.includes('AI_TIMEOUT')) {
      statusCode = 504;
      errorCode = 'AI_TIMEOUT';
    } else if (errMsg.includes('INVALID_AI_OUTPUT')) {
      statusCode = 502;
      errorCode = 'INVALID_AI_OUTPUT';
    }

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: errorCode,
        latencyMs,
        statusCode,
      })
    );

    res.status(statusCode).json({
      error: {
        code: errorCode,
        message: errMsg.replace(/^(AI_ERROR|AI_TIMEOUT|INVALID_AI_OUTPUT):\s*/, ''),
      },
    });
  }
});

// Multi-turn Gemma / Gemini Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model, systemInstruction, language } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: { message: 'Messages array is required' } });
      return;
    }

    const ai = gemmaService.getAI();
    if (!ai) {
      res.status(503).json({ error: { message: 'Gemma / Gemini AI is not configured on this server.' } });
      return;
    }

    const allowedModels = [
      'gemma-3-27b-it',
      'gemma-3-12b-it',
      'gemma-3-4b-it',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview',
    ];
    const primaryModel = allowedModels.includes(model) ? model : 'gemma-3-27b-it';
    const targetLanguage = language && typeof language === 'string' ? language : 'English';

    const baseRolePrompt =
      systemInstruction ||
      'You are ScamLens AI, a specialized fraud prevention and cybersecurity advisor powered by Google Gemma on the Gemini API. Help users identify scams, analyze fraudulent tactics, safeguard accounts, and guide them with concrete precautions.';
    const fullSystemInstruction = `${baseRolePrompt}\nAlways respond clearly and concisely in ${targetLanguage}.`;

    const candidateModels = Array.from(
      new Set([
        primaryModel,
        'gemma-3-27b-it',
        'gemma-3-12b-it',
        'gemma-3-4b-it',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ])
    );

    let replyText = '';

    for (const candidateModel of candidateModels) {
      const isGemma = candidateModel.startsWith('gemma-');
      try {
        // Normalize turns so consecutive messages of the same role are merged (required by Gemma -it models)
        const normalizedTurns: Array<{ role: 'user' | 'model'; text: string }> = [];
        for (const m of messages) {
          const role: 'user' | 'model' = m.role === 'model' ? 'model' : 'user';
          const textContent = String(m.content || '').trim();
          if (!textContent) continue;

          // Skip initial static welcome message from model so the conversation starts with user turn
          if (normalizedTurns.length === 0 && role === 'model') {
            continue;
          }

          if (normalizedTurns.length > 0 && normalizedTurns[normalizedTurns.length - 1].role === role) {
            normalizedTurns[normalizedTurns.length - 1].text += `\n\n${textContent}`;
          } else {
            normalizedTurns.push({ role, text: textContent });
          }
        }

        if (normalizedTurns.length === 0) {
          normalizedTurns.push({ role: 'user', text: 'Hello' });
        }

        const contents = normalizedTurns.map((t, idx) => {
          if (isGemma && idx === 0 && t.role === 'user') {
            return {
              role: 'user',
              parts: [{ text: `[System Instruction: ${fullSystemInstruction}]\n\n${t.text}` }],
            };
          }
          return {
            role: t.role,
            parts: [{ text: t.text }],
          };
        });

        const response = await ai.models.generateContent({
          model: candidateModel,
          contents,
          config: isGemma
            ? { temperature: 0.3 }
            : {
                systemInstruction: fullSystemInstruction,
                temperature: 0.3,
              },
        });

        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Chat model ${candidateModel} failed, trying fallback...`, err);
      }
    }

    if (!replyText) {
      replyText =
        'I analyzed your scenario, but could not produce a response right now. Please try again.';
    }

    res.json({
      reply: replyText,
      model: primaryModel,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: { message: err?.message || 'Failed to generate chat response' } });
  }
});

// Live UI & Sample Scenarios Translation endpoint for all 50+ languages
app.post('/api/translate-ui', async (req: Request, res: Response) => {
  try {
    const { targetLanguage, sourceStrings } = req.body;
    if (!targetLanguage || !sourceStrings) {
      res.status(400).json({ error: { message: 'targetLanguage and sourceStrings required' } });
      return;
    }

    const ai = gemmaService.getAI();
    if (!ai) {
      res.status(503).json({ error: { message: 'AI not configured' } });
      return;
    }

    const prompt = `Translate all string values in the following JSON object into ${targetLanguage} naturally and accurately for a cybersecurity & scam detection app.
CRITICAL RULES:
1. Keep all JSON keys (including sample IDs like "job-offer-fee" and action keys like "RECEIVED_ONLY") 100% identical!
2. Only translate the human-readable string values into ${targetLanguage}.
3. Return ONLY valid JSON with no markdown fences.

JSON to translate:
${JSON.stringify(sourceStrings)}`;

    let rawJson = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      rawJson = response.text?.trim() || '';
    } catch {
      const gemmaRes = await ai.models.generateContent({
        model: 'gemma-3-27b-it',
        contents: prompt,
        config: { temperature: 0.1 },
      });
      rawJson = gemmaRes.text?.trim() || '';
    }

    const clean = rawJson.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    const jsonSlice =
      firstBrace !== -1 && lastBrace > firstBrace
        ? clean.slice(firstBrace, lastBrace + 1)
        : clean;

    const translated = JSON.parse(jsonSlice);
    res.json({ translated });
  } catch (err: any) {
    console.error('UI Translation error:', err);
    res.status(500).json({ error: { message: 'Translation failed' } });
  }
});

// Text-to-Speech endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: { message: 'Text is required for TTS' } });
      return;
    }

    const ai = gemmaService.getAI();
    if (!ai) {
      res.status(503).json({ error: { message: 'AI not configured' } });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 1200),
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(502).json({ error: { message: 'No audio generated' } });
      return;
    }

    res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: { message: err?.message || 'TTS synthesis failed' } });
  }
});

// Voice Turn endpoint (supports audio transcription + Gemma/Gemini response + TTS audio)
app.post('/api/voice-turn', async (req: Request, res: Response) => {
  try {
    const { text, audioBase64, mimeType, language, history } = req.body;
    const ai = gemmaService.getAI();
    if (!ai) {
      res.status(503).json({ error: { message: 'AI not configured' } });
      return;
    }

    const targetLanguage = language || 'English';
    let userTranscript = typeof text === 'string' ? text.trim() : '';

    // 1. If audioBase64 is provided without transcript, transcribe using gemini-3.5-transcribe
    if (!userTranscript && audioBase64) {
      const cleanAudio = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
      const transcribeRes = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: cleanAudio,
              },
            },
            {
              text: `Transcribe the spoken audio accurately. If the speaker is speaking ${targetLanguage} or another language, transcribe in that language.`,
            },
          ],
        },
      });
      userTranscript = transcribeRes.text?.trim() || '';
    }

    if (!userTranscript) {
      res.status(400).json({ error: { message: 'Could not detect speech. Please try speaking again.' } });
      return;
    }

    // 2. Generate concise spoken response with Gemma 3 27B / Gemini Flash
    const voicePrompt = `You are ScamLens Voice, a calm, reassuring real-time fraud & scam protection advisor.
Respond in ${targetLanguage} in 2 to 3 short, natural spoken sentences (under 60 words) suitable for reading aloud. Do not use markdown bullet points or asterisks.
${
  Array.isArray(history) && history.length > 0
    ? `Recent conversation:\n${history
        .slice(-4)
        .map((h: any) => `${h.role === 'model' ? 'Advisor' : 'User'}: ${h.text}`)
        .join('\n')}\n`
    : ''
}User just said: "${userTranscript}"`;

    let replyText = '';
    try {
      const genRes = await ai.models.generateContent({
        model: 'gemma-3-27b-it',
        contents: voicePrompt,
        config: { temperature: 0.3 },
      });
      replyText = genRes.text?.trim() || '';
    } catch {
      const fallbackRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: voicePrompt,
      });
      replyText = fallbackRes.text?.trim() || '';
    }

    // Clean any markdown symbols for speech
    replyText = replyText.replace(/[*#_`~]/g, '').trim();

    // 3. Generate TTS audio via gemini-3.8-flash-lite-tts (optional, non-blocking if TTS fails)
    let ttsAudioBase64: string | undefined;
    try {
      const ttsRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: replyText.slice(0, 800) }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      ttsAudioBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (ttsErr) {
      console.warn('Voice turn TTS fallback to browser speechSynthesis:', ttsErr);
    }

    res.json({
      transcript: userTranscript,
      replyText,
      audioBase64: ttsAudioBase64,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('Voice turn error:', err);
    res.status(500).json({ error: { message: err?.message || 'Voice processing failed' } });
  }
});

// Setup Vite in Dev or Static Serving in Prod
async function startServer() {
  const server = http.createServer(app);

  // Live API WebSocket Voice Streaming Server
  const wss = new WebSocketServer({ server, path: '/api/live-ws' });

  wss.on('connection', async (clientWs, req) => {
    const ai = gemmaService.getAI();
    if (!ai) {
      clientWs.send(JSON.stringify({ error: 'Gemini AI not configured' }));
      clientWs.close();
      return;
    }

    const urlObj = new URL(req.url || '/api/live-ws', 'http://localhost');
    const lang = urlObj.searchParams.get('lang') || 'English';

    try {
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are ScamLens Voice, a calm, reassuring real-time scam and fraud safety advisor. Speak clearly and concisely in ${lang} to help users evaluate suspicious messages, phone calls, or urgent requests.`,
        },
        callbacks: {
          onmessage: (message: any) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part?.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
              if (part?.text) {
                clientWs.send(JSON.stringify({ text: part.text }));
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      clientWs.on('message', (data) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.audio) {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (payload.text) {
            session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: payload.text }] }],
              turnComplete: true,
            });
          }
        } catch (err) {
          console.error('Error handling live client message:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch {
          // cleanup
        }
      });
    } catch (err: any) {
      console.error('Live connect error:', err);
      clientWs.send(JSON.stringify({ error: err?.message || 'Live session failed' }));
      clientWs.close();
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `ScamLens server running on http://0.0.0.0:${PORT} [${isProd ? 'production' : 'development'}]`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

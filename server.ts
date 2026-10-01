import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Shared Gemini client instance
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// NVIDIA NIM Base URL (OpenAI-compatible endpoint)
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// Config status endpoint
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasNvidiaEnvKey: !!process.env.NVIDIA_API_KEY,
    defaultProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'nvidia',
  });
});

// Test NVIDIA API key validity
app.post('/api/verify-nvidia', async (req: Request, res: Response) => {
  const customKey = (req.headers['x-nvidia-api-key'] as string) || req.body?.apiKey;
  const nvidiaKey = customKey || process.env.NVIDIA_API_KEY;

  if (!nvidiaKey) {
    res.status(400).json({
      success: false,
      error: 'No NVIDIA API key provided. Set NVIDIA_API_KEY in .env or pass x-nvidia-api-key header.',
    });
    return;
  }

  try {
    const testResponse = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nvidiaKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: 'Say hello in one word.' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });

    if (!testResponse.ok) {
      const errBody = await testResponse.text();
      let errorMsg = `NVIDIA API error: HTTP ${testResponse.status}`;
      try {
        const parsed = JSON.parse(errBody);
        errorMsg = parsed?.error?.message || parsed?.detail || errorMsg;
      } catch {
        errorMsg = errBody || errorMsg;
      }
      res.status(testResponse.status).json({ success: false, error: errorMsg });
      return;
    }

    const data = await testResponse.json();
    const reply = data?.choices?.[0]?.message?.content || 'OK';

    res.json({
      success: true,
      message: 'NVIDIA API key verified successfully! Connected to NVIDIA NIM.',
      reply: reply.trim(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect to NVIDIA API';
    res.status(500).json({ success: false, error: message });
  }
});

// SSE Streaming chat endpoint supporting both Gemini and NVIDIA NIM
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const {
    messages = [],
    model = 'gemini-2.5-flash',
    provider = 'gemini',
    temperature = 0.7,
    topP = 0.95,
    maxTokens = 4096,
    systemInstruction,
    attachments = [],
  } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sendEvent = (data: Record<string, unknown> | string) => {
    if (typeof data === 'string') {
      res.write(`data: ${data}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  const clientApiKey = (req.headers['x-nvidia-api-key'] as string) || '';

  // Handle NVIDIA NIM Provider
  if (provider === 'nvidia') {
    const nvidiaKey = clientApiKey || process.env.NVIDIA_API_KEY;

    if (!nvidiaKey) {
      sendEvent({
        error:
          'NVIDIA API Key is missing. Please add your NVIDIA API key (from https://build.nvidia.com) in Settings or set NVIDIA_API_KEY in .env.',
      });
      sendEvent('[DONE]');
      res.end();
      return;
    }

    try {
      // Build OpenAI-compatible message payload
      const formattedMessages: Array<{ role: string; content: string }> = [];

      if (systemInstruction && systemInstruction.trim()) {
        formattedMessages.push({
          role: 'system',
          content: systemInstruction.trim(),
        });
      }

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        let content = msg.content || '';

        // If last user message has attachments info or descriptions
        if (i === messages.length - 1 && attachments && attachments.length > 0) {
          const filesSummary = attachments
            .map((att: { name: string; type: string }) => `[Attached file: ${att.name} (${att.type})]`)
            .join('\n');
          content = `${filesSummary}\n\n${content}`;
        }

        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content,
        });
      }

      const nvidiaResponse = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nvidiaKey.trim()}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          top_p: typeof topP === 'number' ? topP : 0.95,
          max_tokens: typeof maxTokens === 'number' ? maxTokens : 4096,
          stream: true,
        }),
      });

      if (!nvidiaResponse.ok) {
        const errText = await nvidiaResponse.text();
        let errMsg = `NVIDIA API error: HTTP ${nvidiaResponse.status}`;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed?.error?.message || parsed?.detail || errMsg;
        } catch {
          errMsg = errText || errMsg;
        }
        sendEvent({ error: errMsg });
        sendEvent('[DONE]');
        res.end();
        return;
      }

      if (!nvidiaResponse.body) {
        sendEvent({ error: 'NVIDIA API returned empty response body.' });
        sendEvent('[DONE]');
        res.end();
        return;
      }

      // Stream parsing SSE chunks from NVIDIA
      const reader = nvidiaResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const payload = trimmed.replace(/^data:\s*/, '').trim();

          if (payload === '[DONE]') {
            sendEvent('[DONE]');
            res.end();
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            const choice = parsed?.choices?.[0];
            const delta = choice?.delta;

            // DeepSeek-R1 and similar reasoning models output reasoning_content
            const reasoning = delta?.reasoning_content || '';
            const textChunk = delta?.content || '';

            if (textChunk || reasoning) {
              sendEvent({
                chunk: textChunk,
                reasoningChunk: reasoning,
                model: parsed.model || model,
              });
            }
          } catch {
            // Ignore parse errors on partial heartbeats
          }
        }
      }

      sendEvent('[DONE]');
      res.end();
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error during NVIDIA streaming';
      sendEvent({ error: message });
      sendEvent('[DONE]');
      res.end();
      return;
    }
  }

  // Handle Gemini Provider
  if (!geminiClient) {
    sendEvent({
      error: 'GEMINI_API_KEY is not configured on the server. Please check your environment configuration.',
    });
    sendEvent('[DONE]');
    res.end();
    return;
  }

  try {
    const geminiModel = model.includes('gemini') ? model : 'gemini-2.5-flash';

    // Format conversation history for Gemini SDK
    // The Gemini generateContent contents can be structured with parts
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // Check if there are attachments for this message
      if (i === messages.length - 1 && attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.base64 && att.type?.startsWith('image/')) {
            const rawBase64 = att.base64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.type,
                data: rawBase64,
              },
            });
          } else if (att.content) {
            parts.push({
              text: `[File Attachment: ${att.name}]\n${att.content}\n`,
            });
          }
        }
      }

      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    const config: Record<string, unknown> = {
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      topP: typeof topP === 'number' ? topP : 0.95,
      maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 4096,
    };

    if (systemInstruction && systemInstruction.trim()) {
      config.systemInstruction = systemInstruction.trim();
    }

    const responseStream = await geminiClient.models.generateContentStream({
      model: geminiModel,
      contents,
      config,
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        sendEvent({
          chunk: text,
          model: geminiModel,
        });
      }
    }

    sendEvent('[DONE]');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during Gemini generation';
    sendEvent({ error: message });
    sendEvent('[DONE]');
    res.end();
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniChat Server] running on http://0.0.0.0:${PORT}`);
    console.log(`- Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
    console.log(`- NVIDIA API: ${process.env.NVIDIA_API_KEY ? 'Configured in ENV' : 'Can be provided via UI/Header'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

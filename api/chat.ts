import type { IncomingMessage, ServerResponse } from 'node:http';

const AI_GATEWAY_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';

export interface ServerlessRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, unknown>;
}

export interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
}

interface ChatCompletionRequestBody {
  model?: string;
  messages?: Array<{ role: string; content: unknown }>;
  prompt?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}

function sendJson(res: ServerlessResponse, statusCode: number, payload: unknown) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    const next = res.status(statusCode);
    if (typeof next.json === 'function') {
      next.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req: ServerlessRequest): Promise<ChatCompletionRequestBody> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      return req.body.trim() ? (JSON.parse(req.body) as ChatCompletionRequestBody) : {};
    }
    if (typeof req.body === 'object') {
      return req.body as ChatCompletionRequestBody;
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as ChatCompletionRequestBody;
}

function getQueryParam(req: ServerlessRequest, key: string): string | undefined {
  if (req.query && req.query[key] !== undefined) {
    const val = req.query[key];
    if (typeof val === 'string') return val;
    if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  }
  if (req.url) {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get(key) ?? undefined;
  }
  return undefined;
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    sendJson(res, 405, {
      error: 'Method not allowed. Send a POST request with chat completion messages.',
    });
    return;
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 503, {
      error:
        'AI_GATEWAY_API_KEY is not configured. Please add it to your environment secrets.',
    });
    return;
  }

  try {
    let payload: ChatCompletionRequestBody;

    if (req.method === 'GET') {
      const prompt = getQueryParam(req, 'prompt')?.trim();
      const model = getQueryParam(req, 'model')?.trim();
      if (!prompt) {
        sendJson(res, 400, {
          error:
            'Provide a ?prompt=... query parameter for GET requests, or send a POST JSON body with { model, messages }.',
        });
        return;
      }
      payload = {
        ...(model ? { model } : {}),
        messages: [{ role: 'user', content: prompt }],
      };
    } else {
      const body = await readRequestBody(req);
      const { prompt, ...rest } = body;
      const messages =
        Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : typeof prompt === 'string' && prompt.trim()
            ? [{ role: 'user', content: prompt.trim() }]
            : null;

      if (!messages) {
        sendJson(res, 400, {
          error: 'Request body must include a non-empty "messages" array or "prompt" string.',
        });
        return;
      }

      payload = {
        ...rest,
        messages,
      };
    }

    const upstreamResponse = await fetch(AI_GATEWAY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccountKey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const contentType = upstreamResponse.headers.get('content-type') || '';

    if (payload.stream && upstreamResponse.ok && upstreamResponse.body) {
      res.statusCode = upstreamResponse.status;
      res.setHeader(
        'Content-Type',
        contentType || 'text/event-stream; charset=utf-8'
      );
      res.setHeader('Cache-Control', 'no-cache, no-transform');

      const reader = upstreamResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) res.write(value);
      }
      res.end();
      return;
    }

    const rawText = await upstreamResponse.text();
    let parsed: unknown = rawText;
    if (contentType.includes('application/json') || rawText.startsWith('{') || rawText.startsWith('[')) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { raw: rawText };
      }
    } else {
      parsed = { data: rawText };
    }

    sendJson(res, upstreamResponse.status, parsed);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to connect to AI Gateway.';
    sendJson(res, 502, { error: message });
  }
}

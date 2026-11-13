import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ServerlessRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, unknown>;
}

export interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
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

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, {
      ok: false,
      error: 'Method not allowed. Use GET or HEAD.',
    });
    return;
  }

  const aiGatewayConfigured = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());

  if (req.method === 'HEAD') {
    res.statusCode = 200;
    res.end();
    return;
  }

  sendJson(res, 200, {
    ok: true,
    status: 'healthy',
    service: 'petkin-serverless-api',
    timestamp: new Date().toISOString(),
    aiGateway: {
      endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
      configured: aiGatewayConfigured,
    },
  });
}

import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessRequest extends IncomingMessage {
  body?: unknown;
}

interface ServerlessResponse extends ServerResponse {
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

async function readBody(req: ServerlessRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      return req.body.trim()
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : {};
    }
    if (typeof req.body === 'object') {
      return req.body as Record<string, unknown>;
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
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
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const body = await readBody(req);
    const petId = Number(body.petId);
    const adopterName = String(body.adopterName || '').trim();
    const adopterEmail = String(body.adopterEmail || '').trim();
    const adopterPhone = String(body.adopterPhone || '').trim();
    const housingType = String(body.housingType || '').trim();
    const carePlan = String(body.carePlan || '').trim();

    if (!petId || !adopterName || !adopterEmail || !housingType || !carePlan) {
      sendJson(res, 400, {
        error: 'Pet selection, name, email, housing type, and care plan are required.',
      });
      return;
    }

    const referenceCode = `ENQ-${Date.now().toString().slice(-6)}-${Math.floor(
      10 + Math.random() * 89
    )}`;

    sendJson(res, 201, {
      enquiry: {
        id: Date.now(),
        referenceCode,
        petId,
        adopterName,
        adopterEmail,
        adopterPhone: adopterPhone || null,
        housingType,
        carePlan,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to submit enquiry.';
    sendJson(res, 500, { error: message });
  }
}

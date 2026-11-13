import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessRequest extends IncomingMessage {
  query?: Record<string, unknown>;
}

interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
}

const GROOMING_DATA = [
  {
    id: 1,
    slug: 'petkin-calm-bukit-timah',
    salonName: 'PetKin Calm Grooming Studio',
    location: 'Bukit Timah, Singapore',
    servesDogs: true,
    servesCats: true,
    photoUrl: '/images/service-grooming-studio.jpg',
    packages: [
      {
        id: 'basic-grooming',
        name: 'Basic Grooming',
        price: 55,
        petTypes: ['Dog', 'Cat'],
        description:
          'Warm botanical bath, low-decibel blow-dry, brush-out, ear clean, nail trim, and paw pad tidy.',
        durationMins: 60,
      },
      {
        id: 'full-grooming',
        name: 'Full Grooming',
        price: 85,
        petTypes: ['Dog', 'Cat'],
        description:
          'Complete comfort scissor/clipper styling, de-shedding coat mask, bath, nail, and hygiene care.',
        durationMins: 90,
      },
      {
        id: 'bath-blow-dry',
        name: 'Bath & Blow Dry',
        price: 45,
        petTypes: ['Dog', 'Cat'],
        description:
          'Double cleanse with chamomile & aloe wash, conditioning rinse, and thorough root-to-tip drying.',
        durationMins: 45,
      },
      {
        id: 'nail-trimming',
        name: 'Nail Trimming',
        price: 25,
        petTypes: ['Dog', 'Cat'],
        description:
          'Low-stress nail clip and smooth buffing, paw pad fur tidy, and ear corner wipe.',
        durationMins: 25,
      },
    ],
    availableSlots: ['10:00 AM', '1:30 PM', '4:30 PM'],
    maxConcurrentPerSlot: 2,
    rating: null,
    reviewCount: 0,
    active: true,
  },
  {
    id: 2,
    slug: 'petkin-east-coast-joo-chiat',
    salonName: 'PetKin East Coast Care Studio',
    location: 'Joo Chiat, Singapore',
    servesDogs: true,
    servesCats: true,
    photoUrl: '/images/service-grooming-studio.jpg',
    packages: [
      {
        id: 'basic-grooming',
        name: 'Basic Grooming',
        price: 58,
        petTypes: ['Dog', 'Cat'],
        description:
          'Gentle tropical-climate bath, brush-out, ear cleaning, nail trim, and sanitary tidy.',
        durationMins: 60,
      },
      {
        id: 'full-grooming',
        name: 'Full Grooming',
        price: 88,
        petTypes: ['Dog', 'Cat'],
        description:
          'Breed-comfort styling, undercoat deshedding, soothing oat mask, and full hygiene care.',
        durationMins: 95,
      },
      {
        id: 'bath-blow-dry',
        name: 'Bath & Blow Dry',
        price: 48,
        petTypes: ['Dog', 'Cat'],
        description:
          'Hypoallergenic coat wash and moisture-wicking dry ideal after East Coast park walks.',
        durationMins: 45,
      },
      {
        id: 'nail-trimming',
        name: 'Nail Trimming',
        price: 25,
        petTypes: ['Dog', 'Cat'],
        description: 'Calm nail clip, dremel smoothing, and paw balm conditioning.',
        durationMins: 25,
      },
    ],
    availableSlots: ['09:30 AM', '12:30 PM', '3:30 PM'],
    maxConcurrentPerSlot: 2,
    rating: null,
    reviewCount: 0,
    active: true,
  },
];

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

function getParam(req: ServerlessRequest, key: string): string {
  if (req.query && req.query[key] !== undefined) {
    const v = req.query[key];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  }
  if (req.url) {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get(key) || '';
  }
  return '';
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
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const search = getParam(req, 'search').trim().toLowerCase();
  const petType = getParam(req, 'petType');
  const location = getParam(req, 'location').trim().toLowerCase();
  const serviceName = getParam(req, 'serviceName').trim().toLowerCase();
  const maxPriceRaw = getParam(req, 'maxPrice');
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;

  const providers = GROOMING_DATA.map((provider) => ({
    ...provider,
    slotAvailability: provider.availableSlots.map((slot) => ({
      slot,
      remaining: provider.maxConcurrentPerSlot,
      available: provider.maxConcurrentPerSlot > 0,
    })),
  })).filter((p) => {
    if (petType === 'Dog' && !p.servesDogs) return false;
    if (petType === 'Cat' && !p.servesCats) return false;
    if (location && location !== 'all' && !p.location.toLowerCase().includes(location)) {
      return false;
    }
    if (serviceName && serviceName !== 'all') {
      const hasPkg = p.packages.some((pkg) =>
        pkg.name.toLowerCase().includes(serviceName)
      );
      if (!hasPkg) return false;
    }
    if (maxPrice) {
      const minPkg = Math.min(...p.packages.map((pkg) => pkg.price));
      if (minPkg > maxPrice) return false;
    }
    if (search) {
      const pkgText = p.packages
        .map((x) => `${x.name} ${x.description}`)
        .join(' ');
      const hay = `${p.salonName} ${p.location} ${pkgText}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  sendJson(res, 200, { providers });
}

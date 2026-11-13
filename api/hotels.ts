import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessRequest extends IncomingMessage {
  query?: Record<string, unknown>;
}

interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
}

const HOTELS_DATA = [
  {
    id: 1,
    slug: 'petkin-sanctuary-bukit-timah',
    name: 'PetKin Sanctuary Suites',
    location: 'Bukit Timah, Singapore',
    acceptsDogs: true,
    acceptsCats: true,
    photoUrl: '/images/service-hotel-suites.jpg',
    roomTypes: [
      {
        name: 'Dog Sanctuary Suite',
        species: 'Dog',
        dimensions: '2.2 m × 1.8 m private acoustic suite',
        description:
          'Quiet oak-framed suite with raised orthopaedic bedding, three daily structured walks, and evening check-in notes.',
        dailyCapacity: 6,
        pricePerNight: 78,
      },
      {
        name: 'Cat Sunlit Wing Condo',
        species: 'Cat',
        dimensions: '1.6 m multi-tier vertical condo',
        description:
          'Located in a dog-free wing with sunlit window perches, tucked litter alcove, and twice-daily wand play.',
        dailyCapacity: 8,
        pricePerNight: 52,
      },
    ],
    facilities: [
      '24/7 Care Attendants',
      'HEPA Air Filtration',
      'Dedicated Dog-Free Feline Wing',
      'Customised Meal Prep',
      'Daily Photo & Appetite Updates',
    ],
    startingPricePerNight: 52,
    verified: true,
    rating: null,
    reviewCount: 0,
    active: true,
  },
  {
    id: 2,
    slug: 'petkin-harbour-tiong-bahru',
    name: 'PetKin Harbour Lodge',
    location: 'Tiong Bahru, Singapore',
    acceptsDogs: true,
    acceptsCats: true,
    photoUrl: '/images/service-hotel-suites.jpg',
    roomTypes: [
      {
        name: 'Garden Rest Dog Cabin',
        species: 'Dog',
        dimensions: '2.0 m × 1.6 m calm rest cabin',
        description:
          'Designed for HDB-sized and senior dogs seeking quiet daytime naps, shaded courtyard walks, and predictable feeding.',
        dailyCapacity: 5,
        pricePerNight: 72,
      },
      {
        name: 'Skyline Feline Loft',
        species: 'Cat',
        dimensions: '1.5 m climbing condo',
        description:
          'Peaceful elevated cat condo with privacy hideaway, filtered hydration fountain, and gentle brushing.',
        dailyCapacity: 6,
        pricePerNight: 48,
      },
    ],
    facilities: [
      'Shaded Courtyard Walks',
      'Acoustic Glass Cabins',
      'Medical-Grade Sanitisation',
      'Vet On-Call Protocol',
      'Twice-Daily Litter Sanitisation',
    ],
    startingPricePerNight: 48,
    verified: true,
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
  const maxPriceRaw = getParam(req, 'maxPrice');
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;

  const enriched = HOTELS_DATA.map((hotel) => {
    const roomsWithAvailability = hotel.roomTypes.map((room) => ({
      ...room,
      remainingRooms: room.dailyCapacity,
      isAvailable: room.dailyCapacity > 0,
    }));
    const totalRemaining = roomsWithAvailability.reduce(
      (sum, r) => sum + r.remainingRooms,
      0
    );
    return {
      ...hotel,
      roomsWithAvailability,
      totalRemaining,
      hasAvailability: totalRemaining > 0,
    };
  }).filter((hotel) => {
    if (petType === 'Dog' && !hotel.acceptsDogs) return false;
    if (petType === 'Cat' && !hotel.acceptsCats) return false;
    if (location && location !== 'all' && !hotel.location.toLowerCase().includes(location)) {
      return false;
    }
    if (maxPrice && hotel.startingPricePerNight > maxPrice) return false;
    if (search) {
      const hay = `${hotel.name} ${hotel.location} ${hotel.facilities.join(' ')}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  sendJson(res, 200, { hotels: enriched });
}

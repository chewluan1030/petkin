import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
}

const PRICING_DATA = {
  serviceCategories: [
    {
      id: 1,
      categoryName: 'Pet Hotel / Boarding',
      priceDisplay: 'From S$48 / night',
      startingPriceSgd: 48,
      durationOrUnit: 'Per night',
      description:
        'Acoustic-buffered canine suites and dog-free feline condos with daily feeding, walks, and enrichment updates.',
      sortOrder: 1,
    },
    {
      id: 2,
      categoryName: 'Basic Grooming',
      priceDisplay: 'From S$55 / session',
      startingPriceSgd: 55,
      durationOrUnit: '60 mins',
      description:
        'Warm botanical bath, low-decibel blow-dry, brush-out, ear cleaning, nail trim, and paw pad tidy.',
      sortOrder: 2,
    },
    {
      id: 3,
      categoryName: 'Full Grooming',
      priceDisplay: 'From S$85 / session',
      startingPriceSgd: 85,
      durationOrUnit: '90–120 mins',
      description:
        'Complete comfort styling, undercoat de-shedding, soothing coat mask, bath, nail, and hygiene care.',
      sortOrder: 3,
    },
    {
      id: 4,
      categoryName: 'Bath & Blow Dry',
      priceDisplay: 'From S$45 / session',
      startingPriceSgd: 45,
      durationOrUnit: '45 mins',
      description:
        'Hypoallergenic tropical-climate wash, conditioning rinse, and thorough undercoat drying.',
      sortOrder: 4,
    },
    {
      id: 5,
      categoryName: 'Nail Trimming',
      priceDisplay: 'From S$25 / session',
      startingPriceSgd: 25,
      durationOrUnit: '25 mins',
      description:
        'Low-stress nail clip, smooth buffing, paw pad fur trim, and soothing paw balm.',
      sortOrder: 5,
    },
    {
      id: 6,
      categoryName: 'Additional Pet Care Services',
      priceDisplay: 'From S$15 / add-on',
      startingPriceSgd: 15,
      durationOrUnit: 'Per add-on',
      description:
        'Optional scent-work enrichment session, soothing paw balm ritual, or extended late check-out care.',
      sortOrder: 6,
    },
  ],
  membershipPlans: [
    {
      id: 1,
      slug: 'free',
      name: 'Free Plan',
      monthlyPriceSgd: 0,
      discountPct: 0,
      badgeLabel: null,
      tagline:
        'Explore verified shelter companions and book PetKin services anytime.',
      features: [
        'Browse pet adoption listings',
        'Browse pet services',
        'Standard booking access',
      ],
      sortOrder: 1,
      active: true,
    },
    {
      id: 2,
      slug: 'paw-plus',
      name: 'Paw Plus',
      monthlyPriceSgd: 9.9,
      discountPct: 10,
      badgeLabel: 'Most Popular',
      tagline:
        'Everyday savings and helpful care reminders for regular grooming and stays.',
      features: [
        'Member offers',
        'Eligible booking discounts (10%)',
        'Pet-care reminders',
      ],
      sortOrder: 2,
      active: true,
    },
    {
      id: 3,
      slug: 'paw-premium',
      name: 'Paw Premium',
      monthlyPriceSgd: 19.9,
      discountPct: 15,
      badgeLabel: null,
      tagline:
        'Enhanced partner savings and priority scheduling for frequent travellers.',
      features: [
        'Additional eligible partner discounts (15%)',
        'Priority customer support',
        'Additional membership benefits',
      ],
      sortOrder: 3,
      active: true,
    },
  ],
};

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
  req: IncomingMessage,
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
  sendJson(res, 200, PRICING_DATA);
}

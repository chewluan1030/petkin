import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessRequest extends IncomingMessage {
  query?: Record<string, unknown>;
}

interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
}

const PETS_DATA = [
  {
    id: 1,
    slug: 'kopi',
    name: 'Kopi',
    petType: 'Dog',
    breed: 'Singapore Special (Project ADORE)',
    age: '2 yrs 6 mos',
    gender: 'Male',
    weight: '13.5 kg',
    photoUrl: '/images/pet-kopi-dog.jpg',
    personality:
      'Steady, house-trained, and greets strangers politely after a 2-minute sniff.',
    specialCare:
      'Two 20–25 minute brisk morning/evening walks plus basic scent games keep Kopi settled and happy indoors.',
    hdbSuitable: true,
    seniorFriendly: false,
    goodWithKids: true,
    firstTimeFriendly: true,
    shelterId: 1,
    shelterName: 'Oasis Second Chance',
    shelterLocation: 'Pasir Ris Farmway, Singapore',
    adoptionStatus: 'Available',
    monthlyCareCostSgd: 180,
    welfareNotes:
      'Thrives with predictable morning and evening walk routines and a quiet resting mat away from corridor foot traffic.',
  },
  {
    id: 2,
    slug: 'milo',
    name: 'Milo',
    petType: 'Cat',
    breed: 'Local Domestic Shorthair',
    age: '3 yrs 2 mos',
    gender: 'Male',
    weight: '4.4 kg',
    photoUrl: '/images/pet-milo-cat.jpg',
    personality:
      'Affectionate ginger-and-white companion who enjoys sunlit windowsills and quiet company.',
    specialCare:
      'Requires fully meshed HDB windows, a vertical scratching post, and two 15-minute wand-toy play sessions before meals.',
    hdbSuitable: true,
    seniorFriendly: true,
    goodWithKids: true,
    firstTimeFriendly: true,
    shelterId: 2,
    shelterName: 'Cat Welfare Society Partner Foster',
    shelterLocation: 'Tiong Bahru, Singapore',
    adoptionStatus: 'Available',
    monthlyCareCostSgd: 110,
    welfareNotes:
      'Strictly indoor placement with secure window grilles or magnetic meshing is essential for feline safety in high-rise flats.',
  },
  {
    id: 3,
    slug: 'luna',
    name: 'Luna',
    petType: 'Dog',
    breed: 'Terrier Mix (HDB-Sized)',
    age: '7 yrs 4 mos',
    gender: 'Female',
    weight: '8.2 kg',
    photoUrl: '/images/pet-luna-dog.jpg',
    personality:
      'Gentle older soul who prefers slow sniff strolls and afternoon naps on supportive bedding.',
    specialCare:
      'Short 15-minute shaded walks in cool hours, joint-supportive diet, and bi-annual senior health checks keep her comfortable.',
    hdbSuitable: true,
    seniorFriendly: true,
    goodWithKids: false,
    firstTimeFriendly: true,
    shelterId: 3,
    shelterName: 'Causes for Animals Singapore',
    shelterLocation: 'Sungei Tengah, Singapore',
    adoptionStatus: 'Available',
    monthlyCareCostSgd: 210,
    welfareNotes:
      'Best suited to calmer adult or senior households without roughhousing toddlers, with non-slip mats on smooth floor tiles.',
  },
  {
    id: 4,
    slug: 'kaya',
    name: 'Kaya',
    petType: 'Cat',
    breed: 'Calico Domestic Shorthair',
    age: '4 yrs 8 mos',
    gender: 'Female',
    weight: '3.9 kg',
    photoUrl: '/images/pet-kaya-cat.jpg',
    personality:
      'Independent, observant calico who warms up gracefully to respectful, unhurried routines.',
    specialCare:
      'Needs a predictable feeding schedule, two clean litter trays in quiet corners, and elevated resting perches.',
    hdbSuitable: true,
    seniorFriendly: true,
    goodWithKids: false,
    firstTimeFriendly: false,
    shelterId: 4,
    shelterName: 'Love Kuching Project',
    shelterLocation: 'Joo Chiat, Singapore',
    adoptionStatus: 'Available',
    monthlyCareCostSgd: 105,
    welfareNotes:
      'Flourishes in peaceful homes that respect feline body language and provide high observation shelves rather than constant handling.',
  },
  {
    id: 5,
    slug: 'boba',
    name: 'Boba',
    petType: 'Dog',
    breed: 'Singapore Special (Project ADORE)',
    age: '1 yr 10 mos',
    gender: 'Male',
    weight: '11.8 kg',
    photoUrl: '/images/pet-boba-dog.jpg',
    personality:
      'Bright, food-motivated young dog who settles neatly beside the study desk after morning exercise.',
    specialCare:
      'Enjoys 30-minute morning walks, basic positive-reinforcement training, and stuffed puzzle feeders while owners work.',
    hdbSuitable: true,
    seniorFriendly: false,
    goodWithKids: true,
    firstTimeFriendly: true,
    shelterId: 5,
    shelterName: 'Action for Singapore Dogs',
    shelterLocation: 'Lim Chu Kang, Singapore',
    adoptionStatus: 'Available',
    monthlyCareCostSgd: 175,
    welfareNotes:
      'Needs consistent mental enrichment and human presence every 5 hours; best matched with hybrid workers or active families.',
  },
  {
    id: 6,
    slug: 'mochi',
    name: 'Mochi',
    petType: 'Cat',
    breed: 'Grey Tabby Shorthair',
    age: '2 yrs 1 mo',
    gender: 'Male',
    weight: '4.1 kg',
    photoUrl: '/images/pet-mochi-cat.jpg',
    personality:
      'Playful yet gentle tabby who greets family members at the door and loves gentle chin rubs.',
    specialCare:
      'Interactive feather play for 20 minutes daily, hydration-rich wet meals, and weekly brushing keep his coat glossy.',
    hdbSuitable: true,
    seniorFriendly: true,
    goodWithKids: true,
    firstTimeFriendly: true,
    shelterId: 6,
    shelterName: 'SPCA Singapore Partner',
    shelterLocation: 'Sungei Tengah Road, Singapore',
    adoptionStatus: 'Available',
    monthlyCareCostSgd: 115,
    welfareNotes:
      'Adaptable indoor cat suited for first-time adopters committed to meshed windows and steady daily engagement.',
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
  const hdbApproved = getParam(req, 'hdbApproved') === 'true';
  const seniorFriendly = getParam(req, 'seniorFriendly') === 'true';
  const goodWithKids = getParam(req, 'goodWithKids') === 'true';

  const pets = PETS_DATA.filter((pet) => {
    if (pet.adoptionStatus !== 'Available') return false;
    if ((petType === 'Dog' || petType === 'Cat') && pet.petType !== petType) {
      return false;
    }
    if (hdbApproved && !pet.hdbSuitable) return false;
    if (seniorFriendly && !pet.seniorFriendly) return false;
    if (goodWithKids && !pet.goodWithKids) return false;
    if (search) {
      const hay = `${pet.name} ${pet.breed} ${pet.shelterName} ${pet.personality}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  sendJson(res, 200, { pets });
}

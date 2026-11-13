import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessRequest extends IncomingMessage {
  body?: unknown;
}

interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
}

interface MatcherUserProfile {
  housingType: 'HDB Flat' | 'Condominium' | 'Landed Home';
  householdSize: number;
  childrenAtHome: boolean;
  seniorsAtHome: boolean;
  previousExperience: 'First-Time Owner' | 'Experienced Owner';
  dailyWorkingHours: string;
  activityLevel: 'Gentle Daily Care' | 'Moderate Walks & Play' | 'Active Outdoor Lifestyle';
  petSizePreference: 'Any Size' | 'Small / Cat' | 'Medium (HDB-Sized)';
  preferredPetType: 'Any' | 'Cat' | 'Dog';
  monthlyBudgetSgd: number;
}

const AVAILABLE_PETS = [
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

const MATCH_DISCLAIMER =
  'AI scores are guidance only, not guaranteed compatibility. Eligibility, HDB rules and adoption approval must be confirmed by the shelter and relevant authorities.';

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

async function readBody(req: ServerlessRequest): Promise<MatcherUserProfile | null> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      return req.body.trim() ? (JSON.parse(req.body) as MatcherUserProfile) : null;
    }
    if (typeof req.body === 'object') {
      return req.body as MatcherUserProfile;
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as MatcherUserProfile) : null;
}

function fallbackMatchPets(userProfile: MatcherUserProfile) {
  const pool = AVAILABLE_PETS.filter(
    (p) =>
      userProfile.preferredPetType === 'Any' ||
      p.petType === userProfile.preferredPetType
  );
  const candidates = pool.length > 0 ? pool : AVAILABLE_PETS;

  return candidates
    .map((pet) => {
      let score = 78;
      const explanations: string[] = [];
      const concerns: string[] = [];

      if (userProfile.housingType === 'HDB Flat') {
        if (pet.hdbSuitable) {
          score += 8;
          explanations.push('Meets HDB housing suitability criteria');
        } else {
          score -= 25;
          concerns.push('May exceed HDB size or housing guidelines');
        }
      }
      if (userProfile.childrenAtHome) {
        if (pet.goodWithKids) {
          score += 6;
          explanations.push('Observed calm around children');
        } else {
          score -= 18;
          concerns.push('Best suited to quiet adult households without young children');
        }
      }
      if (userProfile.seniorsAtHome && pet.seniorFriendly) {
        score += 5;
        explanations.push('Gentle indoor temperament suited to senior family members');
      }
      if (
        userProfile.previousExperience === 'First-Time Owner' &&
        !pet.firstTimeFriendly
      ) {
        score -= 10;
        concerns.push('Benefits from prior handling experience');
      }
      if (pet.monthlyCareCostSgd <= userProfile.monthlyBudgetSgd) {
        score += 4;
        explanations.push(
          `Estimated S$${pet.monthlyCareCostSgd}/mo upkeep fits within your S$${userProfile.monthlyBudgetSgd} budget`
        );
      } else {
        score -= 10;
        concerns.push(
          `Estimated S$${pet.monthlyCareCostSgd}/mo care cost exceeds your stated S$${userProfile.monthlyBudgetSgd} budget`
        );
      }

      return {
        petId: pet.id,
        matchScore: Math.max(40, Math.min(98, score)),
        matchExplanation:
          explanations.length > 0
            ? `${explanations.join('. ')}.`
            : `${pet.name} aligns with your household pace and daily care capacity.`,
        careConsiderations: `${pet.specialCare} ${pet.welfareNotes}`,
        compatibilityConcerns:
          concerns.length > 0
            ? concerns.join(' ')
            : 'Confirm window meshing (for cats) or daily walk handoffs (for dogs) during shelter screening.',
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
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
    const userProfile = await readBody(req);
    if (!userProfile || !userProfile.housingType) {
      sendJson(res, 400, { error: 'Lifestyle profile is required.' });
      return;
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      try {
        const filtered = AVAILABLE_PETS.filter(
          (p) =>
            userProfile.preferredPetType === 'Any' ||
            p.petType === userProfile.preferredPetType
        );
        const pool = filtered.length > 0 ? filtered : AVAILABLE_PETS;
        const prompt = `You are a Singapore animal welfare adoption counsellor at PetKin.
Evaluate the prospective adopter's household profile against the currently available shelter cats and dogs below.
Prioritise animal welfare, Singapore HDB housing suitability, children/senior safety, daily working hours, and realistic monthly care budget.
Return JSON: { "recommendations": [{ "petId": number, "matchScore": number, "matchExplanation": string, "careConsiderations": string, "compatibilityConcerns": string }] } for up to top 3 pets using ONLY pet IDs in the list.

Adopter Profile:
${JSON.stringify(userProfile)}

Available Shelter Pets:
${JSON.stringify(pool)}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (geminiRes.ok) {
          const gData = (await geminiRes.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const rawText =
            gData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const parsed = JSON.parse(rawText) as {
            recommendations?: Array<{
              petId: number;
              matchScore: number;
              matchExplanation: string;
              careConsiderations: string;
              compatibilityConcerns: string;
            }>;
          };
          const validIds = new Set(AVAILABLE_PETS.map((p) => p.id));
          const clean = (parsed.recommendations || [])
            .filter((r) => validIds.has(r.petId))
            .slice(0, 3)
            .map((r) => ({
              petId: r.petId,
              matchScore: Math.max(0, Math.min(100, Math.round(r.matchScore))),
              matchExplanation: r.matchExplanation,
              careConsiderations: r.careConsiderations,
              compatibilityConcerns: r.compatibilityConcerns,
            }));

          if (clean.length > 0) {
            sendJson(res, 200, {
              recommendations: clean,
              source: 'gemini',
              disclaimer: MATCH_DISCLAIMER,
              availablePets: AVAILABLE_PETS,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Gemini REST fallback triggered:', err);
      }
    }

    sendJson(res, 200, {
      recommendations: fallbackMatchPets(userProfile),
      source: 'welfare-fallback',
      disclaimer: MATCH_DISCLAIMER,
      availablePets: AVAILABLE_PETS,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Failed to compute pet matches.';
    sendJson(res, 500, { error: msg });
  }
}

import { GoogleGenAI, Type } from '@google/genai';

export interface MatcherUserProfile {
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

export interface AvailablePetForMatch {
  id: number;
  name: string;
  petType: string;
  breed: string;
  age: string;
  gender: string;
  weight: string;
  personality: string;
  specialCare: string;
  hdbSuitable: boolean;
  seniorFriendly: boolean;
  goodWithKids: boolean;
  firstTimeFriendly: boolean;
  shelterName: string;
  monthlyCareCostSgd: number;
  welfareNotes: string;
}

export interface PetMatchRecommendation {
  petId: number;
  matchScore: number;
  matchExplanation: string;
  careConsiderations: string;
  compatibilityConcerns: string;
}

export interface MatchPetsResponse {
  recommendations: PetMatchRecommendation[];
  source: 'gemini' | 'welfare-fallback';
  disclaimer: string;
}

const MATCH_DISCLAIMER =
  'AI scores are guidance only, not guaranteed compatibility. Eligibility, HDB rules and adoption approval must be confirmed by the shelter and relevant authorities.';

function fallbackMatchPets(
  userProfile: MatcherUserProfile,
  availablePets: AvailablePetForMatch[]
): PetMatchRecommendation[] {
  const scored = availablePets
    .filter(
      (p) =>
        userProfile.preferredPetType === 'Any' ||
        p.petType === userProfile.preferredPetType
    )
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
    });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

export async function matchPetWithGemini(
  userProfile: MatcherUserProfile,
  availablePets: AvailablePetForMatch[]
): Promise<MatchPetsResponse> {
  if (availablePets.length === 0) {
    return {
      recommendations: [],
      source: 'welfare-fallback',
      disclaimer: MATCH_DISCLAIMER,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      recommendations: fallbackMatchPets(userProfile, availablePets),
      source: 'welfare-fallback',
      disclaimer: MATCH_DISCLAIMER,
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const filteredCandidates = availablePets.filter(
      (p) =>
        userProfile.preferredPetType === 'Any' ||
        p.petType === userProfile.preferredPetType
    );
    const pool = filteredCandidates.length > 0 ? filteredCandidates : availablePets;

    const prompt = `You are a Singapore animal welfare adoption counsellor at PetKin.
Evaluate the prospective adopter's household profile against the currently available shelter cats and dogs below.
Prioritise animal welfare, Singapore HDB housing suitability (Project ADORE / meshed windows for cats), children/senior safety, daily working hours, and realistic monthly care budget — NEVER appearance alone.
Return the top 3 recommended pets (or fewer if fewer than 3 exist) using ONLY pet IDs present in the provided list.

Adopter Profile:
${JSON.stringify(userProfile, null, 2)}

Available Shelter Pets:
${JSON.stringify(pool, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'Respond strictly in JSON matching the schema. Keep explanations warm, specific to Singapore households, honest about care commitments, and never guarantee adoption approval.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  petId: { type: Type.INTEGER },
                  matchScore: { type: Type.INTEGER },
                  matchExplanation: { type: Type.STRING },
                  careConsiderations: { type: Type.STRING },
                  compatibilityConcerns: { type: Type.STRING },
                },
                required: [
                  'petId',
                  'matchScore',
                  'matchExplanation',
                  'careConsiderations',
                  'compatibilityConcerns',
                ],
              },
            },
          },
          required: ['recommendations'],
        },
      },
    });

    const raw = (response.text || '{}').trim();
    const parsed = JSON.parse(raw) as {
      recommendations?: PetMatchRecommendation[];
    };

    const validIds = new Set(availablePets.map((p) => p.id));
    const cleanRecs = (parsed.recommendations || [])
      .filter((r) => validIds.has(r.petId))
      .slice(0, 3)
      .map((r) => ({
        petId: r.petId,
        matchScore: Math.max(0, Math.min(100, Math.round(r.matchScore))),
        matchExplanation: r.matchExplanation,
        careConsiderations: r.careConsiderations,
        compatibilityConcerns: r.compatibilityConcerns,
      }));

    if (cleanRecs.length === 0) {
      return {
        recommendations: fallbackMatchPets(userProfile, availablePets),
        source: 'welfare-fallback',
        disclaimer: MATCH_DISCLAIMER,
      };
    }

    return {
      recommendations: cleanRecs,
      source: 'gemini',
      disclaimer: MATCH_DISCLAIMER,
    };
  } catch (error) {
    console.error('Gemini matchPet failed, using welfare fallback:', error);
    return {
      recommendations: fallbackMatchPets(userProfile, availablePets),
      source: 'welfare-fallback',
      disclaimer: MATCH_DISCLAIMER,
    };
  }
}

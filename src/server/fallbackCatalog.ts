import type {
  GroomingFilters,
  HotelFilters,
  PetFilters,
} from '../db/queries.ts';

export const FALLBACK_PETS = [
  {
    id: 1,
    slug: 'kopi',
    name: 'Kopi',
    petType: 'Dog' as const,
    breed: 'Singapore Special (Project ADORE)',
    age: '2 yrs 6 mos',
    gender: 'Male' as const,
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
    petType: 'Cat' as const,
    breed: 'Local Domestic Shorthair',
    age: '3 yrs 2 mos',
    gender: 'Male' as const,
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
    petType: 'Dog' as const,
    breed: 'Terrier Mix (HDB-Sized)',
    age: '7 yrs 4 mos',
    gender: 'Female' as const,
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
    petType: 'Cat' as const,
    breed: 'Calico Domestic Shorthair',
    age: '4 yrs 8 mos',
    gender: 'Female' as const,
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
    petType: 'Dog' as const,
    breed: 'Singapore Special (Project ADORE)',
    age: '1 yr 10 mos',
    gender: 'Male' as const,
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
    petType: 'Cat' as const,
    breed: 'Grey Tabby Shorthair',
    age: '2 yrs 1 mo',
    gender: 'Male' as const,
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

export const FALLBACK_HOTELS = [
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
        species: 'Dog' as const,
        dimensions: '2.2 m × 1.8 m private acoustic suite',
        description:
          'Quiet oak-framed suite with raised orthopaedic bedding, three daily structured walks, and evening check-in notes.',
        dailyCapacity: 6,
        pricePerNight: 78,
      },
      {
        name: 'Cat Sunlit Wing Condo',
        species: 'Cat' as const,
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
        species: 'Dog' as const,
        dimensions: '2.0 m × 1.6 m calm rest cabin',
        description:
          'Designed for HDB-sized and senior dogs seeking quiet daytime naps, shaded courtyard walks, and predictable feeding.',
        dailyCapacity: 5,
        pricePerNight: 72,
      },
      {
        name: 'Skyline Feline Loft',
        species: 'Cat' as const,
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

export const FALLBACK_GROOMING_PROVIDERS = [
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
        petTypes: ['Dog' as const, 'Cat' as const],
        description:
          'Warm botanical bath, low-decibel blow-dry, brush-out, ear clean, nail trim, and paw pad tidy.',
        durationMins: 60,
      },
      {
        id: 'full-grooming',
        name: 'Full Grooming',
        price: 85,
        petTypes: ['Dog' as const, 'Cat' as const],
        description:
          'Complete comfort scissor/clipper styling, de-shedding coat mask, bath, nail, and hygiene care.',
        durationMins: 90,
      },
      {
        id: 'bath-blow-dry',
        name: 'Bath & Blow Dry',
        price: 45,
        petTypes: ['Dog' as const, 'Cat' as const],
        description:
          'Double cleanse with chamomile & aloe wash, conditioning rinse, and thorough root-to-tip drying.',
        durationMins: 45,
      },
      {
        id: 'nail-trimming',
        name: 'Nail Trimming',
        price: 25,
        petTypes: ['Dog' as const, 'Cat' as const],
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
        petTypes: ['Dog' as const, 'Cat' as const],
        description:
          'Gentle tropical-climate bath, brush-out, ear cleaning, nail trim, and sanitary tidy.',
        durationMins: 60,
      },
      {
        id: 'full-grooming',
        name: 'Full Grooming',
        price: 88,
        petTypes: ['Dog' as const, 'Cat' as const],
        description:
          'Breed-comfort styling, undercoat deshedding, soothing oat mask, and full hygiene care.',
        durationMins: 95,
      },
      {
        id: 'bath-blow-dry',
        name: 'Bath & Blow Dry',
        price: 48,
        petTypes: ['Dog' as const, 'Cat' as const],
        description:
          'Hypoallergenic coat wash and moisture-wicking dry ideal after East Coast park walks.',
        durationMins: 45,
      },
      {
        id: 'nail-trimming',
        name: 'Nail Trimming',
        price: 25,
        petTypes: ['Dog' as const, 'Cat' as const],
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

export const FALLBACK_PRICING = {
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

export function filterFallbackPets(filters: PetFilters = {}) {
  const q = (filters.search || '').trim().toLowerCase();
  return FALLBACK_PETS.filter((pet) => {
    if (!filters.includeAllStatuses && pet.adoptionStatus !== 'Available') {
      return false;
    }
    if (filters.petType && pet.petType !== filters.petType) {
      return false;
    }
    if (filters.hdbApproved && !pet.hdbSuitable) {
      return false;
    }
    if (filters.seniorFriendly && !pet.seniorFriendly) {
      return false;
    }
    if (filters.goodWithKids && !pet.goodWithKids) {
      return false;
    }
    if (q) {
      const hay = `${pet.name} ${pet.breed} ${pet.shelterName} ${pet.personality}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterFallbackHotels(filters: HotelFilters = {}) {
  const q = (filters.search || '').trim().toLowerCase();
  const loc = (filters.location || '').trim().toLowerCase();

  const enriched = FALLBACK_HOTELS.map((hotel) => {
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
  });

  return enriched.filter((hotel) => {
    if (filters.petType === 'Dog' && !hotel.acceptsDogs) return false;
    if (filters.petType === 'Cat' && !hotel.acceptsCats) return false;
    if (loc && loc !== 'all' && !hotel.location.toLowerCase().includes(loc)) {
      return false;
    }
    if (
      filters.maxPrice &&
      hotel.startingPricePerNight > Number(filters.maxPrice)
    ) {
      return false;
    }
    if (q) {
      const hay = `${hotel.name} ${hotel.location} ${hotel.facilities.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterFallbackGrooming(filters: GroomingFilters = {}) {
  const q = (filters.search || '').trim().toLowerCase();
  const loc = (filters.location || '').trim().toLowerCase();
  const svc = (filters.serviceName || '').trim().toLowerCase();

  const enriched = FALLBACK_GROOMING_PROVIDERS.map((provider) => ({
    ...provider,
    slotAvailability: provider.availableSlots.map((slot) => ({
      slot,
      remaining: provider.maxConcurrentPerSlot,
      available: provider.maxConcurrentPerSlot > 0,
    })),
  }));

  return enriched.filter((p) => {
    if (filters.petType === 'Dog' && !p.servesDogs) return false;
    if (filters.petType === 'Cat' && !p.servesCats) return false;
    if (loc && loc !== 'all' && !p.location.toLowerCase().includes(loc)) {
      return false;
    }
    if (svc && svc !== 'all') {
      const hasPkg = p.packages.some((pkg) =>
        pkg.name.toLowerCase().includes(svc)
      );
      if (!hasPkg) return false;
    }
    if (filters.maxPrice) {
      const minPkg = Math.min(...p.packages.map((pkg) => pkg.price));
      if (minPkg > Number(filters.maxPrice)) return false;
    }
    if (q) {
      const pkgText = p.packages
        .map((x) => `${x.name} ${x.description}`)
        .join(' ');
      const hay = `${p.salonName} ${p.location} ${pkgText}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

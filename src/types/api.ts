export type NavTab = 'find-a-pet' | 'services' | 'pricings';
export type PetSpecies = 'Dog' | 'Cat';

export interface PetListing {
  id: number;
  slug: string;
  name: string;
  petType: PetSpecies;
  breed: string;
  age: string;
  gender: 'Male' | 'Female';
  weight: string;
  photoUrl: string;
  personality: string;
  specialCare: string;
  hdbSuitable: boolean;
  seniorFriendly: boolean;
  goodWithKids: boolean;
  firstTimeFriendly: boolean;
  shelterId: number;
  shelterName: string;
  shelterLocation: string;
  adoptionStatus: 'Available' | 'Pending' | 'Adopted';
  monthlyCareCostSgd: number;
  welfareNotes: string;
}

export interface MatchRecommendation {
  petId: number;
  matchScore: number;
  matchExplanation: string;
  careConsiderations: string;
  compatibilityConcerns: string;
}

export interface HotelRoomWithAvailability {
  name: string;
  species: PetSpecies;
  pricePerNight: number;
  dimensions: string;
  dailyCapacity: number;
  description: string;
  remainingRooms: number;
  isAvailable: boolean;
}

export interface PetHotelListing {
  id: number;
  slug: string;
  name: string;
  location: string;
  acceptsDogs: boolean;
  acceptsCats: boolean;
  photoUrl: string;
  roomTypes: HotelRoomWithAvailability[];
  roomsWithAvailability: HotelRoomWithAvailability[];
  facilities: string[];
  startingPricePerNight: number;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  totalRemaining: number;
  hasAvailability: boolean;
}

export interface GroomingPackageItem {
  id: string;
  name: string;
  description: string;
  durationMins: number;
  price: number;
  petTypes: PetSpecies[];
}

export interface GroomingSlotAvailability {
  slot: string;
  remaining: number;
  available: boolean;
}

export interface GroomingProviderListing {
  id: number;
  slug: string;
  salonName: string;
  location: string;
  servesDogs: boolean;
  servesCats: boolean;
  photoUrl: string;
  packages: GroomingPackageItem[];
  availableSlots: string[];
  slotAvailability: GroomingSlotAvailability[];
  maxConcurrentPerSlot: number;
  rating: number | null;
  reviewCount: number;
}

export interface ServicePricingItem {
  id: number;
  categoryName: string;
  priceDisplay: string;
  startingPriceSgd: number;
  durationOrUnit: string;
  description: string;
  sortOrder: number;
}

export interface MembershipPlanItem {
  id: number;
  slug: string;
  name: string;
  monthlyPriceSgd: number;
  discountPct: number;
  badgeLabel: string | null;
  tagline: string;
  features: string[];
  sortOrder: number;
}

export interface BookingRecord {
  id: number;
  referenceCode: string;
  serviceType: 'hotel' | 'grooming';
  providerId: number;
  providerName: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  contactNumber: string;
  petName: string;
  petType: PetSpecies;
  checkInDate: string;
  checkOutDate: string | null;
  timeSlot: string | null;
  nights: number;
  additionalRequirements: string | null;
  basePrice: number;
  additionalCharges: number;
  bookingFee: number;
  discountAmount: number;
  totalPayable: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  cancellationRequested: boolean;
  cancellationReason: string | null;
  createdAt: string;
}

export interface CustomerPetProfile {
  id: number;
  name: string;
  species: PetSpecies;
  breed: string;
  age: string;
  weight: string;
  careNotes: string | null;
}

export interface CustomerFavouritePet {
  favouriteId: number;
  petId: number;
  name: string;
  petType: PetSpecies;
  breed: string;
  age: string;
  photoUrl: string;
  adoptionStatus: string;
  shelterName: string;
}

export interface CustomerEnquiryItem {
  id: number;
  referenceCode: string;
  petId: number;
  petName: string;
  petType: PetSpecies;
  shelterName: string;
  housingType: string;
  carePlan: string;
  status: string;
  createdAt: string;
}

export interface CustomerAccountData {
  profile: {
    id: number;
    uid: string;
    email: string;
    displayName: string | null;
    phone: string | null;
    housingType: string | null;
    role: 'customer' | 'admin';
    membershipTierSlug: string | null;
  } | null;
  customerPets: CustomerPetProfile[];
  favourites: CustomerFavouritePet[];
  enquiries: CustomerEnquiryItem[];
  bookings: BookingRecord[];
}

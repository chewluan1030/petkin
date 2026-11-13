import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export interface HotelRoomType {
  name: string;
  species: 'Dog' | 'Cat';
  pricePerNight: number;
  dimensions: string;
  dailyCapacity: number;
  description: string;
}

export interface GroomingPackageItem {
  id: string;
  name: string;
  description: string;
  durationMins: number;
  price: number;
  petTypes: ('Dog' | 'Cat')[];
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  phone: text('phone'),
  housingType: text('housing_type').default('HDB Flat'),
  role: text('role').notNull().default('customer'),
  membershipTierSlug: text('membership_tier_slug').default('free'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const customerPets = pgTable('customer_pets', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  name: text('name').notNull(),
  species: text('species').notNull(),
  breed: text('breed').notNull(),
  age: text('age').notNull(),
  weight: text('weight').notNull(),
  careNotes: text('care_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shelters = pgTable('shelters', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  location: text('location').notNull(),
  contactEmail: text('contact_email').notNull(),
  verified: boolean('verified').notNull().default(true),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  petType: text('pet_type').notNull(),
  breed: text('breed').notNull(),
  age: text('age').notNull(),
  gender: text('gender').notNull(),
  weight: text('weight').notNull(),
  photoUrl: text('photo_url').notNull(),
  personality: text('personality').notNull(),
  specialCare: text('special_care').notNull(),
  hdbSuitable: boolean('hdb_suitable').notNull().default(true),
  seniorFriendly: boolean('senior_friendly').notNull().default(false),
  goodWithKids: boolean('good_with_kids').notNull().default(false),
  firstTimeFriendly: boolean('first_time_friendly').notNull().default(true),
  shelterId: integer('shelter_id')
    .references(() => shelters.id)
    .notNull(),
  adoptionStatus: text('adoption_status').notNull().default('Available'),
  monthlyCareCostSgd: integer('monthly_care_cost_sgd').notNull(),
  welfareNotes: text('welfare_notes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const favouritePets = pgTable('favourite_pets', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  petId: integer('pet_id')
    .references(() => pets.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adoptionEnquiries = pgTable('adoption_enquiries', {
  id: serial('id').primaryKey(),
  referenceCode: text('reference_code').notNull().unique(),
  petId: integer('pet_id')
    .references(() => pets.id, { onDelete: 'cascade' })
    .notNull(),
  userUid: text('user_uid'),
  adopterName: text('adopter_name').notNull(),
  adopterEmail: text('adopter_email').notNull(),
  adopterPhone: text('adopter_phone'),
  housingType: text('housing_type').notNull(),
  carePlan: text('care_plan').notNull(),
  status: text('status').notNull().default('Submitted'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const petHotels = pgTable('pet_hotels', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  acceptsDogs: boolean('accepts_dogs').notNull().default(true),
  acceptsCats: boolean('accepts_cats').notNull().default(true),
  photoUrl: text('photo_url').notNull(),
  roomTypes: jsonb('room_types').$type<HotelRoomType[]>().notNull(),
  facilities: jsonb('facilities').$type<string[]>().notNull(),
  startingPricePerNight: numeric('starting_price_per_night', {
    precision: 10,
    scale: 2,
  }).notNull(),
  verified: boolean('verified').notNull().default(true),
  rating: numeric('rating', { precision: 3, scale: 1 }),
  reviewCount: integer('review_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const groomingProviders = pgTable('grooming_providers', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  salonName: text('salon_name').notNull(),
  location: text('location').notNull(),
  servesDogs: boolean('serves_dogs').notNull().default(true),
  servesCats: boolean('serves_cats').notNull().default(true),
  photoUrl: text('photo_url').notNull(),
  packages: jsonb('packages').$type<GroomingPackageItem[]>().notNull(),
  availableSlots: jsonb('available_slots').$type<string[]>().notNull(),
  maxConcurrentPerSlot: integer('max_concurrent_per_slot').notNull().default(1),
  rating: numeric('rating', { precision: 3, scale: 1 }),
  reviewCount: integer('review_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  referenceCode: text('reference_code').notNull().unique(),
  userUid: text('user_uid'),
  serviceType: text('service_type').notNull(),
  providerId: integer('provider_id').notNull(),
  providerName: text('provider_name').notNull(),
  serviceName: text('service_name').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  contactNumber: text('contact_number').notNull(),
  petName: text('pet_name').notNull(),
  petType: text('pet_type').notNull(),
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date'),
  timeSlot: text('time_slot'),
  nights: integer('nights').notNull().default(1),
  additionalRequirements: text('additional_requirements'),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  additionalCharges: numeric('additional_charges', {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default('0.00'),
  bookingFee: numeric('booking_fee', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
  totalPayable: numeric('total_payable', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Pending'),
  cancellationRequested: boolean('cancellation_requested').notNull().default(false),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const servicePricing = pgTable('service_pricing', {
  id: serial('id').primaryKey(),
  categoryName: text('category_name').notNull().unique(),
  priceDisplay: text('price_display').notNull(),
  startingPriceSgd: numeric('starting_price_sgd', {
    precision: 10,
    scale: 2,
  }).notNull(),
  durationOrUnit: text('duration_or_unit').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const membershipPlans = pgTable('membership_plans', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  monthlyPriceSgd: numeric('monthly_price_sgd', {
    precision: 10,
    scale: 2,
  }).notNull(),
  discountPct: integer('discount_pct').notNull().default(0),
  badgeLabel: text('badge_label'),
  tagline: text('tagline').notNull(),
  features: jsonb('features').$type<string[]>().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

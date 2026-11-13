import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adoptionEnquiries,
  bookings,
  customerPets,
  favouritePets,
  groomingProviders,
  membershipPlans,
  petHotels,
  pets,
  servicePricing,
  shelters,
  users,
  type GroomingPackageItem,
  type HotelRoomType,
} from './schema.ts';

export class ConflictError extends Error {
  status = 409;
}

export class ValidationError extends Error {
  status = 400;
}

export interface PetFilters {
  search?: string;
  petType?: 'Dog' | 'Cat';
  hdbApproved?: boolean;
  seniorFriendly?: boolean;
  goodWithKids?: boolean;
  includeAllStatuses?: boolean;
}

export async function getPets(filters: PetFilters = {}) {
  try {
    const rows = await db
      .select({
        id: pets.id,
        slug: pets.slug,
        name: pets.name,
        petType: pets.petType,
        breed: pets.breed,
        age: pets.age,
        gender: pets.gender,
        weight: pets.weight,
        photoUrl: pets.photoUrl,
        personality: pets.personality,
        specialCare: pets.specialCare,
        hdbSuitable: pets.hdbSuitable,
        seniorFriendly: pets.seniorFriendly,
        goodWithKids: pets.goodWithKids,
        firstTimeFriendly: pets.firstTimeFriendly,
        shelterId: pets.shelterId,
        shelterName: shelters.name,
        shelterLocation: shelters.location,
        adoptionStatus: pets.adoptionStatus,
        monthlyCareCostSgd: pets.monthlyCareCostSgd,
        welfareNotes: pets.welfareNotes,
      })
      .from(pets)
      .innerJoin(shelters, eq(pets.shelterId, shelters.id))
      .orderBy(asc(pets.id));

    const q = (filters.search || '').trim().toLowerCase();

    return rows.filter((pet) => {
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
  } catch (error) {
    console.error('getPets failed:', error);
    throw new Error('Unable to retrieve adoption listings.', { cause: error });
  }
}

function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  return aStart < bEnd && bStart < aEnd;
}

export interface HotelFilters {
  search?: string;
  petType?: 'Dog' | 'Cat';
  location?: string;
  maxPrice?: number;
  checkInDate?: string;
  checkOutDate?: string;
}

export async function getPetHotels(filters: HotelFilters = {}) {
  try {
    const hotels = await db
      .select()
      .from(petHotels)
      .where(eq(petHotels.active, true))
      .orderBy(asc(petHotels.id));

    const activeBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.serviceType, 'hotel'),
          inArray(bookings.status, ['Pending', 'Confirmed'])
        )
      );

    const q = (filters.search || '').trim().toLowerCase();
    const loc = (filters.location || '').trim().toLowerCase();
    const hasDateWindow =
      Boolean(filters.checkInDate) &&
      Boolean(filters.checkOutDate) &&
      (filters.checkOutDate as string) > (filters.checkInDate as string);

    const enriched = hotels.map((hotel) => {
      const roomsWithAvailability = (hotel.roomTypes || []).map((room) => {
        let bookedCount = 0;
        if (hasDateWindow) {
          bookedCount = activeBookings.filter(
            (b) =>
              b.providerId === hotel.id &&
              b.serviceName === room.name &&
              datesOverlap(
                b.checkInDate,
                b.checkOutDate || b.checkInDate,
                filters.checkInDate as string,
                filters.checkOutDate as string
              )
          ).length;
        }
        const remainingRooms = Math.max(0, room.dailyCapacity - bookedCount);
        return {
          ...room,
          remainingRooms,
          isAvailable: remainingRooms > 0,
        };
      });

      const totalRemaining = roomsWithAvailability.reduce(
        (sum, r) => sum + r.remainingRooms,
        0
      );

      return {
        ...hotel,
        startingPricePerNight: Number(hotel.startingPricePerNight),
        rating: hotel.rating ? Number(hotel.rating) : null,
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
      if (hasDateWindow && !hotel.hasAvailability) {
        return false;
      }
      return true;
    });
  } catch (error) {
    console.error('getPetHotels failed:', error);
    throw new Error('Unable to retrieve pet hotel listings.', { cause: error });
  }
}

export interface GroomingFilters {
  search?: string;
  petType?: 'Dog' | 'Cat';
  location?: string;
  serviceName?: string;
  maxPrice?: number;
  date?: string;
}

export async function getGroomingServices(filters: GroomingFilters = {}) {
  try {
    const providers = await db
      .select()
      .from(groomingProviders)
      .where(eq(groomingProviders.active, true))
      .orderBy(asc(groomingProviders.id));

    const dateBookings = filters.date
      ? await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.serviceType, 'grooming'),
              eq(bookings.checkInDate, filters.date),
              inArray(bookings.status, ['Pending', 'Confirmed'])
            )
          )
      : [];

    const q = (filters.search || '').trim().toLowerCase();
    const loc = (filters.location || '').trim().toLowerCase();
    const svc = (filters.serviceName || '').trim().toLowerCase();

    const enriched = providers.map((provider) => {
      const slotAvailability = (provider.availableSlots || []).map((slot) => {
        const bookedInSlot = dateBookings.filter(
          (b) => b.providerId === provider.id && b.timeSlot === slot
        ).length;
        const remaining = Math.max(
          0,
          provider.maxConcurrentPerSlot - bookedInSlot
        );
        return {
          slot,
          remaining,
          available: remaining > 0,
        };
      });

      return {
        ...provider,
        rating: provider.rating ? Number(provider.rating) : null,
        slotAvailability,
      };
    });

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
        const pkgText = p.packages.map((x) => `${x.name} ${x.description}`).join(' ');
        const hay = `${p.salonName} ${p.location} ${pkgText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  } catch (error) {
    console.error('getGroomingServices failed:', error);
    throw new Error('Unable to retrieve grooming services.', { cause: error });
  }
}

export interface CreateBookingInput {
  userUid?: string;
  serviceType: 'hotel' | 'grooming';
  providerId: number;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  contactNumber: string;
  petName: string;
  petType: 'Dog' | 'Cat';
  checkInDate: string;
  checkOutDate?: string;
  timeSlot?: string;
  additionalRequirements?: string;
  addEnrichmentOrLateCare?: boolean;
}

export async function createBooking(input: CreateBookingInput) {
  try {
    return await db.transaction(async (tx) => {
      let providerName = '';
      let basePrice = 0;
      let nights = 1;

      if (input.serviceType === 'hotel') {
        if (!input.checkOutDate || input.checkOutDate <= input.checkInDate) {
          throw new ValidationError('Check-out date must be after check-in date.');
        }

        const hotelRows = await tx
          .select()
          .from(petHotels)
          .where(and(eq(petHotels.id, input.providerId), eq(petHotels.active, true)))
          .limit(1);

        if (hotelRows.length === 0) {
          throw new ValidationError('Selected pet hotel was not found.');
        }

        const hotel = hotelRows[0];
        providerName = hotel.name;
        const room = (hotel.roomTypes || []).find(
          (r) => r.name === input.serviceName
        );
        if (!room) {
          throw new ValidationError('Selected room type was not found.');
        }
        if (room.species !== input.petType) {
          throw new ValidationError(
            `${room.name} is configured for ${room.species} guests only.`
          );
        }

        const startMs = new Date(input.checkInDate).getTime();
        const endMs = new Date(input.checkOutDate).getTime();
        nights = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));

        const overlapping = await tx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.serviceType, 'hotel'),
              eq(bookings.providerId, hotel.id),
              eq(bookings.serviceName, room.name),
              inArray(bookings.status, ['Pending', 'Confirmed'])
            )
          );

        const conflictingCount = overlapping.filter((b) =>
          datesOverlap(
            b.checkInDate,
            b.checkOutDate || b.checkInDate,
            input.checkInDate,
            input.checkOutDate as string
          )
        ).length;

        if (conflictingCount >= room.dailyCapacity) {
          throw new ConflictError(
            `No ${room.name} suites remain for those dates. Please select different dates or another room.`
          );
        }

        basePrice = Number(room.pricePerNight) * nights;
      } else {
        if (!input.timeSlot) {
          throw new ValidationError('Please choose an appointment time slot.');
        }

        const providerRows = await tx
          .select()
          .from(groomingProviders)
          .where(
            and(
              eq(groomingProviders.id, input.providerId),
              eq(groomingProviders.active, true)
            )
          )
          .limit(1);

        if (providerRows.length === 0) {
          throw new ValidationError('Selected grooming studio was not found.');
        }

        const provider = providerRows[0];
        providerName = provider.salonName;

        if (!provider.availableSlots.includes(input.timeSlot)) {
          throw new ValidationError('Selected time slot is not offered by this studio.');
        }

        const pkg = (provider.packages || []).find(
          (p) => p.name === input.serviceName
        );
        if (!pkg) {
          throw new ValidationError('Selected grooming package was not found.');
        }

        const existingSlotBookings = await tx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.serviceType, 'grooming'),
              eq(bookings.providerId, provider.id),
              eq(bookings.checkInDate, input.checkInDate),
              eq(bookings.timeSlot, input.timeSlot),
              inArray(bookings.status, ['Pending', 'Confirmed'])
            )
          );

        if (existingSlotBookings.length >= provider.maxConcurrentPerSlot) {
          throw new ConflictError(
            `The ${input.timeSlot} slot on ${input.checkInDate} is no longer available. Please choose another slot.`
          );
        }

        basePrice = Number(pkg.price);
      }

      const additionalCharges = input.addEnrichmentOrLateCare ? 15 : 0;
      const bookingFee = 4.5;

      let discountPct = 0;
      if (input.userUid) {
        const userRows = await tx
          .select()
          .from(users)
          .where(eq(users.uid, input.userUid))
          .limit(1);
        const slug = userRows[0]?.membershipTierSlug || 'free';
        const planRows = await tx
          .select()
          .from(membershipPlans)
          .where(eq(membershipPlans.slug, slug))
          .limit(1);
        discountPct = planRows[0]?.discountPct || 0;
      }

      const discountAmount = Number(((basePrice * discountPct) / 100).toFixed(2));
      const totalPayable = Number(
        Math.max(0, basePrice + additionalCharges + bookingFee - discountAmount).toFixed(2)
      );

      const referenceCode = `PK-${Date.now().toString().slice(-6)}-${Math.floor(
        10 + Math.random() * 89
      )}`;

      const inserted = await tx
        .insert(bookings)
        .values({
          referenceCode,
          userUid: input.userUid || null,
          serviceType: input.serviceType,
          providerId: input.providerId,
          providerName,
          serviceName: input.serviceName,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim(),
          contactNumber: input.contactNumber.trim(),
          petName: input.petName.trim(),
          petType: input.petType,
          checkInDate: input.checkInDate,
          checkOutDate: input.serviceType === 'hotel' ? input.checkOutDate || null : null,
          timeSlot: input.serviceType === 'grooming' ? input.timeSlot || null : null,
          nights,
          additionalRequirements: input.additionalRequirements?.trim() || null,
          basePrice: basePrice.toFixed(2),
          additionalCharges: additionalCharges.toFixed(2),
          bookingFee: bookingFee.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          status: 'Pending',
        })
        .returning();

      return {
        ...inserted[0],
        basePrice: Number(inserted[0].basePrice),
        additionalCharges: Number(inserted[0].additionalCharges),
        bookingFee: Number(inserted[0].bookingFee),
        discountAmount: Number(inserted[0].discountAmount),
        totalPayable: Number(inserted[0].totalPayable),
      };
    });
  } catch (error) {
    if (error instanceof ConflictError || error instanceof ValidationError) {
      throw error;
    }
    console.error('createBooking failed:', error);
    throw new Error('Unable to create booking request.', { cause: error });
  }
}

export async function getPricing() {
  try {
    const [services, plans] = await Promise.all([
      db.select().from(servicePricing).orderBy(asc(servicePricing.sortOrder)),
      db
        .select()
        .from(membershipPlans)
        .where(eq(membershipPlans.active, true))
        .orderBy(asc(membershipPlans.sortOrder)),
    ]);

    return {
      serviceCategories: services.map((s) => ({
        ...s,
        startingPriceSgd: Number(s.startingPriceSgd),
      })),
      membershipPlans: plans.map((p) => ({
        ...p,
        monthlyPriceSgd: Number(p.monthlyPriceSgd),
      })),
    };
  } catch (error) {
    console.error('getPricing failed:', error);
    throw new Error('Unable to retrieve pricing data.', { cause: error });
  }
}

export async function createAdoptionEnquiry(data: {
  petId: number;
  userUid?: string;
  adopterName: string;
  adopterEmail: string;
  adopterPhone?: string;
  housingType: string;
  carePlan: string;
}) {
  try {
    const petRows = await db
      .select()
      .from(pets)
      .where(eq(pets.id, data.petId))
      .limit(1);

    if (petRows.length === 0 || petRows[0].adoptionStatus !== 'Available') {
      throw new ValidationError(
        'This pet is no longer open for adoption enquiries.'
      );
    }

    const referenceCode = `ENQ-${Date.now().toString().slice(-6)}-${Math.floor(
      10 + Math.random() * 89
    )}`;

    const inserted = await db
      .insert(adoptionEnquiries)
      .values({
        referenceCode,
        petId: data.petId,
        userUid: data.userUid || null,
        adopterName: data.adopterName.trim(),
        adopterEmail: data.adopterEmail.trim(),
        adopterPhone: data.adopterPhone?.trim() || null,
        housingType: data.housingType,
        carePlan: data.carePlan.trim(),
        status: 'Submitted',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('createAdoptionEnquiry failed:', error);
    throw new Error('Unable to submit adoption enquiry.', { cause: error });
  }
}

export async function getCustomerAccountData(uid: string) {
  try {
    const [profileRows, myPets, favRows, myEnquiries, myBookings] =
      await Promise.all([
        db.select().from(users).where(eq(users.uid, uid)).limit(1),
        db
          .select()
          .from(customerPets)
          .where(eq(customerPets.userUid, uid))
          .orderBy(desc(customerPets.id)),
        db
          .select({
            favouriteId: favouritePets.id,
            petId: pets.id,
            name: pets.name,
            petType: pets.petType,
            breed: pets.breed,
            age: pets.age,
            photoUrl: pets.photoUrl,
            adoptionStatus: pets.adoptionStatus,
            shelterName: shelters.name,
          })
          .from(favouritePets)
          .innerJoin(pets, eq(favouritePets.petId, pets.id))
          .innerJoin(shelters, eq(pets.shelterId, shelters.id))
          .where(eq(favouritePets.userUid, uid))
          .orderBy(desc(favouritePets.id)),
        db
          .select({
            id: adoptionEnquiries.id,
            referenceCode: adoptionEnquiries.referenceCode,
            petId: adoptionEnquiries.petId,
            petName: pets.name,
            petType: pets.petType,
            shelterName: shelters.name,
            housingType: adoptionEnquiries.housingType,
            carePlan: adoptionEnquiries.carePlan,
            status: adoptionEnquiries.status,
            createdAt: adoptionEnquiries.createdAt,
          })
          .from(adoptionEnquiries)
          .innerJoin(pets, eq(adoptionEnquiries.petId, pets.id))
          .innerJoin(shelters, eq(pets.shelterId, shelters.id))
          .where(eq(adoptionEnquiries.userUid, uid))
          .orderBy(desc(adoptionEnquiries.id)),
        db
          .select()
          .from(bookings)
          .where(eq(bookings.userUid, uid))
          .orderBy(desc(bookings.id)),
      ]);

    return {
      profile: profileRows[0] || null,
      customerPets: myPets,
      favourites: favRows,
      enquiries: myEnquiries,
      bookings: myBookings.map((b) => ({
        ...b,
        basePrice: Number(b.basePrice),
        additionalCharges: Number(b.additionalCharges),
        bookingFee: Number(b.bookingFee),
        discountAmount: Number(b.discountAmount),
        totalPayable: Number(b.totalPayable),
      })),
    };
  } catch (error) {
    console.error('getCustomerAccountData failed:', error);
    throw new Error('Unable to load customer account data.', { cause: error });
  }
}

export async function getAdminOverview() {
  try {
    const [
      allPets,
      allShelters,
      allHotels,
      allGroomers,
      allBookings,
      allEnquiries,
      pricing,
    ] = await Promise.all([
      getPets({ includeAllStatuses: true }),
      db.select().from(shelters).orderBy(asc(shelters.id)),
      db.select().from(petHotels).orderBy(asc(petHotels.id)),
      db.select().from(groomingProviders).orderBy(asc(groomingProviders.id)),
      db.select().from(bookings).orderBy(desc(bookings.id)),
      db
        .select({
          id: adoptionEnquiries.id,
          referenceCode: adoptionEnquiries.referenceCode,
          petId: adoptionEnquiries.petId,
          petName: pets.name,
          shelterName: shelters.name,
          adopterName: adoptionEnquiries.adopterName,
          adopterEmail: adoptionEnquiries.adopterEmail,
          housingType: adoptionEnquiries.housingType,
          carePlan: adoptionEnquiries.carePlan,
          status: adoptionEnquiries.status,
          createdAt: adoptionEnquiries.createdAt,
        })
        .from(adoptionEnquiries)
        .innerJoin(pets, eq(adoptionEnquiries.petId, pets.id))
        .innerJoin(shelters, eq(pets.shelterId, shelters.id))
        .orderBy(desc(adoptionEnquiries.id)),
      getPricing(),
    ]);

    return {
      pets: allPets,
      shelters: allShelters,
      petHotels: allHotels.map((h) => ({
        ...h,
        startingPricePerNight: Number(h.startingPricePerNight),
      })),
      groomingProviders: allGroomers,
      bookings: allBookings.map((b) => ({
        ...b,
        totalPayable: Number(b.totalPayable),
      })),
      enquiries: allEnquiries,
      serviceCategories: pricing.serviceCategories,
      membershipPlans: pricing.membershipPlans,
    };
  } catch (error) {
    console.error('getAdminOverview failed:', error);
    throw new Error('Unable to load admin overview.', { cause: error });
  }
}

export type { HotelRoomType, GroomingPackageItem };

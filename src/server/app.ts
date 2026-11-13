import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  ConflictError,
  createAdoptionEnquiry,
  createBooking,
  getAdminOverview,
  getCustomerAccountData,
  getGroomingServices,
  getPetHotels,
  getPets,
  getPricing,
  ValidationError,
} from '../db/queries.ts';
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
} from '../db/schema.ts';
import {
  optionalAuth,
  requireAdmin,
  requireAuth,
  type AuthRequest,
} from '../middleware/auth.ts';
import {
  matchPetWithGemini,
  type MatcherUserProfile,
} from './geminiMatcher.ts';
import healthHandler from '../../api/health.ts';
import chatHandler from '../../api/chat.ts';

export const app = express();
app.use(express.json({ limit: '1mb' }));

app.all('/api/health', (req, res) => healthHandler(req, res));
app.all('/api/chat', (req, res) => chatHandler(req, res));

// 1. getPets(filters) — Adoption Database
app.get('/api/pets', async (req, res) => {
  try {
    const petType =
      req.query.petType === 'Dog' || req.query.petType === 'Cat'
        ? req.query.petType
        : undefined;

    const results = await getPets({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      petType,
      hdbApproved: req.query.hdbApproved === 'true',
      seniorFriendly: req.query.seniorFriendly === 'true',
      goodWithKids: req.query.goodWithKids === 'true',
    });

    res.json({ pets: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pets.';
    res.status(500).json({ error: message });
  }
});

// 2. matchPet(userProfile, availablePets) — Gemini AI
app.post('/api/pets/match', async (req, res) => {
  try {
    const userProfile = req.body as MatcherUserProfile;
    if (!userProfile || !userProfile.housingType) {
      return res.status(400).json({ error: 'Lifestyle profile is required.' });
    }

    const availablePets = await getPets();
    const matchResult = await matchPetWithGemini(userProfile, availablePets);
    res.json({ ...matchResult, availablePets });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate AI matches.';
    res.status(500).json({ error: message });
  }
});

// Adoption enquiry submission
app.post('/api/enquiries', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      petId,
      adopterName,
      adopterEmail,
      adopterPhone,
      housingType,
      carePlan,
    } = req.body;

    if (!petId || !adopterName || !adopterEmail || !housingType || !carePlan) {
      return res.status(400).json({
        error: 'Pet selection, name, email, housing type, and care plan are required.',
      });
    }

    const enquiry = await createAdoptionEnquiry({
      petId: Number(petId),
      userUid: req.user?.uid,
      adopterName,
      adopterEmail,
      adopterPhone,
      housingType,
      carePlan,
    });

    res.status(201).json({ enquiry });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return res.status(error.status).json({ error: error.message });
    }
    const message =
      error instanceof Error ? error.message : 'Failed to submit enquiry.';
    res.status(500).json({ error: message });
  }
});

// 3. getPetHotels(filters) — Pet Hotel Database
app.get('/api/hotels', async (req, res) => {
  try {
    const petType =
      req.query.petType === 'Dog' || req.query.petType === 'Cat'
        ? req.query.petType
        : undefined;

    const hotels = await getPetHotels({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      petType,
      location:
        typeof req.query.location === 'string' ? req.query.location : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      checkInDate:
        typeof req.query.checkInDate === 'string' ? req.query.checkInDate : undefined,
      checkOutDate:
        typeof req.query.checkOutDate === 'string' ? req.query.checkOutDate : undefined,
    });

    res.json({ hotels });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch pet hotels.';
    res.status(500).json({ error: message });
  }
});

// 4. getGroomingServices(filters) — Grooming Database
app.get('/api/grooming', async (req, res) => {
  try {
    const petType =
      req.query.petType === 'Dog' || req.query.petType === 'Cat'
        ? req.query.petType
        : undefined;

    const providers = await getGroomingServices({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      petType,
      location:
        typeof req.query.location === 'string' ? req.query.location : undefined,
      serviceName:
        typeof req.query.serviceName === 'string'
          ? req.query.serviceName
          : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      date: typeof req.query.date === 'string' ? req.query.date : undefined,
    });

    res.json({ providers });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch grooming services.';
    res.status(500).json({ error: message });
  }
});

// 5. createBooking(bookingDetails) — Booking Management
app.post('/api/bookings', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      serviceType,
      providerId,
      serviceName,
      customerName,
      customerEmail,
      contactNumber,
      petName,
      petType,
      checkInDate,
      checkOutDate,
      timeSlot,
      additionalRequirements,
      addEnrichmentOrLateCare,
    } = req.body;

    if (
      !serviceType ||
      !providerId ||
      !serviceName ||
      !customerName ||
      !customerEmail ||
      !contactNumber ||
      !petName ||
      !petType ||
      !checkInDate
    ) {
      return res.status(400).json({
        error: 'Please complete all required customer, pet, service, and date fields.',
      });
    }

    const booking = await createBooking({
      userUid: req.user?.uid,
      serviceType,
      providerId: Number(providerId),
      serviceName,
      customerName,
      customerEmail,
      contactNumber,
      petName,
      petType,
      checkInDate,
      checkOutDate,
      timeSlot,
      additionalRequirements,
      addEnrichmentOrLateCare: Boolean(addEnrichmentOrLateCare),
    });

    res.status(201).json({ booking });
  } catch (error: unknown) {
    if (error instanceof ConflictError || error instanceof ValidationError) {
      return res.status(error.status).json({ error: error.message });
    }
    const message =
      error instanceof Error ? error.message : 'Failed to create booking.';
    res.status(500).json({ error: message });
  }
});

// 6. getPricing() — Pricing Database
app.get('/api/pricing', async (_req, res) => {
  try {
    const pricing = await getPricing();
    res.json(pricing);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load pricing.';
    res.status(500).json({ error: message });
  }
});

// 7. manageCustomerAccount(userId) — Strictly scoped to authenticated user's UID
app.get('/api/account', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await getCustomerAccountData(req.user!.uid);
    res.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load account.';
    res.status(500).json({ error: message });
  }
});

app.put('/api/account/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { displayName, phone, housingType, membershipTierSlug } = req.body;
    const updated = await db
      .update(users)
      .set({
        ...(displayName !== undefined ? { displayName: String(displayName) } : {}),
        ...(phone !== undefined ? { phone: String(phone) } : {}),
        ...(housingType !== undefined ? { housingType: String(housingType) } : {}),
        ...(membershipTierSlug !== undefined
          ? { membershipTierSlug: String(membershipTierSlug) }
          : {}),
      })
      .where(eq(users.uid, req.user!.uid))
      .returning();

    res.json({ profile: updated[0] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update profile.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/account/pets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, species, breed, age, weight, careNotes } = req.body;
    if (!name || !species || !breed || !age || !weight) {
      return res
        .status(400)
        .json({ error: 'Name, species, breed, age, and weight are required.' });
    }
    const created = await db
      .insert(customerPets)
      .values({
        userUid: req.user!.uid,
        name: String(name),
        species: species === 'Cat' ? 'Cat' : 'Dog',
        breed: String(breed),
        age: String(age),
        weight: String(weight),
        careNotes: careNotes ? String(careNotes) : null,
      })
      .returning();
    res.status(201).json({ pet: created[0] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to save pet profile.';
    res.status(500).json({ error: message });
  }
});

app.delete('/api/account/pets/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const petId = Number(req.params.id);
    await db
      .delete(customerPets)
      .where(
        and(eq(customerPets.id, petId), eq(customerPets.userUid, req.user!.uid))
      );
    res.json({ deleted: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to remove pet profile.';
    res.status(500).json({ error: message });
  }
});

app.post(
  '/api/account/favourites/:petId',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const petId = Number(req.params.petId);
      const existing = await db
        .select()
        .from(favouritePets)
        .where(
          and(
            eq(favouritePets.userUid, req.user!.uid),
            eq(favouritePets.petId, petId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .delete(favouritePets)
          .where(
            and(
              eq(favouritePets.userUid, req.user!.uid),
              eq(favouritePets.petId, petId)
            )
          );
        return res.json({ favourited: false });
      }

      await db.insert(favouritePets).values({
        userUid: req.user!.uid,
        petId,
      });
      res.json({ favourited: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update favourites.';
      res.status(500).json({ error: message });
    }
  }
);

app.post(
  '/api/account/bookings/:id/cancel-request',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const bookingId = Number(req.params.id);
      const reason = String(req.body.reason || 'Customer requested cancellation');

      const updated = await db
        .update(bookings)
        .set({
          cancellationRequested: true,
          cancellationReason: reason,
        })
        .where(and(eq(bookings.id, bookingId), eq(bookings.userUid, req.user!.uid)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Booking not found for this account.' });
      }
      res.json({ booking: updated[0] });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to request cancellation.';
      res.status(500).json({ error: message });
    }
  }
);

// 8. manageAdminDashboard() — Authorised Administrators Only
app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const overview = await getAdminOverview();
    res.json(overview);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load admin dashboard.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/admin/pets', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      petType,
      breed,
      age,
      gender,
      weight,
      photoUrl,
      personality,
      specialCare,
      hdbSuitable,
      seniorFriendly,
      goodWithKids,
      firstTimeFriendly,
      shelterId,
      adoptionStatus,
      monthlyCareCostSgd,
      welfareNotes,
    } = req.body;

    const slug = `${String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const created = await db
      .insert(pets)
      .values({
        slug,
        name: String(name),
        petType: petType === 'Cat' ? 'Cat' : 'Dog',
        breed: String(breed),
        age: String(age),
        gender: gender === 'Female' ? 'Female' : 'Male',
        weight: String(weight),
        photoUrl:
          String(photoUrl || '').trim() ||
          (petType === 'Cat'
            ? '/images/pet-milo-cat.jpg'
            : '/images/pet-kopi-dog.jpg'),
        personality: String(personality),
        specialCare: String(specialCare),
        hdbSuitable: Boolean(hdbSuitable),
        seniorFriendly: Boolean(seniorFriendly),
        goodWithKids: Boolean(goodWithKids),
        firstTimeFriendly: Boolean(firstTimeFriendly),
        shelterId: Number(shelterId),
        adoptionStatus: String(adoptionStatus || 'Available'),
        monthlyCareCostSgd: Number(monthlyCareCostSgd || 150),
        welfareNotes: String(welfareNotes || specialCare),
      })
      .returning();

    res.status(201).json({ pet: created[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add pet.';
    res.status(500).json({ error: message });
  }
});

app.patch('/api/admin/pets/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const petId = Number(req.params.id);
    const { adoptionStatus, monthlyCareCostSgd, hdbSuitable } = req.body;
    const updated = await db
      .update(pets)
      .set({
        ...(adoptionStatus !== undefined ? { adoptionStatus: String(adoptionStatus) } : {}),
        ...(monthlyCareCostSgd !== undefined
          ? { monthlyCareCostSgd: Number(monthlyCareCostSgd) }
          : {}),
        ...(hdbSuitable !== undefined ? { hdbSuitable: Boolean(hdbSuitable) } : {}),
      })
      .where(eq(pets.id, petId))
      .returning();
    res.json({ pet: updated[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update pet.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/admin/shelters', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, location, contactEmail, description, verified } = req.body;
    const created = await db
      .insert(shelters)
      .values({
        name: String(name),
        location: String(location),
        contactEmail: String(contactEmail),
        description: String(description),
        verified: verified !== undefined ? Boolean(verified) : true,
      })
      .returning();
    res.status(201).json({ shelter: created[0] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to save shelter.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/admin/hotels', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      location,
      acceptsDogs,
      acceptsCats,
      startingPricePerNight,
      roomName,
      roomSpecies,
      dailyCapacity,
      facilitiesText,
    } = req.body;

    const slug = `${String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const price = Number(startingPricePerNight || 65);
    const created = await db
      .insert(petHotels)
      .values({
        slug,
        name: String(name),
        location: String(location),
        acceptsDogs: Boolean(acceptsDogs),
        acceptsCats: Boolean(acceptsCats),
        photoUrl: '/images/service-hotel-suites.jpg',
        roomTypes: [
          {
            name: String(roomName || 'Standard Comfort Suite'),
            species: roomSpecies === 'Cat' ? 'Cat' : 'Dog',
            pricePerNight: price,
            dimensions: 'Private temperature-controlled suite',
            dailyCapacity: Number(dailyCapacity || 4),
            description: 'Clean, quiet boarding accommodation with daily care notes.',
          },
        ],
        facilities: String(
          facilitiesText || '24/7 Care Attendants, HEPA Air Filtration'
        )
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        startingPricePerNight: price.toFixed(2),
        verified: true,
        rating: null,
        reviewCount: 0,
        active: true,
      })
      .returning();

    res.status(201).json({ hotel: created[0] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to add pet hotel.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/admin/grooming', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      salonName,
      location,
      servesDogs,
      servesCats,
      packageName,
      packagePrice,
      durationMins,
      slotsText,
    } = req.body;

    const slug = `${String(salonName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const petTypes: ('Dog' | 'Cat')[] = [];
    if (servesDogs) petTypes.push('Dog');
    if (servesCats) petTypes.push('Cat');
    if (petTypes.length === 0) petTypes.push('Dog');

    const created = await db
      .insert(groomingProviders)
      .values({
        slug,
        salonName: String(salonName),
        location: String(location),
        servesDogs: Boolean(servesDogs),
        servesCats: Boolean(servesCats),
        photoUrl: '/images/service-grooming-studio.jpg',
        packages: [
          {
            id: `pkg-${Date.now()}`,
            name: String(packageName || 'Basic Grooming'),
            description: 'Calm bath, brush-out, nail trim, and ear cleaning.',
            durationMins: Number(durationMins || 60),
            price: Number(packagePrice || 55),
            petTypes,
          },
        ],
        availableSlots: String(slotsText || '10:00 AM, 1:30 PM, 4:30 PM')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        maxConcurrentPerSlot: 2,
        rating: null,
        reviewCount: 0,
        active: true,
      })
      .returning();

    res.status(201).json({ provider: created[0] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to add grooming provider.';
    res.status(500).json({ error: message });
  }
});

app.patch(
  '/api/admin/pricing/service/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { startingPriceSgd, priceDisplay } = req.body;
      const updated = await db
        .update(servicePricing)
        .set({
          ...(startingPriceSgd !== undefined
            ? { startingPriceSgd: Number(startingPriceSgd).toFixed(2) }
            : {}),
          ...(priceDisplay !== undefined ? { priceDisplay: String(priceDisplay) } : {}),
        })
        .where(eq(servicePricing.id, id))
        .returning();
      res.json({ servicePricing: updated[0] });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update pricing.';
      res.status(500).json({ error: message });
    }
  }
);

app.patch(
  '/api/admin/pricing/membership/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { monthlyPriceSgd, discountPct } = req.body;
      const updated = await db
        .update(membershipPlans)
        .set({
          ...(monthlyPriceSgd !== undefined
            ? { monthlyPriceSgd: Number(monthlyPriceSgd).toFixed(2) }
            : {}),
          ...(discountPct !== undefined ? { discountPct: Number(discountPct) } : {}),
        })
        .where(eq(membershipPlans.id, id))
        .returning();
      res.json({ membershipPlan: updated[0] });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update membership plan.';
      res.status(500).json({ error: message });
    }
  }
);

app.patch(
  '/api/admin/bookings/:id/status',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = String(req.body.status);
      if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid booking status.' });
      }
      const updated = await db
        .update(bookings)
        .set({ status })
        .where(eq(bookings.id, id))
        .returning();
      res.json({ booking: updated[0] });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update booking status.';
      res.status(500).json({ error: message });
    }
  }
);

app.patch(
  '/api/admin/enquiries/:id/status',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = String(req.body.status);
      const updated = await db
        .update(adoptionEnquiries)
        .set({ status })
        .where(eq(adoptionEnquiries.id, id))
        .returning();
      res.json({ enquiry: updated[0] });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update enquiry status.';
      res.status(500).json({ error: message });
    }
  }
);

// Always return JSON for unmatched /api/* routes or unexpected Express errors
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message =
    err instanceof Error ? err.message : 'Unexpected server error.';
  if (req.path.startsWith('/api')) {
    res.status(500).json({ error: message });
    return;
  }
  res.status(500).send(message);
});

export default app;

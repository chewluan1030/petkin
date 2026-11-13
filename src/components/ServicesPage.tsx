import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseJsonResponse } from '../lib/http';
import type {
  BookingRecord,
  GroomingProviderListing,
  MembershipPlanItem,
  NavTab,
  PetHotelListing,
  PetSpecies,
} from '../types/api';
import { ResilientImage } from './ResilientImage';

const GROOMING_STUDIO_IMAGE = '/images/service-grooming-studio.jpg';
const HOTEL_SUITES_IMAGE = '/images/service-hotel-suites.jpg';

interface ServicesPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAccount: () => void;
  refreshKey: number;
}

type ServiceCategory = 'grooming' | 'hotel';

export function ServicesPage({
  onNavigate,
  onOpenAccount,
  refreshKey,
}: ServicesPageProps) {
  const { user, accountData, authFetch, refreshAccount } = useAuth();
  const bookingSectionRef = useRef<HTMLElement | null>(null);

  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  const defaultCheckOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  }, []);

  // Grooming state & filters
  const [groomingProviders, setGroomingProviders] = useState<
    GroomingProviderListing[]
  >([]);
  const [groomingLoading, setGroomingLoading] = useState(true);
  const [groomingSearch, setGroomingSearch] = useState('');
  const [groomingPetType, setGroomingPetType] = useState<'All' | PetSpecies>('All');
  const [groomingLocation, setGroomingLocation] = useState('All');
  const [groomingServiceFilter, setGroomingServiceFilter] = useState('All');
  const [groomingMaxPrice, setGroomingMaxPrice] = useState('');
  const [groomingDateFilter, setGroomingDateFilter] = useState(defaultDate);

  // Hotel state & filters
  const [hotels, setHotels] = useState<PetHotelListing[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelSearch, setHotelSearch] = useState('');
  const [hotelPetType, setHotelPetType] = useState<'All' | PetSpecies>('All');
  const [hotelLocation, setHotelLocation] = useState('All');
  const [hotelMaxPrice, setHotelMaxPrice] = useState('');
  const [hotelCheckInFilter, setHotelCheckInFilter] = useState(defaultDate);
  const [hotelCheckOutFilter, setHotelCheckOutFilter] = useState(defaultCheckOut);
  const [viewedHotel, setViewedHotel] = useState<PetHotelListing | null>(null);

  // Active membership info for discount preview
  const [plans, setPlans] = useState<MembershipPlanItem[]>([]);

  // Booking form state
  const [category, setCategory] = useState<ServiceCategory>('grooming');
  const [selectedProviderId, setSelectedProviderId] = useState<number>(0);
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<PetSpecies>('Dog');
  const [checkInDate, setCheckInDate] = useState(defaultDate);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [timeSlot, setTimeSlot] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [addExtraCare, setAddExtraCare] = useState(false);

  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedBooking, setSubmittedBooking] = useState<BookingRecord | null>(
    null
  );

  const fetchGrooming = useCallback(async () => {
    setGroomingLoading(true);
    try {
      const params = new URLSearchParams();
      if (groomingSearch.trim()) params.set('search', groomingSearch.trim());
      if (groomingPetType !== 'All') params.set('petType', groomingPetType);
      if (groomingLocation !== 'All') params.set('location', groomingLocation);
      if (groomingServiceFilter !== 'All')
        params.set('serviceName', groomingServiceFilter);
      if (groomingMaxPrice) params.set('maxPrice', groomingMaxPrice);
      if (groomingDateFilter) params.set('date', groomingDateFilter);

      const res = await fetch(`/api/grooming?${params.toString()}`);
      const data = await parseJsonResponse<{
        providers?: GroomingProviderListing[];
      }>(res);
      if (res.ok) {
        const list = data.providers || [];
        setGroomingProviders(list);
      }
    } finally {
      setGroomingLoading(false);
    }
  }, [
    groomingSearch,
    groomingPetType,
    groomingLocation,
    groomingServiceFilter,
    groomingMaxPrice,
    groomingDateFilter,
  ]);

  const fetchHotels = useCallback(async () => {
    setHotelsLoading(true);
    try {
      const params = new URLSearchParams();
      if (hotelSearch.trim()) params.set('search', hotelSearch.trim());
      if (hotelPetType !== 'All') params.set('petType', hotelPetType);
      if (hotelLocation !== 'All') params.set('location', hotelLocation);
      if (hotelMaxPrice) params.set('maxPrice', hotelMaxPrice);
      if (hotelCheckInFilter && hotelCheckOutFilter > hotelCheckInFilter) {
        params.set('checkInDate', hotelCheckInFilter);
        params.set('checkOutDate', hotelCheckOutFilter);
      }

      const res = await fetch(`/api/hotels?${params.toString()}`);
      const data = await parseJsonResponse<{ hotels?: PetHotelListing[] }>(res);
      if (res.ok) {
        setHotels(data.hotels || []);
      }
    } finally {
      setHotelsLoading(false);
    }
  }, [
    hotelSearch,
    hotelPetType,
    hotelLocation,
    hotelMaxPrice,
    hotelCheckInFilter,
    hotelCheckOutFilter,
  ]);

  useEffect(() => {
    const t = setTimeout(fetchGrooming, 150);
    return () => clearTimeout(t);
  }, [fetchGrooming, refreshKey]);

  useEffect(() => {
    const t = setTimeout(fetchHotels, 150);
    return () => clearTimeout(t);
  }, [fetchHotels, refreshKey]);

  useEffect(() => {
    fetch('/api/pricing')
      .then((r) => parseJsonResponse<{ membershipPlans?: MembershipPlanItem[] }>(r))
      .then((d) => setPlans(d.membershipPlans || []))
      .catch(() => {});
  }, [refreshKey]);

  // Pre-fill user contact details if logged in
  useEffect(() => {
    if (accountData?.profile) {
      setCustomerName((v) => v || accountData.profile?.displayName || '');
      setCustomerEmail((v) => v || accountData.profile?.email || '');
      setContactNumber((v) => v || accountData.profile?.phone || '');
    }
  }, [accountData?.profile]);

  // Keep booking provider/service initialized when lists arrive
  useEffect(() => {
    if (category === 'grooming' && groomingProviders.length > 0) {
      const match = groomingProviders.find((p) => p.id === selectedProviderId);
      const chosen = match || groomingProviders[0];
      if (!match) setSelectedProviderId(chosen.id);
      if (
        !selectedServiceName ||
        !chosen.packages.some((pkg) => pkg.name === selectedServiceName)
      ) {
        setSelectedServiceName(chosen.packages[0]?.name || '');
      }
      const firstOpenSlot =
        chosen.slotAvailability.find((s) => s.available)?.slot ||
        chosen.availableSlots[0] ||
        '';
      if (!timeSlot || !chosen.availableSlots.includes(timeSlot)) {
        setTimeSlot(firstOpenSlot);
      }
    } else if (category === 'hotel' && hotels.length > 0) {
      const match = hotels.find((h) => h.id === selectedProviderId);
      const chosen = match || hotels[0];
      if (!match) setSelectedProviderId(chosen.id);
      if (
        !selectedServiceName ||
        !chosen.roomsWithAvailability.some((r) => r.name === selectedServiceName)
      ) {
        const defaultRoom = chosen.roomsWithAvailability[0];
        if (defaultRoom) {
          setSelectedServiceName(defaultRoom.name);
          setPetType(defaultRoom.species);
        }
      }
    }
  }, [
    category,
    groomingProviders,
    hotels,
    selectedProviderId,
    selectedServiceName,
    timeSlot,
  ]);

  const handleSelectGrooming = (
    provider: GroomingProviderListing,
    packageName: string,
    slotOverride?: string
  ) => {
    setCategory('grooming');
    setSelectedProviderId(provider.id);
    setSelectedServiceName(packageName);
    setCheckInDate(groomingDateFilter);
    const openSlot =
      slotOverride ||
      provider.slotAvailability.find((s) => s.available)?.slot ||
      provider.availableSlots[0] ||
      '';
    setTimeSlot(openSlot);
    setSubmittedBooking(null);
    setFormError('');
    bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectHotel = (
    hotel: PetHotelListing,
    roomName: string,
    species: PetSpecies
  ) => {
    setCategory('hotel');
    setSelectedProviderId(hotel.id);
    setSelectedServiceName(roomName);
    setPetType(species);
    setCheckInDate(hotelCheckInFilter);
    setCheckOutDate(hotelCheckOutFilter);
    setSubmittedBooking(null);
    setFormError('');
    setViewedHotel(null);
    bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeGroomingProvider = useMemo(
    () =>
      groomingProviders.find((p) => p.id === selectedProviderId) ||
      groomingProviders[0] ||
      null,
    [groomingProviders, selectedProviderId]
  );

  const activeHotel = useMemo(
    () => hotels.find((h) => h.id === selectedProviderId) || hotels[0] || null,
    [hotels, selectedProviderId]
  );

  const userPlan = useMemo(() => {
    const slug = accountData?.profile?.membershipTierSlug || 'free';
    return plans.find((p) => p.slug === slug) || null;
  }, [accountData?.profile?.membershipTierSlug, plans]);

  const nightsCount = useMemo(() => {
    if (category !== 'hotel') return 1;
    const diff = Math.round(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 1;
  }, [category, checkInDate, checkOutDate]);

  const priceEstimate = useMemo(() => {
    let base = 0;
    if (category === 'grooming' && activeGroomingProvider) {
      const pkg = activeGroomingProvider.packages.find(
        (p) => p.name === selectedServiceName
      );
      base = pkg ? pkg.price : 0;
    } else if (category === 'hotel' && activeHotel) {
      const room = activeHotel.roomsWithAvailability.find(
        (r) => r.name === selectedServiceName
      );
      base = room ? room.pricePerNight * nightsCount : 0;
    }
    const extra = addExtraCare ? 15 : 0;
    const fee = 4.5;
    const discountPct = userPlan?.discountPct || 0;
    const discount = Number(((base * discountPct) / 100).toFixed(2));
    const total = Number(Math.max(0, base + extra + fee - discount).toFixed(2));
    return { base, extra, fee, discount, total, discountPct };
  }, [
    category,
    activeGroomingProvider,
    activeHotel,
    selectedServiceName,
    nightsCount,
    addExtraCare,
    userPlan,
  ]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !customerEmail.trim() || !contactNumber.trim()) {
      setFormError('Please enter your name, email, and Singapore contact number.');
      return;
    }
    if (!petName.trim()) {
      setFormError('Please enter your pet’s name.');
      return;
    }
    if (category === 'hotel' && checkOutDate <= checkInDate) {
      setFormError('Check-out date must be after check-in date.');
      return;
    }
    if (category === 'grooming' && !timeSlot) {
      setFormError('Please choose an available grooming appointment slot.');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: category,
          providerId: selectedProviderId,
          serviceName: selectedServiceName,
          customerName,
          customerEmail,
          contactNumber,
          petName,
          petType,
          checkInDate,
          checkOutDate: category === 'hotel' ? checkOutDate : undefined,
          timeSlot: category === 'grooming' ? timeSlot : undefined,
          additionalRequirements,
          addEnrichmentOrLateCare: addExtraCare,
        }),
      });
      const data = await parseJsonResponse<{
        booking: BookingRecord;
        error?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit booking.');
      }
      setSubmittedBooking(data.booking);
      await Promise.all([fetchGrooming(), fetchHotels()]);
      if (user) await refreshAccount();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to create booking.'
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      {/* Page Header & Direct In-House Positioning */}
      <section className="pb-10 border-b border-[#E5E0D8]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-[#4A6B53] mb-2.5">
              PetKin Care Services · Singapore
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#1E2420] [text-wrap:balance]">
              In-House Pet Grooming &amp; Hotel Care
            </h1>
            <p className="mt-4 text-base sm:text-[17px] leading-relaxed text-[#57605A]">
              PetKin directly operates our calm grooming studios and boarding suites in Singapore with salaried, fear-free certified specialists—paired with real-time availability and transparent SGD pricing.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAccount}
            className="self-start md:self-auto px-4 py-2.5 bg-white hover:bg-[#F2EFE9] border border-[#E5E0D8] text-sm font-medium text-[#1E2420] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            {user ? 'View My Bookings' : 'Sign In for Member Discounts'}
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex items-start gap-3">
            <Building2 className="w-5 h-5 text-[#4A6B53] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#1E2420]">
                100% Directly Operated
              </p>
              <p className="text-xs text-[#57605A] mt-1 leading-relaxed">
                Single standard of hygiene, safety, and gentle handling across our Singapore locations.
              </p>
            </div>
          </div>
          <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#4A6B53] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#1E2420]">
                Live Capacity Protection
              </p>
              <p className="text-xs text-[#57605A] mt-1 leading-relaxed">
                Real-time suite and slot inventory prevents overbooking and double reservations.
              </p>
            </div>
          </div>
          <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#4A6B53] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#1E2420]">
                Pending-First Confirmation
              </p>
              <p className="text-xs text-[#57605A] mt-1 leading-relaxed">
                Every request starts as Pending and is confirmed only after provider capacity &amp; care checks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A: PET GROOMING */}
      <section aria-labelledby="section-grooming-heading" className="py-12 border-b border-[#E5E0D8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="text-xs font-semibold text-[#4A6B53] mb-2">
              Section A · Grooming Studios
            </p>
            <h2
              id="section-grooming-heading"
              className="font-display text-3xl font-semibold text-[#1E2420]"
            >
              Pet Grooming
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#57605A] leading-relaxed">
              Calm, one-pet-per-table grooming sessions using botanical, tropical-climate skin cleansers and low-decibel dryers. Filter by pet type, location, package, and date to check live open appointment slots.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="h-full min-h-[240px] sm:min-h-[300px] rounded-2xl overflow-hidden border border-[#E5E0D8] bg-[#F2EFE9]">
              <ResilientImage
                src={GROOMING_STUDIO_IMAGE}
                alt="PetKin certified groomer gently brushing a calm dog in a sunlit studio"
                className="w-full h-full object-cover object-center"
                fallbackTitle="PetKin Grooming Studio"
              />
            </div>
          </div>
        </div>

        {/* Grooming Search & Filters */}
        <div className="p-4 bg-[#F2EFE9]/75 border border-[#E5E0D8] rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#57605A] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={groomingSearch}
              onChange={(e) => setGroomingSearch(e.target.value)}
              placeholder="Search salon or package..."
              aria-label="Search grooming providers"
              className="w-full h-10 pl-9 pr-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
            />
          </div>
          <select
            aria-label="Filter grooming by pet type"
            value={groomingPetType}
            onChange={(e) => setGroomingPetType(e.target.value as 'All' | PetSpecies)}
            className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
          >
            <option value="All">Dogs &amp; Cats</option>
            <option value="Dog">Dogs Only</option>
            <option value="Cat">Cats Only</option>
          </select>
          <select
            aria-label="Filter grooming by Singapore location"
            value={groomingLocation}
            onChange={(e) => setGroomingLocation(e.target.value)}
            className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
          >
            <option value="All">All Locations</option>
            <option value="Bukit Timah">Bukit Timah</option>
            <option value="Joo Chiat">Joo Chiat</option>
          </select>
          <select
            aria-label="Filter by grooming package"
            value={groomingServiceFilter}
            onChange={(e) => setGroomingServiceFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
          >
            <option value="All">All Packages</option>
            <option value="Basic Grooming">Basic Grooming</option>
            <option value="Full Grooming">Full Grooming</option>
            <option value="Bath & Blow Dry">Bath &amp; Blow Dry</option>
            <option value="Nail Trimming">Nail Trimming</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Check grooming slot date"
              value={groomingDateFilter}
              onChange={(e) => setGroomingDateFilter(e.target.value)}
              className="flex-1 h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
            />
            <input
              type="number"
              min={20}
              placeholder="Max S$"
              aria-label="Max grooming price"
              value={groomingMaxPrice}
              onChange={(e) => setGroomingMaxPrice(e.target.value)}
              className="w-24 h-10 px-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm tabular-nums"
            />
          </div>
        </div>

        {groomingLoading ? (
          <p className="text-sm text-[#57605A]">Loading grooming studios...</p>
        ) : groomingProviders.length === 0 ? (
          <div className="p-8 bg-white border border-[#E5E0D8] rounded-xl text-center text-sm text-[#57605A]">
            No grooming studios match those filters. Try widening your price or location criteria.
          </div>
        ) : (
          <div className="space-y-8">
            {groomingProviders.map((provider) => (
              <div
                key={provider.id}
                className="p-6 bg-white border border-[#E5E0D8] rounded-2xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-[#1E2420]">
                      {provider.salonName}
                    </h3>
                    <p className="text-xs text-[#57605A] mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#4A6B53]" aria-hidden="true" />
                        {provider.location}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {provider.servesDogs && provider.servesCats
                          ? 'Dogs & Cats'
                          : provider.servesDogs
                          ? 'Dogs'
                          : 'Cats'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {provider.rating && provider.reviewCount > 0
                          ? `${provider.rating}/5 (${provider.reviewCount} reviews)`
                          : 'Verified studio · No reviews yet'}
                      </span>
                    </p>
                  </div>

                  {/* Live Slots for Selected Date */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#57605A]">
                      Slots on {groomingDateFilter}:
                    </span>
                    {provider.slotAvailability.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={!s.available}
                        onClick={() =>
                          handleSelectGrooming(
                            provider,
                            provider.packages[0]?.name || 'Basic Grooming',
                            s.slot
                          )
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border tabular-nums ${
                          s.available
                            ? 'bg-[#E9F0EB] text-[#4A6B53] border-[#C8D8CC] hover:bg-[#4A6B53] hover:text-white cursor-pointer'
                            : 'bg-[#F2EFE9] text-[#57605A]/60 border-[#E5E0D8] line-through cursor-not-allowed'
                        }`}
                      >
                        {s.slot} {!s.available ? '(Full)' : `(${s.remaining} left)`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.packages.map((pkg) => (
                    <article
                      key={pkg.id}
                      className="p-5 bg-[#FAF9F6] border border-[#E5E0D8] rounded-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="font-display text-lg font-semibold text-[#1E2420]">
                            {pkg.name}
                          </h4>
                          <span className="text-base font-semibold text-[#1E2420] tabular-nums">
                            S${pkg.price}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[#4A6B53] flex items-center gap-1.5 tabular-nums">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          {pkg.durationMins} mins · {pkg.petTypes.join(' & ')}
                        </p>
                        <p className="mt-2.5 text-sm text-[#57605A] leading-relaxed">
                          {pkg.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSelectGrooming(provider, pkg.name)}
                          className="px-4 py-2 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Book Grooming
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION B: PET HOTEL */}
      <section aria-labelledby="section-hotel-heading" className="py-12 border-b border-[#E5E0D8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="h-full min-h-[240px] sm:min-h-[300px] rounded-2xl overflow-hidden border border-[#E5E0D8] bg-[#F2EFE9]">
              <ResilientImage
                src={HOTEL_SUITES_IMAGE}
                alt="PetKin pet hotel suites for dogs and sunlit vertical cat condos"
                className="w-full h-full object-cover object-center"
                fallbackTitle="PetKin Pet Hotel Suites"
              />
            </div>
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col justify-center">
            <p className="text-xs font-semibold text-[#4A6B53] mb-2">
              Section B · Overnight Boarding
            </p>
            <h2
              id="section-hotel-heading"
              className="font-display text-3xl font-semibold text-[#1E2420]"
            >
              Pet Hotel
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#57605A] leading-relaxed">
              Hygienic, acoustic-buffered boarding suites with dedicated canine and dog-free feline wings. Select your check-in and check-out dates below to see live confirmed room availability.
            </p>
          </div>
        </div>

        {/* Hotel Search & Date Availability Filters */}
        <div className="p-4 bg-[#F2EFE9]/75 border border-[#E5E0D8] rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#57605A] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={hotelSearch}
              onChange={(e) => setHotelSearch(e.target.value)}
              placeholder="Search hotel name, facility..."
              aria-label="Search pet hotels"
              className="w-full h-10 pl-9 pr-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
            />
          </div>
          <select
            aria-label="Filter pet hotels by pet type"
            value={hotelPetType}
            onChange={(e) => setHotelPetType(e.target.value as 'All' | PetSpecies)}
            className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
          >
            <option value="All">Dogs &amp; Cats</option>
            <option value="Dog">Dog Suites</option>
            <option value="Cat">Cat Suites</option>
          </select>
          <select
            aria-label="Filter pet hotels by location"
            value={hotelLocation}
            onChange={(e) => setHotelLocation(e.target.value)}
            className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
          >
            <option value="All">All Locations</option>
            <option value="Bukit Timah">Bukit Timah</option>
            <option value="Tiong Bahru">Tiong Bahru</option>
          </select>
          <input
            type="date"
            aria-label="Check-in date filter"
            value={hotelCheckInFilter}
            onChange={(e) => setHotelCheckInFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Check-out date filter"
              value={hotelCheckOutFilter}
              onChange={(e) => setHotelCheckOutFilter(e.target.value)}
              className="flex-1 min-w-0 h-10 px-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm"
            />
            <input
              type="number"
              min={30}
              placeholder="Max S$"
              aria-label="Max nightly price"
              value={hotelMaxPrice}
              onChange={(e) => setHotelMaxPrice(e.target.value)}
              className="w-20 h-10 px-2 bg-white border border-[#E5E0D8] rounded-lg text-sm tabular-nums"
            />
          </div>
        </div>

        {hotelsLoading ? (
          <p className="text-sm text-[#57605A]">Checking live suite inventory...</p>
        ) : hotels.length === 0 ? (
          <div className="p-8 bg-white border border-[#E5E0D8] rounded-xl text-center text-sm text-[#57605A]">
            No pet hotels match those dates or filters. Try adjusting your check-in/check-out window or location.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotels.map((hotel) => (
              <article
                key={hotel.id}
                className="p-6 bg-white border border-[#E5E0D8] rounded-xl flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-[#1E2420]">
                        {hotel.name}
                      </h3>
                      <p className="text-xs text-[#57605A] mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#4A6B53]" aria-hidden="true" />
                        <span>{hotel.location}</span>
                        <span aria-hidden="true">·</span>
                        <span>{hotel.verified ? 'Verified Provider' : 'Partner'}</span>
                      </p>
                    </div>
                    <p className="text-base font-semibold text-[#1E2420] tabular-nums whitespace-nowrap shrink-0">
                      From S${hotel.startingPricePerNight} / night
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-[#57605A]">
                    {hotel.rating && hotel.reviewCount > 0
                      ? `Rated ${hotel.rating}/5 across ${hotel.reviewCount} verified stays`
                      : 'Verified listing · Customer ratings appear once stays are completed'}
                  </p>

                  {/* Available Room Types */}
                  <div className="mt-4 space-y-2.5">
                    {hotel.roomsWithAvailability.map((room) => (
                      <div
                        key={room.name}
                        className="p-3.5 bg-[#FAF9F6] border border-[#E5E0D8] rounded-lg flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1E2420]">
                            {room.name} ({room.species})
                          </p>
                          <p className="text-xs text-[#57605A] tabular-nums">
                            S${room.pricePerNight}/night · {room.remainingRooms} of{' '}
                            {room.dailyCapacity} suites open
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!room.isAvailable}
                          onClick={() =>
                            handleSelectHotel(hotel, room.name, room.species)
                          }
                          className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
                            room.isAvailable
                              ? 'bg-[#4A6B53] hover:bg-[#3B5743] text-white cursor-pointer'
                              : 'bg-[#E5E0D8] text-[#57605A] cursor-not-allowed'
                          }`}
                        >
                          {room.isAvailable ? 'Book Pet Hotel' : 'Full'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <ul className="mt-4 space-y-1.5 text-xs text-[#57605A]">
                    {hotel.facilities.slice(0, 4).map((fac) => (
                      <li key={fac} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#4A6B53]" aria-hidden="true" />
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setViewedHotel(hotel)}
                    className="px-4 py-2 text-xs font-semibold text-[#1E2420] bg-[#F2EFE9] hover:bg-[#E5E0D8] rounded-lg cursor-pointer"
                  >
                    View Hotel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const openRoom =
                        hotel.roomsWithAvailability.find((r) => r.isAvailable) ||
                        hotel.roomsWithAvailability[0];
                      if (openRoom) {
                        handleSelectHotel(hotel, openRoom.name, openRoom.species);
                      }
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg cursor-pointer"
                  >
                    Book Pet Hotel
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* INTERACTIVE BOOKING FORM & SUMMARY */}
      <section
        ref={bookingSectionRef}
        id="inhouse-booking-form"
        aria-labelledby="booking-form-heading"
        className="py-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold text-[#4A6B53] mb-2">
              Live Booking Request
            </p>
            <h2
              id="booking-form-heading"
              className="font-display text-2xl sm:text-3xl font-semibold text-[#1E2420]"
            >
              Book Pet Hotel or Grooming
            </h2>
            <p className="mt-3 text-sm text-[#57605A] leading-relaxed">
              Availability is checked transactionally on our server to prevent double bookings. All new requests start with status <strong>Pending</strong> until confirmed by PetKin.
            </p>

            <div className="mt-6 p-4 bg-[#F2EFE9] border border-[#E5E0D8] rounded-xl text-xs space-y-1.5">
              {user && userPlan ? (
                <>
                  <p className="font-semibold text-[#1E2420]">
                    Active Membership: {userPlan.name}
                  </p>
                  <p className="text-[#57605A] tabular-nums">
                    {userPlan.discountPct > 0
                      ? `${userPlan.discountPct}% member discount applies automatically to eligible service charges.`
                      : 'Upgrade to Paw Plus or Paw Premium on Pricing for eligible booking discounts.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[#1E2420]">
                    Member Booking Discounts
                  </p>
                  <p className="text-[#57605A]">
                    Sign in with a Paw Plus or Paw Premium plan to apply eligible booking discounts automatically.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('pricings')}
                    className="text-[#4A6B53] font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Compare Membership Plans
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {submittedBooking ? (
              <div
                aria-live="polite"
                className="p-6 sm:p-8 bg-white border border-[#E5E0D8] rounded-2xl space-y-6"
              >
                <div className="p-4 bg-[#E9F0EB] border border-[#C8D8CC] rounded-xl flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-[#4A6B53] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#1E2420]">
                      Booking Request Submitted · Reference {submittedBooking.referenceCode}
                    </p>
                    <p className="text-xs text-[#57605A] mt-1 leading-relaxed">
                      Current Status: <strong className="text-[#1E2420]">{submittedBooking.status}</strong>. Your booking will be marked Confirmed once our team reviews facility readiness and vaccination records.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#4A6B53]">
                      Reservation Details
                    </p>
                    <p>
                      <span className="font-semibold">Provider:</span>{' '}
                      <span className="text-[#57605A]">{submittedBooking.providerName}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Service:</span>{' '}
                      <span className="text-[#57605A]">{submittedBooking.serviceName}</span>
                    </p>
                    <p className="tabular-nums">
                      <span className="font-semibold">Schedule:</span>{' '}
                      <span className="text-[#57605A]">
                        {submittedBooking.serviceType === 'hotel'
                          ? `${submittedBooking.checkInDate} → ${submittedBooking.checkOutDate} (${submittedBooking.nights} nights)`
                          : `${submittedBooking.checkInDate} @ ${submittedBooking.timeSlot}`}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Pet:</span>{' '}
                      <span className="text-[#57605A]">
                        {submittedBooking.petName} ({submittedBooking.petType})
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 tabular-nums">
                    <p className="text-xs font-semibold text-[#4A6B53]">
                      Price Breakdown (SGD)
                    </p>
                    <p className="flex justify-between text-[#57605A]">
                      <span>Provider Service Price:</span>
                      <span>S${submittedBooking.basePrice.toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between text-[#57605A]">
                      <span>Additional Care Charges:</span>
                      <span>S${submittedBooking.additionalCharges.toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between text-[#57605A]">
                      <span>PetKin Booking Fee:</span>
                      <span>S${submittedBooking.bookingFee.toFixed(2)}</span>
                    </p>
                    {submittedBooking.discountAmount > 0 && (
                      <p className="flex justify-between text-[#4A6B53]">
                        <span>Membership Discount:</span>
                        <span>-S${submittedBooking.discountAmount.toFixed(2)}</span>
                      </p>
                    )}
                    <p className="flex justify-between font-semibold text-[#1E2420] pt-2 border-t border-[#E5E0D8]">
                      <span>Total Payable:</span>
                      <span>S${submittedBooking.totalPayable.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {user && (
                    <button
                      type="button"
                      onClick={onOpenAccount}
                      className="px-4 py-2.5 text-sm font-medium text-[#1E2420] bg-[#F2EFE9] hover:bg-[#E5E0D8] rounded-lg cursor-pointer"
                    >
                      Track in My Account
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubmittedBooking(null)}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg cursor-pointer"
                  >
                    Make Another Booking
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleBookingSubmit}
                className="p-6 sm:p-8 bg-white border border-[#E5E0D8] rounded-2xl space-y-5"
              >
                <div>
                  <span className="block text-xs font-semibold text-[#1E2420] mb-2">
                    Service Type
                  </span>
                  <div className="inline-flex p-1 bg-[#F2EFE9] rounded-lg border border-[#E5E0D8]">
                    <button
                      type="button"
                      onClick={() => {
                        setCategory('grooming');
                        setSelectedProviderId(groomingProviders[0]?.id || 0);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${
                        category === 'grooming'
                          ? 'bg-white text-[#1E2420] shadow-xs'
                          : 'text-[#57605A]'
                      }`}
                    >
                      Pet Grooming
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory('hotel');
                        setSelectedProviderId(hotels[0]?.id || 0);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${
                        category === 'hotel'
                          ? 'bg-white text-[#1E2420] shadow-xs'
                          : 'text-[#57605A]'
                      }`}
                    >
                      Pet Hotel Boarding
                    </button>
                  </div>
                </div>

                {/* Provider & Service */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bk-provider"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      {category === 'grooming' ? 'Grooming Studio' : 'Pet Hotel'}
                    </label>
                    <select
                      id="bk-provider"
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    >
                      {category === 'grooming'
                        ? groomingProviders.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.salonName} ({p.location})
                            </option>
                          ))
                        : hotels.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.location})
                            </option>
                          ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="bk-service"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      {category === 'grooming' ? 'Grooming Package' : 'Suite / Room Type'}
                    </label>
                    <select
                      id="bk-service"
                      value={selectedServiceName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedServiceName(name);
                        if (category === 'hotel' && activeHotel) {
                          const r = activeHotel.roomsWithAvailability.find(
                            (rm) => rm.name === name
                          );
                          if (r) setPetType(r.species);
                        }
                      }}
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    >
                      {category === 'grooming' && activeGroomingProvider
                        ? activeGroomingProvider.packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.name}>
                              {pkg.name} (S${pkg.price} · {pkg.durationMins} mins)
                            </option>
                          ))
                        : activeHotel?.roomsWithAvailability.map((room) => (
                            <option key={room.name} value={room.name}>
                              {room.name} (S${room.pricePerNight}/night · {room.species})
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                {/* Dates & Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bk-checkin"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      {category === 'hotel' ? 'Check-in Date' : 'Appointment Date'}
                    </label>
                    <input
                      id="bk-checkin"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => {
                        setCheckInDate(e.target.value);
                        if (category === 'grooming') {
                          setGroomingDateFilter(e.target.value);
                        }
                      }}
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>

                  {category === 'hotel' ? (
                    <div>
                      <label
                        htmlFor="bk-checkout"
                        className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                      >
                        Check-out Date
                      </label>
                      <input
                        id="bk-checkout"
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                      />
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="bk-slot"
                        className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                      >
                        Available Time Slot
                      </label>
                      <select
                        id="bk-slot"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                      >
                        {(activeGroomingProvider?.slotAvailability || []).map((s) => (
                          <option
                            key={s.slot}
                            value={s.slot}
                            disabled={!s.available}
                          >
                            {s.slot}{' '}
                            {s.available
                              ? `(${s.remaining} open)`
                              : '(Unavailable / Full)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Pet Details */}
                <div className="pt-2 border-t border-[#E5E0D8] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bk-pet-name"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Pet Name
                    </label>
                    <input
                      id="bk-pet-name"
                      type="text"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="e.g. Kopi"
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bk-pet-type"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Pet Type
                    </label>
                    <select
                      id="bk-pet-type"
                      value={petType}
                      onChange={(e) => setPetType(e.target.value as PetSpecies)}
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    >
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                    </select>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="bk-cust-name"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Customer Name
                    </label>
                    <input
                      id="bk-cust-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name"
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bk-cust-email"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="bk-cust-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.sg"
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bk-cust-phone"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Contact Number
                    </label>
                    <input
                      id="bk-cust-phone"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+65 9123 4567"
                      className="w-full h-11 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 text-xs text-[#1E2420] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addExtraCare}
                      onChange={(e) => setAddExtraCare(e.target.checked)}
                      className="accent-[#4A6B53]"
                    />
                    <span>
                      Add Additional Pet Care Service (+S$15.00 · scent enrichment or calming paw balm / late pick-up)
                    </span>
                  </label>
                  <div>
                    <label
                      htmlFor="bk-notes"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Additional Care Requirements
                    </label>
                    <textarea
                      id="bk-notes"
                      rows={2}
                      value={additionalRequirements}
                      onChange={(e) => setAdditionalRequirements(e.target.value)}
                      placeholder="Feeding schedule, allergies, shy-pet handling notes..."
                      className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-medium text-[#9F2B2B]">
                    {formError}
                  </p>
                )}

                <div className="pt-4 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-[#57605A] tabular-nums space-y-0.5">
                    <p>
                      Service: S${priceEstimate.base.toFixed(2)} + Add-on: S$
                      {priceEstimate.extra.toFixed(2)} + PetKin Fee: S$
                      {priceEstimate.fee.toFixed(2)}
                      {priceEstimate.discount > 0
                        ? ` − Member (${priceEstimate.discountPct}%): S$${priceEstimate.discount.toFixed(2)}`
                        : ''}
                    </p>
                    <p className="text-lg font-semibold text-[#1E2420]">
                      Total Payable: S${priceEstimate.total.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={bookingSubmitting}
                    className="px-6 py-3 bg-[#4A6B53] hover:bg-[#3B5743] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {bookingSubmitting ? 'Submitting Booking...' : 'Submit Booking Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Hotel Details Modal ("View Hotel") */}
      {viewedHotel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2420]/50 backdrop-blur-[2px]"
          onClick={() => setViewedHotel(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotel-detail-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-7 shadow-xl space-y-5"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
              <div>
                <p className="text-xs font-semibold text-[#4A6B53]">
                  Verified Singapore Pet Hotel
                </p>
                <h3
                  id="hotel-detail-title"
                  className="font-display text-2xl font-semibold text-[#1E2420] mt-1"
                >
                  {viewedHotel.name}
                </h3>
                <p className="text-xs text-[#57605A] mt-0.5">
                  {viewedHotel.location} · Starting S${viewedHotel.startingPricePerNight}/night
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewedHotel(null)}
                aria-label="Close hotel details"
                className="p-2 text-[#57605A] hover:text-[#1E2420] hover:bg-[#F2EFE9] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#F2EFE9] border border-[#E5E0D8]">
              <ResilientImage
                src={viewedHotel.photoUrl}
                alt={viewedHotel.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1E2420] mb-2">
                Facilities &amp; Care Standards
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#57605A]">
                {viewedHotel.facilities.map((f) => (
                  <p key={f} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4A6B53]" />
                    <span>{f}</span>
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1E2420] mb-2">
                Rooms &amp; Live Availability ({hotelCheckInFilter} → {hotelCheckOutFilter})
              </h4>
              <div className="space-y-3">
                {viewedHotel.roomsWithAvailability.map((room) => (
                  <div
                    key={room.name}
                    className="p-4 bg-[#FAF9F6] border border-[#E5E0D8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[#1E2420]">
                        {room.name} ({room.species}) — S${room.pricePerNight}/night
                      </p>
                      <p className="text-xs text-[#57605A] mt-0.5">
                        {room.dimensions} · {room.description}
                      </p>
                      <p className="text-xs font-medium text-[#4A6B53] mt-1 tabular-nums">
                        {room.remainingRooms} of {room.dailyCapacity} suites available
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!room.isAvailable}
                      onClick={() =>
                        handleSelectHotel(viewedHotel, room.name, room.species)
                      }
                      className="px-4 py-2 bg-[#4A6B53] hover:bg-[#3B5743] disabled:opacity-50 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {room.isAvailable ? 'Select Room' : 'Unavailable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

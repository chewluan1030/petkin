import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseJsonResponse } from '../lib/http';
import type {
  BookingRecord,
  GroomingProviderListing,
  MembershipPlanItem,
  PetHotelListing,
  PetListing,
  ServicePricingItem,
} from '../types/api';

interface AdminDashboardModalProps {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

interface AdminOverview {
  pets: PetListing[];
  shelters: { id: number; name: string; location: string; contactEmail: string; verified: boolean }[];
  petHotels: PetHotelListing[];
  groomingProviders: GroomingProviderListing[];
  bookings: BookingRecord[];
  enquiries: {
    id: number;
    referenceCode: string;
    petName: string;
    shelterName: string;
    adopterName: string;
    adopterEmail: string;
    status: string;
  }[];
  serviceCategories: ServicePricingItem[];
  membershipPlans: MembershipPlanItem[];
}

type AdminTab = 'bookings' | 'pets' | 'providers' | 'pricing';

export function AdminDashboardModal({
  open,
  onClose,
  onDataChanged,
}: AdminDashboardModalProps) {
  const { user, isAdmin, signInWithGoogle, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('bookings');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [newPet, setNewPet] = useState({
    name: '',
    petType: 'Dog',
    breed: '',
    age: '2 yrs',
    gender: 'Male',
    weight: '11 kg',
    personality: '',
    specialCare: '',
    hdbSuitable: true,
    seniorFriendly: false,
    goodWithKids: true,
    shelterId: 1,
    monthlyCareCostSgd: 160,
  });

  const [newShelter, setNewShelter] = useState({
    name: '',
    location: '',
    contactEmail: '',
    description: '',
  });

  const [newHotel, setNewHotel] = useState({
    name: '',
    location: '',
    acceptsDogs: true,
    acceptsCats: true,
    startingPricePerNight: 68,
    roomName: 'Quiet Rest Suite',
    roomSpecies: 'Dog',
    dailyCapacity: 4,
    facilitiesText: '24/7 Care Attendants, HEPA Air Filtration',
  });

  const [newGroomer, setNewGroomer] = useState({
    salonName: '',
    location: '',
    servesDogs: true,
    servesCats: true,
    packageName: 'Basic Grooming',
    packagePrice: 55,
    durationMins: 60,
    slotsText: '10:00 AM, 1:30 PM, 4:30 PM',
  });

  const loadOverview = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/overview');
      const data = await parseJsonResponse<AdminOverview & { error?: string }>(res);
      if (!res.ok) throw new Error(data.error || 'Failed to load admin console.');
      setOverview(data);
      if (data.shelters?.length > 0) {
        setNewPet((p) => ({ ...p, shelterId: data.shelters[0].id }));
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to load admin data.'
      );
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, authFetch]);

  useEffect(() => {
    if (open && isAdmin) {
      loadOverview();
    }
  }, [open, isAdmin, loadOverview]);

  if (!open) return null;

  const handleBookingStatus = async (id: number, status: string) => {
    setFeedback('');
    const res = await authFetch(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setFeedback(`Booking updated to ${status}.`);
      await loadOverview();
      onDataChanged();
    }
  };

  const handleEnquiryStatus = async (id: number, status: string) => {
    const res = await authFetch(`/api/admin/enquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setFeedback(`Enquiry marked ${status}.`);
      await loadOverview();
    }
  };

  const handlePetStatus = async (id: number, adoptionStatus: string) => {
    const res = await authFetch(`/api/admin/pets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adoptionStatus }),
    });
    if (res.ok) {
      setFeedback(`Pet listing updated to ${adoptionStatus}.`);
      await loadOverview();
      onDataChanged();
    }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPet),
    });
    if (res.ok) {
      setFeedback(`Added ${newPet.name} to adoption listings.`);
      setNewPet((p) => ({ ...p, name: '', breed: '', personality: '', specialCare: '' }));
      await loadOverview();
      onDataChanged();
    }
  };

  const handleAddShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/shelters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newShelter),
    });
    if (res.ok) {
      setFeedback(`Added shelter ${newShelter.name}.`);
      setNewShelter({ name: '', location: '', contactEmail: '', description: '' });
      await loadOverview();
    }
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHotel),
    });
    if (res.ok) {
      setFeedback(`Added pet hotel ${newHotel.name}.`);
      setNewHotel((h) => ({ ...h, name: '', location: '' }));
      await loadOverview();
      onDataChanged();
    }
  };

  const handleAddGroomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/grooming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroomer),
    });
    if (res.ok) {
      setFeedback(`Added grooming studio ${newGroomer.salonName}.`);
      setNewGroomer((g) => ({ ...g, salonName: '', location: '' }));
      await loadOverview();
      onDataChanged();
    }
  };

  const handleServicePriceUpdate = async (
    id: number,
    startingPriceSgd: number
  ) => {
    const res = await authFetch(`/api/admin/pricing/service/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startingPriceSgd,
        priceDisplay: `From S$${startingPriceSgd}`,
      }),
    });
    if (res.ok) {
      setFeedback('Service pricing updated across the website.');
      await loadOverview();
      onDataChanged();
    }
  };

  const handleMembershipUpdate = async (
    id: number,
    monthlyPriceSgd: number,
    discountPct: number
  ) => {
    const res = await authFetch(`/api/admin/pricing/membership/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyPriceSgd, discountPct }),
    });
    if (res.ok) {
      setFeedback('Membership pricing updated across the website.');
      await loadOverview();
      onDataChanged();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2420]/55 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E5E0D8]">
          <div>
            <p className="text-xs font-semibold text-[#4A6B53]">
              PetKin Operations Console
            </p>
            <h2
              id="admin-modal-title"
              className="font-display text-2xl font-semibold text-[#1E2420] mt-0.5"
            >
              Admin Dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin dashboard"
            className="p-2 text-[#57605A] hover:text-[#1E2420] hover:bg-[#F2EFE9] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-4">
            <ShieldAlert className="w-8 h-8 text-[#4A6B53] mx-auto" />
            <p className="text-sm text-[#57605A]">
              Sign in with an authorised PetKin administrator account to manage shelters, pets, providers, pricing, and customer bookings.
            </p>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="px-5 py-2.5 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              Sign In as Administrator
            </button>
          </div>
        ) : !isAdmin ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <ShieldAlert className="w-8 h-8 text-[#9F2B2B] mx-auto" />
            <p className="font-semibold text-[#1E2420]">
              Authorised Administrator Access Required
            </p>
            <p className="text-sm text-[#57605A]">
              Signed in as {user.email}. Only authorised administrator accounts can access operational records and pricing controls.
            </p>
          </div>
        ) : (
          <div className="pt-5 space-y-6">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'bookings', label: 'Bookings & Enquiries' },
                  { id: 'pets', label: 'Adoption Pets & Shelters' },
                  { id: 'providers', label: 'Hotels & Groomers' },
                  { id: 'pricing', label: 'Pricing & Plans' },
                ] as { id: AdminTab; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-[#4A6B53] text-white border-[#4A6B53]'
                      : 'bg-white text-[#57605A] border-[#E5E0D8]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {feedback && (
              <div className="p-3 bg-[#E9F0EB] border border-[#C8D8CC] rounded-lg text-xs font-medium text-[#1E2420] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4A6B53]" />
                <span>{feedback}</span>
              </div>
            )}
            {error && (
              <p className="text-xs font-medium text-[#9F2B2B]">{error}</p>
            )}

            {loading || !overview ? (
              <p className="text-sm text-[#57605A] py-8">Loading operations data...</p>
            ) : (
              <>
                {activeTab === 'bookings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#1E2420] mb-3">
                        Customer Service Bookings ({overview.bookings.length})
                      </h3>
                      {overview.bookings.length === 0 ? (
                        <p className="text-sm text-[#57605A] p-4 bg-white border border-[#E5E0D8] rounded-xl">
                          No customer bookings submitted yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {overview.bookings.map((b) => (
                            <div
                              key={b.id}
                              className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm"
                            >
                              <div>
                                <p className="font-semibold text-[#1E2420]">
                                  {b.referenceCode} · {b.serviceName} ({b.providerName})
                                </p>
                                <p className="text-xs text-[#57605A] mt-0.5 tabular-nums">
                                  {b.customerName} ({b.customerEmail}) · Pet: {b.petName} ({b.petType}) · {b.checkInDate}
                                  {b.checkOutDate ? ` → ${b.checkOutDate}` : ` @ ${b.timeSlot}`} · S$
                                  {b.totalPayable.toFixed(2)}
                                </p>
                                {b.cancellationRequested && (
                                  <p className="text-xs text-[#9F2B2B] mt-1">
                                    Cancellation requested: {b.cancellationReason}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <select
                                  aria-label={`Booking status for ${b.referenceCode}`}
                                  value={b.status}
                                  onChange={(e) =>
                                    handleBookingStatus(b.id, e.target.value)
                                  }
                                  className="h-9 px-2.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-medium"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#1E2420] mb-3">
                        Adoption Enquiries ({overview.enquiries.length})
                      </h3>
                      <div className="space-y-2.5">
                        {overview.enquiries.map((enq) => (
                          <div
                            key={enq.id}
                            className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-[#1E2420]">
                                {enq.referenceCode} · {enq.petName} ({enq.shelterName})
                              </p>
                              <p className="text-xs text-[#57605A]">
                                {enq.adopterName} ({enq.adopterEmail})
                              </p>
                            </div>
                            <select
                              aria-label={`Enquiry status for ${enq.referenceCode}`}
                              value={enq.status}
                              onChange={(e) =>
                                handleEnquiryStatus(enq.id, e.target.value)
                              }
                              className="h-9 px-2.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-medium"
                            >
                              <option value="Submitted">Submitted</option>
                              <option value="Under Shelter Review">
                                Under Shelter Review
                              </option>
                              <option value="Approved">Approved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pets' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#1E2420] mb-3">
                        Adoption Listings (Live Status Sync)
                      </h3>
                      <div className="space-y-2.5">
                        {overview.pets.map((pet) => (
                          <div
                            key={pet.id}
                            className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-[#1E2420]">
                                {pet.name} · {pet.petType} · {pet.breed}
                              </p>
                              <p className="text-xs text-[#57605A]">
                                {pet.shelterName} · Monthly care: S${pet.monthlyCareCostSgd}
                              </p>
                            </div>
                            <select
                              aria-label={`Adoption status for ${pet.name}`}
                              value={pet.adoptionStatus}
                              onChange={(e) =>
                                handlePetStatus(pet.id, e.target.value)
                              }
                              className="h-9 px-3 bg-white border border-[#E5E0D8] rounded-lg text-xs font-medium"
                            >
                              <option value="Available">Available</option>
                              <option value="Pending">Pending</option>
                              <option value="Adopted">Adopted</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <form
                        onSubmit={handleAddPet}
                        className="p-5 bg-white border border-[#E5E0D8] rounded-xl space-y-3"
                      >
                        <h4 className="font-display text-base font-semibold text-[#1E2420]">
                          Add Verified Adoption Pet
                        </h4>
                        <div className="grid grid-cols-2 gap-2.5 text-sm">
                          <input
                            required
                            placeholder="Pet name"
                            value={newPet.name}
                            onChange={(e) =>
                              setNewPet((p) => ({ ...p, name: e.target.value }))
                            }
                            className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                          />
                          <select
                            value={newPet.petType}
                            onChange={(e) =>
                              setNewPet((p) => ({ ...p, petType: e.target.value }))
                            }
                            className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                          >
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                          </select>
                          <input
                            required
                            placeholder="Breed"
                            value={newPet.breed}
                            onChange={(e) =>
                              setNewPet((p) => ({ ...p, breed: e.target.value }))
                            }
                            className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                          />
                          <select
                            value={newPet.shelterId}
                            onChange={(e) =>
                              setNewPet((p) => ({
                                ...p,
                                shelterId: Number(e.target.value),
                              }))
                            }
                            className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                          >
                            {overview.shelters.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <input
                            required
                            placeholder="Age"
                            value={newPet.age}
                            onChange={(e) =>
                              setNewPet((p) => ({ ...p, age: e.target.value }))
                            }
                            className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                          />
                          <input
                            required
                            placeholder="Weight"
                            value={newPet.weight}
                            onChange={(e) =>
                              setNewPet((p) => ({ ...p, weight: e.target.value }))
                            }
                            className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                          />
                        </div>
                        <input
                          required
                          placeholder="Personality & temperament"
                          value={newPet.personality}
                          onChange={(e) =>
                            setNewPet((p) => ({ ...p, personality: e.target.value }))
                          }
                          className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                        />
                        <input
                          required
                          placeholder="Special care requirements"
                          value={newPet.specialCare}
                          onChange={(e) =>
                            setNewPet((p) => ({ ...p, specialCare: e.target.value }))
                          }
                          className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                        />
                        <div className="flex flex-wrap gap-4 text-xs text-[#57605A]">
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={newPet.hdbSuitable}
                              onChange={(e) =>
                                setNewPet((p) => ({
                                  ...p,
                                  hdbSuitable: e.target.checked,
                                }))
                              }
                            />
                            HDB-Approved
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={newPet.seniorFriendly}
                              onChange={(e) =>
                                setNewPet((p) => ({
                                  ...p,
                                  seniorFriendly: e.target.checked,
                                }))
                              }
                            />
                            Senior-Friendly
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={newPet.goodWithKids}
                              onChange={(e) =>
                                setNewPet((p) => ({
                                  ...p,
                                  goodWithKids: e.target.checked,
                                }))
                              }
                            />
                            Good with Kids
                          </label>
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#4A6B53] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Publish Listing
                        </button>
                      </form>

                      <form
                        onSubmit={handleAddShelter}
                        className="p-5 bg-white border border-[#E5E0D8] rounded-xl space-y-3"
                      >
                        <h4 className="font-display text-base font-semibold text-[#1E2420]">
                          Add Partner Shelter ({overview.shelters.length} total)
                        </h4>
                        <input
                          required
                          placeholder="Shelter name"
                          value={newShelter.name}
                          onChange={(e) =>
                            setNewShelter((s) => ({ ...s, name: e.target.value }))
                          }
                          className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                        />
                        <input
                          required
                          placeholder="Singapore location"
                          value={newShelter.location}
                          onChange={(e) =>
                            setNewShelter((s) => ({ ...s, location: e.target.value }))
                          }
                          className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                        />
                        <input
                          required
                          type="email"
                          placeholder="Shelter contact email"
                          value={newShelter.contactEmail}
                          onChange={(e) =>
                            setNewShelter((s) => ({
                              ...s,
                              contactEmail: e.target.value,
                            }))
                          }
                          className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                        />
                        <textarea
                          required
                          rows={2}
                          placeholder="Shelter profile description"
                          value={newShelter.description}
                          onChange={(e) =>
                            setNewShelter((s) => ({
                              ...s,
                              description: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 border border-[#E5E0D8] rounded-lg text-sm"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#4A6B53] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Add Shelter Profile
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {activeTab === 'providers' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form
                      onSubmit={handleAddHotel}
                      className="p-5 bg-white border border-[#E5E0D8] rounded-xl space-y-3"
                    >
                      <h3 className="font-display text-lg font-semibold text-[#1E2420]">
                        Add Pet Hotel ({overview.petHotels.length} active)
                      </h3>
                      <input
                        required
                        placeholder="Hotel name"
                        value={newHotel.name}
                        onChange={(e) =>
                          setNewHotel((h) => ({ ...h, name: e.target.value }))
                        }
                        className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <input
                        required
                        placeholder="Location in Singapore"
                        value={newHotel.location}
                        onChange={(e) =>
                          setNewHotel((h) => ({ ...h, location: e.target.value }))
                        }
                        className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2.5 text-sm">
                        <input
                          required
                          placeholder="Room type name"
                          value={newHotel.roomName}
                          onChange={(e) =>
                            setNewHotel((h) => ({ ...h, roomName: e.target.value }))
                          }
                          className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                        />
                        <input
                          required
                          type="number"
                          placeholder="Nightly price (S$)"
                          value={newHotel.startingPricePerNight}
                          onChange={(e) =>
                            setNewHotel((h) => ({
                              ...h,
                              startingPricePerNight: Number(e.target.value),
                            }))
                          }
                          className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                        />
                      </div>
                      <input
                        placeholder="Facilities (comma-separated)"
                        value={newHotel.facilitiesText}
                        onChange={(e) =>
                          setNewHotel((h) => ({
                            ...h,
                            facilitiesText: e.target.value,
                          }))
                        }
                        className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#4A6B53] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Add Pet Hotel
                      </button>
                    </form>

                    <form
                      onSubmit={handleAddGroomer}
                      className="p-5 bg-white border border-[#E5E0D8] rounded-xl space-y-3"
                    >
                      <h3 className="font-display text-lg font-semibold text-[#1E2420]">
                        Add Grooming Studio ({overview.groomingProviders.length} active)
                      </h3>
                      <input
                        required
                        placeholder="Salon name"
                        value={newGroomer.salonName}
                        onChange={(e) =>
                          setNewGroomer((g) => ({ ...g, salonName: e.target.value }))
                        }
                        className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <input
                        required
                        placeholder="Location in Singapore"
                        value={newGroomer.location}
                        onChange={(e) =>
                          setNewGroomer((g) => ({ ...g, location: e.target.value }))
                        }
                        className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2.5 text-sm">
                        <input
                          required
                          placeholder="Package name"
                          value={newGroomer.packageName}
                          onChange={(e) =>
                            setNewGroomer((g) => ({
                              ...g,
                              packageName: e.target.value,
                            }))
                          }
                          className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                        />
                        <input
                          required
                          type="number"
                          placeholder="Price (S$)"
                          value={newGroomer.packagePrice}
                          onChange={(e) =>
                            setNewGroomer((g) => ({
                              ...g,
                              packagePrice: Number(e.target.value),
                            }))
                          }
                          className="h-9 px-3 border border-[#E5E0D8] rounded-lg"
                        />
                      </div>
                      <input
                        placeholder="Appointment slots (comma-separated)"
                        value={newGroomer.slotsText}
                        onChange={(e) =>
                          setNewGroomer((g) => ({ ...g, slotsText: e.target.value }))
                        }
                        className="w-full h-9 px-3 border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#4A6B53] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Add Grooming Studio
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'pricing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#1E2420] mb-3">
                        Service Categories Pricing (Reflects Live on Website)
                      </h3>
                      <div className="space-y-2.5">
                        {overview.serviceCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-[#1E2420]">
                                {cat.categoryName}
                              </p>
                              <p className="text-xs text-[#57605A]">
                                Current display: {cat.priceDisplay}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#57605A]">S$</span>
                              <input
                                type="number"
                                step="0.5"
                                defaultValue={cat.startingPriceSgd}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (val !== cat.startingPriceSgd) {
                                    handleServicePriceUpdate(cat.id, val);
                                  }
                                }}
                                className="w-24 h-9 px-2.5 border border-[#E5E0D8] rounded-lg text-sm tabular-nums"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#1E2420] mb-3">
                        Membership Plans Pricing
                      </h3>
                      <div className="space-y-2.5">
                        {overview.membershipPlans.map((plan) => (
                          <div
                            key={plan.id}
                            className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-[#1E2420]">
                                {plan.name}
                              </p>
                              <p className="text-xs text-[#57605A] tabular-nums">
                                S${plan.monthlyPriceSgd.toFixed(2)}/mo · Discount:{' '}
                                {plan.discountPct}%
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-[#57605A]">
                                S$/mo
                                <input
                                  type="number"
                                  step="0.1"
                                  defaultValue={plan.monthlyPriceSgd}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val !== plan.monthlyPriceSgd) {
                                      handleMembershipUpdate(
                                        plan.id,
                                        val,
                                        plan.discountPct
                                      );
                                    }
                                  }}
                                  className="ml-1.5 w-20 h-9 px-2 border border-[#E5E0D8] rounded-lg tabular-nums"
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

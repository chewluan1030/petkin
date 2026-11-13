import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Heart,
  LogOut,
  PawPrint,
  Plus,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PetSpecies } from '../types/api';
import { ResilientImage } from './ResilientImage';

interface CustomerAccountDrawerProps {
  open: boolean;
  onClose: () => void;
}

type AccountSection = 'bookings' | 'pets' | 'favourites' | 'enquiries' | 'profile';

export function CustomerAccountDrawer({
  open,
  onClose,
}: CustomerAccountDrawerProps) {
  const {
    user,
    accountData,
    authError,
    signInWithGoogle,
    signOutUser,
    refreshAccount,
    authFetch,
  } = useAuth();

  const [section, setSection] = useState<AccountSection>('bookings');
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog' as PetSpecies,
    breed: '',
    age: '',
    weight: '',
    careNotes: '',
  });
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phone: '',
    housingType: 'HDB Flat',
  });
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (accountData?.profile) {
      setProfileForm({
        displayName: accountData.profile.displayName || '',
        phone: accountData.profile.phone || '',
        housingType: accountData.profile.housingType || 'HDB Flat',
      });
    }
  }, [accountData?.profile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setBusy(true);
    try {
      const res = await authFetch('/api/account/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add pet.');
      setPetForm({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        weight: '',
        careNotes: '',
      });
      setStatusMessage('Pet profile saved to your account.');
      await refreshAccount();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to save pet profile.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePet = async (id: number) => {
    setBusy(true);
    try {
      await authFetch(`/api/account/pets/${id}`, { method: 'DELETE' });
      await refreshAccount();
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveFavourite = async (petId: number) => {
    setBusy(true);
    try {
      await authFetch(`/api/account/favourites/${petId}`, { method: 'POST' });
      await refreshAccount();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setBusy(true);
    try {
      const res = await authFetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error('Could not update profile.');
      setStatusMessage('Account information updated.');
      await refreshAccount();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update profile.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRequestCancellation = async (bookingId: number) => {
    setBusy(true);
    setErrorMessage('');
    try {
      const res = await authFetch(
        `/api/account/bookings/${bookingId}/cancel-request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: cancelReason || 'Change of schedule',
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to submit cancellation request.');
      setCancelTargetId(null);
      setCancelReason('');
      setStatusMessage('Cancellation request sent to PetKin team.');
      await refreshAccount();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to submit request.'
      );
    } finally {
      setBusy(false);
    }
  };

  const upcomingBookings = (accountData?.bookings || []).filter(
    (b) => b.status === 'Pending' || b.status === 'Confirmed'
  );
  const pastBookings = (accountData?.bookings || []).filter(
    (b) => b.status === 'Completed' || b.status === 'Cancelled'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1E2420]/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-full bg-[#FAF9F6] border-l border-[#E5E0D8] overflow-y-auto p-6 sm:p-8 flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E5E0D8]">
          <div>
            <p className="text-xs font-semibold text-[#4A6B53]">
              PetKin Customer Portal
            </p>
            <h2
              id="account-drawer-title"
              className="font-display text-2xl font-semibold text-[#1E2420] mt-1"
            >
              My Account &amp; Care Records
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer account"
            className="p-2 text-[#57605A] hover:text-[#1E2420] hover:bg-[#F2EFE9] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="my-auto py-12 text-center max-w-md mx-auto space-y-5">
            <div className="w-12 h-12 rounded-xl bg-[#E9F0EB] text-[#4A6B53] flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-[#1E2420]">
              Sign in to manage your pets and bookings
            </h3>
            <p className="text-sm text-[#57605A] leading-relaxed">
              Access your saved dogs and cats, favourite shelter companions, adoption enquiries, and live Pet Hotel or Grooming booking statuses—protected securely so only you can view your personal records.
            </p>
            {authError && (
              <p role="alert" className="text-xs font-medium text-[#9F2B2B]">
                {authError}
              </p>
            )}
            <button
              type="button"
              onClick={signInWithGoogle}
              className="px-6 py-3 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Continue with Google Sign-In
            </button>
          </div>
        ) : (
          <div className="pt-5 flex-1 flex flex-col">
            <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#1E2420]">
                  {accountData?.profile?.displayName || user.displayName || 'PetKin Member'}
                </p>
                <p className="text-xs text-[#57605A]">
                  {user.email} · Plan:{' '}
                  <span className="font-medium text-[#4A6B53] uppercase">
                    {accountData?.profile?.membershipTierSlug || 'free'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={signOutUser}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#57605A] hover:text-[#1E2420] bg-[#F2EFE9] rounded-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </div>

            {/* Sub-navigation inside drawer */}
            <div className="mt-5 flex flex-wrap gap-2 border-b border-[#E5E0D8] pb-4">
              {(
                [
                  { id: 'bookings', label: 'Bookings', count: accountData?.bookings.length || 0 },
                  { id: 'pets', label: 'My Pets', count: accountData?.customerPets.length || 0 },
                  { id: 'favourites', label: 'Favourites', count: accountData?.favourites.length || 0 },
                  { id: 'enquiries', label: 'Enquiries', count: accountData?.enquiries.length || 0 },
                  { id: 'profile', label: 'Profile' },
                ] as { id: AccountSection; label: string; count?: number }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSection(tab.id);
                    setStatusMessage('');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    section === tab.id
                      ? 'bg-[#4A6B53] text-white border-[#4A6B53]'
                      : 'bg-white text-[#57605A] border-[#E5E0D8] hover:text-[#1E2420]'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined ? ` (${tab.count})` : ''}
                </button>
              ))}
            </div>

            {statusMessage && (
              <div className="mt-4 p-3 bg-[#E9F0EB] border border-[#C8D8CC] rounded-lg text-xs font-medium text-[#1E2420] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4A6B53]" aria-hidden="true" />
                <span>{statusMessage}</span>
              </div>
            )}
            {errorMessage && (
              <p role="alert" className="mt-4 text-xs font-medium text-[#9F2B2B]">
                {errorMessage}
              </p>
            )}

            {/* Section Content */}
            <div className="mt-5 space-y-5 flex-1">
              {section === 'bookings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[#1E2420] mb-3">
                      Upcoming Bookings
                    </h3>
                    {upcomingBookings.length === 0 ? (
                      <p className="text-sm text-[#57605A] p-4 bg-white border border-[#E5E0D8] rounded-xl">
                        No upcoming Pet Hotel or Grooming bookings yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingBookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-2 text-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-[#1E2420]">
                                  {b.serviceName} · {b.providerName}
                                </p>
                                <p className="text-xs text-[#57605A] tabular-nums">
                                  Ref: {b.referenceCode} · Pet: {b.petName} ({b.petType})
                                </p>
                              </div>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F2EFE9] text-[#1E2420]">
                                Status: {b.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#57605A] tabular-nums flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#4A6B53]" aria-hidden="true" />
                              {b.serviceType === 'hotel'
                                ? `${b.checkInDate} to ${b.checkOutDate} (${b.nights} nights)`
                                : `${b.checkInDate} at ${b.timeSlot}`}
                              {' · '}Total: S${b.totalPayable.toFixed(2)}
                            </p>

                            {b.cancellationRequested ? (
                              <p className="text-xs font-medium text-[#4A6B53]">
                                Cancellation request submitted ({b.cancellationReason})
                              </p>
                            ) : cancelTargetId === b.id ? (
                              <div className="pt-2 flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  placeholder="Reason for cancellation..."
                                  className="flex-1 min-w-[180px] h-9 px-3 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                                />
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleRequestCancellation(b.id)}
                                  className="px-3 py-1.5 bg-[#4A6B53] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                >
                                  Submit Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCancelTargetId(null)}
                                  className="px-3 py-1.5 text-xs text-[#57605A] cursor-pointer"
                                >
                                  Keep
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCancelTargetId(b.id)}
                                className="text-xs font-medium text-[#57605A] hover:text-[#1E2420] underline underline-offset-2 cursor-pointer"
                              >
                                Request Cancellation
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-semibold text-[#1E2420] mb-3">
                      Booking History
                    </h3>
                    {pastBookings.length === 0 ? (
                      <p className="text-sm text-[#57605A] p-4 bg-white border border-[#E5E0D8] rounded-xl">
                        No completed or cancelled bookings yet.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {pastBookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex items-center justify-between gap-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-[#1E2420]">
                                {b.serviceName} · {b.petName}
                              </p>
                              <p className="text-xs text-[#57605A] tabular-nums">
                                {b.referenceCode} · {b.checkInDate} · S${b.totalPayable.toFixed(2)}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-[#57605A]">
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {section === 'pets' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleAddPet}
                    className="p-5 bg-white border border-[#E5E0D8] rounded-xl space-y-4"
                  >
                    <h3 className="font-display text-lg font-semibold text-[#1E2420] flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-[#4A6B53]" aria-hidden="true" />
                      Add Cat or Dog Profile
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Pet name (e.g. Kopi)"
                        value={petForm.name}
                        onChange={(e) =>
                          setPetForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <select
                        value={petForm.species}
                        onChange={(e) =>
                          setPetForm((p) => ({
                            ...p,
                            species: e.target.value as PetSpecies,
                          }))
                        }
                        className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                      >
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="Breed (e.g. Singapore Special)"
                        value={petForm.breed}
                        onChange={(e) =>
                          setPetForm((p) => ({ ...p, breed: e.target.value }))
                        }
                        className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Age (e.g. 3 yrs)"
                          value={petForm.age}
                          onChange={(e) =>
                            setPetForm((p) => ({ ...p, age: e.target.value }))
                          }
                          className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Weight (e.g. 12 kg)"
                          value={petForm.weight}
                          onChange={(e) =>
                            setPetForm((p) => ({ ...p, weight: e.target.value }))
                          }
                          className="h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Care notes, allergies, or temperament..."
                      value={petForm.careNotes}
                      onChange={(e) =>
                        setPetForm((p) => ({ ...p, careNotes: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      Save Pet Profile
                    </button>
                  </form>

                  <div className="space-y-3">
                    {(accountData?.customerPets || []).length === 0 ? (
                      <p className="text-sm text-[#57605A]">
                        No saved pet profiles yet. Add your cat or dog above for faster bookings.
                      </p>
                    ) : (
                      accountData?.customerPets.map((pet) => (
                        <div
                          key={pet.id}
                          className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-[#1E2420]">
                              {pet.name} · {pet.species}
                            </p>
                            <p className="text-xs text-[#57605A] mt-0.5 tabular-nums">
                              {pet.breed} · {pet.age} · {pet.weight}
                            </p>
                            {pet.careNotes && (
                              <p className="text-xs text-[#57605A] mt-1">
                                Care notes: {pet.careNotes}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePet(pet.id)}
                            aria-label={`Remove ${pet.name}`}
                            className="p-2 text-[#57605A] hover:text-[#9F2B2B] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {section === 'favourites' && (
                <div className="space-y-3">
                  {(accountData?.favourites || []).length === 0 ? (
                    <p className="text-sm text-[#57605A] p-4 bg-white border border-[#E5E0D8] rounded-xl">
                      No favourite pets saved yet. Tap “Save” on any pet card on Find A Pet.
                    </p>
                  ) : (
                    accountData?.favourites.map((fav) => (
                      <div
                        key={fav.favouriteId}
                        className="p-4 bg-white border border-[#E5E0D8] rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#F2EFE9] shrink-0">
                            <ResilientImage
                              src={fav.photoUrl}
                              alt={fav.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1E2420] text-sm">
                              {fav.name} ({fav.petType})
                            </p>
                            <p className="text-xs text-[#57605A]">
                              {fav.breed} · {fav.shelterName} · {fav.adoptionStatus}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavourite(fav.petId)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#57605A] hover:text-[#1E2420] cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 fill-[#4A6B53] text-[#4A6B53]" />
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {section === 'enquiries' && (
                <div className="space-y-3">
                  {(accountData?.enquiries || []).length === 0 ? (
                    <p className="text-sm text-[#57605A] p-4 bg-white border border-[#E5E0D8] rounded-xl">
                      You have not submitted any shelter adoption enquiries yet.
                    </p>
                  ) : (
                    accountData?.enquiries.map((enq) => (
                      <div
                        key={enq.id}
                        className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-1.5 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#1E2420]">
                            {enq.petName} ({enq.petType}) · {enq.shelterName}
                          </p>
                          <span className="text-xs font-medium px-2.5 py-0.5 bg-[#E9F0EB] text-[#4A6B53] rounded-md">
                            {enq.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#57605A] tabular-nums">
                          Ref: {enq.referenceCode} · Housing: {enq.housingType}
                        </p>
                        <p className="text-xs text-[#57605A]">{enq.carePlan}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {section === 'profile' && (
                <form
                  onSubmit={handleSaveProfile}
                  className="p-5 bg-white border border-[#E5E0D8] rounded-xl space-y-4"
                >
                  <div>
                    <label
                      htmlFor="acct-display-name"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="acct-display-name"
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, displayName: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="acct-phone"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Singapore Contact Number
                    </label>
                    <input
                      id="acct-phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+65 9123 4567"
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="acct-housing"
                      className="block text-xs font-semibold text-[#1E2420] mb-1.5"
                    >
                      Housing Type
                    </label>
                    <select
                      id="acct-housing"
                      value={profileForm.housingType}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, housingType: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    >
                      <option value="HDB Flat">HDB Flat</option>
                      <option value="Condominium">Condominium</option>
                      <option value="Landed Home">Landed Home</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Save Account Info
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

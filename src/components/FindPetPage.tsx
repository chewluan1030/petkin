import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  HeartHandshake,
  Info,
  Search,
  SlidersHorizontal,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type {
  MatchRecommendation,
  NavTab,
  PetListing,
} from '../types/api';
import { ResilientImage } from './ResilientImage';

type FilterId = 'all' | 'dogs' | 'cats' | 'hdb' | 'senior' | 'kids';

const FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All Pets' },
  { id: 'dogs', label: 'Dogs' },
  { id: 'cats', label: 'Cats' },
  { id: 'hdb', label: 'HDB-Approved' },
  { id: 'senior', label: 'Senior-Friendly' },
  { id: 'kids', label: 'Good with Kids' },
];

const HERO_IMAGE = '/images/hero-family-dog.jpg';

interface FindPetPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAccount: () => void;
  refreshKey: number;
}

export function FindPetPage({
  onNavigate,
  onOpenAccount,
  refreshKey,
}: FindPetPageProps) {
  const { user, accountData, authFetch, refreshAccount } = useAuth();

  const [pets, setPets] = useState<PetListing[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [showMatcher, setShowMatcher] = useState(true);

  // 10-field profile for Gemini matchPet(userProfile, availablePets)
  const [matcherForm, setMatcherForm] = useState({
    housingType: 'HDB Flat' as 'HDB Flat' | 'Condominium' | 'Landed Home',
    householdSize: 3,
    childrenAtHome: true,
    seniorsAtHome: false,
    previousExperience: 'First-Time Owner' as
      | 'First-Time Owner'
      | 'Experienced Owner',
    dailyWorkingHours: '4–6 hours away',
    activityLevel: 'Moderate Walks & Play' as
      | 'Gentle Daily Care'
      | 'Moderate Walks & Play'
      | 'Active Outdoor Lifestyle',
    petSizePreference: 'Medium (HDB-Sized)' as
      | 'Any Size'
      | 'Small / Cat'
      | 'Medium (HDB-Sized)',
    preferredPetType: 'Any' as 'Any' | 'Cat' | 'Dog',
    monthlyBudgetSgd: 200,
  });

  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchResults, setMatchResults] = useState<{
    recommendations: MatchRecommendation[];
    source: string;
    disclaimer: string;
    matchedPets: PetListing[];
  } | null>(null);
  const [matchError, setMatchError] = useState('');

  const [selectedPet, setSelectedPet] = useState<PetListing | null>(null);
  const [enquirySubmittedRef, setEnquirySubmittedRef] = useState('');
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const [enquiryForm, setEnquiryForm] = useState({
    adopterName: '',
    email: '',
    phone: '',
    housingType: 'HDB Flat',
    carePlan: '',
    acknowledgeWelfare: true,
  });

  const fetchPets = useCallback(async () => {
    setLoadingPets(true);
    setPetsError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (activeFilter === 'dogs') params.set('petType', 'Dog');
      if (activeFilter === 'cats') params.set('petType', 'Cat');
      if (activeFilter === 'hdb') params.set('hdbApproved', 'true');
      if (activeFilter === 'senior') params.set('seniorFriendly', 'true');
      if (activeFilter === 'kids') params.set('goodWithKids', 'true');

      const res = await fetch(`/api/pets?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load pets.');
      setPets(data.pets || []);
    } catch (err: unknown) {
      setPetsError(
        err instanceof Error ? err.message : 'Unable to load shelter listings.'
      );
    } finally {
      setLoadingPets(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPets();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchPets, refreshKey]);

  useEffect(() => {
    if (accountData?.profile) {
      setEnquiryForm((prev) => ({
        ...prev,
        adopterName: prev.adopterName || accountData.profile?.displayName || '',
        email: prev.email || accountData.profile?.email || '',
        phone: prev.phone || accountData.profile?.phone || '',
        housingType: accountData.profile?.housingType || prev.housingType,
      }));
    }
  }, [accountData?.profile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPet) setSelectedPet(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPet]);

  const handleRunGeminiMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchingLoading(true);
    setMatchError('');
    try {
      const res = await fetch('/api/pets/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matcherForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not compute AI matches.');
      setMatchResults({
        recommendations: data.recommendations || [],
        source: data.source || 'gemini',
        disclaimer: data.disclaimer,
        matchedPets: data.availablePets || pets,
      });
    } catch (err: unknown) {
      setMatchError(
        err instanceof Error ? err.message : 'Matching service unavailable.'
      );
    } finally {
      setMatchingLoading(false);
    }
  };

  const favouritePetIds = new Set(
    (accountData?.favourites || []).map((f) => f.petId)
  );

  const handleToggleFavourite = async (petId: number) => {
    if (!user) {
      onOpenAccount();
      return;
    }
    const res = await authFetch(`/api/account/favourites/${petId}`, {
      method: 'POST',
    });
    if (res.ok) {
      await refreshAccount();
    }
  };

  const openEnquiryModal = (pet: PetListing) => {
    setSelectedPet(pet);
    setEnquirySubmittedRef('');
    setEnquiryError('');
    setEnquiryForm((prev) => ({
      ...prev,
      housingType: matcherForm.housingType,
      carePlan: '',
    }));
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;
    if (!enquiryForm.adopterName.trim()) {
      setEnquiryError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiryForm.email.trim())) {
      setEnquiryError('Please enter a valid email address.');
      return;
    }
    if (!enquiryForm.carePlan.trim()) {
      setEnquiryError('Please describe your daily care routine.');
      return;
    }
    if (!enquiryForm.acknowledgeWelfare) {
      setEnquiryError('Please acknowledge shelter approval requirements.');
      return;
    }

    setEnquirySubmitting(true);
    setEnquiryError('');
    try {
      const res = await authFetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: selectedPet.id,
          adopterName: enquiryForm.adopterName,
          adopterEmail: enquiryForm.email,
          adopterPhone: enquiryForm.phone,
          housingType: enquiryForm.housingType,
          carePlan: enquiryForm.carePlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit enquiry.');
      setEnquirySubmittedRef(data.enquiry.referenceCode);
      if (user) await refreshAccount();
    } catch (err: unknown) {
      setEnquiryError(
        err instanceof Error ? err.message : 'Unable to submit enquiry.'
      );
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const scrollToExplore = () => {
    document
      .getElementById('explore-pets-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:pt-12 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-[#4A6B53] mb-3">
              Free Welfare-First Adoption Matching · Singapore
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[50px] font-semibold leading-[1.12] tracking-tight text-[#1E2420] [text-wrap:balance]">
              The right match is just the beginning
            </h1>
            <p className="mt-5 text-base sm:text-[17px] leading-relaxed text-[#57605A] max-w-xl">
              PetKin pairs prospective dog and cat adopters with verified Singapore shelter rescues based on home environment, daily schedule, and long-term care readiness—never appearance alone.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={scrollToExplore}
                className="px-6 py-3 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Explore Matches
              </button>
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="px-5 py-3 bg-white hover:bg-[#F2EFE9] text-[#1E2420] border border-[#E5E0D8] text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                View Hotels &amp; Grooming
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E0D8] grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-[#1E2420] tabular-nums">100% Free</p>
                <p className="text-xs text-[#57605A] mt-0.5">Shelter matching</p>
              </div>
              <div>
                <p className="font-semibold text-[#1E2420]">HDB-Aware</p>
                <p className="text-xs text-[#57605A] mt-0.5">Project ADORE &amp; cats</p>
              </div>
              <div>
                <p className="font-semibold text-[#1E2420]">AI-Assisted</p>
                <p className="text-xs text-[#57605A] mt-0.5">Welfare-first guidance</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="h-full min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-[#E5E0D8] bg-[#F2EFE9]">
              <ResilientImage
                src={HERO_IMAGE}
                alt="Mother, father, and son smiling together with their pet dog on a sofa inside their sunlit Singapore HDB apartment"
                className="w-full h-full object-cover object-center"
                fallbackTitle="Singapore HDB Family & Adopted Dog"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section
        id="explore-pets-section"
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1E2420] [text-wrap:balance]">
              Explore Cats &amp; Dogs Across Verified Shelters
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#57605A] max-w-2xl">
              Live listings of pets currently available for adoption. Use our AI lifestyle matcher for tailored welfare guidance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={onOpenAccount}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#1E2420] bg-white border border-[#E5E0D8] hover:bg-[#F2EFE9] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#4A6B53]" aria-hidden="true" />
              <span>{user ? 'My Account' : 'Sign In / Saved Pets'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMatcher((prev) => !prev)}
              aria-expanded={showMatcher}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#1E2420] bg-white border border-[#E5E0D8] hover:bg-[#F2EFE9] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#4A6B53]" aria-hidden="true" />
              <span>{showMatcher ? 'Hide AI Matcher' : 'Open AI Matcher'}</span>
            </button>
          </div>
        </div>

        {/* Gemini AI Lifestyle & Welfare Compatibility Matcher */}
        {showMatcher && (
          <form
            onSubmit={handleRunGeminiMatch}
            aria-label="Gemini AI Lifestyle and Welfare Compatibility Matcher"
            className="mt-6 p-5 sm:p-6 bg-[#F2EFE9]/75 border border-[#E5E0D8] rounded-xl space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#4A6B53] shrink-0" aria-hidden="true" />
                <h3 className="font-sans text-sm font-semibold text-[#1E2420]">
                  Personalised Pet Matching Assistant
                </h3>
              </div>
              <p className="text-xs text-[#57605A]">
                Recommends top 3 available companions based on lifestyle, HDB suitability, and budget
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div>
                <label htmlFor="m-housing" className="block text-xs font-medium text-[#57605A] mb-1">
                  Housing Type
                </label>
                <select
                  id="m-housing"
                  value={matcherForm.housingType}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      housingType: e.target.value as 'HDB Flat' | 'Condominium' | 'Landed Home',
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="HDB Flat">HDB Flat</option>
                  <option value="Condominium">Condominium</option>
                  <option value="Landed Home">Landed Home</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-size" className="block text-xs font-medium text-[#57605A] mb-1">
                  Household Size
                </label>
                <input
                  id="m-size"
                  type="number"
                  min={1}
                  max={12}
                  value={matcherForm.householdSize}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      householdSize: Number(e.target.value || 1),
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="m-children" className="block text-xs font-medium text-[#57605A] mb-1">
                  Children at Home
                </label>
                <select
                  id="m-children"
                  value={matcherForm.childrenAtHome ? 'yes' : 'no'}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      childrenAtHome: e.target.value === 'yes',
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-seniors" className="block text-xs font-medium text-[#57605A] mb-1">
                  Seniors at Home
                </label>
                <select
                  id="m-seniors"
                  value={matcherForm.seniorsAtHome ? 'yes' : 'no'}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      seniorsAtHome: e.target.value === 'yes',
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-exp" className="block text-xs font-medium text-[#57605A] mb-1">
                  Pet Experience
                </label>
                <select
                  id="m-exp"
                  value={matcherForm.previousExperience}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      previousExperience: e.target.value as
                        | 'First-Time Owner'
                        | 'Experienced Owner',
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="First-Time Owner">First-Time Owner</option>
                  <option value="Experienced Owner">Experienced Owner</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-hours" className="block text-xs font-medium text-[#57605A] mb-1">
                  Daily Working Hours Away
                </label>
                <select
                  id="m-hours"
                  value={matcherForm.dailyWorkingHours}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      dailyWorkingHours: e.target.value,
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="Under 4 hours away (WFH)">Under 4 hours away</option>
                  <option value="4–6 hours away">4–6 hours away</option>
                  <option value="6–8 hours away">6–8 hours away</option>
                  <option value="Over 8 hours away">Over 8 hours away</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-activity" className="block text-xs font-medium text-[#57605A] mb-1">
                  Activity Level
                </label>
                <select
                  id="m-activity"
                  value={matcherForm.activityLevel}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      activityLevel: e.target.value as
                        | 'Gentle Daily Care'
                        | 'Moderate Walks & Play'
                        | 'Active Outdoor Lifestyle',
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="Gentle Daily Care">Gentle Daily Care</option>
                  <option value="Moderate Walks & Play">Moderate Walks &amp; Play</option>
                  <option value="Active Outdoor Lifestyle">Active Outdoor Lifestyle</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-pet-size" className="block text-xs font-medium text-[#57605A] mb-1">
                  Pet Size Preference
                </label>
                <select
                  id="m-pet-size"
                  value={matcherForm.petSizePreference}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      petSizePreference: e.target.value as
                        | 'Any Size'
                        | 'Small / Cat'
                        | 'Medium (HDB-Sized)',
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="Any Size">Any Size</option>
                  <option value="Small / Cat">Small / Cat</option>
                  <option value="Medium (HDB-Sized)">Medium (HDB-Sized)</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-pet-type" className="block text-xs font-medium text-[#57605A] mb-1">
                  Preferred Pet Type
                </label>
                <select
                  id="m-pet-type"
                  value={matcherForm.preferredPetType}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      preferredPetType: e.target.value as 'Any' | 'Cat' | 'Dog',
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                >
                  <option value="Any">Either Cat or Dog</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>

              <div>
                <label htmlFor="m-budget" className="block text-xs font-medium text-[#57605A] mb-1">
                  Monthly Care Budget (S$)
                </label>
                <input
                  id="m-budget"
                  type="number"
                  min={50}
                  max={2000}
                  step={10}
                  value={matcherForm.monthlyBudgetSgd}
                  onChange={(e) =>
                    setMatcherForm((p) => ({
                      ...p,
                      monthlyBudgetSgd: Number(e.target.value || 100),
                    }))
                  }
                  className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-[#57605A]">
                AI scores are guidance only, not guaranteed compatibility. Eligibility, HDB rules and adoption approval must be confirmed by the shelter and relevant authorities.
              </p>
              <button
                type="submit"
                disabled={matchingLoading}
                className="px-5 py-2.5 bg-[#4A6B53] hover:bg-[#3B5743] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {matchingLoading ? 'Analysing Compatibility...' : 'Find Top 3 Matches'}
              </button>
            </div>

            {matchError && (
              <p role="alert" className="text-xs font-medium text-[#9F2B2B]">
                {matchError}
              </p>
            )}

            {/* Top 3 AI Recommendations */}
            {matchResults && matchResults.recommendations.length > 0 && (
              <div className="pt-4 border-t border-[#E5E0D8] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-lg font-semibold text-[#1E2420]">
                    Top 3 Recommended Companions for Your Household
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMatchResults(null)}
                    className="text-xs text-[#57605A] hover:text-[#1E2420] cursor-pointer"
                  >
                    Clear Results
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {matchResults.recommendations.map((rec, idx) => {
                    const petObj =
                      matchResults.matchedPets.find((p) => p.id === rec.petId) ||
                      pets.find((p) => p.id === rec.petId);
                    if (!petObj) return null;
                    return (
                      <div
                        key={rec.petId}
                        className="p-4 bg-white border border-[#C8D8CC] rounded-xl flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-display text-lg font-semibold text-[#1E2420]">
                              0{idx + 1}. {petObj.name}
                            </p>
                            <span className="text-sm font-semibold text-[#4A6B53] tabular-nums">
                              {rec.matchScore}/100 Fit
                            </span>
                          </div>
                          <p className="text-xs text-[#57605A]">
                            {petObj.petType} · {petObj.breed} · {petObj.shelterName}
                          </p>
                          <p className="mt-2.5 text-xs text-[#1E2420] leading-relaxed">
                            <strong className="font-semibold">Why it fits:</strong>{' '}
                            {rec.matchExplanation}
                          </p>
                          <p className="mt-1.5 text-xs text-[#57605A] leading-relaxed">
                            <strong className="text-[#1E2420]">Care notes:</strong>{' '}
                            {rec.careConsiderations}
                          </p>
                          <p className="mt-1.5 text-xs text-[#57605A] leading-relaxed">
                            <strong className="text-[#1E2420]">Considerations:</strong>{' '}
                            {rec.compatibilityConcerns}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEnquiryModal(petObj)}
                          className="w-full py-2 px-3 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Enquire
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#57605A]">
                  {matchResults.disclaimer}
                </p>
              </div>
            )}
          </form>
        )}

        {/* Search & Filter Controls */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="w-4 h-4 text-[#57605A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, breed, shelter..."
              aria-label="Search pets by name, breed, or shelter"
              className="w-full h-11 pl-10 pr-9 bg-white border border-[#E5E0D8] rounded-lg text-sm text-[#1E2420] placeholder:text-[#57605A]/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#57605A] hover:text-[#1E2420] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter companion profiles"
            className="flex flex-wrap items-center gap-2"
          >
            {FILTER_OPTIONS.map((opt) => {
              const isSelected = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActiveFilter(opt.id)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#4A6B53] text-white border-[#4A6B53]'
                      : 'bg-white text-[#57605A] border-[#E5E0D8] hover:text-[#1E2420] hover:bg-[#F2EFE9]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#57605A]">
          <p className="tabular-nums">
            {loadingPets
              ? 'Loading available shelter listings...'
              : `Showing ${pets.length} available ${pets.length === 1 ? 'pet' : 'pets'}`}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#4A6B53]" aria-hidden="true" />
            <span>Adoption subject to shelter screening &amp; HDB rules</span>
          </p>
        </div>

        {petsError && (
          <div className="mt-6 p-4 bg-white border border-[#E5E0D8] rounded-xl text-sm text-[#9F2B2B]">
            {petsError}
          </div>
        )}

        {/* Responsive 3-Column Pet Cards Grid */}
        {!loadingPets && pets.length === 0 ? (
          <div className="mt-8 p-10 bg-white border border-[#E5E0D8] rounded-xl text-center">
            <p className="font-display text-lg font-medium text-[#1E2420]">
              No pets match your current filters
            </p>
            <p className="mt-1.5 text-sm text-[#57605A]">
              Try clearing your search term or choosing “All Pets” to see every available dog and cat across our partner shelters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-5 px-4 py-2 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {pets.map((pet) => {
              const isFav = favouritePetIds.has(pet.id);
              return (
                <article
                  key={pet.id}
                  className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] bg-[#F2EFE9] overflow-hidden border-b border-[#E5E0D8]">
                    <ResilientImage
                      src={pet.photoUrl}
                      alt={`${pet.name}, ${pet.breed}`}
                      className="w-full h-full object-cover object-center"
                      fallbackTitle={`${pet.name} (${pet.petType})`}
                    />
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl font-semibold text-[#1E2420]">
                          {pet.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-[#57605A] tabular-nums">
                          {pet.petType} <span aria-hidden="true">·</span> {pet.gender}{' '}
                          <span aria-hidden="true">·</span> {pet.age}{' '}
                          <span aria-hidden="true">·</span> {pet.weight}{' '}
                          <span aria-hidden="true">·</span>{' '}
                          {pet.hdbSuitable ? 'HDB-Approved' : 'Private Housing'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFavourite(pet.id)}
                        aria-label={isFav ? `Remove ${pet.name} from favourites` : `Save ${pet.name} to favourites`}
                        className="p-2 rounded-lg border border-[#E5E0D8] hover:bg-[#F2EFE9] transition-colors shrink-0 cursor-pointer"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav
                              ? 'fill-[#4A6B53] text-[#4A6B53]'
                              : 'text-[#57605A]'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E5E0D8] space-y-2.5 text-sm">
                      <p className="text-[#1E2420]">
                        <span className="font-semibold">Breed:</span>{' '}
                        <span className="text-[#57605A]">{pet.breed}</span>
                      </p>
                      <p className="text-[#57605A] leading-relaxed">{pet.personality}</p>
                      <p className="text-[#1E2420] leading-relaxed">
                        <span className="font-semibold">Care note:</span>{' '}
                        <span className="text-[#57605A]">{pet.specialCare}</span>
                      </p>
                      <p className="text-[#1E2420]">
                        <span className="font-semibold">Shelter:</span>{' '}
                        <span className="text-[#57605A]">{pet.shelterName}</span>
                      </p>
                      <p className="text-xs text-[#57605A] tabular-nums">
                        Est. monthly care: S${pet.monthlyCareCostSgd}/mo · Status:{' '}
                        <span className="font-medium text-[#4A6B53]">
                          {pet.adoptionStatus}
                        </span>
                      </p>
                    </div>

                    <div className="mt-auto pt-5">
                      <button
                        type="button"
                        onClick={() => openEnquiryModal(pet)}
                        className="w-full py-2.5 px-4 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Continuing Journey Strip */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="p-6 sm:p-8 bg-[#F2EFE9] border border-[#E5E0D8] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#4A6B53] mb-1.5">
              Ongoing Care After Adoption
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#1E2420]">
              From your first match to lifelong grooming and stays
            </h2>
            <p className="mt-2 text-sm text-[#57605A] leading-relaxed">
              Every PetKin match connects smoothly into verified Singapore pet hotels and calm grooming studios tailored to your pet’s temperament.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="px-5 py-2.5 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Explore Services
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pricings')}
              className="px-5 py-2.5 bg-white hover:bg-[#FAF9F6] text-[#1E2420] border border-[#E5E0D8] text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Compare Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Adoption Enquiry Modal */}
      {selectedPet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2420]/50 backdrop-blur-[2px]"
          onClick={() => setSelectedPet(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-7 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
              <div>
                <p className="text-xs font-semibold text-[#4A6B53]">
                  Shelter Adoption Enquiry
                </p>
                <h3
                  id="enquiry-modal-title"
                  className="font-display text-2xl font-semibold text-[#1E2420] mt-1"
                >
                  Enquire about {selectedPet.name}
                </h3>
                <p className="text-xs text-[#57605A] mt-0.5">
                  {selectedPet.breed} · {selectedPet.shelterName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPet(null)}
                aria-label="Close enquiry dialog"
                className="p-2 text-[#57605A] hover:text-[#1E2420] rounded-lg hover:bg-[#F2EFE9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySubmittedRef ? (
              <div className="pt-5 space-y-4">
                <div className="p-4 bg-[#E9F0EB] border border-[#C8D8CC] rounded-xl flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-[#4A6B53] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#1E2420]">
                      Enquiry Saved ({enquirySubmittedRef})
                    </p>
                    <p className="text-xs text-[#57605A] mt-1 leading-relaxed">
                      Your enquiry for {selectedPet.name} has been saved. Final adoption eligibility, HDB rules, and home checks are confirmed directly by {selectedPet.shelterName}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPet(null);
                      onOpenAccount();
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-[#1E2420] bg-[#F2EFE9] hover:bg-[#E5E0D8] rounded-lg transition-colors cursor-pointer"
                  >
                    View in My Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPet(null)}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4A6B53] hover:bg-[#3B5743] rounded-lg transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="pt-5 space-y-4">
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E0D8] rounded-lg text-xs text-[#57605A] leading-relaxed">
                  <span className="font-semibold text-[#1E2420]">Welfare note: </span>
                  {selectedPet.welfareNotes}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="enquiry-name" className="block text-xs font-semibold text-[#1E2420] mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="enquiry-name"
                      type="text"
                      value={enquiryForm.adopterName}
                      onChange={(e) =>
                        setEnquiryForm((p) => ({ ...p, adopterName: e.target.value }))
                      }
                      placeholder="e.g. Wei Ming Tan"
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="enquiry-email" className="block text-xs font-semibold text-[#1E2420] mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="enquiry-email"
                      type="email"
                      value={enquiryForm.email}
                      onChange={(e) =>
                        setEnquiryForm((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="name@example.sg"
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="enquiry-housing" className="block text-xs font-semibold text-[#1E2420] mb-1.5">
                      Singapore Residence Type
                    </label>
                    <select
                      id="enquiry-housing"
                      value={enquiryForm.housingType}
                      onChange={(e) =>
                        setEnquiryForm((p) => ({ ...p, housingType: e.target.value }))
                      }
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    >
                      <option value="HDB Flat">HDB Flat</option>
                      <option value="Condominium">Condominium</option>
                      <option value="Landed Home">Landed Home</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="enquiry-phone" className="block text-xs font-semibold text-[#1E2420] mb-1.5">
                      Contact Number
                    </label>
                    <input
                      id="enquiry-phone"
                      type="tel"
                      value={enquiryForm.phone}
                      onChange={(e) =>
                        setEnquiryForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+65 9123 4567"
                      className="w-full h-10 px-3 bg-white border border-[#E5E0D8] rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="enquiry-care" className="block text-xs font-semibold text-[#1E2420] mb-1.5">
                    Daily Care &amp; Schedule Readiness
                  </label>
                  <textarea
                    id="enquiry-care"
                    rows={3}
                    value={enquiryForm.carePlan}
                    onChange={(e) =>
                      setEnquiryForm((p) => ({ ...p, carePlan: e.target.value }))
                    }
                    placeholder="Briefly describe who shares care duties, daily exercise or play routines, and how long the pet will be alone..."
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-sm leading-relaxed"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs text-[#57605A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enquiryForm.acknowledgeWelfare}
                    onChange={(e) =>
                      setEnquiryForm((p) => ({
                        ...p,
                        acknowledgeWelfare: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-[#4A6B53]"
                  />
                  <span>
                    I understand adoption approval and HDB eligibility are subject to partner shelter verification.
                  </span>
                </label>

                {enquiryError && (
                  <p role="alert" className="text-xs font-medium text-[#9F2B2B]">
                    {enquiryError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPet(null)}
                    className="px-4 py-2.5 text-sm font-medium text-[#57605A] hover:text-[#1E2420] rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    className="px-5 py-2.5 bg-[#4A6B53] hover:bg-[#3B5743] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {enquirySubmitting ? 'Submitting...' : 'Submit Adoption Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

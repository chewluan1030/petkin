import { useCallback, useEffect, useState } from 'react';
import { Check, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type {
  MembershipPlanItem,
  NavTab,
  ServicePricingItem,
} from '../types/api';

interface PricingPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAccount: () => void;
  refreshKey: number;
}

export function PricingPage({
  onNavigate,
  onOpenAccount,
  refreshKey,
}: PricingPageProps) {
  const { user, accountData, authFetch, refreshAccount } = useAuth();

  const [serviceCategories, setServiceCategories] = useState<
    ServicePricingItem[]
  >([]);
  const [plans, setPlans] = useState<MembershipPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string>('paw-plus');
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSavedMsg, setPlanSavedMsg] = useState('');

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pricing');
      const data = await res.json();
      if (res.ok) {
        setServiceCategories(data.serviceCategories || []);
        setPlans(data.membershipPlans || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing, refreshKey]);

  useEffect(() => {
    if (accountData?.profile?.membershipTierSlug) {
      setSelectedSlug(accountData.profile.membershipTierSlug);
    }
  }, [accountData?.profile?.membershipTierSlug]);

  const activePlan =
    plans.find((p) => p.slug === selectedSlug) || plans[1] || plans[0] || null;

  const handleChoosePlan = async (plan: MembershipPlanItem) => {
    setSelectedSlug(plan.slug);
    setPlanSavedMsg('');
    if (user) {
      setSavingPlan(true);
      try {
        const res = await authFetch('/api/account/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ membershipTierSlug: plan.slug }),
        });
        if (res.ok) {
          await refreshAccount();
          setPlanSavedMsg(
            `${plan.name} saved to your PetKin account. Eligible discounts now apply on Services.`
          );
        }
      } finally {
        setSavingPlan(false);
      }
    } else {
      setPlanSavedMsg(
        `Previewing ${plan.name}. Sign in to link this plan to your PetKin account.`
      );
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      {/* Header */}
      <section className="max-w-3xl pb-10">
        <p className="text-xs font-semibold tracking-wide text-[#4A6B53] mb-2.5">
          PetKin Services &amp; Memberships · Singapore Dollars (SGD)
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#1E2420] [text-wrap:balance]">
          Transparent service rates &amp; membership plans
        </h1>
        <p className="mt-4 text-base sm:text-[17px] leading-relaxed text-[#57605A]">
          Adoption matching on PetKin is free. Compare live starting rates for Pet Hotel stays and Grooming sessions alongside our proposed monthly membership tiers.
        </p>
      </section>

      {/* Live Service Categories Pricing */}
      <section aria-labelledby="service-rates-heading" className="pb-14">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2
              id="service-rates-heading"
              className="font-display text-2xl sm:text-3xl font-semibold text-[#1E2420]"
            >
              Service Category Rates
            </h2>
            <p className="mt-1 text-sm text-[#57605A]">
              Live pricing synced directly from the PetKin database.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="self-start sm:self-auto px-4 py-2 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-xs sm:text-sm font-semibold rounded-lg cursor-pointer"
          >
            Book a Service
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[#57605A]">Loading live pricing...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {serviceCategories.map((item) => (
              <article
                key={item.id}
                className="p-5 bg-white border border-[#E5E0D8] rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#E5E0D8]">
                    <h3 className="font-display text-lg font-semibold text-[#1E2420]">
                      {item.categoryName}
                    </h3>
                    <span className="text-sm font-semibold text-[#4A6B53] tabular-nums whitespace-nowrap shrink-0">
                      {item.priceDisplay}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs font-medium text-[#57605A]">
                    {item.durationOrUnit} · Starting S${item.startingPriceSgd.toFixed(2)}
                  </p>
                  <p className="mt-2 text-sm text-[#57605A] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Three Membership Cards Side by Side */}
      <section aria-labelledby="membership-plans-heading" className="py-12 border-t border-[#E5E0D8]">
        <div className="mb-8">
          <h2
            id="membership-plans-heading"
            className="font-display text-2xl sm:text-3xl font-semibold text-[#1E2420]"
          >
            Monthly Membership Plans
          </h2>
          <p className="mt-1.5 text-sm text-[#57605A]">
            Membership pricing and benefits are proposed business-plan examples until confirmed by Found U.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
          {plans.map((plan) => {
            const isSelected = activePlan?.slug === plan.slug;
            return (
              <article
                key={plan.id}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-colors ${
                  plan.badgeLabel
                    ? 'bg-white border-2 border-[#4A6B53]'
                    : 'bg-white border border-[#E5E0D8]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-semibold text-[#1E2420]">
                      {plan.name}
                    </h3>
                    {plan.badgeLabel && (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-[#4A6B53] bg-[#E9F0EB] border border-[#C8D8CC] rounded-md whitespace-nowrap shrink-0">
                        {plan.badgeLabel}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-[#57605A] leading-relaxed">
                    {plan.tagline}
                  </p>

                  <div className="mt-6 pb-6 border-b border-[#E5E0D8] flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-display text-4xl font-semibold text-[#1E2420]">
                      S${plan.monthlyPriceSgd.toFixed(plan.monthlyPriceSgd % 1 === 0 ? 0 : 2)}
                    </span>
                    <span className="text-sm text-[#57605A]">/month</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check
                          className="w-4 h-4 text-[#4A6B53] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span className="text-[#1E2420]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    disabled={savingPlan}
                    onClick={() => handleChoosePlan(plan)}
                    aria-pressed={isSelected}
                    className={`w-full py-3 px-4 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                      isSelected || plan.badgeLabel
                        ? 'bg-[#4A6B53] hover:bg-[#3B5743] text-white'
                        : 'bg-[#F2EFE9] hover:bg-[#E5E0D8] text-[#1E2420]'
                    }`}
                  >
                    {isSelected ? `Selected: ${plan.name}` : 'Choose Plan'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Selection Summary */}
        {activePlan && (
          <div className="mt-8 p-6 bg-[#F2EFE9] border border-[#E5E0D8] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-[#4A6B53]">
                Selected Membership Summary
              </p>
              <h3 className="font-display text-2xl font-semibold text-[#1E2420] mt-1 tabular-nums">
                {activePlan.name} — S$
                {activePlan.monthlyPriceSgd.toFixed(
                  activePlan.monthlyPriceSgd % 1 === 0 ? 0 : 2
                )}
                /month
              </h3>
              <p className="text-sm text-[#57605A] mt-1">
                {activePlan.discountPct > 0
                  ? `Includes ${activePlan.discountPct}% eligible booking discount on PetKin grooming and pet hotel bookings.`
                  : 'Standard access to free adoption matching and PetKin grooming & boarding bookings.'}
              </p>
              {planSavedMsg && (
                <p className="mt-2 text-xs font-medium text-[#4A6B53] inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>{planSavedMsg}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!user && (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="px-4 py-2.5 bg-white hover:bg-[#FAF9F6] text-[#1E2420] border border-[#E5E0D8] text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Sign In to Save Plan
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="px-5 py-2.5 bg-[#4A6B53] hover:bg-[#3B5743] text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                Book Services
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Comparison & Business-Plan Note */}
      <section className="py-10 border-t border-[#E5E0D8]">
        <div className="p-6 bg-white border border-[#E5E0D8] rounded-xl flex items-start gap-3 text-sm text-[#57605A] leading-relaxed">
          <Info className="w-5 h-5 text-[#4A6B53] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[#1E2420]">
              Membership Governance &amp; Pricing Note
            </p>
            <p className="mt-1">
              Membership pricing and benefits are proposed business-plan examples until confirmed by Found U. All live service prices and plan changes saved by authorised administrators in the database update automatically on this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

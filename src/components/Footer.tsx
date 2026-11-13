import type { NavTab } from '../types/api';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
}

export function Footer({
  onSelectTab,
  onOpenAccount,
  onOpenAdmin,
}: FooterProps) {
  return (
    <footer className="border-t border-[#E5E0D8] bg-[#F2EFE9]/60 mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#E5E0D8]">
          <div>
            <p className="font-display text-lg font-semibold text-[#1E2420]">PetKin</p>
            <p className="text-sm text-[#57605A] mt-1">
              The Right Match Is Just the Beginning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-[#57605A]">
            <button
              type="button"
              onClick={() => onSelectTab('find-a-pet')}
              className="hover:text-[#1E2420] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Find A Pet
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('services')}
              className="hover:text-[#1E2420] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('pricings')}
              className="hover:text-[#1E2420] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Pricings
            </button>
            <span aria-hidden="true" className="text-[#E5E0D8]">|</span>
            <button
              type="button"
              onClick={onOpenAccount}
              className="hover:text-[#1E2420] font-medium text-[#4A6B53] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Customer Account
            </button>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hover:text-[#1E2420] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Admin Console
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed text-[#57605A]">
          <p>
            © 2026 PetKin. Adoption is subject to shelter approval. Pet services are subject to provider availability. Terms &amp; Conditions apply.
          </p>
          <p className="whitespace-nowrap shrink-0">
            Singapore (SGD)
          </p>
        </div>
      </div>
    </footer>
  );
}

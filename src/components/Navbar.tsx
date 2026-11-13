import type { NavTab } from '../types/api';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'find-a-pet', label: 'Find A Pet' },
  { id: 'services', label: 'Services' },
  { id: 'pricings', label: 'Pricings' },
];

export function Navbar({ activeTab, onSelectTab }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E5E0D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('find-a-pet')}
          className="inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group cursor-pointer"
          aria-label="PetKin — Go to Find A Pet"
        >
          <span
            className="w-8 h-8 rounded-lg bg-[#4A6B53] text-white flex items-center justify-center transition-colors group-hover:bg-[#3B5743]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M4 11.5L12 4.5L20 11.5" />
              <path d="M6.5 10.5V19.5H17.5V10.5" />
              <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-[#1E2420]">
            PetKin
          </span>
        </button>

        <nav aria-label="Primary Navigation" className="flex items-center gap-5 sm:gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm sm:text-[15px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#1E2420]'
                    : 'text-[#57605A] hover:text-[#1E2420]'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#4A6B53] transition-opacity duration-150 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

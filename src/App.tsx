import { useState } from 'react';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { CustomerAccountDrawer } from './components/CustomerAccountDrawer';
import { FindPetPage } from './components/FindPetPage';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PricingPage } from './components/PricingPage';
import { ServicesPage } from './components/ServicesPage';
import { AuthProvider } from './context/AuthContext';
import type { NavTab } from './types/api';

function PetKinShell() {
  const [activeTab, setActiveTab] = useState<NavTab>('find-a-pet');
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1E2420]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#4A6B53] focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      <Navbar activeTab={activeTab} onSelectTab={handleSelectTab} />

      <main id="main-content" className="flex-1">
        {activeTab === 'find-a-pet' && (
          <FindPetPage
            onNavigate={handleSelectTab}
            onOpenAccount={() => setAccountOpen(true)}
            refreshKey={refreshKey}
          />
        )}
        {activeTab === 'services' && (
          <ServicesPage
            onNavigate={handleSelectTab}
            onOpenAccount={() => setAccountOpen(true)}
            refreshKey={refreshKey}
          />
        )}
        {activeTab === 'pricings' && (
          <PricingPage
            onNavigate={handleSelectTab}
            onOpenAccount={() => setAccountOpen(true)}
            refreshKey={refreshKey}
          />
        )}
      </main>

      <Footer
        onSelectTab={handleSelectTab}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <CustomerAccountDrawer
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
      />

      <AdminDashboardModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onDataChanged={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PetKinShell />
    </AuthProvider>
  );
}

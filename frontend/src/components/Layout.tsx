import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('has-sidebar');
    return () => {
      document.documentElement.classList.remove('has-sidebar');
    };
  }, []);
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text-primary)]">
      {/* Mobile / tablet app shell */}
      <MobileHeader onToggleMenu={toggleMobileMenu} />
      <MobileTabBar />
      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-200 ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMobileMenu}
        />
        <div
          className={`absolute inset-y-0 left-0 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <Sidebar variant="mobile" onNavigate={closeMobileMenu} />
        </div>
      </div>
      {/* Desktop / laptop: persistent sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {/* Main content area: full-width on mobile/tablet, offset handled globally on desktop via has-sidebar */}
      <main className="min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}

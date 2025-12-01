import { IonIcon } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gridOutline, cashOutline, peopleOutline, briefcaseOutline, documentTextOutline, personCircleOutline } from 'ionicons/icons';

const items = [
  { to: '/', label: 'Dashboard', icon: gridOutline },
  { to: '/finance', label: 'Finance', icon: cashOutline },
  { to: '/hr', label: 'HR', icon: peopleOutline },
  { to: '/projects', label: 'Projects', icon: briefcaseOutline },
  { to: '/documents-main', label: 'Documents', icon: documentTextOutline },
  { to: '/profile', label: 'Profile', icon: personCircleOutline },
];

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t zynq-border bg-[color:var(--surface)] lg:hidden">
      <div className="flex justify-between">
        {items.map((item) => {
          const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 text-[10px] leading-tight gap-0.5 ${
                active ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-secondary)]'
              }`}
            >
              <IonIcon icon={item.icon} className="text-lg" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

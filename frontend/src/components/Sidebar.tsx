import { NavLink } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { gridOutline, cashOutline, peopleOutline, briefcaseOutline, documentTextOutline, settingsOutline, barChartOutline } from 'ionicons/icons';
import { useAuth } from '../auth/AuthContext';

const allItems = [
  { to: '/', label: 'Dashboard', icon: gridOutline, key: 'dashboard' },
  { to: '/finance', label: 'Finance', icon: cashOutline, key: 'finance' },
  { to: '/hr', label: 'HR', icon: peopleOutline, key: 'hr' },
  { to: '/projects', label: 'Projects', icon: briefcaseOutline, key: 'projects' },
  { to: '/documents-main', label: 'Documents', icon: documentTextOutline, key: 'documents' },
  { to: '/admin', label: 'Admin', icon: settingsOutline, key: 'admin' },
  { to: '/analytics', label: 'Analytics', icon: barChartOutline, key: 'analytics' },
];

type SidebarProps = {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

export default function Sidebar({ variant = 'desktop', onNavigate }: SidebarProps) {
  const { role } = useAuth();
  const upperRole = (role || '').trim().toUpperCase();
  const items = allItems
    .filter((it) => {
      switch (upperRole) {
        case 'ADMIN':
        case 'SUPERADMIN':
        case 'GM':
        case 'MANAGER':
        case 'TEAM LEADER':
        case 'OFFICE_DESK':
        case 'RECORDER':
          // Full app navigation except items further filtered out (Admin/Analytics)
          return true;
        case 'HR_MANAGER':
          return ['dashboard', 'hr'].includes(it.key);
        case 'FINANCE_MANAGER':
          return ['dashboard', 'finance'].includes(it.key);
        case 'PROJECT_MANAGER':
          return ['dashboard', 'projects'].includes(it.key);
        case 'ACCOUNTANT':
          // Accountant can see Dashboard, Finance, HR, Projects, and Documents
          return ['dashboard', 'finance', 'hr', 'projects', 'documents'].includes(it.key);
        default:
          // unauthenticated or unknown: keep minimal
          return it.key === 'dashboard';
      }
    })
    .filter((it) => {
      // Only ADMIN and SUPERADMIN see Analytics; Admin visible to ADMIN, SUPERADMIN, and GM
      if (it.key === 'analytics') return upperRole === 'ADMIN' || upperRole === 'SUPERADMIN';
      if (it.key === 'admin') return upperRole === 'ADMIN' || upperRole === 'SUPERADMIN' || upperRole === 'GM';
      return true;
    });

  const containerClasses =
    variant === 'desktop'
      ? 'fixed inset-y-0 left-0 w-60 bg-[color:var(--header)] border-r zynq-border p-4 flex flex-col z-40 sm:z-50 shadow-[4px_0_12px_rgba(0,0,0,0.06)] max-h-screen'
      : 'flex flex-col h-full w-72 max-w-[85vw] bg-[color:var(--surface)] border-r zynq-border shadow-soft';

  const itemPadding = variant === 'desktop' ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base';

  return (
    <aside className={containerClasses}>
      <div className="px-2 py-3 text-lg font-semibold tracking-tight">Zynq</div>
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl transition-colors ${itemPadding} ${
                isActive
                  ? 'bg-[color:var(--surface)] text-[color:var(--text-primary)] border zynq-border'
                  : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)]'
              }`
            }
          >
            <IonIcon icon={it.icon} className="text-lg" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

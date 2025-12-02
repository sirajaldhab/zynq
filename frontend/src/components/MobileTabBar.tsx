import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardIcon, FinanceIcon, HrIcon, ProjectsIcon, DocumentsIcon, ProfileIcon } from '../icons/AppIcons';

const items = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/finance', label: 'Finance', icon: FinanceIcon },
  { to: '/hr', label: 'HR', icon: HrIcon },
  { to: '/projects', label: 'Projects', icon: ProjectsIcon },
  { to: '/documents-main', label: 'Documents', icon: DocumentsIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
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
              <item.icon className="text-lg" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

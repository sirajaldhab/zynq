import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import InstallPwaButton from './InstallPwaButton';

type MobileHeaderProps = {
  onToggleMenu?: () => void;
};

export default function MobileHeader({ onToggleMenu }: MobileHeaderProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => {
    logout();
    window.location.href = '/auth/login';
  };

  return (
    <IonHeader className="lg:hidden fixed inset-x-0 top-0 z-50">
      <IonToolbar className="border-b zynq-border shadow-soft bg-[color:var(--header)] text-[color:var(--text-primary)] flex items-center justify-between">
        <IonTitle>
          <button
            type="button"
            className="text-base font-semibold tracking-tight"
            onClick={() => navigate('/')}
          >
            Zynq
          </button>
        </IonTitle>
        <IonButtons slot="end">
          <InstallPwaButton />
          <ThemeToggle />
          <IonButton onClick={onLogout}>Logout</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}

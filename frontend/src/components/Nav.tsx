import { IonHeader, IonToolbar, IonButtons, IonTitle, IonButton } from '@ionic/react';
import ThemeToggle from './ThemeToggle';
import InstallPwaButton from './InstallPwaButton';
import { useAuth } from '../auth/AuthContext';

export default function Nav() {
  const { logout } = useAuth();
  const onLogout = () => {
    logout();
    window.location.href = '/auth/login';
  };
  return (
    <IonHeader className="hidden lg:block">
      <IonToolbar className="border-b zynq-border shadow-soft bg-[color:var(--header)] text-[color:var(--text-primary)]">
        <IonTitle className="font-semibold">Zynq</IonTitle>
        <IonButtons slot="end">
          <InstallPwaButton />
          <ThemeToggle />
          <IonButton onClick={onLogout}>Logout</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}

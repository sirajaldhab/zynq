import { useEffect, useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { moon, sunny } from 'ionicons/icons';

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <IonButton fill="clear" onClick={() => setDark((v) => !v)} title="Toggle theme">
      <IonIcon icon={dark ? sunny : moon} />
    </IonButton>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { IonAlert, IonButton, IonIcon } from '@ionic/react';
import { downloadOutline } from 'ionicons/icons';

const INSTALLED_FLAG = 'zynq_pwa_installed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>; // eslint-disable-line @typescript-eslint/consistent-type-assertions
};

export default function InstallPwaButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [iosAlertOpen, setIosAlertOpen] = useState(false);

  const isIosDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  }, []);

  const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alreadyInstalled = isStandalone() || localStorage.getItem(INSTALLED_FLAG) === 'true';
    if (alreadyInstalled) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setShowIosGuide(false);
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_FLAG, 'true');
      setPromptEvent(null);
      setShowButton(false);
      setShowIosGuide(false);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        handleAppInstalled();
      }
    };

    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleDisplayChange);
    else if ((mediaQuery as any).addListener) (mediaQuery as any).addListener(handleDisplayChange);

    if (isIosDevice) {
      setShowIosGuide(true);
      setShowButton(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleDisplayChange);
      else if ((mediaQuery as any).removeListener) (mediaQuery as any).removeListener(handleDisplayChange);
    };
  }, [isIosDevice]);

  if (!showButton) return null;

  const onInstall = async () => {
    if (showIosGuide && !promptEvent) {
      setIosAlertOpen(true);
      return;
    }
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_FLAG, 'true');
        setShowButton(false);
      }
    } finally {
      setPromptEvent(null);
    }
  };

  return (
    <>
      <IonButton size="small" fill="clear" title="Install app" onClick={onInstall} className="text-base" aria-label="Install app">
        <IonIcon slot="icon-only" icon={downloadOutline} />
      </IonButton>
      <IonAlert
        isOpen={iosAlertOpen}
        onDidDismiss={() => setIosAlertOpen(false)}
        header="Install on iPhone/iPad"
        message="Tap the share icon in Safari, then choose 'Add to Home Screen' to install Zynq as an app."
        buttons={['Got it']}
      />
    </>
  );
}

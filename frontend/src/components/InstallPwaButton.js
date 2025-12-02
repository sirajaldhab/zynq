import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { IonAlert, IonButton, IonIcon } from '@ionic/react';
import { downloadOutline } from 'ionicons/icons';
const INSTALLED_FLAG = 'zynq_pwa_installed';
export default function InstallPwaButton() {
    const [promptEvent, setPromptEvent] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [iosAlertOpen, setIosAlertOpen] = useState(false);
    const isIosDevice = useMemo(() => {
        if (typeof navigator === 'undefined')
            return false;
        return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    }, []);
    const isStandalone = () => {
        if (typeof window === 'undefined')
            return false;
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    };
    useEffect(() => {
        if (typeof window === 'undefined')
            return undefined;
        const alreadyInstalled = isStandalone() || localStorage.getItem(INSTALLED_FLAG) === 'true';
        if (alreadyInstalled) {
            return undefined;
        }
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setPromptEvent(event);
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
        const handleDisplayChange = (event) => {
            if (event.matches) {
                handleAppInstalled();
            }
        };
        if (mediaQuery.addEventListener)
            mediaQuery.addEventListener('change', handleDisplayChange);
        else if (mediaQuery.addListener)
            mediaQuery.addListener(handleDisplayChange);
        if (isIosDevice) {
            setShowIosGuide(true);
            setShowButton(true);
        }
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            if (mediaQuery.removeEventListener)
                mediaQuery.removeEventListener('change', handleDisplayChange);
            else if (mediaQuery.removeListener)
                mediaQuery.removeListener(handleDisplayChange);
        };
    }, [isIosDevice]);
    if (!showButton)
        return null;
    const onInstall = async () => {
        if (showIosGuide && !promptEvent) {
            setIosAlertOpen(true);
            return;
        }
        if (!promptEvent)
            return;
        try {
            await promptEvent.prompt();
            const result = await promptEvent.userChoice;
            if (result.outcome === 'accepted') {
                localStorage.setItem(INSTALLED_FLAG, 'true');
                setShowButton(false);
            }
        }
        finally {
            setPromptEvent(null);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(IonButton, { size: "small", fill: "clear", title: "Install app", onClick: onInstall, className: "text-base", "aria-label": "Install app", children: _jsx(IonIcon, { slot: "icon-only", icon: downloadOutline }) }), _jsx(IonAlert, { isOpen: iosAlertOpen, onDidDismiss: () => setIosAlertOpen(false), header: "Install on iPhone/iPad", message: "Tap the share icon in Safari, then choose 'Add to Home Screen' to install Zynq as an app.", buttons: ['Got it'] })] }));
}

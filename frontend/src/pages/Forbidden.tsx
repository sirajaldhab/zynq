import React from 'react';
import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { lockClosedOutline } from 'ionicons/icons';

export default function Forbidden() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Access Denied</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="min-h-screen flex items-center justify-center p-8 bg-[color:var(--bg)]">
        <div className="w-full max-w-xl text-center bg-[color:var(--surface)] border zynq-border rounded-2xl p-10 shadow-xl">
          <div className="flex items-center justify-center mb-4 text-[color:var(--text-secondary)]">
            <IonIcon icon={lockClosedOutline} style={{ fontSize: 48 }} />
          </div>
          <div className="text-2xl font-semibold mb-2 text-[color:var(--text-primary)]">403 — Forbidden</div>
          <div className="text-sm mb-6 text-[color:var(--text-secondary)]">You don't have permission to access this page. If you believe this is a mistake, contact your administrator.</div>
          <div className="flex items-center justify-center gap-3">
            <IonButton onClick={() => (window.location.href = '/')}>Go to Dashboard</IonButton>
            <IonButton fill="outline" onClick={() => (window.location.href = '/auth/login')}>Login as different user</IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

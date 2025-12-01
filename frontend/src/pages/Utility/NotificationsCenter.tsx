import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function NotificationsCenter() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Notifications Center</div>
        <div className="zynq-muted text-sm">Home &gt; Notifications</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Centralized notifications</div>
        {/* TODO: Filters, mark as read, preferences */}
      </IonContent>
    </IonPage>
  );
}

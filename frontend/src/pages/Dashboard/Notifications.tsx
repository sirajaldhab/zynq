import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function DashboardNotifications() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Dashboard / Notifications</div>
        <div className="zynq-muted text-sm">Home &gt; Dashboard &gt; Notifications</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — System updates and user alerts</div>
        {/* TODO: Notifications list with read/unread state */}
      </IonContent>
    </IonPage>
  );
}

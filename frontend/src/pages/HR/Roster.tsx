import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function HRRoster() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">HR / Roster</div>
        <div className="zynq-muted text-sm">Home &gt; HR &gt; Roster</div>
        {/* TODO: Shift planning, assignments */}
      </IonContent>
    </IonPage>
  );
}

import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function UtilityCalendar() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Calendar</div>
        <div className="zynq-muted text-sm">Home &gt; Calendar</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Organization-wide calendar</div>
        {/* TODO: Combined events view */}
      </IonContent>
    </IonPage>
  );
}

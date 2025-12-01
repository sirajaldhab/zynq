import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function ProjectCalendar() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Projects / Calendar</div>
        <div className="zynq-muted text-sm">Home &gt; Projects &gt; Calendar</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Deadlines calendar view</div>
        {/* TODO: Calendar view for tasks/milestones */}
      </IonContent>
    </IonPage>
  );
}

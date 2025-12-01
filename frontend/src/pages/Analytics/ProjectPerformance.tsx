import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function ProjectPerformance() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Analytics / Project Performance</div>
        <div className="zynq-muted text-sm">Home &gt; Analytics &gt; Project Performance</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Project KPIs and trends</div>
        {/* TODO: Velocity, deadline slippage, budget variance */}
      </IonContent>
    </IonPage>
  );
}

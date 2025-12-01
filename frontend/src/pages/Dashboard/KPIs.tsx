import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function KPIs() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Dashboard / KPIs</div>
        <div className="zynq-muted text-sm">Home &gt; Dashboard &gt; KPIs</div>
        {/* TODO: Integrate charts for KPIs and period filters */}
      </IonContent>
    </IonPage>
  );
}

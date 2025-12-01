import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function FinanceReports() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Finance / Reports</div>
        <div className="zynq-muted text-sm">Home &gt; Finance &gt; Reports</div>
      </IonContent>
    </IonPage>
  );
}

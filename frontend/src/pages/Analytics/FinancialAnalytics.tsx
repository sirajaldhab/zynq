import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function FinancialAnalytics() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Analytics / Financial</div>
        <div className="zynq-muted text-sm">Home &gt; Analytics &gt; Financial</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Financial analytics dashboards</div>
        {/* TODO: KPI charts, filters, export */}
      </IonContent>
    </IonPage>
  );
}

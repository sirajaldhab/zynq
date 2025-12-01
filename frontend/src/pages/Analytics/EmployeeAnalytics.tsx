import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function EmployeeAnalytics() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Analytics / Employee</div>
        <div className="zynq-muted text-sm">Home &gt; Analytics &gt; Employee</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Employee performance and HR insights</div>
        {/* TODO: Attrition, attendance trends */}
      </IonContent>
    </IonPage>
  );
}

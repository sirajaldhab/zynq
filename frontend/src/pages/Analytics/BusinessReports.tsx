import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function BusinessReports() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Analytics / Business Reports</div>
        <div className="zynq-muted text-sm">Home &gt; Analytics &gt; Business Reports</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Cross-domain business reports</div>
        {/* TODO: Combined Finance/HR/Projects reporting */}
      </IonContent>
    </IonPage>
  );
}

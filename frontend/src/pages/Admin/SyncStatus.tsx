import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function AdminSyncStatus() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Admin / Database Sync Status</div>
        <div className="zynq-muted text-sm">Home &gt; Admin &gt; Sync Status</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — RxDB/Prisma sync diagnostics</div>
        {/* TODO: Sync progress, conflicts, last run */}
      </IonContent>
    </IonPage>
  );
}

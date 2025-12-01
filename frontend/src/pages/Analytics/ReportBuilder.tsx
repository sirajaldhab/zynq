import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function ReportBuilder() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Analytics / Report Builder</div>
        <div className="zynq-muted text-sm">Home &gt; Analytics &gt; Report Builder</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Custom report builder</div>
        {/* TODO: Drag-and-drop builder, save/export */}
      </IonContent>
    </IonPage>
  );
}

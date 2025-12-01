import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function ProjectFiles() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Projects / Files & Documents</div>
        <div className="zynq-muted text-sm">Home &gt; Projects &gt; Files & Documents</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — File upload & management</div>
        {/* TODO: Upload, preview, versions, tags */}
      </IonContent>
    </IonPage>
  );
}

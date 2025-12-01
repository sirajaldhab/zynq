import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function SupportHelp() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Support / Help</div>
        <div className="zynq-muted text-sm">Home &gt; Support</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Help center and support</div>
        {/* TODO: FAQs, contact, feedback */}
      </IonContent>
    </IonPage>
  );
}

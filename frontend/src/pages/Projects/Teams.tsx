import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function ProjectTeams() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Projects / Teams</div>
        <div className="zynq-muted text-sm">Home &gt; Projects &gt; Teams</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Team members per project</div>
        {/* TODO: Add/remove members, roles per project */}
      </IonContent>
    </IonPage>
  );
}

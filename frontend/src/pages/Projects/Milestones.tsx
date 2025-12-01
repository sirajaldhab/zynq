import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function ProjectMilestones() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Projects / Milestones</div>
        <div className="zynq-muted text-sm">Home &gt; Projects &gt; Milestones</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Milestone timeline</div>
        {/* TODO: Milestone creation, progress, dependencies */}
      </IonContent>
    </IonPage>
  );
}

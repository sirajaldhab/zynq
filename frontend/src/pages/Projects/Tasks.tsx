import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';

export default function ProjectTasks() {
  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Projects / Tasks</div>
        <div className="zynq-muted text-sm">Home &gt; Projects &gt; Tasks</div>
        <div className="mt-4 text-sm zynq-muted">Coming Soon — Task board/list</div>
        {/* TODO: CRUD, assignment, status, due dates */}
      </IonContent>
    </IonPage>
  );
}

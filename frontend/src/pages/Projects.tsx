import React, { useEffect, useMemo, useState } from 'react';
import { IonButton, IonContent, IonHeader, IonItem, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import Nav from '../components/Nav';
import { getDB, ProjectDoc } from '../db/rxdb';
import { useAuth } from '../auth/AuthContext';
import { syncPull } from '../db/sync';

export default function Projects() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ProjectDoc[]>([]);
  const canSync = useMemo(() => Boolean(accessToken), [accessToken]);

  useEffect(() => {
    let sub: any;
    (async () => {
      const db = await getDB();
      sub = db.projects
        .find()
        .$ 
        .subscribe((docs: any[]) => setItems(docs.map((d: any) => d.toJSON())));
    })();
    return () => sub?.unsubscribe?.();
  }, []);

  async function handleSync() {
    if (!accessToken) return;
    await syncPull(accessToken, null, 100);
  }

  return (
    <IonPage>
      <Nav />
      <IonHeader>
        <IonToolbar>
          <IonTitle>Projects</IonTitle>
          {canSync && (
            <IonButton slot="end" onClick={handleSync}>
              Sync
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent className="p-6">
        <IonList>
          {items.map((p) => (
            <IonItem key={p.id}>
              <div className="flex flex-col">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm opacity-70">{p.status || '—'}</span>
              </div>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
}

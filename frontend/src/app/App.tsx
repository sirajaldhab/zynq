import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

export default function App() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Zynq</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Zynq Monorepo Scaffold</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Frontend is up. Backend, infra, sync, and modules will arrive next.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}

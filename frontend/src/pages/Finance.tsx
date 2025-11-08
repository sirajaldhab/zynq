import { IonContent, IonPage } from '@ionic/react';
import Nav from '../components/Nav';

export default function Finance() {
  return (
    <IonPage>
      <Nav />
      <IonContent fullscreen>
        <div className="p-4">
          <h1 className="text-xl font-semibold">Finance</h1>
          <p>Invoices, payments, and financial KPIs will appear here.</p>
        </div>
      </IonContent>
    </IonPage>
  );
}

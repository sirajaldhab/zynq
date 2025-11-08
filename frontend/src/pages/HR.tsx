import { IonContent, IonPage } from '@ionic/react';
import Nav from '../components/Nav';

export default function HR() {
  return (
    <IonPage>
      <Nav />
      <IonContent fullscreen>
        <div className="p-4">
          <h1 className="text-xl font-semibold">HR</h1>
          <p>Employees, attendance, and HR KPIs will appear here.</p>
        </div>
      </IonContent>
    </IonPage>
  );
}

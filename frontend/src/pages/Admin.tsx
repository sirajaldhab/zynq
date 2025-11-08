import { IonContent, IonPage } from '@ionic/react';
import Nav from '../components/Nav';

export default function Admin() {
  return (
    <IonPage>
      <Nav />
      <IonContent fullscreen>
        <div className="p-4">
          <h1 className="text-xl font-semibold">Admin</h1>
          <p>Users, roles, and system settings will appear here.</p>
        </div>
      </IonContent>
    </IonPage>
  );
}

import { IonHeader, IonToolbar, IonButtons, IonButton, IonTitle } from '@ionic/react';

export default function Nav() {
  return (
    <IonHeader>
      <IonToolbar>
        <IonTitle>Zynq</IonTitle>
        <IonButtons slot="end">
          <IonButton href="/">Dashboard</IonButton>
          <IonButton href="/projects">Projects</IonButton>
          <IonButton href="/finance">Finance</IonButton>
          <IonButton href="/hr">HR</IonButton>
          <IonButton href="/admin">Admin</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}

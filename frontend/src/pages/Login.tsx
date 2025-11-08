import React, { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@zynq.app');
  const [password, setPassword] = useState('ChangeMe!1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login — Zynq</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="p-6 max-w-md mx-auto">
        <form onSubmit={onSubmit} className="space-y-4">
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput value={email} onIonChange={(e) => setEmail(e.detail.value || '')} type="email" required />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Password</IonLabel>
            <IonInput value={password} onIonChange={(e) => setPassword(e.detail.value || '')} type="password" required />
          </IonItem>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <IonButton type="submit" expand="block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
}

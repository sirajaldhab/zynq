import React, { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { API_BASE } from '../config';
import { useAuth } from '../auth/AuthContext';

export default function Register() {
  const apiBase = API_BASE;
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      // If backend indicates pending approval, show message and do not auto-login
      if (data?.pending) {
        alert('Account created and pending admin approval. You can log in after approval.');
        window.location.href = '/auth/login';
        return;
      }
      // Otherwise, attempt login (for ACTIVE/admin accounts)
      await login(email, password);
      const role = localStorage.getItem('userRole');
      let target = '/';
      switch (role) {
        case 'ADMIN':
        case 'GM':
          target = '/admin';
          break;
        case 'HR_MANAGER':
          target = '/hr';
          break;
        case 'FINANCE_MANAGER':
          target = '/finance';
          break;
        case 'PROJECT_MANAGER':
          target = '/projects';
          break;
        default:
          target = '/';
      }
      window.location.href = target;
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register — Zynq</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="p-6 max-w-md mx-auto">
        <form onSubmit={onSubmit} className="space-y-4">
          <IonItem>
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput id="register-name" name="name" value={name} onIonChange={(e) => setName(e.detail.value || '')} required />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput id="register-email" name="email" value={email} onIonChange={(e) => setEmail(e.detail.value || '')} type="email" required />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Password</IonLabel>
            <IonInput id="register-password" name="password" value={password} onIonChange={(e) => setPassword(e.detail.value || '')} type="password" required />
          </IonItem>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <IonButton type="submit" expand="block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
}

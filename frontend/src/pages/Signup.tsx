import React, { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { API_BASE } from '../config';

export default function Signup() {
  const apiBase = API_BASE;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/auth/signup-pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        let msg = 'Signup failed';
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {
          const text = await res.text();
          if (text) msg = text;
        }
        throw new Error(msg);
      }
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign Up — Zynq</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-[color:var(--bg)]">
        <div className="min-h-screen flex items-center justify-center p-6">
          <IonCard className="w-full max-w-lg shadow-xl border zynq-border">
          <IonCardHeader>
            <IonCardTitle className="text-xl">Create your account</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {done ? (
              <div className="space-y-4">
                <div className="text-green-600 font-medium">Account request sent — waiting for Admin approval.</div>
                <div className="text-sm text-[color:var(--text-secondary)]">
                  You can close this window. Once approved, you can log in with the same email and password.
                </div>
                <IonButton expand="block" onClick={() => (window.location.href = '/auth/login')}>Back to Login</IonButton>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <IonItem>
                  <IonLabel position="stacked">Full Name</IonLabel>
                  <IonInput id="signup-name" name="name" value={name} onIonChange={(e) => setName(e.detail.value || '')} required />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Email ID</IonLabel>
                  <IonInput id="signup-email" name="email" type="email" value={email} onIonChange={(e) => setEmail(e.detail.value || '')} required />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput id="signup-password" name="password" type="password" value={password} onIonChange={(e) => setPassword(e.detail.value || '')} required />
                </IonItem>
                {/* Role selection removed; backend defaults to STAFF */}
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <IonButton type="submit" expand="block" disabled={loading || !name || !email || !password}>
                  {loading ? 'Submitting…' : 'Request Account'}
                </IonButton>
                <div className="text-center text-sm text-[color:var(--text-secondary)]">
                  Already have an account? <a href="/auth/login" className="underline">Sign in</a>
                </div>
              </form>
            )}
          </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}

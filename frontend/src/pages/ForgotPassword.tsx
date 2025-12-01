import React, { useState } from 'react';
import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonPage, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { API_BASE } from '../config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Request failed');
      setMessage('If an account exists for that email, you will receive reset instructions shortly.');
    } catch (err: any) {
      setError(err?.message || 'Unable to send reset email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="min-h-screen bg-gradient-to-b from-[color:var(--bg)] via-[color:var(--surface)]/70 to-[color:var(--bg)] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center space-y-1">
            <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Zynq</div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Reset password</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">Enter the email linked to your account</p>
          </div>
          <IonCard className="w-full shadow-xl border zynq-border backdrop-blur-sm">
            <IonCardHeader>
              <IonCardTitle className="text-lg sm:text-xl">Forgot password</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <IonItem lines="none" className="rounded-xl border zynq-border">
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onIonChange={(e) => setEmail(e.detail.value || '')}
                  />
                </IonItem>
                {message && <div className="text-emerald-600 text-sm">{message}</div>}
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <IonButton type="submit" expand="block" disabled={loading} className="h-12 text-base font-semibold">
                  {loading ? 'Sending…' : 'Send reset link'}
                </IonButton>
                <div className="text-center text-xs sm:text-sm text-[color:var(--text-secondary)]">
                  <a href="/auth/login" className="underline">Back to sign in</a>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
          <div className="mt-6 text-center text-xs sm:text-sm text-[color:var(--text-secondary)]">
            Need help? Contact your administrator for manual reset.
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

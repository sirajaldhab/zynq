import React, { useState } from 'react';
import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonPage, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!role) return;
    let target = '/';
    switch (role) {
      case 'ADMIN':
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
  }, [role]);

  return (
    <IonPage>
      <IonContent className="min-h-screen bg-gradient-to-b from-[color:var(--bg)] via-[color:var(--surface)]/70 to-[color:var(--bg)] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center space-y-1">
            <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Zynq</div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Welcome back</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">Sign in to continue to your workspace</p>
          </div>
          <IonCard className="w-full shadow-xl border zynq-border backdrop-blur-sm">
            <IonCardHeader>
              <IonCardTitle className="text-lg sm:text-xl">Account access</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <IonItem lines="none" className="rounded-xl border zynq-border">
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput id="login-email" name="email" value={email} onIonChange={(e) => setEmail(e.detail.value || '')} type="email" required />
                </IonItem>
                <IonItem lines="none" className="rounded-xl border zynq-border">
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput id="login-password" name="password" value={password} onIonChange={(e) => setPassword(e.detail.value || '')} type="password" required />
                </IonItem>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <IonButton type="submit" expand="block" disabled={loading} className="h-12 text-base font-semibold">
                  {loading ? 'Signing in…' : 'Sign in'}
                </IonButton>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2 text-[color:var(--text-secondary)]">
                  <a href="/auth/forgot-password" className="underline">Forgot password?</a>
                  <span>
                    Need access? <a href="/auth/signup" className="underline">Request account</a>
                  </span>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
          <div className="mt-6 text-center text-xs sm:text-sm text-[color:var(--text-secondary)]">
            © {new Date().getFullYear()} Zynq. All rights reserved.
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

import React from 'react';
import { IonPage, IonContent, useIonToast, IonButton } from '@ionic/react';
import Nav from '../../components/Nav';
import { fetchMe, UserDto } from '../../api/adminService';

export default function ProfileSettings() {
  const [present] = useIonToast();
  const [user, setUser] = React.useState<UserDto | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem('token') || undefined;
        const data = await fetchMe({ token });
        setUser(data);
      } catch (error) {
        present({ message: 'Failed to load profile', color: 'danger', duration: 2000, position: 'top' });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [present]);

  const roleName = (user?.role?.name || user?.roleId || '').toUpperCase();
  const canAccessAdmin = roleName === 'ADMIN' || roleName === 'GM';

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold">Profile</div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-[color:var(--surface)] p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-sky-500/30 flex items-center justify-center text-3xl font-semibold text-white uppercase">
                {user?.name?.[0] || user?.email?.[0] || '?'}
              </div>
              <div className="mt-4">
                <div className="text-lg font-semibold">{user?.name || '—'}</div>
                <div className="text-sm text-zinc-400">{user?.email || '—'}</div>
                <div className="text-xs mt-1 text-emerald-400 uppercase tracking-wide">{user?.role?.name || user?.roleId || '—'}</div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[color:var(--surface)] p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-base font-semibold">Account Details</div>
                  <div className="text-xs text-zinc-400"> </div>
                </div>
                {canAccessAdmin && (
                  <IonButton
                    size="small"
                    className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                    routerLink="/admin"
                  >
                    Open Admin Dashboard
                  </IonButton>
                )}
              </div>

              {loading && <div className="text-sm text-zinc-400">Loading profile…</div>}

              {!loading && (
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Full name</div>
                    <div className="text-base">{user?.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Email</div>
                    <div className="text-base">{user?.email || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Role</div>
                    <div className="text-base">{user?.role?.name || user?.roleId || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Status</div>
                    <div className="text-base capitalize">{user?.status?.toLowerCase() || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Phone</div>
                    <div className="text-base">{(user as any)?.phone || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Created</div>
                    <div className="text-base">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { usePermissions } from '../../auth/usePermissions';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { chevronBackOutline } from 'ionicons/icons';

export default function HRAttendance() {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold">HR / Attendance</div>
          <div className="zynq-muted text-sm">Home &gt; HR &gt; Attendance</div>

          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/hr')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {can('HR.Attendance.Entry.View') && (
            <div onClick={() => navigate('/hr/attendance/entry')}>
              <Card>
                <CardHeader className="text-sm zynq-muted">Attendance</CardHeader>
                <CardContent>
                  <CardTitle className="mb-1">Attendance Entry</CardTitle>
                  <div className="text-sm zynq-muted">Record daily check-in and check-out details.</div>
                </CardContent>
              </Card>
            </div>
            )}
            {can('HR.Attendance.Records.View') && (
            <div onClick={() => navigate('/hr/attendance/records')}>
              <Card>
                <CardHeader className="text-sm zynq-muted">Attendance</CardHeader>
                <CardContent>
                  <CardTitle className="mb-1">Attendance Records</CardTitle>
                  <div className="text-sm zynq-muted">View and analyze historical attendance records.</div>
                </CardContent>
              </Card>
            </div>
            )}
            {can('HR.Attendance.ManpowerSupplier.View') && (
            <div onClick={() => navigate('/hr/attendance/manpower-supplier')}>
              <Card>
                <CardHeader className="text-sm zynq-muted">Attendance</CardHeader>
                <CardContent>
                  <CardTitle className="mb-1">Manpower Supplier</CardTitle>
                  <div className="text-sm zynq-muted">Manage and track manpower suppliers.</div>
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

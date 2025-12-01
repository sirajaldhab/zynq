import React, { useEffect } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';

export default function Documents() {
  const navigate = useNavigate();
  useEffect(() => {
    console.log('Loaded Documents > Main');
  }, []);

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] text-[color:var(--text-primary)] py-8">
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold mb-1">Documents</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Documents</div>
          <div className="hidden lg:block">
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/documents-main/company-list')}
              className="text-left"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Company List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="zynq-muted text-sm">View documents grouped by company.</div>
                </CardContent>
              </Card>
            </button>
            <button
              type="button"
              onClick={() => navigate('/documents-main/documents')}
              className="text-left"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="zynq-muted text-sm">Open the main document library.</div>
                </CardContent>
              </Card>
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

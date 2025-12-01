import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { chevronBackOutline } from 'ionicons/icons';

export default function Expenses() {
  const navigate = useNavigate();

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold hidden lg:block">Finance / Expenses</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Finance &gt; Expenses</div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/finance')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card
            className="cursor-pointer bg-[color:var(--card-bg,rgba(255,255,255,0.04))] hover:bg-[color:var(--card-bg-hover,rgba(255,255,255,0.08))] transition-colors"
            onClick={() => navigate('/finance/expenses/expense')}
          >
            <CardHeader>
              <CardTitle>Expense</CardTitle>
            </CardHeader>
            <CardContent className="text-sm zynq-muted">
              High-level expense overview and management.
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer bg-[color:var(--card-bg,rgba(255,255,255,0.04))] hover:bg-[color:var(--card-bg-hover,rgba(255,255,255,0.08))] transition-colors"
            onClick={() => navigate('/finance/expenses/general')}
          >
            <CardHeader>
              <CardTitle>General Expense</CardTitle>
            </CardHeader>
            <CardContent className="text-sm zynq-muted">
              Manage general, non-project-specific expenses.
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer bg-[color:var(--card-bg,rgba(255,255,255,0.04))] hover:bg-[color:var(--card-bg-hover,rgba(255,255,255,0.08))] transition-colors"
            onClick={() => navigate('/finance/expenses/manpower')}
          >
            <CardHeader>
              <CardTitle>Manpower Expense</CardTitle>
            </CardHeader>
            <CardContent className="text-sm zynq-muted">
              Track and analyze manpower-related expenses.
            </CardContent>
          </Card>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';

export default function ManpowerExpensePage() {
  const navigate = useNavigate();

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold">Finance / Manpower Expense</div>
          <div className="zynq-muted text-sm">Home &gt; Finance &gt; Manpower Expense</div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/finance/expenses')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card
              className="cursor-pointer bg-[color:var(--card-bg,rgba(255,255,255,0.04))] hover:bg-[color:var(--card-bg-hover,rgba(255,255,255,0.08))] transition-colors"
              onClick={() => navigate('/finance/expenses/company-employee-salary')}
            >
              <CardHeader>
                <CardTitle>Company Employee Expenses</CardTitle>
              </CardHeader>
              <CardContent className="text-sm zynq-muted">
                Manage salary-related expenses for internal company employees.
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer bg-[color:var(--card-bg,rgba(255,255,255,0.04))] hover:bg-[color:var(--card-bg-hover,rgba(255,255,255,0.08))] transition-colors"
              onClick={() => navigate('/finance/expenses/manpower/external-labour-expense')}
            >
              <CardHeader>
                <CardTitle>External Labour Expense</CardTitle>
              </CardHeader>
              <CardContent className="text-sm zynq-muted">
                View and manage external labour-related expenses.
              </CardContent>
            </Card>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

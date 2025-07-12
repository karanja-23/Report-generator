import { Routes } from '@angular/router';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { ReportsComponent } from './Components/reports/reports.component';
import { ViewReportComponent } from './Components/view-report/view-report.component';

export const routes: Routes = [
  
    {
        path: '',
        component: DashboardComponent
    },
    {
        path: 'reports',
        component:ReportsComponent
    },
    {
        path:'reports/:id',
        component:ViewReportComponent
    }
];

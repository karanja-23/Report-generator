import { Routes } from '@angular/router';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { ReportsComponent } from './Components/reports/reports.component';
export const routes: Routes = [
    {
        path: '',
        component: DashboardComponent
    },
    {
        path: 'reports',
        component:ReportsComponent
    }
];

import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OrderComponent } from './pages/order/order.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { StockingComponent } from './pages/stocking/stocking.component';
import { SalesComponent } from './pages/sales/sales.component';
import { WagesComponent } from './pages/wages/wages.component';
import { ExpenseComponent } from './pages/expense/expense.component';
import { ReportComponent } from './pages/report/report.component';
import { LoginComponent } from './pages/auth/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard' },
  { path: 'employees', component: EmployeeComponent, title: 'Employees' },
  { path: 'expenses', component: ExpenseComponent, title: 'Expenses' },
  { path: 'orders', component: OrderComponent, title: 'Orders' },
  { path: 'reports', component: ReportComponent, title: 'Reports' },
  { path: 'sales', component: SalesComponent, title: 'Sales' },
  { path: 'stock', component: StockingComponent, title: 'Stock Management' },
  { path: 'wages', component: WagesComponent, title: 'Wages' },
  { path: '**', redirectTo: '/dashboard' }
];

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DashboardResponse, DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  loading = false;
  data?: DashboardResponse;

  summaryItems: Array<{ key: 'totalOrder' | 'paddyTaken' | 'newOrder' | 'output'; label: string }> = [
    { key: 'totalOrder', label: 'Previous Order' },
    { key: 'paddyTaken', label: 'Paddy Taken' },
    { key: 'newOrder', label: 'New Order' },
    { key: 'output', label: 'Total Order' }
  ];

  constructor(
    private dashboardService: DashboardService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (d) => {
        this.data = d;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        const msg = error?.error?.message || error?.message || 'Error loading dashboard';
        this.snackBar.open(String(msg), 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        this.loading = false;
      }
    });
  }

  get monthBars(): Array<{
    month: number;
    label: string;
    revenue: number;
    expense: number;
    profit: number;
    revenueHeight: number;
    expenseHeight: number;
    profitHeight: number;
    tooltip: string;
  }> {
    const months = this.data?.yearly?.months || [];
    const values = months.flatMap(m => [
      Number(m.revenue?.total ?? 0),
      Number(m.expense?.total ?? 0),
      Math.abs(Number(m.profit ?? 0))
    ]);
    const maxVal = Math.max(1, ...values);

    return months
      .slice()
      .sort((a, b) => (a.month ?? 0) - (b.month ?? 0))
      .map(m => {
        const revenue = Number(m.revenue?.total ?? 0);
        const expense = Number(m.expense?.total ?? 0);
        const profit = Number(m.profit ?? 0);
        const revenueHeight = revenue > 0 ? Math.max(6, Math.round((revenue / maxVal) * 100)) : 0;
        const expenseHeight = expense > 0 ? Math.max(6, Math.round((expense / maxVal) * 100)) : 0;
        const profitHeight = profit !== 0 ? Math.max(6, Math.round((Math.abs(profit) / maxVal) * 100)) : 0;
        return {
          month: m.month,
          label: this.monthLabel(m.month),
          revenue,
          expense,
          profit,
          revenueHeight,
          expenseHeight,
          profitHeight,
          tooltip: `Revenue: ${this.formatCurrency(revenue)} | Expense: ${this.formatCurrency(expense)} | Profit: ${this.formatCurrency(profit)}`
        };
      })
      .filter(b => b.revenue > 0 || b.expense > 0 || b.profit !== 0);
  }

  monthLabel(m: number): string {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!m || m < 1 || m > 12) return String(m ?? '');
    return labels[m - 1];
  }

  formatCurrency(value: unknown): string {
      const n = Number(value ?? 0);
      const isNegative = n < 0;
      const absValue = Math.abs(n);
    
      return `${isNegative ? '-' : ''}₹${absValue.toLocaleString('en-IN')}`;
  }

  formatNumber(value: unknown): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('en-IN');
  }
}

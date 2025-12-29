import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Income, IncomeService } from '../../services/income.service';
import { IncomeDialogResult, IncomeFormDialogComponent } from './income-form-dialog/income-form-dialog.component';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './income.component.html',
  styleUrl: './income.component.scss'
})
export class incomeComponent {

  private gridApi!: GridApi;
  public clientId = this.getClientId();

  rowData: Income[] = [];
  loading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  columnDefs: ColDef[] = [
    { field: 'item', headerName: 'Item', sortable: true, filter: true, flex: 1 },
    { field: 'description', headerName: 'Description', sortable: true, filter: true, flex: 1 },
    {
      field: 'amount',
      headerName: 'Amount',
      sortable: true,
      filter: true,
      width: 140,
      valueFormatter: (p: ValueFormatterParams) => this.currencyFormatter(p)
    },
    {
      field: 'date',
      headerName: 'Date',
      sortable: true,
      filter: true,
      width: 140,
      valueFormatter: (params) => this.dateFormatter(params?.value)
    },
    {
      headerName: 'Actions',
      field: 'actions',
      sortable: false,
      filter: false,
      width: 120,
      cellRenderer: (params: ICellRendererParams) => {
        const div = document.createElement('div');
        div.className = 'gridActionBtnWrap';

        const editBtn = document.createElement('button');
        editBtn.className = 'mat-icon-button gridAction-edit';
        editBtn.style.color = '#3f51b5';
        editBtn.innerHTML = '<mat-icon>edit</mat-icon>';

        const componentRef = this;
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          componentRef.onEditClick(params.data?._id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'mat-icon-button gridAction-delete';
        deleteBtn.style.color = '#f44336';
        deleteBtn.innerHTML = '<mat-icon>delete</mat-icon>';

        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          componentRef.onDeleteClick(params.data?._id, params.data?.item);
        });

        div.appendChild(editBtn);
        div.appendChild(deleteBtn);
        return div;
      }
    }
  ];

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true
  };

  constructor(
    private incomeService: IncomeService,
    private dialog: MatDialog,
    private zone: NgZone,
    private snackBar: MatSnackBar
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.loadExpenses();
    });
  }

  private getApiErrorMessage(error: any, fallback: string): string {
    const msg = error?.error?.message || error?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    return fallback;
  }

  private getClientId(): string {
    try {
      const raw = sessionStorage.getItem('user');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return String(parsed?._id ?? parsed);
    } catch {
      return '';
    }
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  onSearchChange(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchSubject.next(term);
  }

  loadExpenses(): void {
    this.loading = true;
    this.incomeService.getIncome().subscribe({
      next: (data) => {
        let filteredData = data || [];

        if (this.searchTerm) {
          const searchLower = this.searchTerm.toLowerCase();
          filteredData = filteredData.filter((e: Income) =>
            (e.item || '').toLowerCase().includes(searchLower) ||
            (e.description || '').toLowerCase().includes(searchLower) ||
            String(e.amount ?? '').includes(searchLower) ||
            String(e.date ?? '').includes(searchLower)
          );
        }

        this.rowData = filteredData;
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', filteredData);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.snackBar.open(this.getApiErrorMessage(error, 'Error loading expenses'), 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  onAddClick(): void {
    const dialogRef = this.dialog.open(IncomeFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe((result?: IncomeDialogResult) => {
      if (!result) return;
      this.incomeService.createIncome({
        ...result,
        clientId: this.clientId.trim()
      }).subscribe({
        next: () => {
          this.snackBar.open('Expense added successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.loadExpenses();
        },
        error: (error) => {
          console.error('Error adding expense:', error);
          this.snackBar.open(error?.error?.message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      });
    });
  }

  onEditClick(id?: string): void {
    if (!id) return;
    const expense = this.rowData.find(e => e._id === id);
    if (!expense) {
      this.snackBar.open('Expense not found', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    this.zone.run(() => {
      const dialogRef = this.dialog.open(IncomeFormDialogComponent, {
        width: '700px',
        maxWidth: '95vw',
        disableClose: true,
        autoFocus: false,
        data: { isEdit: true, expense: { ...expense } }
      });

      dialogRef.afterClosed().subscribe((result?: IncomeDialogResult) => {
        if (!result) return;
        this.loading = true;
        this.incomeService.updateIncome(id, {
          ...result,
          clientId: this.clientId.trim()
        }).subscribe({
          next: () => {
            this.snackBar.open('Expense updated successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
            this.loadExpenses();
          },
          error: (error) => {
            console.error('Error updating expense:', error);
            this.snackBar.open(error?.error?.message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
            this.loading = false;
          }
        });
      });
    });
  }

  onDeleteClick(id?: string, item?: string): void {
    if (!id) return;
    if (!confirm(`Are you sure you want to delete expense${item ? ` for ${item}` : ''}? This action cannot be undone.`)) return;
    this.loading = true;
    this.incomeService.deleteIncome(id).subscribe({
      next: () => {
        this.snackBar.open('Expense deleted successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        this.loadExpenses();
      },
      error: (error) => {
        console.error('Error deleting expense:', error);
        this.snackBar.open(this.getApiErrorMessage(error, 'Error deleting expense. Please try again.'), 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        this.loading = false;
      }
    });
  }

  private currencyFormatter(params: ValueFormatterParams): string {
    const value = Number(params.value ?? 0);
    return `₹${value.toLocaleString('en-IN')}`;
  }

  private dateFormatter(value: unknown): string {
    if (!value) return '';
    const s = String(value);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-IN');
  }
}

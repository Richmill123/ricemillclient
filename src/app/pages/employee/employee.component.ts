import { Component, NgZone } from '@angular/core';
import { ColDef, GridReadyEvent, GridApi, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeeFormDialogComponent } from './employee-form-dialog/employee-form-dialog.component';
import { EmployeeService, Employee } from '../../services/employee.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class EmployeeComponent {
  private gridApi!: GridApi;
  public clientId = JSON.parse(sessionStorage.getItem('user') || '');

  rowData: any[] = [];
  loading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      sortable: true,
      filter: true,
      width: 150
    },
    {
      field: 'gender',
      headerName: 'Gender',
      sortable: true,
      filter: true,
      width: 120
    },
    {
      field: 'salary',
      headerName: 'Salary',
      sortable: true,
      filter: true,
      width: 150,
      valueFormatter: this.currencyFormatter
    },
    {
      field: 'debtAmount',
      headerName: 'Debt',
      sortable: true,
      filter: true,
      width: 150,
      valueFormatter: this.currencyFormatter
    },
    {
      field: 'pendingSalary',
      headerName: 'Pending Salary',
      sortable: true,
      filter: true,
      width: 150,
      valueFormatter: this.currencyFormatter
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
          componentRef.onEditClick(params.data._id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'mat-icon-button gridAction-delete';
        deleteBtn.style.color = '#f44336';
        deleteBtn.innerHTML = '<mat-icon>delete</mat-icon>';

        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          componentRef.onDeleteClick(params.data._id);
        });

        div.appendChild(editBtn);
        div.appendChild(deleteBtn);

        return div;
      }
    }
  ];

  defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  };

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private zone: NgZone,
    private snackBar: MatSnackBar
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.loadEmployees();
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  onSearchChange(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchTerm);
  }

  private currencyFormatter(params: ValueFormatterParams): string {
    if (!params.value) return '₹0';
    return `₹${params.value.toLocaleString('en-IN')}`;
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        const normalizedData = data.map((employee: Employee & { debtAmount?: number; pendingSalary?: number }) => {
          const salary = Number((employee as any).salary) || 0;
          const debtAmount = Number((employee as any).debtAmount) || 0;
          const pendingSalary = Math.max(0, salary - debtAmount);
          return {
            ...(employee as any),
            salary,
            debtAmount,
            pendingSalary
          };
        });

        let filteredData = normalizedData;

        if (this.searchTerm) {
          const searchLower = this.searchTerm.toLowerCase();
          filteredData = normalizedData.filter((employee: Employee) =>
            employee.name.toLowerCase().includes(searchLower) ||
            employee.phoneNumber.includes(this.searchTerm)
          );
        }

        this.rowData = filteredData;
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', filteredData);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.snackBar.open('Error loading employees', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  onAddClick(): void {
    const dialogRef = this.dialog.open(EmployeeFormDialogComponent,

      {
        autoFocus: false,
        restoreFocus: false,
        width: '700px',
        height: '80vh',
        data: { isEdit: false }
      });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employeeService.createEmployee({
          ...result,
          clientId: this.clientId
        }).subscribe({
          next: () => {
            this.snackBar.open('Employee added successfully', 'Close', { duration: 3000 });
            this.loadEmployees();
          },
          error: (error) => {
            console.error('Error adding employee:', error);
            this.snackBar.open(error?.error?.message, 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  onEditClick(id: string): void {
    const employee = this.rowData.find(item => item._id === id);
    if (!employee) {
      this.snackBar.open('Employee not found', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    this.zone.run(() => {
      const dialogRef = this.dialog.open(EmployeeFormDialogComponent, {
        width: '700px',
        height: '80vh',
        data: {
          isEdit: true,
          employee: { ...employee }
        }
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.loading = true;
          this.employeeService.updateEmployee(employee._id, result).subscribe({
            next: () => {
              this.snackBar.open('Employee updated successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadEmployees();
            },
            error: (error) => {
              this.snackBar.open(error?.error?.message, 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
              this.loading = false;
            }
          });
        }
      });
    });
  }

  onDeleteClick(id: string): void {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      this.loading = true;
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.snackBar.open('Employee deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          this.snackBar.open('Error deleting employee. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }
}

import { Component, ElementRef, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { ColDef, GridReadyEvent, GridApi, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { StockService, Stock } from '../../services/stock.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';


const environment = {
  apiUrl: 'https://richmill-git-main-richmill123s-projects.vercel.app/api'
};

@Component({
  selector: 'app-stocking',
  standalone: true,
  imports: [
    AgGridModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './stocking.component.html',
  styleUrls: ['./stocking.component.scss']
})
export class StockingComponent implements OnInit {
  private gridApi!: GridApi;
  public clientId = JSON.parse(sessionStorage.getItem('user') || '');

  rowData: any[] = [];
  loading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  columnDefs: ColDef[] = [
    {
      field: 'itemType',
      headerName: 'Item Type',
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      field: 'availableQuantity',
      headerName: 'Available Quantity',
      sortable: true,
      filter: true,
      width: 150,
      valueFormatter: this.quantityFormatter
    },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      sortable: true,
      valueFormatter: this.dateFormatter,
      width: 200
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
    private stockService: StockService,
    private dialog: MatDialog,
    private zone: NgZone,
    private snackBar: MatSnackBar
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.loadStocks();
    });
  }

  ngOnInit(): void {
    this.loadStocks();
  }

  onSearchChange(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchTerm);
  }

  private quantityFormatter(params: ValueFormatterParams): string {
    return params.value ? `${params.value} Bags` : '0 Bags';
  }

  private dateFormatter(params: ValueFormatterParams): string {
    if (!params.value) return 'N/A';
    return new Date(params.value).toLocaleString();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.loadStocks();
  }

  loadStocks(): void {
    this.loading = true;
    this.stockService.getStocks().subscribe({
      next: (data) => {
        let filteredData = data;

        if (this.searchTerm) {
          const searchLower = this.searchTerm.toLowerCase();
          filteredData = data.filter((stock: Stock) =>
            stock.itemType.toLowerCase().includes(searchLower)
          );
        }

        this.rowData = filteredData;
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', filteredData);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stocks:', error);
        this.snackBar.open('Error loading stocks', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  onAddClick(): void {
    const dialogRef = this.dialog.open(StockFormAddDialogComponent, {
      width: '500px',
      height: '300px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.stockService.createStock({
          ...result,
          clientId: this.clientId
        }).subscribe({
          next: () => {
            this.snackBar.open('Stock added successfully', 'Close', { duration: 3000 });
            this.loadStocks();
          },
          error: (error) => {
            console.error(error?.error?.message, error);
            this.snackBar.open(error?.error?.message, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  onEditClick(id: string): void {
    const stock = this.rowData.find(item => item._id === id);
    if (!stock) {
      this.snackBar.open('Stock item not found', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    this.zone.run(() => {
      const dialogRef = this.dialog.open(StockFormDialogComponent, {
        width: '500px',
        height: '300px',
        data: { stock: { ...stock } },
        ariaLabel: 'Edit Stock Item',
        role: 'dialog',
        autoFocus: false,
        restoreFocus: true
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.loading = true;
          this.stockService.updateStock(stock._id, {
            quantity: result.availableQuantity,
            clientId: this.clientId
          }).subscribe({
            next: () => {
              this.snackBar.open('Stock updated successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadStocks();
            },
            error: (error) => {
              console.error('Error updating stock:', error);
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
    if (confirm('Are you sure you want to delete this stock item? This action cannot be undone.')) {
      this.loading = true;
      this.stockService.deleteStock(id).subscribe({
        next: () => {
          this.snackBar.open('Stock deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadStocks();
        },
        error: (error) => {
          console.error('Error deleting stock:', error);
          this.snackBar.open('Error deleting stock. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }
}

@Component({
  selector: 'app-stock-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
   <h2 mat-dialog-title style="box-shadow: 0 0 4px #0000004d;">
  Edit Stock
</h2>

<mat-dialog-content class="dialog-content">
  <form [formGroup]="form" class="dialog-form" >
  <div class="formInnerWrap">

    <mat-form-field appearance="outline" style="width: 100% !important;">
      <mat-label>Item Type</mat-label>
      <mat-select formControlName="itemType">
        <mat-option *ngFor="let type of itemTypes" [value]="type">
            {{ type | titlecase }}
        </mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" style="width: 100% !important;">
      <mat-label>Available Quantity (Bags)</mat-label>
      <input matInput type="number" formControlName="availableQuantity">
      <span matSuffix>Bags</span>
    </mat-form-field>

    </div>

  </form>
</mat-dialog-content>

<mat-dialog-actions align="end" style="box-shadow: 0 0 4px #0000004d;">
  <button mat-button (click)="onCancel()">Cancel</button>
  <button
    mat-raised-button
    color="primary"
    (click)="onSave()"
    [disabled]="form.invalid">
     Update
  </button>
</mat-dialog-actions>

  `
})

export class StockFormDialogComponent {
  loading = false;

  itemTypes = ['bran', 'husk', 'black rice', 'broken rice', 'Karika', 'others'];
  form: FormGroup;
  @ViewChild('quantityInput') quantityInput: ElementRef<HTMLInputElement> | undefined;


  constructor(
    private fb: FormBuilder, public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<StockFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private elementRef: ElementRef
  ) {

    this.form = this.fb.group({
      itemType: [
        { value: data?.stock?.itemType || '' },
        Validators.required
      ],
      availableQuantity: [
        data?.stock?.availableQuantity || 0,
        [Validators.required, Validators.min(0)]
      ]
    });
    this.dialogRef.afterOpened().subscribe(() => {
      this.ngOnInit();
    });
  }
  ngOnInit() {
    if (this.data?.stock) {
      const itemType = this.itemTypes.find(
        type => type.toLowerCase() === this.data.stock.itemType?.toLowerCase()
      );
      setTimeout(() => {
        this.form.patchValue({
          itemType: itemType || '',
          availableQuantity: this.data.stock.availableQuantity || 0
        });

        if (itemType) {
          this.form.get('itemType')?.disable();
        }

        this.cdr.detectChanges();
      });
    }
  }

  onSave() {
    this.dialogRef.close(this.form.getRawValue());
  }

  onCancel() {
    this.dialogRef.close();
  }
}


@Component({
  selector: 'app-stock-form-add-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
   <h2 mat-dialog-title style="box-shadow: 0 0 4px #0000004d;">
  Add Stock
</h2>

<mat-dialog-content class="dialog-content">
  <form [formGroup]="form" class="dialog-form">
<div class="formInnerWrap">
    <mat-form-field appearance="outline" style="width: 100% !important;">
      <mat-label>Item Type</mat-label>
      <mat-select formControlName="itemType" >
        <mat-option *ngFor="let type of itemTypes" [value]="type">
          {{ type | titlecase }}
        </mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" style="width: 100% !important;">
      <mat-label>Available Quantity (Bags)</mat-label>
      <input matInput type="number" formControlName="availableQuantity">
      <span matSuffix>Bags</span>
    </mat-form-field>
    </div>

  </form>
</mat-dialog-content>

<mat-dialog-actions align="end" style="box-shadow: 0 0 4px #0000004d;">
  <button mat-button (click)="onCancel()">Cancel</button>
  <button
    mat-raised-button
    color="primary"
    (click)="onSave()"
    [disabled]="form.invalid">
     Save
  </button>
</mat-dialog-actions>

  `
})

export class StockFormAddDialogComponent {
  loading = false;

  itemTypes = ['bran', 'husk', 'black rice', 'broken rice', 'Karika', 'others'];
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<StockFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.form = this.fb.group({
      itemType: [
        { value: '' },
        Validators.required
      ],
      availableQuantity: [
        0,
        [Validators.required, Validators.min(0)]
      ]
    });
  }


  onSave() {
    this.dialogRef.close(this.form.getRawValue());
  }

  onCancel() {
    this.dialogRef.close();
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Expense, PaymentMethod } from '../../../services/expense.service';

export type IncomeDialogResult = {
  item: string;
  description?: string;
  amount: number;
  date: string;
};

@Component({
  selector: 'app-income-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './income-form-dialog.component.html',
  styleUrls: ['./income-form-dialog.component.scss']
})
export class IncomeFormDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;

  readonly paymentMethods: PaymentMethod[] = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<IncomeFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { isEdit: boolean; expense?: Expense }
  ) {
    const today = new Date().toISOString().slice(0, 10);

    this.form = this.fb.group({
      item: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      amount: [0, [Validators.required, Validators.min(0)]],
      date: [today, [Validators.required]]
    });

    this.dialogRef.afterOpened().subscribe(() => {
      this.ngOnInit();
    });
  }

  ngOnInit(): void {
    if (this.data?.isEdit && this.data.expense) {
      const e = this.data.expense;
      this.form.patchValue({
        item: e.item ?? '',
        description: e.description ?? '',
        amount: Number(e.amount ?? 0),
        date: (e.date ?? '').slice(0, 10)
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'OK', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading = true;

    const raw = this.form.getRawValue();

    const result: IncomeDialogResult = {
      item: String(raw.item).trim(),
      description: raw.description ? String(raw.description).trim() : '',
      amount: Number(raw.amount ?? 0),
      date: String(raw.date).trim()
    };

    setTimeout(() => {
      this.dialogRef.close(result);
      this.loading = false;
    }, 100);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

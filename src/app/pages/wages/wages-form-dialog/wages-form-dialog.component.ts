import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Wage } from '../../../services/wages.service';

export type WagesDialogResult = {
  employeeId: string;
  employeeName: string;
  advanceWage: number;
  totalWage: number;
  typeOfWork: 'boiling' | 'splitting' | 'other';
  machineType: 'Electric' | 'Manual' | 'Hybrid';
  date: string;
  advanceamount: string;
  notes?: string;
  bags: number;
};

@Component({
  selector: 'app-wages-form-dialog',
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
  templateUrl: './wages-form-dialog.component.html',
  styleUrls: ['./wages-form-dialog.component.scss']
})
export class WagesFormDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;

  readonly workTypes: string[] = ['boiling', 'splitting', 'other'];
  readonly machineTypes: string[] = ['Electric', 'Manual', 'Hybrid'];
  private readonly objectIdPattern = /^[a-f\d]{24}$/i;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WagesFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { isEdit: boolean; wage?: Wage }
  ) {
    const today = new Date().toISOString().slice(0, 10);
    this.form = this.fb.group({
      employeeId: ['', [Validators.required]],
      employeeName: ['', [Validators.required, Validators.minLength(2)]],
      advanceWage: [0, [Validators.required, Validators.min(0)]],
      totalWage: [0, [Validators.required, Validators.min(0)]],
      bags: [0, [Validators.required, Validators.min(0)]],
      typeOfWork: ['other', [Validators.required]],
      machineType: ['Hybrid', [Validators.required]],
      date: [today, [Validators.required]],
      debt: [''],
      notes: ['']
    }, {
      validators: [this.advanceLessThanTotalValidator]
    });

    this.dialogRef.afterOpened().subscribe(() => {
      this.ngOnInit();
    });
  }

  ngOnInit(): void {
    if (this.data?.isEdit && this.data.wage) {
      const w = this.data.wage;
      this.form.patchValue({
        employeeId: w.employeeId ?? '',
        employeeName: w.employeeName ?? '',
        advanceWage: Number(w.advanceWage ?? 0),
        totalWage: Number(w.totalWage ?? 0),
        typeOfWork: w.typeOfWork ?? 'other',
        machineType: w.machineType ?? 'Hybrid',
        date: (w.date ?? '').slice(0, 10),
        debt: w.advanceamount,
        bags: w.bags,
        notes: w.notes ?? ''
      });
    }
  }

  private advanceLessThanTotalValidator(group: AbstractControl): ValidationErrors | null {
    const total = Number(group.get('totalWage')?.value ?? 0);
    const advance = Number(group.get('advanceWage')?.value ?? 0);
    if (Number.isNaN(total) || Number.isNaN(advance)) return null;
    return advance > total ? { advanceExceedsTotal: true } : null;
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

    const result: WagesDialogResult = {
      employeeId: String(raw.employeeId).trim(),
      employeeName: String(raw.employeeName).trim(),
      advanceWage: Number(raw.advanceWage ?? 0),
      totalWage: Number(raw.totalWage ?? 0),
      typeOfWork: String(raw.typeOfWork).trim() as WagesDialogResult['typeOfWork'],
      machineType: String(raw.machineType).trim() as WagesDialogResult['machineType'],
      date: String(raw.date).trim(),
      advanceamount: String(raw.debt),
      bags: raw.bags,
      notes: raw.notes ? String(raw.notes).trim() : ''
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

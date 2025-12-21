import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './employee-form-dialog.component.html',
  styleUrls: ['./employee-form-dialog.component.scss']
})
export class EmployeeFormDialogComponent implements OnInit {
  form: FormGroup;
  minDate: Date;
  maxDate: Date;
  loading = false;

  private readonly allowedGenders = ['Male', 'Female', 'Other'] as const;
  private readonly allowedMaritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

  constructor(
    private fb: FormBuilder, public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<EmployeeFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { isEdit: boolean, employee?: any }
  ) {
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 70, 0, 1);
    this.maxDate = new Date(currentYear - 18, 11, 31);

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      gender: ['', Validators.required],
      address: ['', Validators.required],
      dob: [null, Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      emergencyContactNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      maritalStatus: ['', Validators.required],
      salary: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.employee) {
      const employeeData = {
        ...this.data.employee,
        gender: this.normalizeSelectValue(this.data.employee.gender, this.allowedGenders),
        maritalStatus: this.normalizeSelectValue(this.data.employee.maritalStatus, this.allowedMaritalStatuses),
        dob: this.data.employee.dob ? new Date(this.data.employee.dob) : null,
        salary: Number(this.data.employee.salary) || 0
      };

      setTimeout(() => {
        this.form.patchValue(employeeData);
        this.cdr.detectChanges();
      });
    }
  }

  onSave(): void {
    if (this.form.valid) {
      this.loading = true;
      const formValue = {
        ...this.form.value,
        dob: this.form.value.dob ? this.formatDate(this.form.value.dob) : null
      };

      setTimeout(() => {
        this.dialogRef.close(formValue);
        this.loading = false;
      }, 100);
    } else {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'OK', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  private normalizeSelectValue<T extends readonly string[]>(
    value: unknown,
    allowed: T
  ): T[number] | '' {
    if (typeof value !== 'string') return '';
    const normalized = value.trim().toLowerCase();
    const match = allowed.find(v => v.toLowerCase() === normalized);
    return (match ?? '') as T[number] | '';
  }
}
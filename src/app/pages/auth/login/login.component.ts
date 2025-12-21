import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorDialogComponent } from '../../../shared/components/error-dialog/error-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ErrorDialogComponent
  ],
  providers: [HttpClient],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  hidePassword = true;
  isLoading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const isLoggedIn = false;
    if (isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.isLoading = true;
    this.error = null;

    const loginData = {
      username: this.username,
      password: this.password
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    this.http.post<any>('https://richmill-git-main-richmill123s-projects.vercel.app/api/admins/login', loginData, httpOptions)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isLoading = false;
          let errorMessage = 'An error occurred during login.';
          
          if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
          } else {
            errorMessage = error.error?.message || error.message || 'Server error occurred';
            if (error.status === 401) {
              errorMessage = 'Invalid username or password';
            } else if (error.status === 0) {
              errorMessage = 'Unable to connect to the server. Please check your connection.';
            }
          }
          
          this.error = errorMessage;
          this.dialog.open(ErrorDialogComponent, {
            width: '350px',
            data: { message: errorMessage }
          });
          return throwError(() => new Error(errorMessage));
        })
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.token) {
            sessionStorage.setItem('auth_token', response.token);
            sessionStorage.setItem('user', JSON.stringify(this.username?.split('/')[0]));
          }
          
          this.toastr.success('Login successful!', 'Success', {
            timeOut: 3000,
            positionClass: 'toast-top-right',
            closeButton: true
          });
          this.router.navigate(['/dashboard']);
        }
      });
  }
}
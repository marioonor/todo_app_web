import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../service/auth.service'; 
// import { AuthenService } from '../guards/AuthService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, FormsModule], 
  standalone: true,
})
export class LoginComponent {
  credentials = {
    username: '',
    password: '',
  };
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService, 
    // private authenService: AuthenService, 
    private router: Router
  ) {}

  onSubmit(loginForm: NgForm): void {
    this.errorMessage = null;
    this.isLoading = true;

    if (loginForm.invalid) {
      Object.values(loginForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      this.isLoading = false;
      return;
    }

    this.authService.login(this.credentials).subscribe({
      next: (user) => { 
        this.isLoading = false;
        console.log('Login successful (via AuthService), user details:', user);

        if (user && user.token) {
          const redirectUrl = this.authService.redirectUrl || '/todo-list';
          this.authService.redirectUrl = null; 
          this.router.navigate([redirectUrl]);
        } else {
          console.error('Login successful, but no token was found in the response from AuthService.');
          this.errorMessage = 'Authentication failed: User data or token not provided by the server after login.';
        }

      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Login error (from LoginComponent):', error);
        this.errorMessage = null
        if (error.error) {
          if (typeof error.error === 'object') {
            if (error.error.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
              this.errorMessage = error.error.errors.map((err: any) => {
                let field = err.field ? `${err.field.charAt(0).toUpperCase() + err.field.slice(1)}: ` : '';
                return field + (err.defaultMessage || 'validation error');
              }).join('; ');
            } else if (error.error.message && typeof error.error.message === 'string') {
              this.errorMessage = error.error.message;
            }
          } else if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          }
        } 

        if (!this.errorMessage) { 
          if (error.status === 400) {
            this.errorMessage = 'Invalid request. Please check your input fields.';
          } else if (error.status === 401) {
            this.errorMessage = 'Unauthorized: Incorrect email or password.';
          } else if (error.status === 0 || error.status === -1) { 
            this.errorMessage = 'Could not connect to the server. Please check your network or if the server is running.';
          } else {
            this.errorMessage = `An unexpected error occurred (Status: ${error.status}). Please try again.`;
          }
        }
      },
    });
  }
}

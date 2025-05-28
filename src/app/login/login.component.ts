import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms'; // Adjust path as needed
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, FormsModule], // Import CommonModule and FormsModule for template-driven forms
  standalone: true,
})
export class LoginComponent {
  credentials = {
    username: '',
    password: '',
  };
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(loginForm: NgForm): void {
    this.errorMessage = null;
    this.isLoading = true;

    if (loginForm.invalid) {
      // Mark all fields as touched to show validation errors if not already visible
      Object.values(loginForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      // Also ensure the form itself is marked as submitted for ngClass conditions
      // loginForm.form.markAsSubmitted(); // ngForm does this automatically on submit event
      this.isLoading = false;
      return;
    }

    this.authService.login(this.credentials).subscribe({
      next: (user) => {
        // AuthService.login() should ideally return UserResponse or similar
        this.isLoading = false;
        console.log('Login successful, user:', user);

        // Navigate to the todo-list page
        this.router.navigate(['/todo-list']); // Make sure '/todo-list' is a defined route
      },
      error: (error: HttpErrorResponse) => {
        // This is where your line 46 log comes from
        this.isLoading = false;
        console.error('Login error (from LoginComponent):', error);
        this.errorMessage = null
        if (error.error) {
          if (typeof error.error === 'object') {
            // Spring Boot validation errors often have a 'message' and an 'errors' array
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

        if (!this.errorMessage) { // Fallback messages if no specific message was extracted
          if (error.status === 400) {
            this.errorMessage = 'Invalid request. Please check your input fields.';
          } else if (error.status === 401) {
            this.errorMessage = 'Unauthorized: Incorrect email or password.';
          } else if (error.status === 0 || error.status === -1) { // -1 for some fetch errors
            this.errorMessage = 'Could not connect to the server. Please check your network or if the server is running.';
          } else {
            this.errorMessage = `An unexpected error occurred (Status: ${error.status}). Please try again.`;
          }
        }
      },
    });
  }
}

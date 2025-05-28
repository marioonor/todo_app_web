import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

// It's good practice to define interfaces for your data structures.
// These can also be in a separate `models.ts` file.
interface RegistrationPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UserResponse {
  id: number; // Or string, depending on your backend ID type
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  // Note: Avoid returning sensitive data like passwords, even hashed, if not needed by the client.
  // The current backend returns the full Users entity, so this matches.
}

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterLink],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  firstName: string = '';
  lastName: string = '';
  showpassword: boolean = false;

  private apiUrl = 'http://localhost:8080/auth/register';

  constructor(private router: Router, private http: HttpClient) {}

  togglePassword() {
    this.showpassword = !this.showpassword;
  }

  onRegister() {
    if (
      !this.username ||
      !this.email ||
      !this.password ||
      !this.firstName ||
      !this.lastName
    ) {
      alert('Please fill in all fields');
      return;
    }

    const userData: RegistrationPayload = {
      username: this.username,
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
    };

    this.http.post<UserResponse>(this.apiUrl, userData).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        // Provide more specific feedback
        alert(`Registration successful for ${response.username}! You can now log in.`);
        this.router.navigate(['/login']);
      },
      error: (err) => { // Changed variable name for clarity
        console.error('Registration failed', err);
        let errorMessage = 'Registration failed. Please try again.';

        if (err.error) {
          if (err.error.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
            // Handle Spring Boot validation errors (if backend sends them this way)
            errorMessage = err.error.errors.map((e: any) => e.defaultMessage || 'Validation error').join('\n');
          } else if (err.error.message && typeof err.error.message === 'string') {
            // Handle custom error messages from backend, e.g., { "message": "User already exists" }
            errorMessage = err.error.message;
          } else if (typeof err.error === 'string') {
            // Handle if the error body itself is a plain string
            errorMessage = err.error;
          }
        } else if (err.message && typeof err.message === 'string') {
          // Fallback to the HttpErrorResponse message
          errorMessage = err.message;
        }
        alert(errorMessage);
      },
    });
  }
}

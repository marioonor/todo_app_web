import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface RegistrationPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UserResponse {
  id: number; 
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterLink, RouterModule],
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

  imagePath: string = 'assets/images/image.png';
  imageanimatedPath: string = 'assets/images/homelogo.gif';

  // private apiUrl = 'http://34.238.44.249:8080/auth/register';
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
        alert(`Registration successful for ${response.username}! You can now log in.`);
        this.router.navigate(['/login']);
      },
      error: (err) => { 
        console.error('Registration failed', err);
        let errorMessage = 'Registration failed. Please try again.';

        if (err.error) {
          if (err.error.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
            errorMessage = err.error.errors.map((e: any) => e.defaultMessage || 'Validation error').join('\n');
          } else if (err.error.message && typeof err.error.message === 'string') {
            errorMessage = err.error.message;
          } else if (typeof err.error === 'string') {
            errorMessage = err.error;
          }
        } else if (err.message && typeof err.message === 'string') {
          errorMessage = err.message;
        }
        alert(errorMessage);
      },
    });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}

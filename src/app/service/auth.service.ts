import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { RegistrationPayload, UserResponse } from '../models/auth.models';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authApiUrl = `${environment.apiUrl}/auth`; // Base URL for auth endpoints
  private currentUserKey = 'currentUser'; // Key for storing user in localStorage

  private currentUserSubject: BehaviorSubject<UserResponse | null>;
  public currentUser: Observable<UserResponse | null>;

  constructor(private http: HttpClient, private router: Router) { 
    const storedUser = localStorage.getItem(this.currentUserKey);
    this.currentUserSubject = new BehaviorSubject<UserResponse | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  register(userData: RegistrationPayload): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${this.authApiUrl}/register`,
      userData
    );
  }

  login(
    credentials: Pick<RegistrationPayload, 'username' | 'password'>
  ): Observable<UserResponse> {
    return this.http
      .post<UserResponse>(`${this.authApiUrl}/login`, credentials) // <--- Correctly uses POST
      .pipe(
        tap((user) => {
          // Assuming the login response includes the UserResponse object
          if (user && user.id) {
            // Check if user data is valid
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
          } else {
            // Handle cases where login is successful but user data is not as expected
            // Or if the backend returns a different structure for login success (e.g., just a token)
            // you might need another call to fetch user details.
            // For this example, we assume UserResponse is returned.
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.currentUserKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getLoggedInUserFirstName(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.firstName : null;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}

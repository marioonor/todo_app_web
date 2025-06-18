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
  private authApiUrl = `${environment.apiUrl}/auth`;
  private currentUserKey = 'currentUser';

  private currentUserSubject: BehaviorSubject<UserResponse | null>;
  public currentUser: Observable<UserResponse | null>;

  public redirectUrl: string | null = null;

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
      .post<UserResponse>(`${this.authApiUrl}/login`, credentials)
      .pipe(
        tap((user) => {
          if (user && user.token) {
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
            if (!user.id && environment.production === false) {
              console.warn('AuthService: Login successful and token received, but user.id is missing in the response. Full user details may not be available. Backend should ideally provide a complete UserResponse including user ID.', user);
            }
          } else {
            console.error('AuthService: Login response did not contain a user object or a token. User authentication state not updated.', user);
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

  public getCurrentUserValue(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}

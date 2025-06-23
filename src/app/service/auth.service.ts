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
  private static readonly CURRENT_USER_KEY = 'currentUser';

  private currentUserSubject: BehaviorSubject<UserResponse | null>;
  public currentUser: Observable<UserResponse | null>;

  public redirectUrl: string | null = null;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem(AuthService.CURRENT_USER_KEY);
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
          console.log('[AuthService login] User response from backend:', user);
          if (user && user.token) {
            localStorage.setItem(
              AuthService.CURRENT_USER_KEY,
              JSON.stringify(user)
            );
            this.currentUserSubject.next(user);
            if (!user.id && environment.production === false) {
              console.warn(
                'AuthService: Login successful and token received, but user.id is missing in the response. Full user details may not be available. Backend should ideally provide a complete UserResponse including user ID.',
                user
              );
            }
          } else {
            console.error(
              'AuthService: Login response did not contain a user object or a token. User authentication state not updated.',
              user
            );
          }
        })
      );
  }

  getToken(): string | null {
    const storedUser = localStorage.getItem(AuthService.CURRENT_USER_KEY);
    if (storedUser) {
      try {
        const user: UserResponse = JSON.parse(storedUser);
        // Add a log here to see the parsed user and its token
        console.log('[AuthService getToken] Parsed user from localStorage:', user);
        return user?.token || null; // Use optional chaining for safety
      } catch (e) {
        console.error('[AuthService getToken] Error parsing user from localStorage:', e);
        localStorage.removeItem(AuthService.CURRENT_USER_KEY); // Clear corrupted item
        return null;
      }
    }
    console.log('[AuthService getToken] No stored user found in localStorage.');
    return null;
  }

  logout(): void {
    localStorage.removeItem(AuthService.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getLoggedInUserFirstName(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.username : null;
  }

  public getCurrentUserValue(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}

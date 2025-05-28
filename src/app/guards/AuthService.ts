import { Injectable, isDevMode, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
    providedIn: 'root',
})
export class AuthenService {
    private authTokenKey = 'authToken'; // Key for storing the token in localStorage
    private currentUserToken: string | null = null;

    public logoutEvent: EventEmitter<void> = new EventEmitter<void>();
    redirectUrl: string | null = null;

    constructor(private router: Router) {
        if (typeof window !== 'undefined' && window.localStorage) {
            this.currentUserToken = localStorage.getItem(this.authTokenKey);
        } else {
            if (isDevMode()) {
                console.warn('AuthenService: Local Storage is not available. Auth token will not persist across sessions.');
            }
        }
    }

    Login(token: string): void {
        if (!token) {
            console.error('AuthenService: Login(token) called without a token.');
            return;
        }
        this.currentUserToken = token;
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(this.authTokenKey, token);
            if (isDevMode()) {
                console.log('AuthenService: User token stored. User is now considered logged in.');
            }
        } else {
            if (isDevMode()) {
                console.warn('AuthenService: Local Storage is not available. Token not persisted.');
            }
        }
    }

    Logout(): void {
        const wasLoggedIn = this.isUserLoggedIn(); // Check before clearing
        this.currentUserToken = null;
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(this.authTokenKey);
        } else {
            if (isDevMode()) {
                console.warn('AuthenService: Local Storage is not available. Token not removed from persistence.');
            }
        }
        if (isDevMode()) {
            console.log('AuthenService: User logged out. Token removed.');
        }
        if (wasLoggedIn) {
            this.logoutEvent.emit();
        }
        this.router.navigate(['/login']);
    }

    isUserLoggedIn(): boolean {
        return !!this.currentUserToken;
    }
}
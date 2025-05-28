import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from "@angular/router";
import { AuthService } from "../service/auth.service"; // Corrected import path and service name
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { } // Corrected service type

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        // The 'state.url' is the URL the user is trying to access.
        return this.checkLogin(state.url);
    }

    checkLogin(url: string): boolean | UrlTree {
        if (this.authService.isAuthenticated()) { // Use isAuthenticated() from AuthService
          console.log(`AuthGuard: User is authenticated. Allowing access to ${url}.`);  
          return true;
        }

        // Store the attempted URL for redirecting
        this.authService.redirectUrl = url;
        console.log(`AuthGuard: User not authenticated. Attempted URL: ${url}. Redirecting to /login.`);

        // Redirect to the login page
        return this.router.parseUrl('/login');
    }
}
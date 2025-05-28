import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from "@angular/router";
import { AuthenService } from "./AuthService";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
})

export class AuthGuard implements CanActivate {
    constructor(private authService: AuthenService, private router: Router) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        return this.checkLogin(state.url);
    }

    checkLogin(url: string): boolean | UrlTree {
        if (this.authService.isUserLoggedIn()) {
            return true;
        }
        // Store the attempted URL for redirecting
        this.authService.redirectUrl = url;

        // Redirect to the login page
        return this.router.parseUrl('/login');
    }
}
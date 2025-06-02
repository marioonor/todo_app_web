import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../service/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    _next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    return this.checkLogin(state.url);
  }

  checkLogin(url: string): boolean | UrlTree {
    const isAuthenticated = this.authService.isAuthenticated();
    console.log(
      `[AuthGuard] checkLogin for URL: ${url}. User authenticated: ${isAuthenticated}`
    );

    if (isAuthenticated) {
      console.log(
        `[AuthGuard] User is authenticated. Allowing access to ${url}.`
      );
      return true;
    }

    this.authService.redirectUrl = url;
    console.log(
      `[AuthGuard] User not authenticated. Attempted URL: ${url}. Redirecting to /login.`
    );

    return this.router.parseUrl('/home');
  }
}

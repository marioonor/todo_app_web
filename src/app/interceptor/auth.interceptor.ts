import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../service/auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  // intercept(
  //   req: HttpRequest<any>,
  //   next: HttpHandler
  // ): Observable<HttpEvent<any>> {
  //   const currentUser = this.authService.getCurrentUserValue();
  //   const token = currentUser?.token;
  //   console.log('[AuthInterceptor] Intercepting request to:', req.url);
  //   console.log('[AuthInterceptor] Current User:', currentUser);
  //   console.log('[AuthInterceptor] Token:', token);
  //   console.log('[AuthInterceptor] environment.apiUrl:', environment.apiUrl);

  //   const targetApiPrefix = environment.apiUrl + '/api/';
  //   const isApiRequest = req.url.startsWith(targetApiPrefix);

  //   console.log(
  //     `[AuthInterceptor] Checking if request URL "${req.url}" starts with "${targetApiPrefix}". Result: ${isApiRequest}`
  //   );

  //   if (token && isApiRequest) {
  //     req = req.clone({
  //       setHeaders: { Authorization: `Bearer ${token}` },
  //     });
  //     console.log('[AuthInterceptor] Added Authorization header to:', req.url);
  //   } else {
  //     if (!token && isApiRequest) {
  //       console.warn(
  //         '[AuthInterceptor] No token found. Authorization header NOT added for API URL:',
  //         req.url
  //       );
  //     } else if (token && !isApiRequest) {
  //       console.log(
  //         '[AuthInterceptor] Token present, but request is NOT for a designated API URL. Header NOT added for:',
  //         req.url
  //       );
  //     } else if (!token && !isApiRequest) {
  //       console.log(
  //         '[AuthInterceptor] No token and not an API request. Header NOT added for:',
  //         req.url
  //       );
  //     }
  //   }
  //   return next.handle(req);
  // }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.authService.getToken(); // or however you get the token
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(authReq);
}
}

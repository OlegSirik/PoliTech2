import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const bffInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const outgoing = req.url.startsWith('/bff') ? req.clone({ withCredentials: true }) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      const isSessionProbe = req.url.includes('/bff/login') || req.url.includes('/bff/session');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isSessionProbe) {
        auth.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};

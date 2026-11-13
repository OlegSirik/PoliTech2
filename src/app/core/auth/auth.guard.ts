import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const decide = (authenticated: boolean) => authenticated
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  if (auth.sessionKnown()) {
    return decide(auth.isAuthenticated());
  }
  return auth.restore().pipe(map((user) => decide(user !== null)));
};

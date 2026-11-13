import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { LoginRequest, SessionUser, SessionView } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<SessionUser | null>(null);
  private readonly known = signal(false);
  private restore$: Observable<SessionUser | null> | null = null;

  readonly user = this.session.asReadonly();

  isAuthenticated(): boolean {
    return this.session() !== null;
  }

  sessionKnown(): boolean {
    return this.known();
  }

  restore(): Observable<SessionUser | null> {
    if (this.known()) {
      return of(this.session());
    }
    if (!this.restore$) {
      this.restore$ = this.http.get<SessionView>('/bff/session').pipe(
        map((view) => this.apply(view)),
        catchError(() => {
          this.session.set(null);
          this.known.set(true);
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this.restore$;
  }

  login(request: LoginRequest): Observable<SessionUser> {
    return this.http.post<SessionView>('/bff/login', {
      tenantCode: request.tenant.trim(),
      userLogin: request.login.trim(),
      password: request.password,
      clientId: request.clientId?.trim() || null,
    }).pipe(
      map((view) => {
        const user = this.apply(view);
        if (!user) {
          throw new Error('Сессия не создана');
        }
        return user;
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post('/bff/logout', {}).pipe(
      catchError(() => of(null)),
      tap(() => this.clear()),
      map(() => undefined),
    );
  }

  clear(): void {
    this.session.set(null);
    this.known.set(true);
    this.restore$ = null;
  }

  private apply(view: SessionView): SessionUser | null {
    if (!view.authenticated || !view.userLogin || !view.tenantCode) {
      this.session.set(null);
      this.known.set(true);
      return null;
    }
    const user: SessionUser = {
      login: view.userLogin,
      displayName: view.userLogin,
      tenant: view.tenantCode,
      role: view.clientId || 'PoliTechAPI',
    };
    this.session.set(user);
    this.known.set(true);
    return user;
  }
}

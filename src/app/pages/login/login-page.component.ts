import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { TenantContext } from '../../core/tenant/tenant-context';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle/theme-toggle.component';
import { bffErrorMessage } from '../../core/bff/bff-error';

@Component({
  selector: 'pt-login-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ThemeToggleComponent,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tenant = inject(TenantContext);

  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    tenant: ['', Validators.required],
    login: ['', Validators.required],
    clientId: ['sys'],
    password: ['', Validators.required],
  });

  constructor() {
    if (!this.tenant.code().trim()) {
      this.tenant.set('demo');
      void this.router.navigate(['/login'], { queryParamsHandling: 'preserve', replaceUrl: true });
    }
    this.form.controls.tenant.setValue(this.tenant.code() || 'demo');
    this.form.controls.clientId.setValue('sys');
    this.auth.restore().subscribe((user) => {
      if (user) {
        void this.router.navigateByUrl(this.safeReturnUrl());
      }
    });
  }

  protected submit(): void {
    const tenant = this.tenant.code().trim() || 'demo';
    this.tenant.set(tenant);
    this.form.controls.tenant.setValue(tenant);
    this.form.controls.clientId.setValue('sys');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl(this.safeReturnUrl());
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.error.set(bffErrorMessage(error, 'Не удалось войти'));
      },
    });
  }

  private safeReturnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
      return '/dashboard';
    }
    return value;
  }
}

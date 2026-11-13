import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
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

  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    tenant: ['SYS', Validators.required],
    login: ['', Validators.required],
    clientId: [''],
    password: ['', Validators.required],
  });

  constructor() {
    this.auth.restore().subscribe((user) => {
      if (user) {
        void this.router.navigateByUrl(this.safeReturnUrl());
      }
    });
  }

  protected submit(): void {
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

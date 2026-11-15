import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, UrlSerializer, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { bffInterceptor } from './core/bff/bff.interceptor';
import { TenantUrlSerializer } from './core/tenant/tenant-url-serializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    { provide: UrlSerializer, useClass: TenantUrlSerializer },
    provideHttpClient(withInterceptors([bffInterceptor])),
    provideAnimationsAsync(),
  ],
};

import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  NoPreloading,
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';

import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initApp } from './functions/init.function';

import { appRoutes } from './router/app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { SessionStore } from './stores/session.store';
import { intercept } from './functions/interceptor.function';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:10000', // registra dopo idle/10s
    }),

    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withPreloading(isDevMode() ? NoPreloading : PreloadAllModules)
    ),

    provideHttpClient(withInterceptors([(req, next) => intercept(req, next)])),

    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
    }),

    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' },

    provideAppInitializer(() => {
      const session = inject(SessionStore);
      session.hydrate();
      return initApp();
    }),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

import {
  HttpClient,
  provideHttpClient
} from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection
} from '@angular/core';
import {
  provideAnimationsAsync
} from '@angular/platform-browser/animations/async';
import {
  provideRouter
} from '@angular/router';
import {
  TranslateLoader,
  TranslateModule
} from '@ngx-translate/core';

import {
  routes
} from './app.routes';
import {
  HttpLoaderFactory
} from './shared/loaders/http-loader-factory';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({
      eventCoalescing: true
    }), provideRouter(routes), provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom([TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    })])
  ]
};

import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

import { AppComponent } from './src/app.component';

// Register the Arabic locale data to enable support for 'ar' locale.
registerLocaleData(localeAr);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    // Set the application's default locale to Arabic.
    { provide: LOCALE_ID, useValue: 'ar' }
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
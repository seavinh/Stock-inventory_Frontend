import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token.interceptor';
import { EN_TRANSLATIONS } from '../assets/i18n/en';
import { KM_TRANSLATIONS } from '../assets/i18n/km';

export class StaticTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    if (lang === 'km') {
      return of(KM_TRANSLATIONS);
    }
    return of(EN_TRANSLATIONS);
  }
}

export function HttpLoaderFactory() {
  return new StaticTranslateLoader();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor])
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory
        }
      })
    )
  ]
};
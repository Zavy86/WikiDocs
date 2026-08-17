import { ApplicationConfig, importProvidersFrom, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, SecurityContext } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter, withHashLocation } from '@angular/router';
import { MARKED_OPTIONS, provideMarkdown, SANITIZE } from 'ngx-markdown';
import { InformationService } from 'src/app/services/information.service';
import { ParserService } from 'src/app/services/parser.service';
import { ThemeService } from 'src/app/services/theme.service';
import { routes } from 'src/app/app.routes';

export const appConfig:ApplicationConfig = {
  providers: [
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-symbols-outlined' }
    },
    importProvidersFrom(MatSnackBarModule),
    provideAppInitializer(():Promise<void> => {
      inject(ThemeService).restore();
      const informationService:InformationService = inject(InformationService);
      void informationService.load();
      const parserService:ParserService = inject(ParserService);
      return parserService.loadMarkdownPlugins();
    }),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideMarkdown({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useValue: {
          gfm: true,
          breaks: false,
        },
      },
      sanitize: {
        provide: SANITIZE,
        useValue: SecurityContext.NONE,
      },
    }),
    provideRouter(routes, withHashLocation()),
  ],
};

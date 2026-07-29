import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from 'src/app/app.config';
import { App } from 'src/app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { installApiFetch } from './app/services/api-auth';
installApiFetch();
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

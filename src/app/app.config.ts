import { ApplicationConfig, isDevMode } from '@angular/core'; // Import isDevMode
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage'; // Import getStorage and provideStorage
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker'; // Import provideServiceWorker

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()), // Add provideStorage
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', { // Register the service worker
      enabled: !isDevMode(), // Enable only in production
      registrationStrategy: 'registerWhenStable:30000' // Register after 30 seconds of stability
    })
  ]
};

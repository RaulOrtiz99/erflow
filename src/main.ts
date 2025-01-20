// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import {SupabaseInitService} from './app/core/services/supabase-init.services';


// Configuración de la aplicación
const appConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    provideRouter(routes),
    // Inicializamos Supabase como un provider
    {
      provide: 'SUPABASE_INIT',
      useFactory: async (supabaseInit: SupabaseInitService) => {
        await supabaseInit.testConnection();
        return true;
      },
      deps: [SupabaseInitService]
    }
  ]
};

// Iniciamos la aplicación con la configuración
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));

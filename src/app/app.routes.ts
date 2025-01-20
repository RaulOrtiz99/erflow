// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
  },
  {
    path: 'rooms',
    loadChildren: () => import('./features/rooms/rooms.routes')
  },
  {
    path: 'diagram',
    loadChildren: () => import('./features/diagram/diagram.routes')
  }
];

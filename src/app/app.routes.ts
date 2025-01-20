import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.default)
  },
  {
    path: 'rooms',
    loadChildren: () => import('./features/rooms/rooms.routes').then(m => m.default)
  },
  {
    path: 'diagram',
    loadChildren: () => import('./features/diagram/diagram.routes').then(m => m.default)
  }
];

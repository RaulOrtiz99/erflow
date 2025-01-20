import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./components/room-list/room-list.component')
      .then(m => m.RoomListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/room-detail/room-detail.component')
      .then(m => m.RoomDetailComponent)
  }
] as Routes;

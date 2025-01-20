import { Routes } from '@angular/router';

export default [
  {
    path: ':roomId',
    loadComponent: () => import('./components/diagram-canvas/diagram-canvas.component')
      .then(m => m.DiagramCanvasComponent)
  }
] as Routes;

import { Routes } from '@angular/router';
import { ROUTE } from './routes/route';
import { baseRoutes } from './base.routes';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: `${ROUTE.BASE.BASE_PATH}`,
    pathMatch: 'full',
  },
  {
    path: ROUTE.BASE.BASE_PATH,
    loadComponent: () => import('../layouts/base-layout/base-layout.component'),
    children: baseRoutes,
  },
  { path: '**', redirectTo: ROUTE.BASE.HOME },
];

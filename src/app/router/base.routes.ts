import { Routes } from '@angular/router';
import { ROUTE } from './routes/route';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export const baseRoutes: Routes = [
  {
    path: '',
    redirectTo: `${ROUTE.BASE.HOME}`,
    pathMatch: 'full',
  },
  {
    path: ROUTE.BASE.HOME,
    loadComponent: () => import('../pages/home/home.component'),
  },
  {
    path: ROUTE.BASE.MEETINGS,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.MEETINGS`));
    },
    loadComponent: () => import('../pages/meetings/meetings.component'),
  },
  {
    path: `${ROUTE.BASE.MEETING}/:meetingKey`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.MEETING`));
    },
    loadComponent: () => import('../pages/meeting/meeting.component'),
  },
  {
    path: ROUTE.BASE.DRIVERS,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.DRIVERS`));
    },
    loadComponent: () => import('../pages/drivers/drivers.component'),
  },
  {
    path: `${ROUTE.BASE.SESSION}/:sessionKey`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.SESSION`));
    },
    loadComponent: () => import('../pages/session/session.component'),
  },
  {
    path: ROUTE.BASE.SETTINGS,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.SETTINGS`));
    },
    loadComponent: () => import('../pages/settings/settings.component'),
  },
  { path: '**', redirectTo: ROUTE.BASE.HOME },
];

import { Injectable, signal, WritableSignal } from '@angular/core';
import { MenuItem } from '../shared/menu-item.interface';
import { ROUTE_BASE } from '../router/routes/route.base';

@Injectable({ providedIn: 'root' })
export class MenuService {

  menuItemList: WritableSignal<MenuItem[]> = signal([]);

  constructor() {
    this.menuItemList.set([
      { label: 'menu.home', route: `/${ROUTE_BASE.BASE_PATH}/${ROUTE_BASE.HOME}`, icon: 'home', order: 1 },
      { label: 'menu.meetings', route: `/${ROUTE_BASE.BASE_PATH}/${ROUTE_BASE.MEETINGS}`, icon: 'event', order: 2 },
      { label: 'menu.drivers', route: `/${ROUTE_BASE.BASE_PATH}/${ROUTE_BASE.DRIVERS}`, icon: 'people', order: 3 },
      { label: 'menu.settings', route: `/${ROUTE_BASE.BASE_PATH}/${ROUTE_BASE.SETTINGS}`, icon: 'settings', order: 4 },
    ]);
  }

}

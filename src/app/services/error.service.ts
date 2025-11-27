import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from '../templates/toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  constructor(private translate: TranslateService, private toast: ToastService) {}

  emitError(...args: any[]): void {
    this.toast.add({
      summary: this.translate.instant(`error.${args[0]}`),
    });
  }
}

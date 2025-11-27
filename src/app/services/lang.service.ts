import { Injectable } from '@angular/core';
import { LANG } from '../enums/lang.enum';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LangService {
  constructor(private translateSvc: TranslateService) {}

  use(lang: LANG) {
    this.translateSvc.use(lang).subscribe({
      next: () => {
        // Language changed successfully
      },
      error: (err) => {
        console.error('LangService: Error changing language', err);
      }
    });
  }

  getCurrentLang(): string {
    return this.translateSvc.currentLang || this.translateSvc.defaultLang || 'en';
  }

  getAvailableLangs(): readonly string[] {
    return this.translateSvc.getLangs();
  }
}

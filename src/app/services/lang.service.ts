import { Injectable } from '@angular/core';
import { LANG } from '../enums/lang.enum';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LangService {
  constructor(private translateSvc: TranslateService) {}

  use(lang: LANG) {
    console.log('LangService: Switching to language:', lang);
    this.translateSvc.use(lang).subscribe({
      next: () => {
        console.log('LangService: Language changed successfully to', lang);
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

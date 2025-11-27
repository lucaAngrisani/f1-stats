import { inject } from '@angular/core';
import { SessionStore } from '../stores/session.store';
import { LangService } from '../services/lang.service';
import { TranslateService } from '@ngx-translate/core';
import { LANG } from '../enums/lang.enum';

export const initApp = async () => {
  console.log('INIT APP');

  const sessionStore = inject(SessionStore);
  const langService = inject(LangService);
  const translateService = inject(TranslateService);

  // Configura le lingue disponibili
  translateService.addLangs([LANG.EN, LANG.IT, LANG.ES, LANG.FR]);
  translateService.setDefaultLang(LANG.EN);

  // Inizializza la lingua salvata
  const savedLang = sessionStore.langSelected();
  console.log('Language from store:', savedLang);

  langService.use(savedLang);

  console.log('Language initialized:', savedLang);
};

import { inject } from '@angular/core';
import { SessionStore } from '../stores/session.store';
import { LangService } from '../services/lang.service';

export const initApp = async () => {
  console.log('INIT APP');

  const sessionStore = inject(SessionStore);
  const langService = inject(LangService);

  // Inizializza la lingua salvata
  const savedLang = sessionStore.langSelected();
  langService.use(savedLang);

  console.log('Language initialized:', savedLang);
};

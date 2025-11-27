import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { SessionStore } from '../../stores/session.store';
import { LANG } from '../../enums/lang.enum';

interface LanguageOption {
  value: LANG;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  imports: [MatCardModule, MatButtonToggleModule, FormsModule],
})
export default class SettingsComponent {
  private store = inject(SessionStore);

  languages: LanguageOption[] = [
    { value: LANG.EN, label: 'English', flag: '🇬🇧' },
    { value: LANG.IT, label: 'Italiano', flag: '🇮🇹' },
    { value: LANG.ES, label: 'Español', flag: '🇪🇸' },
    { value: LANG.FR, label: 'Français', flag: '🇫🇷' },
  ];

  selectedLanguage = computed(() => this.store.langSelected());

  onLanguageChange(lang: LANG) {
    this.store.setLang(lang);
  }
}

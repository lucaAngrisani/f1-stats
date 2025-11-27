import { Component, input, InputSignal, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Session } from '../../models/session.model';
import { Router } from '@angular/router';
import { ROUTE } from '../../router/routes/route';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.css'],
  imports: [MatCardModule, MatChipsModule],
})
export class SessionCardComponent {
  private router = inject(Router);

  session: InputSignal<Session | null> = input<Session | null>(null);

  formattedDateStart = computed(() => {
    const dateStr = this.session()?.dateStart;
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  formattedDateEnd = computed(() => {
    const dateStr = this.session()?.dateEnd;
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  sessionTypeColor = computed(() => {
    const type = this.session()?.sessionType?.toLowerCase();
    switch (type) {
      case 'race':
        return '#e10600';
      case 'qualifying':
        return '#00a650';
      case 'sprint':
        return '#ff8700';
      case 'practice':
        return '#0090d0';
      default:
        return '#666666';
    }
  });

  onCardClick() {
    this.router.navigate([ROUTE.BASE.BASE_PATH, ROUTE.BASE.SESSION, this.session()?.sessionKey]);
  }
}

import { Component, inject, signal } from '@angular/core';
import { SessionApiService } from '../../services/api/session-api.service';
import { Session } from '../../models/session.model';
import { SessionCardComponent } from '../../components/session/session-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  imports: [SessionCardComponent],
  providers: [SessionApiService],
})
export default class HomeComponent {
  private sessionApiSvc = inject(SessionApiService);

  public sessions = signal<Session[]>([]);

  constructor() {
    // Ottieni tutte le sessioni dell'ultimo meeting
    this.sessionApiSvc.getSessionByMeeting('latest').then((res) => {
      if (res && res.length > 0) {
        // Ordina per data decrescente (più recente prima)
        const sorted = res.sort((a, b) =>
          new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
        );
        this.sessions.set(sorted);
      }
    });
  }
}

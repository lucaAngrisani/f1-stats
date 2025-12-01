import { Component, inject, input, OnInit, signal } from '@angular/core';
import { SessionApiService } from '../../services/api/session-api.service';
import { Session } from '../../models/session.model';
import { SessionCardComponent } from '../../components/session-card/session-card.component';

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.component.html',
  styleUrl: './meeting.component.css',
  imports: [SessionCardComponent],
  providers: [SessionApiService],
})
export default class MeetingComponent implements OnInit {
  protected meetingKey = input<string>('');

  private sessionApiSvc = inject(SessionApiService);

  public sessions = signal<Session[]>([]);

  async ngOnInit() {
    const meetingKey = this.meetingKey();
    const [sessions] = await Promise.all([this.sessionApiSvc.getSessionByMeeting(meetingKey)]);

    if (sessions && sessions.length > 0) {
      // Ordina per data decrescente (più recente prima)
      const sorted = sessions.sort((a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
      );
      this.sessions.set(sorted);
    } else {
      this.sessions.set([]);
    }
  }
}

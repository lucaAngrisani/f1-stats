import { Component, inject, signal } from '@angular/core';
import { SessionApiService } from '../../services/api/session-api.service';
import { Session } from '../../models/session.model';
import { SessionCardComponent } from '../../components/session/session-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [SessionCardComponent],
  providers: [SessionApiService],
})
export default class HomeComponent {
  private sessionApiSvc = inject(SessionApiService);

  public currentSession = signal<Session>(new Session());

  constructor() {
    this.sessionApiSvc.getSession().then((res) => res?.[0] && this.currentSession.set(res[0]));
  }
}

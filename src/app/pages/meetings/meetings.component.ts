import { Component, inject, signal } from '@angular/core';
import { MeetingApiService } from '../../services/api/meeting-api.service';
import { Meeting } from '../../models/meeting.model';
import { MeetingCardComponent } from '../../components/meeting/meeting-card.component';

@Component({
  selector: 'app-meetings',
  templateUrl: './meetings.component.html',
  imports: [MeetingCardComponent],
  providers: [MeetingApiService],
})
export default class MeetingsComponent {
  private meetingApiSvc = inject(MeetingApiService);

  public meetings = signal<Meeting[]>([]);

  constructor() {
    this.meetingApiSvc.getAllMeeting().then((res) => this.meetings.set(res.reverse()));
  }
}

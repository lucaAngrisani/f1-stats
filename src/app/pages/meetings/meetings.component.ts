import { Component, inject, signal, computed } from '@angular/core';
import { MeetingApiService } from '../../services/api/meeting-api.service';
import { Meeting } from '../../models/meeting.model';
import { MeetingCardComponent } from '../../components/meeting/meeting-card.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-meetings',
  templateUrl: './meetings.component.html',
  styleUrl: './meetings.component.css',
  imports: [MeetingCardComponent, MatSelectModule, MatFormFieldModule, TranslateModule],
  providers: [MeetingApiService],
})
export default class MeetingsComponent {
  private meetingApiSvc = inject(MeetingApiService);

  public allMeetings = signal<Meeting[]>([]);
  public selectedYear = signal<number>(new Date().getFullYear());

  // Anni disponibili: da 10 anni fa ad oggi
  public availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  });

  // Meeting (già filtrati dall'API per anno)
  public meetings = this.allMeetings;

  constructor() {
    // Carica i meeting dell'anno corrente
    const currentYear = new Date().getFullYear();
    this.meetingApiSvc.getAllMeeting(currentYear).then((res) => {
      // Ordina per data decrescente (dal più recente al più vecchio)
      const sorted = res.sort((a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
      );
      this.allMeetings.set(sorted);
    });
  }

  onYearChange(year: number) {
    this.selectedYear.set(year);
    // Carica i meeting del nuovo anno selezionato
    this.meetingApiSvc.getAllMeeting(year).then((res) => {
      // Ordina per data decrescente (dal più recente al più vecchio)
      const sorted = res.sort((a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
      );
      this.allMeetings.set(sorted);
    });
  }
}

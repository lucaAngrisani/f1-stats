import { Component, input, InputSignal, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Meeting } from '../../models/meeting.model';
import { Router } from '@angular/router';
import { ROUTE } from '../../router/routes/route';

@Component({
  selector: 'app-meeting-card',
  templateUrl: './meeting-card.component.html',
  styleUrl: './meeting-card.component.css',
  imports: [MatCardModule, MatChipsModule],
})
export class MeetingCardComponent {
  router = inject(Router);

  meeting: InputSignal<Meeting | null> = input<Meeting | null>(null);

  formattedDate = computed(() => {
    const dateStr = this.meeting()?.dateStart;
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  onCardClick() {
    this.router.navigate([ROUTE.BASE.BASE_PATH, ROUTE.BASE.MEETING, this.meeting()?.meetingKey]);
  }
}

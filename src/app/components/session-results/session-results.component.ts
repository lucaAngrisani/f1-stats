import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { SessionResult } from '../../models/session-result.model';
import { Driver } from '../../models/driver.model';
import { TranslateModule } from '@ngx-translate/core';
import { Session } from '../../models/session.model';

@Component({
  selector: 'app-session-results',
  templateUrl: './session-results.component.html',
  styleUrl: './session-results.component.css',
  imports: [TranslateModule],
})
export class SessionResultsComponent {
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  sessionInfo: InputSignal<Session> = input<Session>(new Session());
  sessionResults: InputSignal<SessionResult[]> = input<SessionResult[]>([]);

  sessionResultWDriver: Signal<(SessionResult & { driver: Driver } & { formattedDuration: string[] } & { gaps: string[] })[]> =
    computed(() =>
      this.sessionResults().map((sr) => {
        const srd = {
          ...sr,
          driver: this.drivers().find((d) => d.driverNumber == sr.driverNumber)!,
          formattedDuration: (Array.isArray(sr.duration) ? sr.duration : [sr.duration]).map(d => this.formatDuration(d)),
          gaps: (Array.isArray(sr.gapToLeader) ? sr.gapToLeader : [sr.gapToLeader]).map(g => this.formatGapValue(g))
        };
        return srd;
      })
    );

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    } else {
      return `${secs}.${ms.toString().padStart(3, '0')}s`;
    }
  }

  private formatGapValue(gap: number | string | null | undefined): string {
    if (gap === null || gap === undefined) {
      return 'ND';
    }
    if (typeof gap === 'string') {
      return gap;
    }
    if (gap === 0) {
      return '0.000s';
    }
    return '+' + this.formatGap(gap);
  }

  private formatGap(seconds: number): string {
    if (seconds) {
      if (seconds < 60) {
        return `${seconds.toFixed(3)}s`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toFixed(3)}`;
      }
    } else {
      return '';
    }
  }
}

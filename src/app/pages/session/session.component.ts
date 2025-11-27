import { Component, inject, input, OnInit, signal } from '@angular/core';
import { SessionApiService } from '../../services/api/session-api.service';
import { Session } from '../../models/session.model';
import { SessionResult } from '../../models/session-result.model';
import { Driver } from '../../models/driver.model';
import { DriverApiService } from '../../services/api/driver-api.service';
import { Lap } from '../../models/lap.model';
import { LapsInfoComponent } from '../../components/laps-info/laps-info.component';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrl: './session.component.css',
  imports: [LapsInfoComponent],
  providers: [SessionApiService, DriverApiService, LapsInfoComponent],
})
export default class SessionComponent implements OnInit {
  protected sessionKey = input<string>('');

  private driverApiSvc = inject(DriverApiService);
  private sessionApiSvc = inject(SessionApiService);

  public session = signal<SessionResult[]>([]);
  public drivers = signal<Driver[]>([]);
  public laps = signal<Lap[]>([]);

  async ngOnInit() {
    const sessionKey = this.sessionKey();
    const [session, laps, drivers] = await Promise.all([
      this.sessionApiSvc.getSessionResult(sessionKey),
      this.sessionApiSvc.getLap(sessionKey),
      this.driverApiSvc.getAllDriver(sessionKey),
    ]);

    this.session.set(session ?? []);
    this.drivers.set(
      session.map(s => drivers.find(d => d.driverNumber == s.driverNumber)!) ?? []
    );
    this.laps.set(laps ?? []);
  }

  formatDuration(seconds: number): string {
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

  formatGap(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(3)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toFixed(3)}`;
    }
  }

  getDriverByNumber(driverNumber: number): Driver | undefined {
    return this.drivers().find((d) => d.driverNumber === driverNumber);
  }
}

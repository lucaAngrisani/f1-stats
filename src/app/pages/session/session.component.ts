import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { SessionApiService } from '../../services/api/session-api.service';
import { Session } from '../../models/session.model';
import { SessionResult } from '../../models/session-result.model';
import { Driver } from '../../models/driver.model';
import { DriverApiService } from '../../services/api/driver-api.service';
import { Lap } from '../../models/lap.model';
import { LapsInfoComponent } from '../../components/laps-info/laps-info.component';
import { Weather } from '../../models/weather.model';
import { Position } from '../../models/position.model';

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

  public sessionInfo = signal<Session>(new Session());
  public session = signal<SessionResult[]>([]);
  public positions = signal<Position[]>([]);
  public weather = signal<Weather[]>([]);
  public drivers = signal<Driver[]>([]);
  public laps = signal<Lap[]>([]);

  // Computed per il meteo corrente (ultimo dato disponibile)
  public currentWeather = computed(() => {
    const weatherData = this.weather();
    if (weatherData.length === 0) return null;
    // Ordina per data e prendi l'ultimo
    return weatherData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  });

  // Computed per verificare se la sessione è Qualifying
  public isQualifying = computed(() => {
    return this.sessionInfo().sessionType === 'Qualifying';
  });

  async ngOnInit() {
    const sessionKey = this.sessionKey();
    const [session, sessionResult, laps, positions, drivers, weather] = await Promise.all([
      this.sessionApiSvc.getSession(sessionKey),
      this.sessionApiSvc.getSessionResult(sessionKey),
      this.sessionApiSvc.getLap(sessionKey),
      this.sessionApiSvc.getPosition(sessionKey),
      this.driverApiSvc.getAllDriver(sessionKey),
      this.sessionApiSvc.getWeather(sessionKey),
    ]);

    this.sessionInfo.set(session[0]);
    this.session.set(sessionResult ?? []);
    this.weather.set(weather ?? []);
    this.drivers.set(
      sessionResult.map((s) => drivers.find((d) => d.driverNumber == s.driverNumber)!) ?? []
    );
    this.laps.set(laps ?? []);
    this.positions.set(positions ?? []);
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

  getDriverByNumber(driverNumber: number): Driver | undefined {
    return this.drivers().find((d) => d.driverNumber === driverNumber);
  }

  formatWeatherTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatSessionDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatSessionTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isArray(value: any): value is any[] {
    return Array.isArray(value);
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  asNumberArray(value: number | number[]): number[] {
    return Array.isArray(value) ? value : [value];
  }

  asNumber(value: number | number[]): number {
    return Array.isArray(value) ? value[0] : value;
  }

  formatGapValue(gap: number | string | null | undefined): string {
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

  safeFormatGap(gap: number | number[] | string | null | undefined): string {
    if (gap === null || gap === undefined) {
      return 'ND';
    }
    if (Array.isArray(gap)) {
      return this.formatGapValue(gap[0]);
    }
    return this.formatGapValue(gap);
  }
}

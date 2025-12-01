import { Component, inject, input, OnInit, signal } from '@angular/core';
import { SessionApiService } from '../../services/api/session-api.service';
import { Session } from '../../models/session.model';
import { SessionResult } from '../../models/session-result.model';
import { Driver } from '../../models/driver.model';
import { DriverApiService } from '../../services/api/driver-api.service';
import { Lap } from '../../models/lap.model';
import { LapsInfoComponent } from '../../components/laps-info/laps-info.component';
import { Weather } from '../../models/weather.model';
import { Position } from '../../models/position.model';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Stint } from '../../models/stint.model';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrl: './session.component.css',
  imports: [LapsInfoComponent, DatePipe, TranslateModule],
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
  public stints = signal<Stint[]>([]);
  public laps = signal<Lap[]>([]);

  async ngOnInit() {
    const sessionKey = this.sessionKey();
    const [session, sessionResult, laps, positions, drivers, weather, stints] = await Promise.all([
      this.sessionApiSvc.getSession(sessionKey),
      this.sessionApiSvc.getSessionResult(sessionKey),
      this.sessionApiSvc.getLap(sessionKey),
      this.sessionApiSvc.getPosition(sessionKey),
      this.driverApiSvc.getAllDriver(sessionKey),
      this.sessionApiSvc.getWeather(sessionKey),
      this.sessionApiSvc.getStints(sessionKey),
    ]);

    this.sessionInfo.set(session[0]);
    this.session.set(sessionResult ?? []);
    this.weather.set(weather ?? []);
    this.drivers.set(
      sessionResult.map((s) => drivers.find((d) => d.driverNumber == s.driverNumber)!) ?? []
    );
    this.laps.set(laps ?? []);
    this.positions.set(positions ?? []);
    this.stints.set(stints ?? []);
  }
}

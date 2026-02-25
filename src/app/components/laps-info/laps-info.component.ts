import { Component, computed, input, InputSignal, output, signal, Signal } from '@angular/core';
import { Lap } from '../../models/lap.model';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { Driver } from '../../models/driver.model';
import { SessionResult } from '../../models/session-result.model';
import { Weather } from '../../models/weather.model';
import { Position } from '../../models/position.model';
import { TrackComponent } from '../track/track.component';
import { Session } from '../../models/session.model';
import { SessionResultsComponent } from '../session-results/session-results.component';
import { WeatherConditionsComponent } from '../weather-conditions/weather-conditions.component';
import { DriverLaps } from '../../models/interfaces/driver-laps.interface';
import { PositionsComponent } from '../positions/positions.component';
import { LapEvent } from '../../models/interfaces/lap-event.interface';
import { StintAnalysisComponent } from '../stint-analysis/stint-analysis.component';
import { Stint } from '../../models/stint.model';
import { LapTimesComponent } from '../lap-times/lap-times.component';
import { EventsComponent } from '../events/events.component';
import { HeatmapComponent } from '../heatmap/heatmap.component';

@Component({
  selector: 'app-laps-info',
  templateUrl: './laps-info.component.html',
  styleUrl: './laps-info.component.css',
  imports: [
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    TrackComponent,
    EventsComponent,
    TranslateModule,
    HeatmapComponent,
    LapTimesComponent,
    PositionsComponent,
    StintAnalysisComponent,
    SessionResultsComponent,
    WeatherConditionsComponent,
  ],
})
export class LapsInfoComponent {
  laps: InputSignal<Lap[]> = input<Lap[]>([]);
  stints: InputSignal<Stint[]> = input<Stint[]>([]);
  numTotLaps: InputSignal<number> = input<number>(0);
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  weather: InputSignal<Weather[]> = input<Weather[]>([]);
  positions: InputSignal<Position[]> = input<Position[]>([]);
  sessionInfo: InputSignal<Session> = input<Session>(new Session());
  results: InputSignal<SessionResult[]> = input<SessionResult[]>([]);

  loadWeather = output<void>();
  loadPositions = output<void>();
  loadStints = output<void>();
  loadLaps = output<void>();

  selectedTabIndex = signal<number>(0);

  // Raggruppa i giri per driver
  driverLaps: Signal<DriverLaps[]> = computed(() => {
    const lapsArray = this.laps();
    const grouped = new Map<number, Lap[]>();

    lapsArray.forEach((lap) => {
      if (!grouped.has(lap.driverNumber)) {
        grouped.set(lap.driverNumber, []);
      }
      grouped.get(lap.driverNumber)!.push(lap);
    });

    const driversArray = this.drivers();
    return driversArray
      .map((driver) => ({
        driverNumber: driver.driverNumber,
        laps: (grouped.get(driver.driverNumber) || []).sort((a, b) => a.lapNumber - b.lapNumber),
      }))
      .filter((driverData) => driverData.laps.length > 0);
  });

  // Identifica eventi speciali
  events: Signal<LapEvent[]> = computed(() => {
    const allEvents: LapEvent[] = [];

    this.driverLaps().forEach((driverData) => {
      let fastestLap = Number.MAX_VALUE;
      let fastestLapNumber = 0;
      let slowestLap = 0;
      let slowestLapNumber = 0;

      // Identifica giri "puliti" (senza pit out, con durata valida)
      const cleanLaps = driverData.laps.filter((lap) => lap.lapDuration > 0 && !lap.isPitOutLap);

      driverData.laps.forEach((lap) => {
        // Pit stop
        if (lap.isPitOutLap) {
          allEvents.push({
            lapNumber: lap.lapNumber,
            driverNumber: lap.driverNumber,
            type: 'pit',
            icon: '⛽',
          });
        }

        // Fast lap (tra tutti i giri validi)
        if (lap.lapDuration > 0 && lap.lapDuration < fastestLap) {
          fastestLap = lap.lapDuration;
          fastestLapNumber = lap.lapNumber;
        }
      });

      // Slowest lap (solo tra giri puliti)
      cleanLaps.forEach((lap) => {
        if (lap.lapDuration > slowestLap) {
          slowestLap = lap.lapDuration;
          slowestLapNumber = lap.lapNumber;
        }
      });

      if (fastestLapNumber > 0) {
        allEvents.push({
          lapNumber: fastestLapNumber,
          driverNumber: driverData.driverNumber,
          type: 'fastest',
          icon: '🔥',
        });
      }

      if (slowestLapNumber > 0 && cleanLaps.length > 3) {
        // Solo se ha fatto almeno 4 giri puliti
        allEvents.push({
          lapNumber: slowestLapNumber,
          driverNumber: driverData.driverNumber,
          type: 'slowest',
          icon: '🐌',
        });
      }
    });

    return allEvents.sort((a, b) => a.lapNumber - b.lapNumber);
  });

  onTabChange(index: number) {
    // Calcola quale tab è stata selezionata, considerando la tab Position che potrebbe non esserci
    const hasPositionTab =
      this.sessionInfo().sessionType === 'Race' || this.sessionInfo().sessionType === 'SprintRace';
    // Indici tab: 0=Results, 1=Position (se presente), 2=Stint, 3=LapTimes, 4=Events, 5=Heatmap, 6=Track, 7=Weather
    const weatherTabIndex = hasPositionTab ? 7 : 6;
    const positionTabIndex = 1;
    const stintTabIndex = hasPositionTab ? 2 : 1;
    const lapTabIndex = hasPositionTab ? 3 : 2;
    const timelineTabIndex = hasPositionTab ? 4 : 3;
    const sectorsTabIndex = hasPositionTab ? 5 : 4;

    if (index === weatherTabIndex) {
      this.loadWeather.emit();
    }
    if (hasPositionTab && index === positionTabIndex) {
      this.loadLaps.emit();
      this.loadPositions.emit();
    }
    if (index === stintTabIndex) {
      this.loadStints.emit();
    }
    if (
      index === timelineTabIndex ||
      index == lapTabIndex ||
      index === positionTabIndex ||
      index === sectorsTabIndex
    ) {
      this.loadLaps.emit();
    }

    this.selectedTabIndex.set(index);
  }
}

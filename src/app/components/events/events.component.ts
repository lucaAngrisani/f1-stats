import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { DriverLaps } from '../../models/interfaces/driver-laps.interface';
import { SessionResult } from '../../models/session-result.model';
import { LapEvent } from '../../models/interfaces/lap-event.interface';
import { Driver } from '../../models/driver.model';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrl: './events.component.css',
  imports: [MatCardModule, TranslateModule],
})
export class EventsComponent {
  numTotLaps: InputSignal<number> = input<number>(0);
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  events: InputSignal<LapEvent[]> = input<LapEvent[]>([]);
  driverLaps: InputSignal<DriverLaps[]> = input<DriverLaps[]>([]);
  results: InputSignal<SessionResult[]> = input<SessionResult[]>([]);

  getLapNumbers: Signal<number[]> = computed(() => {
    const max = this.numTotLaps();
    return Array.from({ length: max }, (_, i) => i + 1);
  });

  // Raggruppa i giri per driver ordinati per posizione finale
  driverLapsByPosition: Signal<
    (DriverLaps & {
      avg: string;
      best: string;
      driver: Driver;
      sparkline: string;
      events: LapEvent[];
      lapTimes: string[];
      sparklineY: number[];
      isSlowestLap: boolean[];
      isFastestLap: boolean[];
      minTime: number;
      maxTime: number;
    })[]
  > = computed(() => {
    const resultsArray = this.results();
    const lapsData = this.driverLaps();

    // Ordina per posizione finale
    const sortedByPosition = lapsData.sort((a, b) => {
      const resultA = resultsArray.find((r) => r.driverNumber === a.driverNumber);
      const resultB = resultsArray.find((r) => r.driverNumber === b.driverNumber);

      if (!resultA || !resultB) return 0;

      // Converti posizione in numero (gestisce anche stringhe come "DNF")
      const posA = parseInt(resultA.position?.toString() || '999');
      const posB = parseInt(resultB.position?.toString() || '999');

      return posA - posB;
    });

    return sortedByPosition.map((driver) => {
      const validLaps = driver.laps.filter((lap) => lap.lapDuration > 0);
      const times = validLaps.map((lap) => lap.lapDuration);
      const minTime = times.length > 0 ? Math.min(...times) : 0;
      const maxTime = times.length > 0 ? Math.max(...times) : 0;

      return {
        ...driver,
        driver: this.drivers().find((d) => d.driverNumber == driver.driverNumber)!,
        events: this.events().filter((event) => event.driverNumber === driver.driverNumber),
        sparklineY: driver.laps.map((lap) => this.getSparklineY(lap.lapDuration, driver)),
        best: this.formatTime(this.getBestLapTime(driver)),
        avg: this.formatTime(this.getAvgLapTime(driver)),
        sparkline: this.getSparklinePath(driver),
        lapTimes: driver.laps.map((lap) => this.formatTime(lap.lapDuration)),
        isSlowestLap: driver.laps.map((lap) =>
          this.isLapEvent(driver.driverNumber, lap.lapNumber, 'slowest')
        ),
        isFastestLap: driver.laps.map((lap) =>
          this.isLapEvent(driver.driverNumber, lap.lapNumber, 'fastest')
        ),
        minTime,
        maxTime,
      };
    });
  });

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`;
  }

  transformPathWithOffset(path: string, offset: number): string {
    if (!path) return '';
    // Trasforma il path aggiungendo offset X a ogni coordinata
    return path.replace(/([ML])\s*([\d.]+),([\d.]+)/g, (match, command, x, y) => {
      return `${command} ${parseFloat(x) + offset},${y}`;
    });
  }

  private getBestLapTime(driverData: DriverLaps): number {
    const validLaps = driverData.laps.filter((lap) => lap.lapDuration > 0);
    if (validLaps.length === 0) return 0;
    return Math.min(...validLaps.map((lap) => lap.lapDuration));
  }

  private getAvgLapTime(driverData: DriverLaps): number {
    const validLaps = driverData.laps.filter((lap) => lap.lapDuration > 0);
    if (validLaps.length === 0) return 0;
    const sum = validLaps.reduce((acc, lap) => acc + lap.lapDuration, 0);
    return sum / validLaps.length;
  }

  private getSparklinePath(driverData: DriverLaps): string {
    const validLaps = driverData.laps.filter((lap) => lap.lapDuration > 0);
    if (validLaps.length === 0) return '';

    const points = validLaps.map((lap) => {
      const x = (lap.lapNumber - 0.5) * 10;
      const y = this.getSparklineY(lap.lapDuration, driverData);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  private getSparklineY(lapTime: number, driverData: DriverLaps): number {
    const validLaps = driverData.laps.filter((lap) => lap.lapDuration > 0);
    if (validLaps.length === 0) return 50;

    const times = validLaps.map((lap) => lap.lapDuration);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const range = maxTime - minTime;

    if (range === 0) return 50;

    // Inverti la scala: tempi veloci in alto (y piccolo), lenti in basso (y grande)
    // Range: da y=10 (veloce) a y=90 (lento)
    const normalized = (lapTime - minTime) / range;
    return 90 - normalized * 80;
  }

  private isLapEvent(driverNumber: number, lapNumber: number, eventType: string): boolean {
    return this.events().some(
      (event) =>
        event.driverNumber === driverNumber &&
        event.lapNumber === lapNumber &&
        event.type === eventType
    );
  }
}

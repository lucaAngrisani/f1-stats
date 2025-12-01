import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { Driver } from '../../models/driver.model';
import { MatChip } from '@angular/material/chips';
import { StintInfo } from '../../models/interfaces/stint-info.interface';
import { DriverLaps } from '../../models/interfaces/driver-laps.interface';
import { Lap } from '../../models/lap.model';
import { Session } from '../../models/session.model';
import { Stint } from '../../models/stint.model';

@Component({
  selector: 'app-stint-analysis',
  templateUrl: './stint-analysis.component.html',
  styleUrl: './stint-analysis.component.css',
  imports: [MatChip, MatCardModule, TranslateModule],
})
export class StintAnalysisComponent {
  numTotLaps: InputSignal<number> = input<number>(0);
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  driverLaps: InputSignal<DriverLaps[]> = input<DriverLaps[]>([]);
  sessionInfo: InputSignal<Session> = input<Session>(new Session());
  stints: InputSignal<Stint[]> = input<Stint[]>([]);

  // Calcola gli stint per ogni driver utilizzando i dati di stint e laps
  stintsForPlot: Signal<(StintInfo & { compoundBackgroundColor: string; compoundColor: string })[]> =
    computed(() => {
      const stintsData = this.stints();
      const driverLapsData = this.driverLaps();

      return stintsData.map((stint) => {
        // Trova i giri del driver per questo stint
        const driverData = driverLapsData.find((dl) => dl.driverNumber === stint.driverNumber);
        const stintLaps = driverData
          ? driverData.laps.filter(
              (lap) => lap.lapNumber >= stint.lapStart && lap.lapNumber <= stint.lapEnd
            )
          : [];

        // Calcola tempi
        const validLaps = stintLaps.filter((l) => l.lapDuration > 0);
        const avgLapTimeSeconds =
          validLaps.length > 0
            ? validLaps.reduce((sum, l) => sum + l.lapDuration, 0) / validLaps.length
            : 0;
        const bestLapTimeSeconds =
          validLaps.length > 0 ? Math.min(...validLaps.map((l) => l.lapDuration)) : 0;

        const avgLapTime = avgLapTimeSeconds > 0 ? this.formatTime(avgLapTimeSeconds) : '';
        const bestLapTime = bestLapTimeSeconds > 0 ? this.formatTime(bestLapTimeSeconds) : '';

        const compoundBackgroundColor = this.getCompoundColor(stint.compound);
        const compoundColor = this.getStintTextColor(stint.compound);

        return {
          driverNumber: stint.driverNumber,
          stintNumber: stint.stintNumber,
          startLap: stint.lapStart,
          endLap: stint.lapEnd,
          laps: stintLaps,
          compound: stint.compound,
          avgLapTime,
          bestLapTime,
          compoundBackgroundColor,
          compoundColor,
        };
      });
    });

  getCompoundColor(compound: string): string {
    switch (compound.toLowerCase()) {
      case 'soft':
        return '#DC0000'; // Rosso F1
      case 'medium':
        return '#FFF200'; // Giallo F1
      case 'hard':
        return '#FFFFFF'; // Bianco (con bordo nero)
      case 'intermediate':
        return '#43B02A'; // Verde F1
      case 'wet':
      default:
        return '#0090FF'; // Blu F1
    }
  }

  getStintTextColor(compound: string): string {
    const bgColor = this.getCompoundColor(compound);

    // Usa nero per bianco (#FFFFFF) e giallo (#FFF200)
    if (bgColor === '#FFFFFF' || bgColor === '#FFF200') {
      return '#000000';
    }

    return '#FFFFFF';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
  }
}

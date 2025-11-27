import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { Lap } from '../../models/lap.model';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { Driver } from '../../models/driver.model';
import { SessionResult } from '../../models/session-result.model';

interface DriverLaps {
  driverNumber: number;
  laps: Lap[];
}

interface StintInfo {
  driverNumber: number;
  stintNumber: number;
  startLap: number;
  endLap: number;
  laps: Lap[];
  compound?: string;
  avgLapTime: number;
}

interface LapEvent {
  lapNumber: number;
  driverNumber: number;
  type: 'pit' | 'yellow' | 'vsc' | 'incident' | 'blue' | 'fastest';
  icon: string;
}

@Component({
  selector: 'app-laps-info',
  templateUrl: './laps-info.component.html',
  styleUrl: './laps-info.component.css',
  imports: [NgApexchartsModule, MatTabsModule, MatCardModule, MatChipsModule],
})
export class LapsInfoComponent {
  laps: InputSignal<Lap[]> = input<Lap[]>([]);
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  results: InputSignal<SessionResult[]> = input<SessionResult[]>([]);

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

  // Numero massimo di giri nella gara
  maxLapNumber: Signal<number> = computed(() => {
    const allLaps = this.laps();
    if (allLaps.length === 0) return 0;
    return Math.max(...allLaps.map((lap) => lap.lapNumber));
  });

  // Calcola gli stint per ogni driver
  stints: Signal<StintInfo[]> = computed(() => {
    const allStints: StintInfo[] = [];

    this.driverLaps().forEach((driverData) => {
      let currentStint: Lap[] = [];
      let stintNumber = 1;

      driverData.laps.forEach((lap, index) => {
        currentStint.push(lap);

        // Nuovo stint se è un pit out lap o ultimo giro
        if (lap.isPitOutLap || index === driverData.laps.length - 1) {
          if (currentStint.length > 0) {
            // Filtra solo i giri con lapDuration valida (> 0)
            const validLaps = currentStint.filter((l) => l.lapDuration > 0);
            const avgLapTime =
              validLaps.length > 0
                ? validLaps.reduce((sum, l) => sum + l.lapDuration, 0) / validLaps.length
                : 0;

            allStints.push({
              driverNumber: driverData.driverNumber,
              stintNumber,
              startLap: currentStint[0].lapNumber,
              endLap: currentStint[currentStint.length - 1].lapNumber,
              laps: [...currentStint],
              avgLapTime,
            });

            stintNumber++;
            currentStint = [];
          }
        }
      });
    });

    return allStints;
  });

  // Identifica eventi speciali
  events: Signal<LapEvent[]> = computed(() => {
    const allEvents: LapEvent[] = [];

    this.driverLaps().forEach((driverData) => {
      let fastestLap = Number.MAX_VALUE;
      let fastestLapNumber = 0;

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

        // Fast lap
        if (lap.lapDuration > 0 && lap.lapDuration < fastestLap) {
          fastestLap = lap.lapDuration;
          fastestLapNumber = lap.lapNumber;
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
    });

    return allEvents.sort((a, b) => a.lapNumber - b.lapNumber);
  });

  // Configurazione grafico lap times
  lapTimeChartOptions: Signal<any> = computed(() => {
    const series: ApexAxisChartSeries = this.driverLaps().map((driverData) => ({
      name: this.getDriverAcronym(driverData.driverNumber),
      data: driverData.laps
        .filter((lap) => lap.lapDuration > 0)
        .map((lap) => ({
          x: lap.lapNumber,
          y: lap.lapDuration,
        })),
    }));

    return {
      series,
      chart: {
        type: 'line',
        height: 400,
        zoom: { enabled: true },
        toolbar: { show: true },
      } as ApexChart,
      dataLabels: { enabled: false } as ApexDataLabels,
      stroke: { curve: 'smooth', width: 2 } as ApexStroke,
      xaxis: {
        title: { text: 'Lap Number' },
        type: 'numeric',
        decimalsInFloat: 0,
        labels: {
          formatter: (val: string) => Math.floor(Number(val)).toString(),
        },
      } as ApexXAxis,
      yaxis: {
        title: { text: 'Lap Time (s)' },
        labels: {
          formatter: (val: number) => val.toFixed(3),
        },
      } as ApexYAxis,
      legend: {
        position: 'top',
        horizontalAlign: 'center',
      } as ApexLegend,
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(3)}s`,
        },
      } as ApexTooltip,
    };
  });

  // Configurazione heatmap settori per driver
  getHeatmapOptions(driverNumber: number): any {
    const driverData = this.driverLaps().find((d) => d.driverNumber === driverNumber);
    if (!driverData) return null;

    // Raccogli tutti i valori per settore (escludendo gli zeri)
    const sector1Values = driverData.laps
      .map((l) => l.durationSector1)
      .filter((v) => v > 0);
    const sector2Values = driverData.laps
      .map((l) => l.durationSector2)
      .filter((v) => v > 0);
    const sector3Values = driverData.laps
      .map((l) => l.durationSector3)
      .filter((v) => v > 0);

    // Calcola min e max per ogni settore
    const getMinMax = (values: number[]) => {
      if (values.length === 0) return { min: 0, max: 0 };
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { min, max };
    };

    const sector1MinMax = getMinMax(sector1Values);
    const sector2MinMax = getMinMax(sector2Values);
    const sector3MinMax = getMinMax(sector3Values);

    // Trova il range globale per una scala consistente
    const globalMin = Math.min(sector1MinMax.min, sector2MinMax.min, sector3MinMax.min);
    const globalMax = Math.max(sector1MinMax.max, sector2MinMax.max, sector3MinMax.max);
    const range = globalMax - globalMin;

    // Crea i thresholds per la scala colori
    const fastThreshold = globalMin + range * 0.33;
    const mediumThreshold = globalMin + range * 0.66;

    const sectors = ['S1', 'S2', 'S3'];
    const series = sectors.map((sector, sectorIndex) => ({
      name: sector,
      data: driverData.laps.map((lap) => {
        const durations = [lap.durationSector1, lap.durationSector2, lap.durationSector3];
        const value = durations[sectorIndex] || 0;
        return {
          x: `L${lap.lapNumber}`,
          y: value > 0 ? value : null, // null per valori 0 (grigio)
        };
      }),
    }));

    return {
      series,
      chart: {
        type: 'heatmap',
        height: 350,
      } as ApexChart,
      dataLabels: { enabled: false } as ApexDataLabels,
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
              { from: globalMin, to: fastThreshold, color: '#00A100', name: 'Fast' },
              { from: fastThreshold, to: mediumThreshold, color: '#FFB200', name: 'Medium' },
              { from: mediumThreshold, to: globalMax, color: '#FF0000', name: 'Slow' },
            ],
          },
        },
      } as ApexPlotOptions,
      xaxis: {
        type: 'category',
      } as ApexXAxis,
    };
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`;
  }

  getCompoundColor(compound?: string, stintNumber?: number): string {
    if (compound) {
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
          return '#0090FF'; // Blu F1
      }
    }

    // Se compound non è definito, usa colori diversi per stint
    const colors = ['#DC0000', '#FFF200', '#FFFFFF', '#43B02A', '#0090FF', '#FF6B6B'];
    return colors[(stintNumber || 1) % colors.length];
  }

  getStintTextColor(compound?: string, stintNumber?: number): string {
    const bgColor = this.getCompoundColor(compound, stintNumber);
    // Usa nero per bianco (#FFFFFF) e giallo (#FFF200)
    if (bgColor === '#FFFFFF' || bgColor === '#FFF200') {
      return '#000000';
    }
    return '#FFFFFF';
  }

  getDriverByNumber(driverNumber: number): Driver | undefined {
    return this.drivers().find((d) => d.driverNumber === driverNumber);
  }

  getDriverName(driverNumber: number): string {
    const driver = this.getDriverByNumber(driverNumber);
    return driver ? `${driver.firstName} ${driver.lastName}` : `Driver #${driverNumber}`;
  }

  getDriverAcronym(driverNumber: number): string {
    const driver = this.getDriverByNumber(driverNumber);
    return driver ? driver.nameAcronym : `#${driverNumber}`;
  }
}

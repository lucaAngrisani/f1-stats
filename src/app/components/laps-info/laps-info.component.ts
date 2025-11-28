import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { Lap } from '../../models/lap.model';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
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
import { Weather } from '../../models/weather.model';
import { Position } from '../../models/position.model';
import { TrackComponent } from '../track/track.component';
import { Session } from '../../models/session.model';

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
  bestLapTime?: number;
}

interface LapEvent {
  lapNumber: number;
  driverNumber: number;
  type: 'pit' | 'yellow' | 'vsc' | 'incident' | 'blue' | 'fastest' | 'slowest';
  icon: string;
}

@Component({
  selector: 'app-laps-info',
  templateUrl: './laps-info.component.html',
  styleUrl: './laps-info.component.css',
  imports: [NgApexchartsModule, MatTabsModule, MatCardModule, MatChipsModule, TrackComponent, TranslateModule],
})
export class LapsInfoComponent {
  laps: InputSignal<Lap[]> = input<Lap[]>([]);
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  positions: InputSignal<Position[]> = input<Position[]>([]);
  results: InputSignal<SessionResult[]> = input<SessionResult[]>([]);
  weather: InputSignal<Weather[]> = input<Weather[]>([]);
  sessionInfo: InputSignal<Session> = input<Session>(new Session());

  // Seleziona 5 campioni meteo distribuiti uniformemente
  weatherSamples: Signal<Weather[]> = computed(() => {
    const allWeather = this.weather();
    if (allWeather.length === 0) return [];
    if (allWeather.length <= 5) return allWeather;

    const samples: Weather[] = [];
    const step = (allWeather.length - 1) / 4; // 4 intervalli per 5 campioni

    for (let i = 0; i < 5; i++) {
      const index = Math.round(i * step);
      samples.push(allWeather[index]);
    }

    return samples;
  });

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

  // Raggruppa i giri per driver ordinati per posizione finale
  driverLapsByPosition: Signal<DriverLaps[]> = computed(() => {
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

    return sortedByPosition;
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
            const bestLapTime =
              validLaps.length > 0 ? Math.min(...validLaps.map((l) => l.lapDuration)) : undefined;

            allStints.push({
              driverNumber: driverData.driverNumber,
              stintNumber,
              startLap: currentStint[0].lapNumber,
              endLap: currentStint[currentStint.length - 1].lapNumber,
              laps: [...currentStint],
              avgLapTime,
              bestLapTime,
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

    const colors = this.driverLaps().map((driverData) =>
      this.getDriverTeamColor(driverData.driverNumber)
    );

    return {
      series,
      colors: colors,
      chart: {
        type: 'line',
        height: 400,
        zoom: { enabled: true },
        toolbar: { show: true },
      } as ApexChart,
      dataLabels: { enabled: false } as ApexDataLabels,
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: colors,
      } as ApexStroke,
      markers: {
        colors: colors,
      },
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
        markers: {
          fillColors: colors,
        },
      } as ApexLegend,
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(3)}s`,
        },
        marker: {
          fillColors: colors,
        },
      } as ApexTooltip,
    };
  });

  // Configurazione grafico posizioni
  positionChartOptions: Signal<any> = computed(() => {
    const positionsData = this.positions();
    const allLaps = this.laps();

    if (positionsData.length === 0 || allLaps.length === 0) {
      return null;
    }

    // Trova il numero massimo di giri dalla sessione
    const maxLaps = Math.max(...allLaps.map((lap) => lap.lapNumber));

    // Raggruppa le posizioni per driver
    const positionsByDriver = new Map<number, Position[]>();

    positionsData.forEach((pos) => {
      if (!positionsByDriver.has(pos.driverNumber)) {
        positionsByDriver.set(pos.driverNumber, []);
      }
      positionsByDriver.get(pos.driverNumber)!.push(pos);
    });

    // Se non ci sono driver con posizioni
    if (positionsByDriver.size === 0) {
      return null;
    }

    // Crea le serie per il grafico
    const series: ApexAxisChartSeries = [];
    const colors: string[] = [];

    positionsByDriver.forEach((positions, driverNumber) => {
      // Ordina per data
      const sortedPositions = positions.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Ottieni i giri effettivi del pilota per sapere quanti giri ha fatto
      const driverLaps = allLaps
        .filter((lap) => lap.driverNumber === driverNumber)
        .sort((a, b) => a.lapNumber - b.lapNumber);

      const maxDriverLaps = driverLaps.length > 0 ? driverLaps[driverLaps.length - 1].lapNumber : maxLaps;

      // Crea un array completo di posizioni per ogni giro, riempendo i gap
      const completePositions: Array<{ x: number; y: number }> = [];
      let currentPositionIndex = 0;

      for (let lapNum = 1; lapNum <= maxDriverLaps; lapNum++) {
        // Trova se c'è una posizione registrata per questo momento/giro
        // Se non c'è, usa l'ultima posizione nota
        if (currentPositionIndex < sortedPositions.length - 1) {
          // Controlla se il prossimo cambio di posizione è relativo a questo giro o successivo
          const nextPosition = sortedPositions[currentPositionIndex + 1];
          const nextPositionTime = new Date(nextPosition.date).getTime();

          // Se abbiamo informazioni sui giri, usiamo quello per decidere quando cambiare posizione
          const currentLap = driverLaps.find(lap => lap.lapNumber === lapNum);
          if (currentLap) {
            const currentLapTime = new Date(currentLap.dateStart).getTime();
            if (nextPositionTime <= currentLapTime) {
              currentPositionIndex++;
            }
          }
        }

        completePositions.push({
          x: lapNum,
          y: sortedPositions[currentPositionIndex].position,
        });
      }

      series.push({
        name: this.getDriverAcronym(driverNumber),
        data: completePositions,
      });

      colors.push(this.getDriverTeamColor(driverNumber));
    });

    // Trova il numero massimo di posizioni
    const maxPosition = Math.max(...positionsData.map((p) => p.position));

    return {
      series,
      colors: colors,
      chart: {
        type: 'line',
        height: 500,
        zoom: { enabled: true },
        toolbar: { show: true },
      } as ApexChart,
      dataLabels: { enabled: false } as ApexDataLabels,
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: colors,
      } as ApexStroke,
      markers: {
        colors: colors,
        size: 4,
      },
      xaxis: {
        title: { text: 'Lap Number' },
        type: 'numeric',
        decimalsInFloat: 0,
        min: 1,
        max: maxLaps,
        labels: {
          formatter: (val: string) => Math.floor(Number(val)).toString(),
        },
      } as ApexXAxis,
      yaxis: {
        title: { text: 'Position' },
        reversed: true,
        min: 1,
        max: maxPosition,
        tickAmount: maxPosition - 1,
        labels: {
          formatter: (val: number) => `P${Math.round(val)}`,
        },
      } as ApexYAxis,
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        markers: {
          fillColors: colors,
        },
      } as ApexLegend,
      tooltip: {
        y: {
          formatter: (val: number) => `P${val}`,
        },
        marker: {
          fillColors: colors,
        },
      } as ApexTooltip,
    };
  });

  // Configurazione heatmap settori per driver
  getHeatmapOptions(driverNumber: number): any {
    const driverData = this.driverLaps().find((d) => d.driverNumber === driverNumber);
    if (!driverData) return null;

    // Raccogli tutti i valori per settore (escludendo gli zeri)
    const sector1Values = driverData.laps.map((l) => l.durationSector1).filter((v) => v > 0);
    const sector2Values = driverData.laps.map((l) => l.durationSector2).filter((v) => v > 0);
    const sector3Values = driverData.laps.map((l) => l.durationSector3).filter((v) => v > 0);

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

  getDriverTeamColor(driverNumber: number): string {
    const driver = this.getDriverByNumber(driverNumber);
    return driver?.teamColour ? `#${driver.teamColour}` : '#999999';
  }

  // Metodi per Timeline moderna

  getBestLapTime(driverData: DriverLaps): number {
    const validLaps = driverData.laps.filter((lap) => lap.lapDuration > 0);
    if (validLaps.length === 0) return 0;
    return Math.min(...validLaps.map((lap) => lap.lapDuration));
  }

  getAvgLapTime(driverData: DriverLaps): number {
    const validLaps = driverData.laps.filter((lap) => lap.lapDuration > 0);
    if (validLaps.length === 0) return 0;
    const sum = validLaps.reduce((acc, lap) => acc + lap.lapDuration, 0);
    return sum / validLaps.length;
  }

  getSparklinePath(driverData: DriverLaps): string {
    const validLaps = driverData.laps.filter((lap) => lap.lapDuration > 0);
    if (validLaps.length === 0) return '';

    const points = validLaps.map((lap) => {
      const x = (lap.lapNumber - 0.5) * 10;
      const y = this.getSparklineY(lap.lapDuration, driverData);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  getSparklineY(lapTime: number, driverData: DriverLaps): number {
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

  getDriverEvents(driverNumber: number): LapEvent[] {
    return this.events().filter((event) => event.driverNumber === driverNumber);
  }

  isLapEvent(driverNumber: number, lapNumber: number, eventType: string): boolean {
    return this.events().some(
      (event) =>
        event.driverNumber === driverNumber &&
        event.lapNumber === lapNumber &&
        event.type === eventType
    );
  }

  getLapNumbers(): number[] {
    const max = this.maxLapNumber();
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  formatWeatherTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

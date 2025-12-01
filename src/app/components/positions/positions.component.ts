import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Driver } from '../../models/driver.model';
import { Position } from '../../models/position.model';
import { SessionResult } from '../../models/session-result.model';
import { DriverLaps } from '../../models/interfaces/driver-laps.interface';

@Component({
  selector: 'app-positions',
  templateUrl: './positions.component.html',
  imports: [MatCardModule, NgApexchartsModule, TranslateModule],
})
export class PositionsComponent {
  numTotLaps: InputSignal<number> = input<number>(0);
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  positions: InputSignal<Position[]> = input<Position[]>([]);
  driverLaps: InputSignal<DriverLaps[]> = input<DriverLaps[]>([]);
  results: InputSignal<SessionResult[]> = input<SessionResult[]>([]);

  // Configurazione grafico posizioni
  positionChartOptions: Signal<any> = computed(() => {
    const positionsData = this.positions();
    const drivers = this.drivers();
    const results = this.results();
    const numLaps = this.numTotLaps();

    if (positionsData.length === 0 || numLaps === 0) {
      return null;
    }

    // Raggruppa le posizioni per driver e ordinale per data
    const positionsByDriver = new Map<number, Position[]>();
    positionsData.forEach((pos) => {
      if (!positionsByDriver.has(pos.driverNumber)) {
        positionsByDriver.set(pos.driverNumber, []);
      }
      positionsByDriver.get(pos.driverNumber)!.push(pos);
    });

    // Ordina le posizioni di ogni driver
    positionsByDriver.forEach((list) => {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const series: ApexAxisChartSeries = [];
    const colors: string[] = [];

    // Trova il numero massimo di posizioni per le scale
    const maxPosition = Math.max(...positionsData.map((p) => p.position));

    // Itera sui driver presenti nei risultati
    results.forEach((result) => {
      const driverNumber = result.driverNumber;
      const driverPositions = positionsByDriver.get(driverNumber) || [];

      // Se non ci sono posizioni per questo driver, saltalo
      if (driverPositions.length === 0) {
        return;
      }

      const dataPoints: { x: number; y: number }[] = [];
      let lastKnownPosition: number | null = null;

      // Recupera i giri del pilota per avere i tempi
      const driverLapsData = this.driverLaps().find((d) => d.driverNumber === driverNumber);
      const driverLapsList = driverLapsData ? driverLapsData.laps : [];

      // Determina il numero di giri da visualizzare per questo pilota
      const driverTotalLaps = result.numberOfLaps || numLaps;

      // Itera da 1 al numero di giri del pilota
      for (let lapNum = 1; lapNum <= driverTotalLaps; lapNum++) {
        // Trova il giro corrispondente nei dati (se esiste)
        const lapData = driverLapsList.find((l) => l.lapNumber === lapNum);

        if (lapData) {
          const lapDurationMs = (lapData.lapDuration || 0) * 1000;
          const lapEndTime = new Date(lapData.dateStart).getTime() + lapDurationMs;

          // Trova l'ultima posizione registrata prima o esattamente alla fine di questo giro
          let currentLapPosition: number | null = null;

          for (let i = driverPositions.length - 1; i >= 0; i--) {
            const posTime = new Date(driverPositions[i].date).getTime();
            if (posTime <= lapEndTime) {
              currentLapPosition = driverPositions[i].position;
              break;
            }
          }

          if (currentLapPosition !== null) {
            lastKnownPosition = currentLapPosition;
          }
        }

        // Fallback per il primo giro: se non abbiamo trovato una posizione valida
        // (es. dati giro mancanti o posizioni iniziate dopo), usiamo la prima disponibile
        if (lapNum === 1 && lastKnownPosition === null && driverPositions.length > 0) {
          lastKnownPosition = driverPositions[0].position;
        }

        if (lastKnownPosition !== null) {
          dataPoints.push({
            x: lapNum,
            y: lastKnownPosition,
          });
        }
      }

      if (dataPoints.length > 0) {
        series.push({
          name: this.getDriverAcronym(driverNumber),
          data: dataPoints,
        });
        colors.push(this.getDriverTeamColor(driverNumber));
      }
    });

    // Ordina le serie in base alla posizione finale
    series.sort((a, b) => {
      const lastPosA = (a.data[a.data.length - 1] as any).y;
      const lastPosB = (b.data[b.data.length - 1] as any).y;
      return lastPosA - lastPosB;
    });

    const sortedColors = series.map((s) => {
      const driverAcronym = s.name;
      const driver = drivers.find((d) => d.nameAcronym === driverAcronym);
      return driver ? `#${driver.teamColour}` : '#999999';
    });

    return {
      series,
      colors: sortedColors,
      chart: {
        type: 'line',
        height: 500,
        zoom: { enabled: true },
        toolbar: { show: true },
        animations: { enabled: false },
      } as ApexChart,
      dataLabels: { enabled: false } as ApexDataLabels,
      stroke: {
        curve: 'straight',
        width: 2,
      } as ApexStroke,
      markers: {
        size: 3,
      },
      xaxis: {
        title: { text: 'Lap Number' },
        type: 'numeric',
        decimalsInFloat: 0,
        min: 1,
        max: numLaps,
        labels: {
          formatter: (val: string) => Math.floor(Number(val)).toString(),
        },
      } as ApexXAxis,
      yaxis: {
        title: { text: 'Position' },
        reversed: true,
        min: 1,
        max: maxPosition > 0 ? maxPosition : 20,
        tickAmount: maxPosition > 0 ? maxPosition - 1 : 19,
        labels: {
          formatter: (val: number) => `P${Math.round(val)}`,
        },
      } as ApexYAxis,
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
      } as ApexLegend,
      tooltip: {
        y: {
          formatter: (val: number) => `P${val}`,
        },
      } as ApexTooltip,
    };
  });

  private   getDriverAcronym(driverNumber: number): string {
    const driver = this.getDriverByNumber(driverNumber);
    return driver ? driver.nameAcronym : `#${driverNumber}`;
  }

  private getDriverTeamColor(driverNumber: number): string {
    const driver = this.getDriverByNumber(driverNumber);
    return driver?.teamColour ? `#${driver.teamColour}` : '#999999';
  }

  private   getDriverByNumber(driverNumber: number): Driver | undefined {
    return this.drivers().find((d) => d.driverNumber === driverNumber);
  }
}

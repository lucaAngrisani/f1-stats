import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { DriverLaps } from '../../models/interfaces/driver-laps.interface';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Driver } from '../../models/driver.model';

@Component({
  selector: 'app-heatmap',
  styleUrl: './heatmap.component.css',
  templateUrl: './heatmap.component.html',
  imports: [MatCardModule, TranslateModule, NgApexchartsModule],
})
export class HeatmapComponent {
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  driverLaps: InputSignal<DriverLaps[]> = input<DriverLaps[]>([]);

  driverLapsWDriver: Signal<(DriverLaps & { driver: Driver })[]> = computed<
    (DriverLaps & { driver: Driver })[]
  >(() =>
    this.driverLaps().map((dl) => {
      return {
        ...dl,
        driver: this.drivers().find((d) => d.driverNumber == dl.driverNumber)!,
      };
    })
  );

  heatmapOptions: Signal<{ [key: number]: any }> = computed(() => {
    const optValues: { [key: number]: any } = {};

    this.driverLaps().forEach((driverData) => {
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

      optValues[driverData.driverNumber] = {
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
    });

    return optValues;
  });
}

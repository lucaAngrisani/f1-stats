import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DriverLaps } from '../../models/interfaces/driver-laps.interface';
import { Driver } from '../../models/driver.model';

@Component({
  selector: 'app-lap-times',
  templateUrl: './lap-times.component.html',
  imports: [MatCardModule, TranslateModule, NgApexchartsModule],
})
export class LapTimesComponent {
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  driverLaps: InputSignal<DriverLaps[]> = input<DriverLaps[]>([]);

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
        animations: { enabled: false }
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
        position: 'bottom',
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
}

import { Component, inject, signal } from '@angular/core';
import { DriverApiService } from '../../services/api/driver-api.service';
import { Driver } from '../../models/driver.model';
import { DriverComponent } from '../../components/driver/driver.component';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  imports: [DriverComponent],
  providers: [DriverApiService],
})
export default class DriversComponent {
  private driverApiSvc = inject(DriverApiService);

  public drivers = signal<Driver[]>([]);

  constructor() {
    this.driverApiSvc.getAllDriver().then((res) => this.drivers.set(res));
  }
}

import { Component, input, InputSignal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Driver } from '../../models/driver.model';

@Component({
  selector: 'app-driver',
  templateUrl: './driver.component.html',
  styleUrl: './driver.component.css',
  imports: [MatCardModule, MatChipsModule],
})
export class DriverComponent {
  driver: InputSignal<Driver | null> = input<Driver | null>(null);

  teamColorStyle = computed(() => {
    const color = this.driver()?.teamColour;
    return color ? `#${color}` : '#cccccc';
  });
}

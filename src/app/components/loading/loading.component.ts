import { Component, input } from '@angular/core';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css',
  imports: [],
})
export class LoadingComponent {
  show = input(false);

  constructor(public loadingSvc: LoadingService) {}
}

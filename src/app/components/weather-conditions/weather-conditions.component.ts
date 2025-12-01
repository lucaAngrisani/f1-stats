import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { Weather } from '../../models/weather.model';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-weather-conditions',
  templateUrl: './weather-conditions.component.html',
  styleUrl: './weather-conditions.component.css',
  imports: [TranslateModule, DatePipe],
})
export class WeatherConditionsComponent {
  weather: InputSignal<Weather[]> = input<Weather[]>([]);

  public initialWeather = computed(() => {
    const weatherData = this.weather();
    if (weatherData.length === 0) return null;
    // Ordina per data e prendi il primo
    return weatherData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  });

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
}

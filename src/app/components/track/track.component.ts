import { Component, computed, inject, input, InputSignal, OnInit, signal, Signal } from '@angular/core';
import { Location } from '../../models/location.model';
import { Driver } from '../../models/driver.model';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SessionApiService } from '../../services/api/session-api.service';

interface DriverLocation {
  driver: Driver;
  location: Location;
}

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrl: './track.component.css',
  imports: [CommonModule, MatSliderModule, MatCardModule, MatButtonModule, MatIconModule],
  providers: [SessionApiService]
})
export class TrackComponent implements OnInit {
  locations: InputSignal<Location[]> = input<Location[]>([]);
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);

  sessionApiSvc = inject(SessionApiService);

  // Indice temporale corrente dello slider
  currentTimeIndex = signal(0);

  // Flag per l'animazione automatica
  isPlaying = signal(false);
  private animationInterval: any = null;

  // Ottieni tutti i timestamp unici ordinati
  uniqueTimestamps: Signal<Date[]> = computed(() => {
    const locations = this.locations();
    if (locations.length === 0) return [];

    const timestamps = new Set<number>();
    locations.forEach((loc) => timestamps.add(new Date(loc.date).getTime()));

    return Array.from(timestamps)
      .sort((a, b) => a - b)
      .map((time) => new Date(time));
  });

  // Timestamp corrente basato sull'indice dello slider
  currentTimestamp: Signal<Date | null> = computed(() => {
    const timestamps = this.uniqueTimestamps();
    const index = this.currentTimeIndex();
    return timestamps.length > 0 ? timestamps[index] : null;
  });

  // Posizioni dei piloti al timestamp corrente
  currentDriverLocations: Signal<DriverLocation[]> = computed(() => {
    const timestamp = this.currentTimestamp();
    if (!timestamp) return [];

    const locations = this.locations();
    const drivers = this.drivers();
    const timestampTime = timestamp.getTime();

    // Filtra le location per il timestamp corrente
    const locationsAtTime = locations.filter(
      (loc) => new Date(loc.date).getTime() === timestampTime
    );

    // Mappa con i driver
    return locationsAtTime
      .map((loc) => {
        const driver = drivers.find((d) => d.driverNumber === loc.driverNumber);
        return driver ? { driver, location: loc } : null;
      })
      .filter((item): item is DriverLocation => item !== null);
  });

  // Calcola i bounds del tracciato per la scala
  trackBounds: Signal<{ minX: number; maxX: number; minY: number; maxY: number }> = computed(() => {
    const locations = this.locations();
    if (locations.length === 0) {
      return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
    }

    return {
      minX: Math.min(...locations.map((l) => l.x)),
      maxX: Math.max(...locations.map((l) => l.x)),
      minY: Math.min(...locations.map((l) => l.y)),
      maxY: Math.max(...locations.map((l) => l.y)),
    };
  });

  // Traccia il percorso completo del tracciato
  trackPath: Signal<string> = computed(() => {
    const locations = this.locations();
    if (locations.length === 0) return '';

    // Raggruppa per timestamp e prendi un pilota come riferimento per disegnare il tracciato
    const timestamps = this.uniqueTimestamps();
    const bounds = this.trackBounds();

    // Usa il primo pilota disponibile per tracciare il percorso
    const firstDriverNumber = locations[0]?.driverNumber;
    if (!firstDriverNumber) return '';

    const driverLocations = locations
      .filter((loc) => loc.driverNumber === firstDriverNumber)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (driverLocations.length === 0) return '';

    const pathPoints = driverLocations.map((loc) => {
      const x = this.scaleX(loc.x);
      const y = this.scaleY(loc.y);
      return `${x},${y}`;
    });

    return `M ${pathPoints.join(' L ')}`;
  });

  async ngOnInit() {
    await Promise.all([
      this.sessionApiSvc.getLocations()
    ]);
  }

  // Scala le coordinate X per il viewport SVG
  scaleX(x: number): number {
    const bounds = this.trackBounds();
    const width = bounds.maxX - bounds.minX;
    return ((x - bounds.minX) / width) * 900 + 50; // Padding di 50
  }

  // Scala le coordinate Y per il viewport SVG (invertito per SVG)
  scaleY(y: number): number {
    const bounds = this.trackBounds();
    const height = bounds.maxY - bounds.minY;
    return 950 - ((y - bounds.minY) / height) * 900; // Invertito e con padding
  }

  // Gestione dello slider
  onSliderChange(event: any): void {
    this.currentTimeIndex.set(event.value);
    if (this.isPlaying()) {
      this.pause();
    }
  }

  // Play/Pause animazione
  togglePlayPause(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    this.isPlaying.set(true);
    const maxIndex = this.uniqueTimestamps().length - 1;

    this.animationInterval = setInterval(() => {
      const current = this.currentTimeIndex();
      if (current >= maxIndex) {
        this.currentTimeIndex.set(0); // Riparti dall'inizio
      } else {
        this.currentTimeIndex.set(current + 1);
      }
    }, 100); // Aggiorna ogni 100ms
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  // Reset alla posizione iniziale
  reset(): void {
    this.pause();
    this.currentTimeIndex.set(0);
  }

  // Formatta il timestamp per la visualizzazione
  formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  // Cleanup quando il componente viene distrutto
  ngOnDestroy(): void {
    this.pause();
  }
}

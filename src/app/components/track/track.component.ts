import {
  Component,
  computed,
  effect,
  inject,
  input,
  InputSignal,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { Location } from '../../models/location.model';
import { Driver } from '../../models/driver.model';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SessionApiService } from '../../services/api/session-api.service';
import { Session } from '../../models/session.model';
import { Position } from '../../models/position.model';

interface DriverLocation {
  driver: Driver;
  location: Location;
}

interface DriverStanding {
  position: number;
  driver: Driver;
}

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrl: './track.component.css',
  imports: [CommonModule, MatSliderModule, MatCardModule, MatButtonModule, MatIconModule],
  providers: [SessionApiService],
})
export class TrackComponent {
  drivers: InputSignal<Driver[]> = input<Driver[]>([]);
  sessionInfo: InputSignal<Session> = input<Session>(new Session());
  positions: InputSignal<Position[]> = input<Position[]>([]);

  locations: WritableSignal<Location[]> = signal<Location[]>([]);

  sessionApiSvc = inject(SessionApiService);

  // Tempo corrente in millisecondi dall'inizio della sessione (usato dallo slider)
  currentTimeMs = signal(0);

  // Flag per l'animazione automatica
  isPlaying = signal(false);
  private animationInterval: any = null;

  // Lazy loading configuration
  private readonly CHUNK_DURATION_SECONDS = 80; // 80 secondi per chunk
  private readonly PRELOAD_CHUNKS = 2; // Numero di chunk da precaricare in anticipo
  private readonly MAX_LOADED_CHUNKS = 5; // Massimo numero di chunk in memoria (aumentato per evitare cleanup troppo aggressivo)

  // Configurazione velocità playback (modificabile)
  public playbackSpeedMs = 100; // Intervallo in ms tra un frame e l'altro (più alto = più lento)
  public playbackTimeStep = 1000; // Avanzamento temporale in ms per ogni frame (più alto = più veloce)

  // Stato del caricamento
  loadedChunks = new Set<number>(); // Indici dei chunk già caricati (public per il template)
  private loadingChunks = new Set<number>(); // Chunk attualmente in caricamento
  public isLoadingData = signal(false); // Flag globale per loading

  // Durata totale della sessione in millisecondi
  totalDurationMs: Signal<number> = computed(() => {
    const session = this.sessionInfo();
    if (!session.dateStart || !session.dateEnd) return 0;

    const start = new Date(session.dateStart).getTime();
    const end = new Date(session.dateEnd).getTime();
    return end - start;
  });

  // Calcola il numero totale di chunk necessari
  totalChunks: Signal<number> = computed(() => {
    const durationSeconds = this.totalDurationMs() / 1000;
    return Math.ceil(durationSeconds / this.CHUNK_DURATION_SECONDS);
  });

  // Calcola quale chunk corrisponde al tempo corrente
  currentChunkIndex: Signal<number> = computed(() => {
    const timeMs = this.currentTimeMs();
    if (timeMs < 0 || isNaN(timeMs)) return 0;

    const elapsedSeconds = timeMs / 1000;
    const chunkIndex = Math.floor(elapsedSeconds / this.CHUNK_DURATION_SECONDS);
    return Math.max(0, chunkIndex);
  });

  // Timestamp assoluto corrente basato sul tempo dello slider
  currentTimestamp: Signal<Date> = computed(() => {
    const session = this.sessionInfo();
    if (!session.dateStart) {
      return new Date(); // Fallback a data corrente
    }

    const startTime = new Date(session.dateStart).getTime();
    if (isNaN(startTime)) {
      return new Date(); // Fallback se dateStart non è valida
    }

    const currentMs = this.currentTimeMs();
    if (isNaN(currentMs)) {
      return new Date(startTime); // Fallback all'inizio della sessione
    }

    return new Date(startTime + currentMs);
  });

  // Trova le location più vicine al timestamp corrente con coordinate già scalate
  currentDriverLocations: Signal<DriverLocation[]> = computed(() => {
    const currentTime = this.currentTimestamp().getTime();
    const locations = this.locations();
    const drivers = this.drivers();

    if (locations.length === 0) return [];

    // Calcola i bounds una sola volta
    const bounds = this.trackBounds();
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    // Raggruppa location per driver
    const locationsByDriver = new Map<number, Location[]>();
    locations.forEach((loc) => {
      if (!locationsByDriver.has(loc.driverNumber)) {
        locationsByDriver.set(loc.driverNumber, []);
      }
      locationsByDriver.get(loc.driverNumber)!.push(loc);
    });

    // Per ogni driver, trova la location più vicina al timestamp corrente
    const result: DriverLocation[] = [];
    locationsByDriver.forEach((locs, driverNumber) => {
      // Trova la location più vicina (ma non futura)
      const sortedLocs = locs.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Trova l'ultima location <= currentTime
      let closestLoc: Location | null = null;
      for (const loc of sortedLocs) {
        const locTime = new Date(loc.date).getTime();
        if (locTime <= currentTime) {
          closestLoc = loc;
        } else {
          break;
        }
      }

      if (closestLoc) {
        const driver = drivers.find((d) => d.driverNumber === driverNumber);
        if (driver) {
          result.push({ driver, location: closestLoc });
        }
      }
    });

    return result;
  });

  // Calcola i bounds del tracciato per la scala (ottimizzato per grandi dataset)
  trackBounds: Signal<{ minX: number; maxX: number; minY: number; maxY: number }> = computed(() => {
    const locations = this.locations();
    if (locations.length === 0) {
      return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
    }

    // OTTIMIZZAZIONE: Usa loop invece di spread operator per evitare stack overflow
    // con grandi quantità di dati (120,000+ locations)
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Campiona solo 1 location ogni N per velocizzare il calcolo
    const sampleRate = Math.max(1, Math.floor(locations.length / 1000));
    for (let i = 0; i < locations.length; i += sampleRate) {
      const loc = locations[i];
      if (loc.x < minX) minX = loc.x;
      if (loc.x > maxX) maxX = loc.x;
      if (loc.y < minY) minY = loc.y;
      if (loc.y > maxY) maxY = loc.y;
    }

    return { minX, maxX, minY, maxY };
  });

  // Traccia il percorso completo del tracciato (ottimizzato per evitare stack overflow)
  trackPath: Signal<string> = computed(() => {
    const locations = this.locations();
    if (locations.length === 0) return '';

    // Usa il primo pilota disponibile per tracciare il percorso
    const firstDriverNumber = locations[0]?.driverNumber;
    if (!firstDriverNumber) return '';

    // Filtra solo le locations del primo pilota
    const driverLocations = locations
      .filter((loc) => loc.driverNumber === firstDriverNumber)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (driverLocations.length === 0) return '';

    // OTTIMIZZAZIONE: Usa solo un subset di punti per il percorso
    // Prendi 1 punto ogni N per ridurre il carico computazionale
    const maxPathPoints = 500; // Massimo numero di punti per il percorso
    const step = Math.max(1, Math.floor(driverLocations.length / maxPathPoints));
    const sampledLocations = driverLocations.filter((_, index) => index % step === 0);

    // Calcola i bounds solo sulle locations campionate (molto più veloce)
    const minX = Math.min(...sampledLocations.map((l) => l.x));
    const maxX = Math.max(...sampledLocations.map((l) => l.x));
    const minY = Math.min(...sampledLocations.map((l) => l.y));
    const maxY = Math.max(...sampledLocations.map((l) => l.y));

    const width = maxX - minX;
    const height = maxY - minY;

    // Genera i punti del percorso
    const pathPoints = sampledLocations.map((loc) => {
      // Inline scaling per evitare chiamate ricorsive
      const x = ((loc.x - minX) / width) * 900 + 50;
      const y = 950 - ((loc.y - minY) / height) * 900;
      return `${x},${y}`;
    });

    return `M ${pathPoints.join(' L ')}`;
  });

  // Classifica dei piloti basata sul tempo corrente dello slider
  driverStandings: Signal<DriverStanding[]> = computed(() => {
    const positions = this.positions();
    const drivers = this.drivers();
    const currentTime = this.currentTimestamp().getTime();

    if (positions.length === 0 || drivers.length === 0) {
      return [];
    }

    // Raggruppa posizioni per pilota
    const positionsByDriver = new Map<number, Position[]>();
    positions.forEach((pos) => {
      if (!positionsByDriver.has(pos.driverNumber)) {
        positionsByDriver.set(pos.driverNumber, []);
      }
      positionsByDriver.get(pos.driverNumber)!.push(pos);
    });

    // Per ogni pilota, trova l'ultima posizione <= currentTime
    const standings: DriverStanding[] = [];

    drivers.forEach((driver) => {
      const driverPositions = positionsByDriver.get(driver.driverNumber);

      if (!driverPositions || driverPositions.length === 0) {
        return; // Skip se non ci sono posizioni per questo pilota
      }

      // Ordina le posizioni per timestamp
      const sortedPositions = driverPositions.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Trova l'ultima posizione <= currentTime
      let lastValidPosition: Position | null = null;
      for (const pos of sortedPositions) {
        const posTime = new Date(pos.date).getTime();
        if (posTime <= currentTime) {
          lastValidPosition = pos;
        } else {
          break; // Fermiamoci quando superiamo il tempo corrente
        }
      }

      // Se abbiamo trovato una posizione valida, aggiungila alla classifica
      if (lastValidPosition) {
        standings.push({
          position: lastValidPosition.position,
          driver,
        });
      }
    });

    // Ordina per posizione crescente
    return standings.sort((a, b) => a.position - b.position);
  });

  constructor() {
    effect(() => {
      if (this.sessionInfo().dateStart) {
        this.initLoadLocation();
      }
    });

    // Effect per monitorare il chunk corrente e caricare dati in anticipo
    effect(async () => {
      const currentChunk = this.currentChunkIndex();
      const totalChunks = this.totalChunks();

      if (totalChunks > 0 && currentChunk >= 0) {
        // Carica il chunk corrente se non è già caricato
        if (!this.loadedChunks.has(currentChunk)) {
          console.log(`Loading current chunk: ${currentChunk}`);
          await this.loadChunk(currentChunk);
        }

        // Carica i chunk successivi (preload) in serie
        for (let i = 1; i <= this.PRELOAD_CHUNKS; i++) {
          const chunkToLoad = currentChunk + i;
          if (chunkToLoad < totalChunks && !this.loadedChunks.has(chunkToLoad)) {
            await this.loadChunk(chunkToLoad);
          }
        }

        // Il cleanup viene fatto automaticamente dopo ogni caricamento chunk
      }
    });
  }

  async initLoadLocation() {
    // Carica solo i primi chunk iniziali
    this.locations.set([]);
    this.loadedChunks.clear();
    this.loadingChunks.clear();

    const chunksToLoad = Math.min(this.PRELOAD_CHUNKS, this.totalChunks());

    for (let i = 0; i < chunksToLoad; i++) {
      await this.loadChunk(i);
    }
  }

  // Carica un singolo chunk di dati
  private async loadChunk(chunkIndex: number): Promise<void> {
    // Evita caricamenti duplicati
    if (this.loadedChunks.has(chunkIndex) || this.loadingChunks.has(chunkIndex)) {
      return;
    }

    this.loadingChunks.add(chunkIndex);
    this.isLoadingData.set(true);

    try {
      const session = this.sessionInfo();
      const sessionStart = new Date(session.dateStart).getTime();

      // Calcola le date di inizio e fine del chunk
      const chunkStartSeconds = chunkIndex * this.CHUNK_DURATION_SECONDS;
      const chunkEndSeconds = (chunkIndex + 1) * this.CHUNK_DURATION_SECONDS;

      const dateStart = new Date(sessionStart + chunkStartSeconds * 1000);
      const dateEnd = new Date(sessionStart + chunkEndSeconds * 1000);

      // Assicurati che dateEnd non superi la fine della sessione
      const sessionEnd = new Date(session.dateEnd);
      if (dateEnd > sessionEnd) {
        dateEnd.setTime(sessionEnd.getTime());
      }

      console.log(`Loading chunk ${chunkIndex}: ${dateStart.toISOString()} - ${dateEnd.toISOString()}`);

      const newLocations = await this.sessionApiSvc.getLocations(
        session.sessionKey,
        dateStart,
        dateEnd
      );

      // Aggiungi le nuove location a quelle esistenti
      const currentLocations = this.locations();
      this.locations.set([...currentLocations, ...newLocations]);

      this.loadedChunks.add(chunkIndex);
      console.log(`Chunk ${chunkIndex} loaded: ${newLocations.length} locations`);

      // Cleanup immediato dopo ogni caricamento per mantenere solo i chunk necessari
      this.cleanupOldChunks(this.currentChunkIndex());
    } catch (error) {
      console.error(`Error loading chunk ${chunkIndex}:`, error);
    } finally {
      this.loadingChunks.delete(chunkIndex);
      this.isLoadingData.set(this.loadingChunks.size > 0);
    }
  }

  // Rimuove i chunk troppo lontani dal chunk corrente per mantenere solo MAX_LOADED_CHUNKS in memoria
  private cleanupOldChunks(currentChunkIndex: number): void {
    // Controlla sempre se abbiamo superato il limite
    if (this.loadedChunks.size <= this.MAX_LOADED_CHUNKS) {
      return; // Siamo sotto il limite, nessun cleanup necessario
    }

    const chunksToKeep = new Set<number>();
    const totalChunks = this.totalChunks();

    // Mantieni il chunk corrente e i PRELOAD_CHUNKS successivi
    for (let i = 0; i <= this.PRELOAD_CHUNKS; i++) {
      const chunkToKeep = currentChunkIndex + i;
      if (chunkToKeep >= 0 && chunkToKeep < totalChunks) {
        chunksToKeep.add(chunkToKeep);
      }
    }

    // Se non abbiamo abbastanza chunk da mantenere, aggiungi quelli precedenti
    // fino a raggiungere MAX_LOADED_CHUNKS
    let prevIndex = currentChunkIndex - 1;
    while (chunksToKeep.size < this.MAX_LOADED_CHUNKS && prevIndex >= 0) {
      chunksToKeep.add(prevIndex);
      prevIndex--;
    }

    // Trova tutti i chunk da rimuovere (quelli NON in chunksToKeep)
    const chunksToRemove: number[] = [];
    this.loadedChunks.forEach((chunkIndex) => {
      if (!chunksToKeep.has(chunkIndex)) {
        chunksToRemove.push(chunkIndex);
      }
    });

    // Rimuovi i chunk in eccesso
    if (chunksToRemove.length > 0) {
      console.log(`Cleaning up chunks: ${chunksToRemove.join(', ')} | Keeping: ${Array.from(chunksToKeep).sort((a, b) => a - b).join(', ')}`);

      // Filtra le location per rimuovere quelle dei chunk eliminati
      const session = this.sessionInfo();
      const sessionStart = new Date(session.dateStart).getTime();

      const filteredLocations = this.locations().filter((loc) => {
        const locTime = new Date(loc.date).getTime();
        const elapsed = (locTime - sessionStart) / 1000;
        const locChunk = Math.floor(elapsed / this.CHUNK_DURATION_SECONDS);
        return chunksToKeep.has(locChunk);
      });

      this.locations.set(filteredLocations);

      // Rimuovi i chunk dal set
      chunksToRemove.forEach((chunk) => this.loadedChunks.delete(chunk));

      console.log(`Cleanup complete: ${this.loadedChunks.size} chunks in memory`);
    }
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
    // Assicurati che il valore sia un numero
    const newValue = typeof event === 'number' ? event : Number(event.value || event);

    if (!isNaN(newValue)) {
      this.currentTimeMs.set(newValue);
      if (this.isPlaying()) {
        this.pause();
      }
      // Il caricamento dei chunk sarà gestito automaticamente dall'effect
    } else {
      console.error('Invalid slider value:', event);
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
    const totalDuration = this.totalDurationMs();

    this.animationInterval = setInterval(() => {
      const current = this.currentTimeMs();

      // Avanza il tempo usando il timeStep configurabile
      const nextTime = current + this.playbackTimeStep;

      if (nextTime >= totalDuration) {
        this.pause(); // Ferma alla fine
      } else {
        this.currentTimeMs.set(nextTime);
        // Il caricamento dei chunk sarà gestito automaticamente dall'effect
      }
    }, this.playbackSpeedMs);
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
    this.currentTimeMs.set(0);
  }

  // Formatta il timestamp per la visualizzazione
  formatTimestamp(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return '--:--:--.---';
    }

    try {
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });
    } catch {
      return '--:--:--.---';
    }
  }

  // Formatta la durata in formato leggibile
  formatDuration(ms: number): string {
    if (isNaN(ms) || ms < 0) {
      return '--:--';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Cleanup quando il componente viene distrutto
  ngOnDestroy(): void {
    this.pause();
  }
}

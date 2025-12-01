import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);
  public loadingMap: Map<string, boolean> = new Map<string, boolean>();

  constructor() {}

  setLoading(caricamento: boolean, url: string): void {
    if (!url) throw new Error('An url occurred');

    if (caricamento === true) {
      this.loadingMap.set(url, caricamento);
      this.isLoading.set(true);
    } else if (caricamento === false && this.loadingMap.has(url)) {
      this.loadingMap.delete(url);
    }

    if (this.loadingMap.size === 0) this.isLoading.set(false);
  }
}

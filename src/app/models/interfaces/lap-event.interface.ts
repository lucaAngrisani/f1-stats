export interface LapEvent {
  lapNumber: number;
  driverNumber: number;
  type: 'pit' | 'yellow' | 'vsc' | 'incident' | 'blue' | 'fastest' | 'slowest';
  icon: string;
}

import { Lap } from "../lap.model";

export interface StintInfo {
  driverNumber: number;
  stintNumber: number;
  startLap: number;
  endLap: number;
  laps: Lap[];
  compound?: string;
  avgLapTime: string;
  bestLapTime?: string;
}
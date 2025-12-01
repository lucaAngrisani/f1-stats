import { Lap } from "../lap.model";

export interface DriverLaps {
  driverNumber: number;
  laps: Lap[];
}
import { MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Pit {
  @MapField({
    src: 'date',
  })
  date!: string;

  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'pit_duration',
  })
  pitDuration!: number;

  @MapField({
    src: 'lap_number',
  })
  lapNumber!: number;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;
}

export interface Pit extends MapInterface<Pit> {}

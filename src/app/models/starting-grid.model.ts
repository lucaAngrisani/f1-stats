import { MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class StartingGrid {
  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'position',
  })
  position!: number;

  @MapField({
    src: 'lap_duration',
  })
  lapDuration!: number;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;
}

export interface StartingGrid extends MapInterface<StartingGrid> {}

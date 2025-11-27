import { DateField, MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Location {
  @DateField()
  date!: Date;

  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;

  @MapField()
  x!: number;

  @MapField()
  y!: number;

  @MapField()
  z!: number;
}

export interface Location extends MapInterface<Location> {}

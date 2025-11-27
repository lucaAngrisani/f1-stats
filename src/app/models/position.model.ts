import { DateField, MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Position {
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
    src: 'position',
  })
  position!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;
}

export interface Position extends MapInterface<Position> {}

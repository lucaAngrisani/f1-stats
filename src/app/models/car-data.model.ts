import { DateField, MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class CarData {
  @MapField({
    src: 'brake',
  })
  brake!: number;

  @DateField()
  date!: Date;

  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'drs',
  })
  drs!: number;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'n_gear',
  })
  nGear!: number;

  @MapField({
    src: 'rpm',
  })
  rpm!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;

  @MapField({
    src: 'speed',
  })
  speed!: number;

  @MapField({
    src: 'throttle',
  })
  throttle!: number;
}

export interface CarData extends MapInterface<CarData> {}

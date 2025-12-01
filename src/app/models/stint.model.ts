import { DateField, MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Stint {

  @MapField({
    src: 'compound',
  })
  compound!: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'lap_end',
  })
  lapEnd!: number;
  
    @MapField({
    src: 'lap_start',
  })
  lapStart!: number;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'stint_number',
  })
  stintNumber!: number;

  @MapField({
    src: 'tyre_age_at_start',
  })
  tyreAgeAtStart!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;
}

export interface Stint extends MapInterface<Stint> {}
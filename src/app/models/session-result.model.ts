import { MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class SessionResult {
  @MapField({
    src: 'dnf',
  })
  dnf!: boolean;

  @MapField({
    src: 'dns',
  })
  dns!: boolean;

  @MapField({
    src: 'dsq',
  })
  dsq!: boolean;

  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'duration',
  })
  duration!: number | number[];

  @MapField({
    src: 'gap_to_leader',
  })
  gapToLeader!: number | number[] | string;

  @MapField({
    src: 'number_of_laps',
  })
  numberOfLaps!: number;

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

export interface SessionResult extends MapInterface<SessionResult> {}

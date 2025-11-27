import { MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Lap {
  @MapField({
    src: 'date_start',
  })
  dateStart!: string;

  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'duration_sector_1',
  })
  durationSector1!: number;

  @MapField({
    src: 'duration_sector_2',
  })
  durationSector2!: number;

  @MapField({
    src: 'duration_sector_3',
  })
  durationSector3!: number;

  @MapField({
    src: 'i1_speed',
  })
  i1Speed!: number;

  @MapField({
    src: 'i2_speed',
  })
  i2Speed!: number;

  @MapField({
    src: 'is_pit_out_lap',
  })
  isPitOutLap!: boolean;

  @MapField({
    src: 'lap_duration',
  })
  lapDuration!: number;

  @MapField({
    src: 'lap_number',
  })
  lapNumber!: number;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'segments_sector_1',
  })
  segmentsSector1!: number[];

  @MapField({
    src: 'segments_sector_2',
  })
  segmentsSector2!: number[];

  @MapField({
    src: 'segments_sector_3',
  })
  segmentsSector3!: number[];

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;

  @MapField({
    src: 'st_speed',
  })
  stSpeed!: number;
}

export interface Lap extends MapInterface<Lap> {}

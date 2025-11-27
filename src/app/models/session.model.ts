import { MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Session {
  @MapField({
    src: 'circuit_key',
  })
  circuitKey!: number;

  @MapField({
    src: 'circuit_short_name',
  })
  circuitShortName!: string;

  @MapField({
    src: 'country_code',
  })
  countryCode!: string;

  @MapField({
    src: 'country_key',
  })
  countryKey!: number;

  @MapField({
    src: 'country_name',
  })
  countryName!: string;

  @MapField({
    src: 'date_start',
  })
  dateStart!: string;

  @MapField({
    src: 'date_end',
  })
  dateEnd!: string;

  @MapField({
    src: 'gmt_offset',
  })
  gmtOffset!: string;

  @MapField({
    src: 'location',
  })
  location!: string;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;

  @MapField({
    src: 'session_name',
  })
  sessionName!: string;

  @MapField({
    src: 'session_type',
  })
  sessionType!: string;

  @MapField({
    src: 'year',
  })
  year!: number;
}

export interface Session extends MapInterface<Session> {}

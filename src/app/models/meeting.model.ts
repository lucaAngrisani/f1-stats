import { MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Meeting {
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
    src: 'meeting_name',
  })
  meetingName!: string;

  @MapField({
    src: 'meeting_official_name',
  })
  meetingOfficialName!: string;

  @MapField({
    src: 'year',
  })
  year!: number;
}

export interface Meeting extends MapInterface<Meeting> {}

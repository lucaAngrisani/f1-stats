import { MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Driver {
  @MapField({
    src: 'broadcast_name',
  })
  broadcastName!: string;

  @MapField({
    src: 'country_code',
  })
  countryCode!: string;

  @MapField({
    src: 'driver_number',
  })
  driverNumber!: number;

  @MapField({
    src: 'first_name',
  })
  firstName!: string;

  @MapField({
    src: 'last_name',
  })
  lastName!: string;

  @MapField({
    src: 'full_name',
  })
  fullName!: string;

  @MapField({
    src: 'headshot_url',
  })
  headshotUrl?: string;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'name_acronym',
  })
  nameAcronym!: string;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;

  @MapField({
    src: 'team_colour',
  })
  teamColour!: string;

  @MapField({
    src: 'team_name',
  })
  teamName!: string;
}

export interface Driver extends MapInterface<Driver> {}

import { DateField, MapClass, MapField, MapInterface } from 'mapper-factory';

@MapClass()
export class Weather {
  @MapField({
    src: 'air_temperature',
  })
  airTemperature!: number;

  @DateField()
  date!: Date;

  @MapField({
    src: 'humidity',
  })
  humidity!: number;

  @MapField({
    src: 'meeting_key',
  })
  meetingKey!: number;

  @MapField({
    src: 'pressure',
  })
  pressure!: number;

  @MapField({
    src: 'rainfall',
  })
  rainfall!: number;

  @MapField({
    src: 'session_key',
  })
  sessionKey!: number;

  @MapField({
    src: 'track_temperature',
  })
  trackTemperature!: number;

  @MapField({
    src: 'wind_direction',
  })
  windDirection!: number;

  @MapField({
    src: 'wind_speed',
  })
  windSpeed!: number;
}

export interface Weather extends MapInterface<Weather> {}

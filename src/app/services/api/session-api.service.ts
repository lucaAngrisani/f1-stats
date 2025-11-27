import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { ApiService } from '../api.service';
import { API } from '../../api';
import { Session } from '../../models/session.model';
import { SessionResult } from '../../models/session-result.model';
import { Lap } from '../../models/lap.model';
import { Weather } from '../../models/weather.model';
import { Position } from '../../models/position.model';
import { Location } from '../../models/location.model';

@Injectable()
export class SessionApiService {
  constructor(private api: ApiService) {}

  getSession(sessionKey: string = 'latest'): Promise<Session[]> {
    return firstValueFrom(
      this.api
        .get<Session[]>(API.SESSION.GET_ALL.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new Session().from(item)) ?? []))
    );
  }

  getSessionResult(sessionKey: string = 'latest'): Promise<SessionResult[]> {
    return firstValueFrom(
      this.api
        .get<SessionResult[]>(API.SESSION.GET_INFO.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new SessionResult().from(item)) ?? []))
    );
  }

  getLap(sessionKey: string = 'latest'): Promise<Lap[]> {
    return firstValueFrom(
      this.api
        .get<Lap[]>(API.SESSION.GET_LAP_TIMES.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new Lap().from(item)) ?? []))
    );
  }

  getPosition(sessionKey: string = 'latest'): Promise<Position[]> {
    return firstValueFrom(
      this.api
        .get<Position[]>(API.SESSION.GET_POSITION.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new Position().from(item)) ?? []))
    );
  }

  getLocations(sessionKey: string = 'latest', dateStart: Date, dateEnd: Date): Promise<Location[]> {
    return firstValueFrom(
      this.api
        .get<Location[]>(API.SESSION.GET_LOCATIONS.replace('{sessionKey}', sessionKey).replace('{dateStart}', dateStart.toISOString()).replace('{dateEnd}', dateEnd.toISOString()))
        .pipe(map((res) => res?.map((item) => new Location().from(item)) ?? []))
    );
  }

  getWeather(sessionKey: string = 'latest'): Promise<Weather[]> {
    return firstValueFrom(
      this.api
        .get<Weather[]>(API.SESSION.GET_WEATHER.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new Weather().from(item)) ?? []))
    );
  }

  getSessionByMeeting(meetingKey: string = 'latest'): Promise<Session[]> {
    return firstValueFrom(
      this.api
        .get<Session[]>(API.SESSION.GET_BY_MEETING.replace('{meetingKey}', meetingKey))
        .pipe(map((res) => res?.map((item) => new Session().from(item)) ?? []))
    );
  }
}

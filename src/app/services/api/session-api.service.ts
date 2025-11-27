import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { ApiService } from '../api.service';
import { API } from '../../api';
import { Session } from '../../models/session.model';
import { SessionResult } from '../../models/session-result.model';
import { Lap } from '../../models/lap.model';

@Injectable()
export class SessionApiService {
  constructor(private api: ApiService) {}

  getSession(sessionKey: string = 'latest'): Promise<Session[]> {
    return firstValueFrom(
      this.api
        .get<Session[]>(API.SESSION.GET_ALL?.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new Session().from(item)) ?? []))
    );
  }

  getSessionResult(sessionKey: string = 'latest'): Promise<SessionResult[]> {
    return firstValueFrom(
      this.api
        .get<SessionResult[]>(API.SESSION.GET_INFO?.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new SessionResult().from(item)) ?? []))
    );
  }

  getLap(sessionKey: string = 'latest'): Promise<Lap[]> {
    return firstValueFrom(
      this.api
        .get<Lap[]>(API.SESSION.GET_LAP_TIMES?.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new Lap().from(item)) ?? []))
    );
  }

  getSessionByMeeting(meetingKey: string = 'latest'): Promise<Session[]> {
    return firstValueFrom(
      this.api
        .get<Session[]>(API.SESSION.GET_BY_MEETING?.replace('{meetingKey}', meetingKey))
        .pipe(map((res) => res?.map((item) => new Session().from(item)) ?? []))
    );
  }
}

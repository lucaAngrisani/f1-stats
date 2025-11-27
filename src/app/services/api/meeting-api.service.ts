import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { ApiService } from '../api.service';
import { API } from '../../api';
import { Meeting } from '../../models/meeting.model';

@Injectable()
export class MeetingApiService {
  constructor(private api: ApiService) {}

  getAllMeeting(year: number = new Date().getFullYear()): Promise<Meeting[]> {
    return firstValueFrom(
      this.api
        .get<Meeting[]>(API.MEETING.GET_ALL?.replace('{year}', year.toString()))
        .pipe(map((res) => res?.map((item) => new Meeting().from(item)) ?? []))
    );
  }
}

import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { ApiService } from '../api.service';
import { API } from '../../api';
import { Driver } from '../../models/driver.model';

@Injectable()
export class DriverApiService {
  constructor(private api: ApiService) {}

  getAllDriver(sessionKey: string = 'latest'): Promise<Driver[]> {
    return firstValueFrom(
      this.api
        .get<Driver[]>(API.DRIVER.GET_ALL?.replace('{sessionKey}', sessionKey))
        .pipe(map((res) => res?.map((item) => new Driver().from(item)) ?? []))
    );
  }
}

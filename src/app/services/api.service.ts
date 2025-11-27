import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ErrorService } from './error.service';
import { GetOptions } from '../models/api/get-options.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient, private errorService: ErrorService) {}

  public postCustomBase<T, S>(
    baseUrl: string,
    postObj: T,
    api: string,
    opt?: GetOptions,
    errorMessage?: string
  ): Observable<S> {
    return this.http.post<S>(`${baseUrl}/${api}`, postObj, opt).pipe(
      catchError((exception) => {
        this.errorService.emitError(
          exception?.error?.message || exception?.status,
          errorMessage || exception?.error?.error
        );
        throw Error();
      })
    );
  }

  public post<T, S>(
    api: string,
    postObj?: T,
    opt?: GetOptions,
    errorMessage?: string
  ): Observable<S> {
    return this.http.post<S>(`${api}`, postObj, opt).pipe(
      catchError((exception) => {
        this.errorService.emitError(
          exception?.error?.message || exception?.status,
          errorMessage || exception?.error?.error
        );
        throw Error();
      })
    );
  }

  public put<T, S>(
    api: string,
    postObj?: T,
    opt?: GetOptions,
    errorMessage?: string
  ): Observable<S> {
    return this.http.put<S>(`${api}`, postObj, opt).pipe(
      catchError((exception) => {
        this.errorService.emitError(
          exception?.error?.message || exception?.status,
          errorMessage || exception?.error?.error
        );
        throw Error();
      })
    );
  }

  public getCustomBase<S>(
    baseUrl: string,
    api: string,
    opt?: GetOptions,
    errorMessage?: string
  ): Observable<S> {
    return this.http.get<S>(`${baseUrl}/${api}`, opt).pipe(
      catchError((exception) => {
        this.errorService.emitError(
          exception?.error?.message || exception?.status,
          errorMessage || exception?.error?.error
        );
        throw Error();
      })
    );
  }

  public delete<S>(api: string, opt?: GetOptions, errorMessage?: string): Observable<S> {
    return this.http.delete<S>(`${api}`, opt).pipe(
      catchError((exception) => {
        this.errorService.emitError(
          exception?.error?.message || exception?.status,
          errorMessage || exception?.error?.error
        );
        throw Error();
      })
    );
  }

  public get<S>(api: string, opt?: GetOptions, errorMessage?: string): Observable<S> {
    return this.http.get<S>(`${api}`, opt).pipe(
      catchError((exception) => {
        this.errorService.emitError(
          exception?.error?.message || exception?.status,
          errorMessage || exception?.error?.error
        );
        throw Error();
      })
    );
  }

  public postBlob<T>(api: string, postObj: T, errorMessage?: string): Observable<Blob> {
    return this.http
      .post(`${api}`, postObj, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (!response.body) {
            throw new Error('No Blob body in response');
          }
          return response.body;
        }),
        catchError((exception) => {
          this.errorService.emitError(
            exception?.error?.message || exception?.status,
            errorMessage || exception?.error?.error
          );
          throw Error();
        })
      );
  }
}

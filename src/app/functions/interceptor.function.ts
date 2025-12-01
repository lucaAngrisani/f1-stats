import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import { inject } from '@angular/core';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';
import { from, lastValueFrom } from 'rxjs';
import { LoadingService } from '../components/loading/loading.service';
import { EXCEPTION_URL_LOADING } from '../shared/exception.loading';

export const intercept: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const defaultTimeout = 10000;
  const loadingService = inject(LoadingService);

  const timestamp: number = new Date().getTime();

  if (!EXCEPTION_URL_LOADING.some((url) => request.url?.includes(url))) {
    loadingService.setLoading(true, `${request.url}?${timestamp}`);
  }

  return from(lastValueFrom(next(request))).pipe(
    timeout(Number(defaultTimeout)),
    tap((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        if (event?.body?.operationResultCode && event.body?.operationResultCode >= 400) {
          throw Error(event.body?.operationResultDescription);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      /*errorService.emitError({
        summary: error.statusText,
        detail: error.message,
      });*/

      throw error;
    }),
    finalize(() => {
      loadingService.setLoading(false, `${request.url}?${timestamp}`);
    })
  );
};

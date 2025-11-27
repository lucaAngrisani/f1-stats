import { HttpHeaders, HttpParams } from '@angular/common/http';

export class GetOptions {
  headers?: HttpHeaders;
  body?: any;
  observe?: 'body' | undefined;
  params?: HttpParams;
  reportProgress?: boolean | undefined;
  withCredentials?: boolean | undefined;

  constructor(options?: GetOptions) {
    this.headers = options?.headers;
    this.body = options?.body;
    this.observe = options?.observe;
    this.params = options?.params;
    this.reportProgress = options?.reportProgress;
    this.withCredentials = options?.withCredentials;
  }
}

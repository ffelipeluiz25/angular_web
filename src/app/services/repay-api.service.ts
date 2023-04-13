import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiIntegrationProxyDto } from '../models/apiIntegrationProxyDto';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class RepayApiService {
  private proxyConnection: ApiIntegrationProxyDto;

  constructor(
    private api: ApiService,
  ) { }

  public async get(route: string) {
    this.proxyConnection = {
      apiName: "RepayApi",
      apiRouteParams: route,
      method: "get"
    };
    let request = this.api.proxy(this.proxyConnection, true, true);
    return await this.getData<any>(request);
  }

  public async post(route: string, data: any) {
    this.proxyConnection = {
      apiName: "RepayApi",
      apiRouteParams: route,
      method: "post",
      data: data
    };
    let request = this.api.proxy(this.proxyConnection, true, true);
    return await this.getData<any>(request);
  }

  public async getData<T>(request: Observable<any>): Promise<T> {
    const result = (await request.toPromise().catch(err => {
      return new Promise(rejects => {
        rejects(<T>err.error);
      });
    }));

    return new Promise(resolve => {
      resolve(<T>result);
    });
  }
}

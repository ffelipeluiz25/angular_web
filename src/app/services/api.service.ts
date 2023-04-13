import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { filter, pairwise } from 'rxjs/operators';
import { Router, RoutesRecognized } from '@angular/router';
import { ApiIntegrationProxyDto } from '../models/apiIntegrationProxyDto';

@Injectable()
export class ApiService {

  private api_url: string;

  constructor(private httpClient: HttpClient, private router: Router) {
    this.api_url = environment.api_url + '/loansforfeds';
    console.log('api_url', this.api_url);
    this.router.events
      .pipe(filter((evt: any) => evt instanceof RoutesRecognized), pairwise())
      .subscribe((events: RoutesRecognized[]) => {
        const url = events[0].urlAfterRedirects.split(/[?#]/)[0];
        sessionStorage.setItem('previous_url', url);
      });
  }

  public get(endpoint: string, data: any = null, blockUI: boolean = false, progressBar: boolean = false, useJustEnvApiUrl: boolean = false) {
    let headers = this.getHeaders(blockUI, progressBar);
    return this.httpClient.get<any>(this.GetApiUrl(useJustEnvApiUrl) + endpoint, { params: data, headers: headers, withCredentials: true });
  }

  public post(endpoint: string, data: any, blockUI: boolean = false, progressBar: boolean = false, useJustEnvApiUrl: boolean = false) {
    let headers = this.getHeaders(blockUI, progressBar);
    return this.httpClient.post<any>(this.GetApiUrl(useJustEnvApiUrl) + endpoint, data, { headers: headers, withCredentials: true });
  }

  public post_external_api(endpoint: string, data: any, blockUI: boolean = false, progressBar: boolean = false) {
    let headers = this.getHeaders(blockUI, progressBar);
    return this.httpClient.post<any>(endpoint, data, { headers: headers, withCredentials: true });
  }

  public postResponeType(endpoint: string, data: any, blockUI: boolean = false, progressBar: boolean = false) {
    let headers = this.getHeaders(blockUI, progressBar);
    let requestOptions: Object = {
      /* other options here */
      responseType: 'blob',
      headers: headers
    }
    return this.httpClient.post<any>(this.api_url + endpoint, data, requestOptions);
  }

  public put(endpoint: string, data: any, blockUI: boolean = false, progressBar: boolean = false, useJustEnvApiUrl: boolean = false) {
    let headers = this.getHeaders(blockUI, progressBar);
    return this.httpClient.put<any>(this.GetApiUrl(useJustEnvApiUrl) + endpoint, data, { headers: headers, withCredentials: true });
  }

  public delete(endpoint: string, data: any, blockUI: boolean = false, progressBar: boolean = false, useJustEnvApiUrl: boolean = false) {
    let headers = this.getHeaders(blockUI, progressBar);
    return this.httpClient.delete<any>(this.GetApiUrl(useJustEnvApiUrl) + endpoint, { params: data, headers: headers, withCredentials: true });
  }

  public proxy(data: ApiIntegrationProxyDto, blockUI: boolean = false, progressBar: boolean = false) {
    if (data.method === 'get' && data.data !== null) {
      const querystring = require('querystring');
      let queryString = querystring.stringify(data.data);
      if (queryString && queryString !== '') {
        data.apiRouteParams += '?' + queryString;
      }
    }
    let headers = this.getHeaders(blockUI, progressBar);
    return this.httpClient.post<any>(environment.api_url + "/proxy", data, { headers: headers });
  }

  public login(data: any) {
    let headers = this.getHeaders(true, false);
    return this.httpClient.post<any>(environment.api_url + '/login', data, { headers: headers, withCredentials: true });
  }

  public sendResetPasswordEmail(data: any) {
    let headers = this.getHeaders(true, false);
    return this.httpClient.post<any>(environment.api_url + '/reset-password/send-email', data, { headers: headers, withCredentials: true });
  }

  public redefinePassword(data: any) {
    let headers = this.getHeaders(true, false);
    return this.httpClient.post<any>(environment.api_url + '/reset-password/redefine', data, { headers: headers, withCredentials: true });
  }

  public LogEcommercePipe(pipe_step: string, action: string, meta_data: any = null, vendor: string = null, componentUsedIn: string = null) {
    const headers = this.getHeaders(false, false);
    const data = { pipe_step, action, meta_data: null, vendor: null, componentUsedIn: null };

    if (meta_data) data.meta_data = meta_data;
    if (vendor) data.vendor = vendor;
    if (componentUsedIn) data.componentUsedIn = componentUsedIn;

    this.httpClient.post<any>(this.api_url + '/pipe', data, { headers, withCredentials: true }).subscribe(result => {
    });
  }

  public LogEcommercePipeUnauth(program: string, pipe_step: string, action: string, meta_data: any = null) {
    const data = { program, pipe_step, action, meta_data: null };

    if (meta_data) {
      data.meta_data = meta_data;
    }

    const url = environment.api_url + '/shared/pipe';
    this.httpClient.post<any>(url, data, { withCredentials: true }).subscribe(result => {
    });
  }

  public LogReferralPipe(pipe_step: string, action: string, source: string, campaign: string) {
    const headers = this.getHeaders(false, false);
    const data = { pipe_step, action, source, campaign };

    this.httpClient.post<any>(this.api_url + '/referral-pipe', data, { headers, withCredentials: true }).subscribe(result => {
    });
  }

  public ExternalPost(endpoint: string, data: any, blockUI: boolean = false, progressBar: boolean = false) {
    const headers = this.getHeaders(blockUI, progressBar);
    return this.httpClient.post<any>(endpoint, data, { headers: headers, withCredentials: true });
  }

  public getUrlCustomerIdentity() {
    const headers = this.getHeaders(true, false);
    return this.httpClient.get<any>(environment.api_url + '/customer-identity/get-url', { headers: headers, withCredentials: true });
  }

  getFaceIdCustomerStatus(customerId: string) {
    const headers: any = {};
    const url = environment.face_id.customer_status_url.replace('{{customer_id}}', customerId);
    console.log('customer status url', url);
    return this.httpClient.get<any>(url, { headers: headers });
  }

  public getHeaders(blockUI: boolean, progressBar: boolean) {
    var headers: any = {};
    if (blockUI) {
      headers.use_block_ui = 'true';
    }
    if (progressBar) {
      headers.use_progress_bar = 'true';
    }
    return new HttpHeaders(headers);
  }

  public getLatitudeAndLongitudeIP() {
    return this.httpClient.post<any>(environment.geolocation.geolocation_api_endpoint + '?key=' + environment.geolocation.key, {});
  }

  private GetApiUrl(useJustEnvApiUrl: boolean = false): string {
    return useJustEnvApiUrl ? environment.api_url : this.api_url;
  }
}

import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as moment from 'moment';

@Injectable()
export class AuthenticationService {

  constructor(private api: ApiService, public jwtHelper: JwtHelperService) {

  }

  public RefreshToken() {
    this.api.post('/refi', null, false).subscribe(result => {
      if (result.success) {
        this.setToken(result.token);
      }
    });
  }

  public static GetToken() {
    return localStorage.getItem(environment.jwt_token_name);
  }

  public setToken(token: string) {
    localStorage.setItem(environment.jwt_token_name, token);
  }

  public getToken() {
    return AuthenticationService.GetToken();
  }

  public isAuthenticated() {
    const token = localStorage.getItem(environment.jwt_token_name);
    const isAuth = token ? true : false;
    return isAuth;
  }

  public getUserInfo() {
    const token = this.getToken();
    return token == null ? null : this.jwtHelper.decodeToken(token);
  }

  public removeToken() {
    localStorage.removeItem(environment.jwt_token_name);
  }

  public setLastRequestTime() {
    const time = moment().format('YYYY-MM-DD HH:mm:ss');
    localStorage.setItem(environment.last_request_token_name, time);
  }

  public getLastRequestTime() {
    return localStorage.getItem(environment.last_request_token_name);
  }

}

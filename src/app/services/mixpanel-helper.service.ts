import { Injectable } from '@angular/core';
import { BmgmoneyTrackingService } from '@bmgmoney/bmgmoney-tracking';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { UtilityService } from './utility.service';
import { UTMParamsService } from './utmparams.service';

@Injectable({
  providedIn: 'root'
})
export class MixpanelHelperService {

  constructor(
    private authService: AuthenticationService,
    private trackingService: BmgmoneyTrackingService,
    private UTMParams: UTMParamsService,
    private utils: UtilityService) { }

  private getMixPanelEventData(userIP): any {
    const customer = this.authService.getUserInfo();
    const url: string = window.location.href;
    const eventData: any = {
      signin_date: new Date().toISOString(),
      current_url: url,
      last_utm_source: this.UTMParams.getMixpanelUtmSource(),
      last_utm_medium: this.UTMParams.getMixpanelUtmMedium(),
      last_utm_campaign: this.UTMParams.data?.utm_campaign,
      program: this.utils.getProgramName(customer?.program),
      sub_program: this.utils.getSubProgramDescription(customer?.sub_program),
      ip_address: userIP
    };

    return eventData;
  }

  public trackOnMixpanel(eventName: string, userIP: string = null): Observable<any> {
    const customer = this.authService.getUserInfo();
    const eventData = this.getMixPanelEventData(userIP);
    console.log('mix panel event ------>', eventName);
    console.log('mix panel data ------>', eventData);
    return this.trackingService.track(eventName, eventData, customer?.id);
  }

  public trackOnMixpanelCustomEvent(eventName: string, eventData: any): Observable<any> {
    const customer = this.authService.getUserInfo();
    console.log('mix panel event ------>', eventName);
    console.log('mix panel data ------>', eventData);
    return this.trackingService.track(eventName, eventData, customer?.id);
  }
}

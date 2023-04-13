import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class UTMParamsService {

  public data: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute) { }


  UTMTagsString(isMock = false, typeStartTest = null, iHeart = false) {
    var newParamsUrl = null;

    this.route.queryParams.subscribe(params => {
      var queryParams = "";

      if (params['utm_source']) {
        this.SetCookie(environment.utm_source_cookie_name, params['utm_source'], environment.utm_cookies_expires_days);
        queryParams += `utm_source=${params['utm_source']}&`;
      } else {
        this.EraseCookie(environment.utm_source_cookie_name);
      }

      if (params['utm_medium']) {
        this.SetCookie(environment.utm_medium_cookie_name, params['utm_medium'], environment.utm_cookies_expires_days);
        queryParams += `utm_medium=${params['utm_medium']}&`;
      } else {
        this.EraseCookie(environment.utm_medium_cookie_name);
      }

      if (params['utm_campaign']) {
        this.SetCookie(environment.utm_campaign_cookie_name, params['utm_campaign'], environment.utm_cookies_expires_days);
        queryParams += `utm_campaign=${params['utm_campaign']}&`;
      } else {
        this.EraseCookie(environment.utm_campaign_cookie_name);
      }

      if (params['utm_content']) {
        this.SetCookie(environment.utm_content_cookie_name, params['utm_content'], environment.utm_cookies_expires_days);
        queryParams += `utm_content=${params['utm_content']}&`;
      } else {
        this.EraseCookie(environment.utm_content_cookie_name);
      }

      if (params['utm_term']) {
        this.SetCookie(environment.utm_term_cookie_name, params['utm_term'], environment.utm_cookies_expires_days);
        queryParams += `utm_term=${params['utm_term']}&`;
      } else {
        this.EraseCookie(environment.utm_term_cookie_name);
      }

      if (params['gclid']) {
        this.SetCookie(environment.gclid_cookie_name, params['gclid'], environment.utm_cookies_expires_days);
        queryParams += `gclid=${params['gclid']}&`;
      } else {
        this.EraseCookie(environment.gclid_cookie_name);
      }

      if (params['fbclid']) {
        this.SetCookie(environment.fbclid_cookie_name, params['fbclid'], environment.utm_cookies_expires_days);
        queryParams += `fbclid=${params['fbclid']}&`;
      } else {
        this.EraseCookie(environment.fbclid_cookie_name);
      }

      if (params['msclkid']) {
        this.SetCookie(environment.msclkid_cookie_name, params['msclkid'], environment.utm_cookies_expires_days);
        queryParams += `msclkid=${params['msclkid']}&`;
      } else {
        this.EraseCookie(environment.msclkid_cookie_name);
      }

      if (isMock)
        queryParams += `mock=1&`;

      if (iHeart)
        queryParams += `iheart=true&`;

      if (typeStartTest != null)
        queryParams += `typeStartTest=${typeStartTest}`;

      newParamsUrl = this.sanitazeQueryParams(queryParams);
    });

    this.data = newParamsUrl
    return this.data;
  };


  UTMTagsObject(isMock = false, typeStartTest = null, iHeart = false) {
    var queryParams = new Object();

    this.route.queryParams.subscribe(params => {

      if (params['utm_source']) {
        this.SetCookie(environment.utm_source_cookie_name, params['utm_source'], environment.utm_cookies_expires_days);
        queryParams['utm_source'] = params['utm_source'];
      } else {
        this.EraseCookie(environment.utm_source_cookie_name);
      }

      if (params['utm_medium']) {
        this.SetCookie(environment.utm_medium_cookie_name, params['utm_medium'], environment.utm_cookies_expires_days);
        queryParams['utm_medium'] = params['utm_medium'];
      } else {
        this.EraseCookie(environment.utm_medium_cookie_name);
      }

      if (params['utm_campaign']) {
        this.SetCookie(environment.utm_campaign_cookie_name, params['utm_campaign'], environment.utm_cookies_expires_days);
        queryParams['utm_campaign'] = params['utm_campaign'];
      } else {
        this.EraseCookie(environment.utm_campaign_cookie_name);
      }

      if (params['utm_content']) {
        this.SetCookie(environment.utm_content_cookie_name, params['utm_content'], environment.utm_cookies_expires_days);
        queryParams['utm_content'] = params['utm_content'];
      } else {
        this.EraseCookie(environment.utm_content_cookie_name);
      }

      if (params['utm_term']) {
        this.SetCookie(environment.utm_term_cookie_name, params['utm_term'], environment.utm_cookies_expires_days);
        queryParams['utm_term'] = params['utm_term'];
      } else {
        this.EraseCookie(environment.utm_term_cookie_name);
      }

      if (params['gclid']) {
        this.SetCookie(environment.gclid_cookie_name, params['gclid'], environment.utm_cookies_expires_days);
        queryParams['gclid'] = params['gclid'];
      } else {
        this.EraseCookie(environment.gclid_cookie_name);
      }

      if (params['fbclid']) {
        this.SetCookie(environment.fbclid_cookie_name, params['fbclid'], environment.utm_cookies_expires_days);
        queryParams['fbclid'] = params['fbclid'];
      } else {
        this.EraseCookie(environment.fbclid_cookie_name);
      }

      if (params['msclkid']) {
        this.SetCookie(environment.msclkid_cookie_name, params['msclkid'], environment.utm_cookies_expires_days);
        queryParams['msclkid'] = params['msclkid'];
      } else {
        this.EraseCookie(environment.msclkid_cookie_name);
      }

    });

    if (isMock)
      queryParams['mock'] = 1;

    if (iHeart)
      queryParams['iheart'] = true;

    if (typeStartTest)
      queryParams['mock'] = typeStartTest;

    this.data = queryParams
    return this.data;
  };

  SetCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; domain=bmgmoney.com';
  }

  ReadCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') { c = c.substring(1, c.length); }
      if (c.indexOf(nameEQ) === 0) { return c.substring(nameEQ.length, c.length); }
    }
    return null;
  }


  EraseCookie(name) {
    var expires = "expires=" + new Date(0).toUTCString();
    document.cookie = name + "=;" + expires + "; path=/;domain=bmgmoney.com";
  }

  sanitazeQueryParams(params) {

    if (params == null)
      return params;
    else {
      var lastCharacter = params.charAt(params.length - 1);
      if (lastCharacter == "&")
        return params.slice(0, -1);
      else
        return params;
    }
  }

  isUtmSourceFromEmail = () => this.data?.utm_source == "application";

  getMixpanelUtmSource() {
    if (this.data?.utm_source)
      return this.data?.utm_source;

    if (!this.data?.referrer)
      return null;

    if (this.data?.referrer.search('https?://(.*)google.([^/?]*)') === 0)
      return 'google';
    else if (this.data?.referrer.search('https?://(.*)bing.com') === 0)
      return 'bing';
    else if (this.data?.referrer.search('https?://(.*)facebook.com') === 0)
      return 'facebook';
    else if (this.data?.referrer.search('https?://(.*)instagram.com') === 0)
      return 'instagram';
    else
      return null;
  }

  isRefererFromDomain(referer: string, domain: string) {
    if (!referer)
      return false;

    return referer.search(`https?://(.*)${domain}.com`) === 0
  }

  getMixpanelUtmMedium(){
    if(this.data?.utm_medium){
      return this.data.utm_medium;
    } else{
      if(this.isRefererFromDomain(this.data?.referrer,'instagram')) {
        if(this.data?.fbclid)
          return 'social_ads';
        else
          return 'social';
      }
  
      if(this.isRefererFromDomain(this.data?.referrer, 'google')){
        if(this.data?.gclid)
          return 'cpc';
        else
          return 'organic';
      }
  
      if(this.isRefererFromDomain(this.data?.referrer, 'bing')){
        if(this.data?.msclkid)
          return 'cpc';
        else
          return 'organic';
      }
  
      if(this.isRefererFromDomain(this.data?.referrer, 'facebook')){
        if(this.data?.fbclid)
          return 'social_ads';
        else
          return 'social';
      }
    }

    //default
    return null;

  }



}
import { Component, OnInit, Inject, Renderer2, isDevMode } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';
import { ApiService } from '../../../services/api.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import { UTMParamsService } from '../../../services/utmparams.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { NgxHotjarService } from 'ngx-hotjar';
import { hotjarIdentity } from '@bmgmoney/ngx-hotjar-router';

@Component({
  selector: 'app-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrls: ['./authenticate.component.css']
})
export class AuthenticateComponent implements OnInit {

  private token: string;
  private ref = '';
  private source: string;
  private redirectUrl: string;
  private isBrowser = false;
  private is_mock = false;
  private cookie_expires_days = 180;
  private utm_source = '';
  private utm_medium = '';
  private utm_campaign = '';
  private utm_content = '';
  private utm_term = '';
  private browser_fingerprint = '';
  private typeStartTest: number = 0;
  @BlockUI() blockUI: NgBlockUI;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private api: ApiService,
    private steps: LoansForFedsSteps,
    private UTMParams: UTMParamsService,
    private featureToggle: FeatureToggleClientService,
    private mixPanelHelper: MixpanelHelperService,
    private gtmService: GoogleTagManagerService,
    @Inject(PLATFORM_ID) platformId: Object,
    private hjService: NgxHotjarService,
    private renderer2: Renderer2
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.redirectUrl = '/';
    this.UTMParams.UTMTagsObject();
    if (this.isBrowser) {
      this.route.queryParams.subscribe(params => {
        if (params['t']) {
          this.token = params['t'];
        }
        if (params['source']) {
          this.source = params['source'];
        }
        if (params['s']) {
          this.redirectUrl = this.steps.getUrlToRedirect(params['s']);
        }
        if (params['redirect']) {
          this.redirectUrl = params['redirect'];
        }
        if (params['ref']) {
          this.ref = params['ref'];
        }

        console.log('REF LFF=====>', this.ref);

        this.browser_fingerprint = localStorage.getItem('fingerprint');
        if (!this.browser_fingerprint) {
          if (params['b']) {
            this.browser_fingerprint = params['b'];
          }
          localStorage.setItem('fingerprint', this.browser_fingerprint);
        }

        this.api.post('/authenticate', { token: this.token, source: this.source, browser_fingerprint: this.browser_fingerprint }, true).subscribe(result => {
          this.authService.setToken(result.data.token);
          console.log('auth');

          this.setAdaToken(result.data.chatbotToken);
          this.saveCobroseEmail(result.data.email);
          this.hotjarIdentifyUserManually();

          if(this.featureToggle.IsEnabled('enhanced_conversions'))
            this.pushEnhancedConversionTag(result.data.enhancedConversionsData);

          if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
            console.log('auth1');
            if (this.ref !== 'searchEmployer') {
              this.trackLoginOnMixpanelAndRedirect();
            } else {
              this.redirect();
            }
          } else {
            console.log('redirect1', this.redirectUrl);
            this.redirect();
          }
        }, error => {
          console.log('error');
          window.location.href = environment.login_url;
        });
      });
    }
  }

  setAdaToken(token) {
    let myScript = this.renderer2.createElement('script');
    myScript.type = `text/javascript`;
    myScript.text = `adaEmbed.setMetaFields( { jwt_token: "` + token + `" })`;
    this.renderer2.appendChild(document.body, myScript);
  }

  saveCobroseEmail(email)
  {
    let myScript = this.renderer2.createElement('script');
    myScript.type = `text/javascript`;
    myScript.text = `CobrowseIO.customData = {user_email:"`+email+`"}`;
    this.renderer2.appendChild(document.body,myScript);
  }

  hotjarIdentifyUserManually() {
    const user = this.authService.getUserInfo();
    if (!user || !user?.id || user?.id === "")
      return;

    const userAttributes = { "Program": "LFF" };

    hotjarIdentity.SetUp(user?.id, userAttributes);
    this.hjService.hj('identify', user?.id, userAttributes);

    if(isDevMode()) {
      console.log(` >> 🔥 [Auth.HotjarIdentifyUserManually] User successfully identified with ID: ${user?.id}`);
    }
  }

  redirect(): void {
    console.log('redirect', this.redirectUrl);
    if (this.is_mock && this.typeStartTest > 0) {
      this.router.navigate([this.redirectUrl], { queryParams: this.UTMParams.UTMTagsObject(true, this.typeStartTest) });
    } else if (this.is_mock) {
      this.router.navigate([this.redirectUrl], { queryParams: this.UTMParams.UTMTagsObject(true) });
    } else {
      this.router.navigate([this.redirectUrl], { queryParams: this.UTMParams.UTMTagsObject() });
    }
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

  SetCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires;// + '; path=/; domain=bmgmoney.com';
  }

  pushEnhancedConversionTag(enhancedConversionData: any) {
    var tag = {
      event: "personalInformation",
      ...enhancedConversionData
    };

    this.gtmService.pushTag(tag);
  }

  trackLoginOnMixpanelAndRedirect(): void {
      this.blockUI.start();
      this.mixPanelHelper.trackOnMixpanel('SignedIn').subscribe(() => {
        console.log('mixpanelDone');
        this.blockUI.stop();
        this.redirect();
      });
  }
}

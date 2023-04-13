import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../services/form-validation.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { FacebookLoginProvider, GoogleLoginProvider, SocialAuthService } from 'angularx-social-login';
import { ApiService } from '../../../services/api.service';
import swal, { SweetAlertOptions } from 'sweetalert2'
import { environment } from '../../../../environments/environment';
import { WarningModalComponent } from '../../shared/warning-modal/warning-modal.component';
import { Md5 } from 'ts-md5';
import { UTMParamsService } from '../../../services/utmparams.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  @ViewChild('warningModal') warningModal: WarningModalComponent;
  @ViewChild('loginForm') loginForm: NgForm;

  public model: any;
  public passwordType: string;
  public showSocialLoginButtons: boolean;
  public wrongPassword: boolean;
  public env_prd: boolean;

  constructor(
    private authService: AuthenticationService,
    private api: ApiService,
    private socialAuthService: SocialAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formValidation: FormValidationService,
    private UTMParams: UTMParamsService) { }

  ngOnInit() {
    this.env_prd = environment.production;
    if (this.env_prd) {
      let redirect_url = environment.login_url;
      const UTMParams = this.UTMParams.UTMTagsString();
      if (UTMParams) {
        redirect_url = `${redirect_url}&${UTMParams}`;
      }
      document.location.href = redirect_url;
      return;
    }


    this.model = {};
    this.passwordType = 'password';
    this.showSocialLoginButtons = true;


    this.loadFingerprint();
    this.api.LogEcommercePipeUnauth('2', 'login', 'pageview', this.model);

    this.route.queryParams.subscribe(params => {
      if (params['referral_code']) {
        this.SetCookie('_bmg_referral_code', params['referral_code'], 30);
        this.model.referral_code = params['referral_code'];
      } else {
        this.model.referral_code = this.ReadCookie('_bmg_referral_code');
      }
    });
    this.UTMParams.UTMTagsObject();
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

  ngAfterViewInit() {
    // setTimeout(() => this.openWarningModal());
  }

  openWarningModal() {
    const warning = {
      icon: 'warning',
      title: 'Warning',
      message: 'Hurricane Dorian is expected to hit Florida during this upcoming weekend. <br><br>'
        + 'It is possible that our office will be closed. Stay tuned for updates on our site. <br><br> '
        + 'In the meantime, thank you for your patience. <br><br><br>'
        + 'Our hearts and prayers are with you and your families, for those in the path of Hurricane Dorian.'
    };

    this.warningModal.open(warning.title, warning.message, warning.icon);
  }

  public socialSignIn(socialPlatform: string) {
    let socialPlatformProvider;
    if (socialPlatform == "facebook") {
      socialPlatformProvider = FacebookLoginProvider.PROVIDER_ID;
    } else if (socialPlatform == "google") {
      socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    }

    this.socialAuthService.signIn(socialPlatformProvider).then(
      (userData) => {

        this.showSocialLoginButtons = false;
        this.model.social_login_platform = socialPlatformProvider;
        if (socialPlatformProvider == "facebook") {
          this.model.fb_id = userData.id;
        } else if (socialPlatformProvider == "google") {
          this.model.google_id = userData.id;
        }
        this.model.email = userData.email;
        this.login();
      }
    );
  }

  onSubmit() {

    if (this.loginForm.valid) {
      this.login();
    } else {
      this.formValidation.markFormGroupTouched(this.loginForm.form);
    }
  }

  login() {
    this.api.login(this.model).subscribe(
      result => {
        this.authService.setToken(result.data.token);

        var UTMParams = this.UTMParams.UTMTagsString();
        var redirect_url = result.data.redirect_url;

        if (UTMParams)
          redirect_url = `${redirect_url}&${UTMParams}`;

        document.location.href = redirect_url;
      },
      e => {
        if (e.error) {
          if (e.error.user_not_found) {
            swal.fire({
              title: 'Email not found',
              text: `Are you a new customer?`,
              icon: 'info',
              showCancelButton: true,
              confirmButtonText: 'Yes',
              cancelButtonText: 'No'
            } as SweetAlertOptions
            ).then((result) => {
              if (result.value) {
                this.router.navigate(['/signup'], { queryParams: this.UTMParams.UTMTagsObject() });
              }
            });
          }

          if (e.error.customer_inactive) {
            swal.fire('Inactive Account', `Please contact our customer service.<br><br> <i class="fa fa-phone"></i> 800-316-8507`, 'info');
          }

          if (e.error.wrong_password) {
            this.wrongPassword = true;
          }
          if (e.error.another_program) {
            //this.blockUI.start();
            window.location.href = environment.consig_login;
          }
        }
      }
    )

  }

  onChangePasswordInputType() {
    if (this.passwordType == 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  hideWrongPasswordError() {
    this.wrongPassword = false;
  }

  md5(str) {
    const md5 = new Md5();
    return md5.appendStr(str).end();
  }

  loadFingerprint() {
    this.model.browser_fingerprint = localStorage.getItem('fingerprint');
    if (!this.model.browser_fingerprint || this.model.browser_fingerprint === 'null') {
      const array = new Uint32Array(10);
      window.crypto.getRandomValues(array);
      this.model.browser_fingerprint = String(this.md5(array.join(' ')));
      localStorage.setItem('fingerprint', this.model.browser_fingerprint);
    }
  }

  redirectToSignup() {
    window.location.href = environment.login_url + "/signup";
    return false;
  }
}

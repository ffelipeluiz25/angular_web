import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import { NgForm } from '@angular/forms';
import { MockerService } from '../../../services/mocker.service';
import { UTMParamsService } from '../../../services/utmparams.service';
import { environment } from '../../../../environments/environment';
import { AuthenticationService } from '../../../services/authentication.service';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import { PolicyModalComponent } from '../../shared/policy-modal/policy-modal.component';
import { TermsModalComponent } from '../../shared/terms-modal/terms-modal.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { Observable } from 'rxjs';
import { LoansForFedsStepsService } from '../../../services/loan-for-feds-steps-service.service';
import { hotjarIdentity } from '@bmgmoney/ngx-hotjar-router';

@Component({
  selector: 'app-verify-phone-number',
  templateUrl: './verify-phone-number.component.html',
  styleUrls: ['./verify-phone-number.component.css']
})
export class VerifyPhoneNumberComponent implements OnInit {

  @ViewChild('phoneNumberForm') phoneNumberForm: NgForm;
  @ViewChild('verificationCodeForm') verificationCodeForm: NgForm;
  @ViewChild('policyModal') policyModal: PolicyModalComponent;
  @ViewChild('termsModal') termsModal: TermsModalComponent;

  public model: any;
  public selectedPhoneNumber: any;
  public showVerifyPhone: boolean;
  public showFormPhone: boolean;
  public sendButtonText: string;
  public initialized: boolean;
  public is_production = environment.production;
  public is_mock = false;
  public vendor = '';
  public is_argyle = false;
  public is_pinwheel = false;
  public step_to_redirect = '';
  public typeStartTest: number = 0;
  private employerId: number = 0;
  public step = 'verify_phone';
  public ft_routerLoanTermsFirst = this.featureToggleService.IsEnabled('router_loan_terms_first');

  public code_mask = this.featureToggleService.IsEnabled('sms_verify_code_twilio') ? "00000" : "0000";

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private utils: UtilityService,
    private api: ApiService,
    private route: ActivatedRoute,
    private mocker: MockerService,
    private UTMParams: UTMParamsService,
    private lffSteps: LoansForFedsSteps,
    private lffStepsService: LoansForFedsStepsService,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggleService: FeatureToggleClientService,
  ) { }

  ngOnInit() {
    this.initialized = false;
    this.model = {};
    this.selectedPhoneNumber = {};
    this.showVerifyPhone = false;
    this.showFormPhone = true;
    this.sendButtonText = this.utils.IsMobile() ? 'Send' : 'Send verification code';
    this.getVerificationPhoneNumber();
  }

  private VerifyMockData() {
    if (environment.production)
      return false;

    this.route.queryParams.subscribe(params => {
      if (params['mock'] === '1')
        this.is_mock = true;

      if (params['typeStartTest'])
        this.typeStartTest = parseInt(params['typeStartTest']);

    });

    setTimeout(() => {
      if (this.typeStartTest > 0) {
        this.mockData();
        if (this.showVerifyPhone)
          this.onSubmitVerificationCode()
        else
          this.onSubmitVerificationCode();
      }
    }, 100);
  }

  getVerificationPhoneNumber() {
    this.api.get('/verify-phone-number', null, false, true).subscribe(result => {
      this.api.LogEcommercePipe(this.step, 'pageview');
      this.model = result.data;
      this.showPhoneNumberForm();
      this.initialized = true;

      // mock
      this.VerifyMockData();

    });
  }

  onSubmitPhoneNumber() {
    if (this.phoneNumberForm.valid)
      this.submitPhone();
    else
      this.utils.SetFocus('#phone_number');
  }

  submitPhone(fn: Function = null) {
    this.api.post('/verify-phone-number/send-code', this.model, true).subscribe(result => {
      if (result.phone_validated) {
        // if (this.featureToggleService.IsEnabled("mixpanel_tracking")) {
        //   this.trackOnMixpanel();
        // }

        swal.fire({
          title: 'Success!',
          html: `<div>Your phone number is already verified</div>` +
            '<div><button type="submit" data-id="btn_phone_number_is_already" id="btnSwalOk" class="swal2-confirm swal2-styled" aria-label="" style="display: inline-block; border-left-color: rgb(255, 125, 77); border-right-color: rgb(255, 125, 77);">OK</button></div>',
          icon: 'success',
          showCancelButton: false,
          showConfirmButton: false
        } as SweetAlertOptions);

        let btn = document.getElementById("btnSwalOk");
        btn.addEventListener("click", (e: Event) => this.closeSwalFire());

      } else {
        this.showVerifyPhone = true;
        this.showFormPhone = false;
        this.utils.SetFocus('#verification_code');
        this.api.LogEcommercePipe(this.step, 'send_verification_code');
      }

      if (fn) {
        fn();
      }
    }, error => {
      if (error.error.invalid_phone) {
        swal.fire({
          title: '',
          text: 'This phone number is already in use. Please log in to the account linked with this phone number.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonClass: 'btn-success',
          confirmButtonText: 'Log in',
          reverseButtons: true
        } as SweetAlertOptions).then((result) => {
          this.initialized = true;
          this.showPhoneNumberForm();
          if (result.value)
            this.logout();

        });
        return false;
      }
      if (error.error.bad_format_phone) {
        swal.fire({
          title: '',
          text: 'This phone number is invalid. Please try again with a valid number',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonClass: 'btn-success',
          confirmButtonText: 'Ok',
          reverseButtons: true
        } as SweetAlertOptions).then((result) => {
          this.initialized = true;
          this.showPhoneNumberForm();
        });
        return false;
      }

    });
    return false;
  }

  async closeSwalFire() {
    var swal = document.getElementsByClassName('swal2-container');
    for (let index = 0; index < swal.length; index++) {
      const element = swal[index];
      swal[index].setAttribute('hidden', 'true');
    }
  }

  closeSwalFireRedirect() {
    this.closeSwalFire();
    this.redirects();
  }

  getStepArgyle() {
    if (this.ft_routerLoanTermsFirst) {
      var url = this.lffStepsService.getUrlToRedirect('02.1');
      this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject() });
    }
    else {
      var self = this;
      self.api.get('/argyle-verification-step', null, false, true).subscribe(data => {
        if (data.success) {
          var url = self.lffSteps.getUrlToRedirect(data.step_to_redirect);

          self.router.navigate([url], { queryParams: self.UTMParams.UTMTagsObject() });
        }
      });
    }
  }

  redirects() {
    this.getStepArgyle();
  }

  changePhoneNumber() {
    this.showPhoneNumberForm();
    this.model.verification_code = null;
    return false;
  }

  onSubmitVerificationCode() {
    if (this.verificationCodeForm.valid)
      this.submitVerificationCode();
    else
      this.utils.SetFocus('#phone_number');
  }

  submitVerificationCodeSuccess() {
    swal.fire({
      title: 'Success!',
      html: `<div>Your phone number has been verified</div><br>` +
        '<div><button type="submit" data-id="btn_phone_number_has_been" id="btnSwalOk" class="swal2-confirm swal2-styled" aria-label="" style="display: inline-block; border-left-color: rgb(255, 125, 77); border-right-color: rgb(255, 125, 77);">OK</button></div>',
      icon: 'success',
      showCancelButton: false,
      showConfirmButton: false
    } as SweetAlertOptions);

    let btn = document.getElementById("btnSwalOk");
    btn.addEventListener("click", (e: Event) => this.closeSwalFireRedirect());
  }

  submitVerificationCode(fn: Function = null) {
    this.api.post('/verify-phone-number/verify-phone', this.model, true).subscribe(result => {

      if (this.featureToggleService.IsEnabled('mixpanel_tracking')) {
        this.trackOnMixpanel().subscribe();
        this.submitVerificationCodeSuccess();
      } else {
        this.submitVerificationCodeSuccess();
      }

      if (fn) {
        fn();
      }

    }, error => {
      if (error.error.invalid_code) {
        swal.fire('Invalid code', 'The code you provided is not the code we sent to you. Please try again or ask for a new code.', 'warning');
      }
    });
  }

  showPhoneNumberForm() {
    this.showVerifyPhone = false;
    this.showFormPhone = true;
    window.scrollTo(0, 0);
    this.utils.SetFocus('#phone_number');
  }

  logout() {
    this.authService.removeToken();
    sessionStorage.removeItem('previous_url');
    hotjarIdentity.CleanUserIdentityRegistry();
    window.location.href = environment.login_url;
    return false;
  }

  mockData() {
    if (environment.production)
      return false;

    this.model.phone_number = this.mocker.getPhoneNumber();
    this.submitPhone(() => {
      this.model.verification_code = '1234';
      setTimeout(() => {
        this.submitVerificationCode();
      }, 100);
    });
  }

  formatPhoneNumber(phoneNumberString) {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return null;
  }

  openPolicyModal() {
    this.policyModal.open();
    return false;
  }

  openTermsModal() {
    this.termsModal.open();
    return false;
  }


  trackOnMixpanel(): Observable<any> {
    var customer = this.authService.getUserInfo();
    const url: string = window.location.href

    if (this.featureToggleService.IsEnabled('mixpanel_changeApplicationStartEvents')) {
      const eventData = {
        current_url: url,
        application_current_step: 'Verify Phone',
        application_type: this.utils.getApplicationTypeDescription(customer?.application_type)
      };

      return this.mixPanelHelperService.trackOnMixpanelCustomEvent("PersonalInformationVerified", eventData);

    } else {
      const eventData = {
        current_url: url,
        application_started_date: new Date().toISOString(),
        application_type: this.utils.getApplicationTypeDescription(customer?.application_type),
        application_current_step: "Application Started",
        program: this.utils.getProgramName(customer?.program),
        sub_program: customer?.sub_program
      }

      return this.mixPanelHelperService.trackOnMixpanelCustomEvent('ApplicationStarted', eventData);

    }
  }


}

import { Component, OnInit, ViewChild, NgZone, EventEmitter, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormValidationService } from '../../../services/form-validation.service';
import { environment } from '../../../../environments/environment';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import { ChooseButtonsComponent } from '../../shared/choose-buttons/choose-buttons.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { AuthenticationService } from '../../../services/authentication.service';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { MockerService } from '../../../services/mocker.service';
import { PlaidSelectBankModalComponent } from '../../shared/plaid-select-bank-modal/plaid-select-bank-modal.component';
import { Md5 } from 'ts-md5';
import { OpenBankingComponent } from '../../shared/open-banking/open-banking.component';
import { UTMParamsService } from '../../../services/utmparams.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { combineLatest, Observable } from 'rxjs';
@Component({
  selector: 'app-bank-information',
  templateUrl: './bank-information.component.html',
  styleUrls: ['./bank-information.component.css']
})
export class BankInformationComponent implements OnInit {

  @ViewChild('loanTermsForm') loanTermsForm: NgForm;
  @ViewChild('chooseAccountType') chooseAccountType: ChooseButtonsComponent;
  @ViewChild('fastLinkModal') fastLinkModal: ElementRef;
  @ViewChild('formFastLink') formFastLink: NgForm;
  @ViewChild('plaidSelectBankModal') plaidSelectBankModal: PlaidSelectBankModalComponent;
  @ViewChild('openBankingComponent') openBankingComponent: OpenBankingComponent;
  @BlockUI() blockUI: NgBlockUI;

  public model: any;
  public accountTypeList: Array<any>;
  public accountTypeTouched: boolean;
  public showBtnLinkAccount: boolean;
  public yodleeNotify: EventEmitter<any> = new EventEmitter<any>();
  public initialized: boolean;
  public showBankNotFoundError: boolean;
  public yoodleFastLink: any;
  public yoodleFastLinkTarget: string;
  private yoodleUser: any;
  private yodleeAttempts: number;
  public isRefi: boolean;
  public state_abbreviation: string;
  public plaid_accounts: Array<any>;
  public is_mock = false;
  public typeStartTest = 0;
  public isNm: boolean;
  public reconciliation_system: string;
  public browser_fingerprint: any;
  public submitted: boolean;
  public iheartUrl: string;
  public bank_vendor = 'plaid';
  public isRefiCashless: boolean;
  public step = 'bank_information';
  public is_production = environment.production;
  public retiredData: any;
  public openPayrollMandatoryRoutingNumbers: string[] = [];
  public isOpenPayrollMandatory: boolean = false;
  public utmSource: string = '';
  public hasConnectedWithOpenPayroll: boolean = false;
  public isOpenPayrollEnabledForEmployer: boolean = false;

  public _showConnectWithOpenPayrollSection: boolean = false;
  public _showMessageConnectWithOpenPayrollSection: boolean = false;
  public _disabledSubmitButton: boolean = true;
  public hasConnectVendorArgyle: boolean = false;

  public saveAttempts: number = 0;
  public intervalRef: any;
  public loginAttempts: number = 0;
  public ft_shareYourEmployer: boolean = false;
  public ft_mixpanelApplicationSubmitted = false;
  public ft_step_to_capture_debit_card = false;
  public paynearmeRuleActive: boolean = false;
  public currentStep: any;
  public ft_debit_card_is_enabled: boolean = false;
  public hasPayNearMeParameterization: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formValidation: FormValidationService,
    private utils: UtilityService,
    private api: ApiService,
    private authService: AuthenticationService,
    private mocker: MockerService,
    private UTMParams: UTMParamsService,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggle: FeatureToggleClientService,
  ) {
    window['LoanTermsComponentRef'] = { yodleeNotify: this.yodleeNotify };
    this.ft_shareYourEmployer = this.featureToggle.IsEnabled('share_your_employer');
    this.ft_mixpanelApplicationSubmitted = this.featureToggle.IsEnabled('mixpanel_applicationSubmitted');
    this.ft_step_to_capture_debit_card = this.featureToggle.IsEnabled('bankInfoScreensChanges');
    this.ft_debit_card_is_enabled = this.featureToggle.IsEnabled('step_to_capture_debit_card');
  }

  ngOnInit() {
    this.blockUI.start();

    this.submitted = false;
    this.initialized = false;
    this.isRefi = false;
    this.isNm = false;
    this.showBankNotFoundError = false;
    this.isRefiCashless = false;
    this.model = {
      bank_account: {
        bank_account_type: 1
      },
      selected_amount: null
    };
    if (this.ft_step_to_capture_debit_card) {
      this.accountTypeList = [{ value: 1, text: 'Checking' }];
    } else {
      this.accountTypeList = [{ value: 1, text: 'Checking' }, { value: 2, text: 'Savings' }];
    }
    this.showBtnLinkAccount = true;
    this.yodleeAttempts = 0;
    this.yoodleFastLink = {};
    this.yoodleFastLinkTarget = this.utils.IsMobile() ? '_self' : 'iframeFastLink';
    this.plaid_accounts = [];
    this.iheartUrl = '';
    this.currentStep = {
      step: 'bank-information',
      stepNumber: 5,
    };

    this.getBankAccount();
    this.loadFingerprint();
    this.api.LogEcommercePipe(this.step, 'pageview');
    this.getRetired();
    this.getOpenPayrollMandatoryBanks();

    if (this.ft_debit_card_is_enabled && this.hasPayNearMeParameterization) {
      localStorage.setItem('payNearme', 'true');
    }
  }

  getRetired() {
    this.api.get('/retired-decision/get-retired', null, false, false).subscribe(result => {
      if (result.success) {
        this.retiredData = result.data;
      } else {
        swal.fire('', 'Error on get retiree agency', 'info');
      }
    });
  }

  mockBankAccount() {
    if (environment.production) {
      return false;
    }

    this.yodleeAttempts = 10;
    this.model.agreed_with_terms = 1;
    this.onSelectEnterBankAccount();
    this.chooseAccountType.update(this.model.bank_account.bank_account_type);
    this.model.bank_account.bank_routing_number = '000000001';
    const bank_account_number = this.mocker.getBankAccount();
    this.model.bank_account.bank_account_number = bank_account_number;
    this.model.bank_account.confirm_bank_account_number = bank_account_number;
    this.utils.SetFocus('#btnNext');
  }

  getBankAccount() {
    this.api.get('/bank-information', null, true, true).subscribe(result => {
      this.hasConnectedWithOpenPayroll = result?.data?.hasConnectedWithOpenPayroll;
      this.isOpenPayrollEnabledForEmployer = result?.data?.isOpenPayrollEnabledForEmployer;
      this.showConnectWithOpenPayrollSection(); 0
      if (result.data && result.data.bank_account) {
        this.model.bank_account = result.data.bank_account;
        this.showBtnLinkAccount = false;
        this.getBankName();
        this.getOpenPayrollMandatoryBanks();
      }
      this.isNm = result.data.is_nm;
      this.reconciliation_system = result.data.reconciliation_system;
      this.chooseAccountType.update(this.model.bank_account.bank_account_type);
      this.yoodleUser = result.data.yoodle_user;
      this.state_abbreviation = result.data.state_abbreviation;
      this.isRefiCashless = result.data.isRefiCashless;
      this.initialized = true;
      this.VerifyMockData();
      this.hasPayNearMeParameterization = result.data.is_paynearme_parameterized;
      this.blockUI.stop();
    });
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
        this.mockBankAccount();
        this.onSubmit();
      }
    }, 100);
  }


  onSelectAccountType(selectedItem: any) {
    this.model.bank_account.bank_account_type = selectedItem.value;
  }

  onSelectEnterBankAccount() {
    this.showBtnLinkAccount = false;
    return false;
  }

  linkBankAccount() {
    this.api.LogEcommercePipe(this.step, 'click_link_bank_account');
    this.openBankingComponent.ConnectPlaid();
    return false;
  }


  openBankinCallback(e) {
    if (e.success) {
      this.getBankAccount();
    } else {
      swal.fire({
        title: 'Unable to verify source of income',
        text: `Please make sure to link the bank account where you receive your income`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Try again',
        cancelButtonText: 'Cancel'
      } as SweetAlertOptions
      ).then((result) => {
        if (result.value) {
          this.openBankingComponent.restartPlaidProcess();
        }
      });
    }
  }

  onSubmit() {
    let isValid = this.model.bank_account.bank_account_type;
    if (this.typeStartTest > 0)
      isValid = true;
    if (isValid)
      this.save();
    else {

      this.formValidation.markFormGroupTouched(this.loanTermsForm.form);
      this.accountTypeTouched = true;

      if (!(this.model.bank_account.bank_account_type)) {

        if (this.showBtnLinkAccount) {
          this.accountTypeTouched = false;
          this.formValidation.markFormGroupUntouched(this.loanTermsForm.form);
        }
        this.onSelectEnterBankAccount();

      } else {
        if (!this.model.agreed_with_terms)
          document.getElementById('anchor_agree_with_terms').scrollIntoView();
      }
    }
  }

  redirect(result) {
    let url = '/application/processing';
    if (result.utm_source === 'iheart') {
      if (this.typeStartTest > 0)
        this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject(true, this.typeStartTest, true) });
      else
        this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject(false, null, true) });
    } else {
      if (this.typeStartTest > 0)
        this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject(true, this.typeStartTest) });
      else
        this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject() });
    }
  }

  save() {
    this.saveAttempts++;
    if (this.blockUI.isActive) this.blockUI.stop();

    if (!this.submitted) {
      this.submitted = true;
      this.model.browser_fingerprint = this.browser_fingerprint;
      this.api.put('/bank-information', this.model, true).subscribe(result => {
        if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
          this.trackOnMixpanel().subscribe();
          this.redirect(result);
        } else {
          this.redirect(result);
        }
      },
        err => {
          this.submitted = false;
          if (err && err.error.bank_not_found) {
            this.showBankNotFoundError = true;
            this.utils.SetFocus('#bank_routing_number');
          }
          if (err && err.error.notConnectedToOpenPayroll) {
            swal.fire('', 'Please, connect to your work account.', 'warning');
          }
        }
      );
    }
  }

  repeatSaveAfterThreeSeconds() {
    setTimeout(() => {
      this.save();
    }, 3000); //3 seconds
  }

  alreadyAttemptedThreeTimes() {
    return this.saveAttempts == 3;
  }

  processApplication(application_id) {
    this.api.ExternalPost(environment.auto_decision_url, { application_id: application_id }, false).subscribe(result => { });
  }

  hideBankNotFoundError() {
    this.showBankNotFoundError = false;
  }

  getBankName() {
    this.api.get('/cache/bank-name', { routing_number: this.model.bank_account.bank_routing_number }, false, true).subscribe(result => {
      this.model.bank_account.bank_name = result.data.bank_name;
      if (result.data.vendor) {
        this.bank_vendor = result.data.vendor;
      }
    });
  }

  onRoutingNumberBlur() {
    this.getBankName();
    this.isOpenPayrollMandatory = this.openPayrollMandatoryRoutingNumbers.includes(this.model.bank_account.bank_routing_number);
  }

  md5(str) {
    let md5 = new Md5();
    return md5.appendStr(str).end();
  }

  loadFingerprint() {
    this.browser_fingerprint = localStorage.getItem('applicationType');
    if (!this.browser_fingerprint || this.browser_fingerprint === 'null') {
      const array = new Uint32Array(10);
      window.crypto.getRandomValues(array);
      this.browser_fingerprint = String(this.md5(array.join(' ')));
      localStorage.setItem('fingerprint', this.browser_fingerprint);
    }
  }

  getOpenPayrollMandatoryBanks() {
    this.api.get('/bank-information/get_open_payroll_mandatory_banks', null, true, true).subscribe(result => {
      if (result.success) {
        this.openPayrollMandatoryRoutingNumbers = result.data;
        this.isOpenPayrollMandatory = this.openPayrollMandatoryRoutingNumbers.includes(this.model.bank_account.bank_routing_number);
      }
    });
  }

  onOpenPayrollConnected(status: string) {
    if (status == 'success') {
      this.hasConnectedWithOpenPayroll = true;
    } else {
      swal.fire('Hey', 'Having difficulty connecting to your payroll system? Please contact customer service for assistance at 800-316-8507', 'info');
    }
  }

  onHasArgyleConnection(hasArgyleConnection: boolean) {
    this.hasConnectVendorArgyle = hasArgyleConnection;
    this.showConnectWithOpenPayrollSection();
  }

  showConnectWithOpenPayrollSection() {
    this._disabledSubmitButton = false;
    this._showConnectWithOpenPayrollSection = this.isOpenPayrollEnabledForEmployer;
    if (this.model.bank_account.bank_account_verified != undefined) {
      this._showConnectWithOpenPayrollSection = false || this.hasConnectVendorArgyle;
      this._showMessageConnectWithOpenPayrollSection = false;

    }
    else if (this.hasConnectVendorArgyle && this.isOpenPayrollEnabledForEmployer) {
      this._showMessageConnectWithOpenPayrollSection = false;
      this._showConnectWithOpenPayrollSection = this.hasConnectVendorArgyle;
    }
    else {
      this._showConnectWithOpenPayrollSection = !this.hasConnectVendorArgyle || (this.isOpenPayrollEnabledForEmployer && this.isOpenPayrollMandatory);
      if (!this._showConnectWithOpenPayrollSection)
        this._disabledSubmitButton = true;

      if (this._showConnectWithOpenPayrollSection && !this.hasConnectVendorArgyle)
        this._showMessageConnectWithOpenPayrollSection = true;
    }
  }

  trackOnMixpanel(): Observable<any> {
    return combineLatest([this.trackBankInformationSubmitted(), this.trackApplicationSubmitted()]);
  }

  trackBankInformationSubmitted(): Observable<any> {
    const customer = this.authService.getUserInfo();
    const url: string = window.location.href;

    const eventData = {
      current_url: url,
      application_current_step: 'Bank information Submitted',
      application_type: this.utils.getApplicationTypeDescription(customer?.application_type)
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('BankInformationSubmitted', eventData);
  }

  trackApplicationSubmitted() {
    const customer = this.authService.getUserInfo();
    const applicationType = this.utils.getApplicationTypeDescription(customer?.application_type);
    if (applicationType == 'Refinance') {
      return;
    }

    if (this.featureToggle.IsEnabled('mixpanel_applicationSubmitted')) {
      (<any>window).dataLayer.push({ event: 'applicationSubmitted' });
    }

    const eventData = {
      submitted_date: new Date().toISOString(),
      application_type: applicationType,
      application_current_step: 'Application Submitted'
    };
    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('ApplicationSubmitted', eventData);
  }

  backToPaynearme(){
    if(this.ft_debit_card_is_enabled && this.hasPayNearMeParameterization){
      localStorage.setItem('payNearme', 'true');
    }
  }
}

import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { AuthenticationService } from '../../../services/authentication.service';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { ApiService } from '../../../services/api.service';
import { UtilityService } from '../../../services/utility.service';
import { OpenBankingComponent } from '../../shared/open-banking/open-banking.component';

@Component({
  selector: 'app-done',
  templateUrl: './done.component.html',
  styleUrls: ['./done.component.css']
})
export class DoneComponent implements OnInit {
  @ViewChild('openBankingComponent') openBankingComponent: OpenBankingComponent;

  @Output('hasArgyleConnected') hasArgyleConnected = new EventEmitter<boolean>();

  public model: any;
  public step = 'done';
  public bank_search = '';
  public hasReferral: boolean;
  public initialized: boolean;
  public dropfileText: string;
  public isRefiCashless: boolean;
  public open_payroll_connection = true;
  public open_bankin_connection = true;
  public open_banking_mandatory = true;
  public customer: any;
  public featureFaceIdEnabled = false;
  public requestFaceId = false;
  public hasConnectedWithAnyVendor = false;
  public customerId: Number = null;
  public isCustomerCheckingApplication: Boolean = false;
  public isArgyleConnected: Boolean;

  constructor(
    private api: ApiService,
    private utils: UtilityService,
    private featureToggle: FeatureToggleClientService,
    private mixPanelHelperService: MixpanelHelperService,
    private authService: AuthenticationService
  ) {
    this.featureFaceIdEnabled = this.featureToggle.IsEnabled('face_id');
  }

  ngOnInit() {
    this.isArgyleConnected = false;
    this.initialized = false;
    this.hasReferral = false;
    this.isRefiCashless = false;
    this.model = {};
    this.dropfileText = this.utils.IsMobile() ? 'Click to take a picture or to select a file' : 'Drop files here or click to select a file';
    this.customerId = this.authService.getUserInfo()?.id;
    this.getApplicationInformation();
    this.getLoanInfo();
    this.api.LogEcommercePipe('done', 'pageview');
    this.getPendingDocuments();
  }

  updateArgyleStatus(has_argyle_connection: boolean) {
    this.open_payroll_connection = has_argyle_connection;
  }

  getApplicationInformation() {
    this.api.get('/done', null, true, true).subscribe(result => {
      this.model = result.data;
      this.isRefiCashless = result.data.isRefiCashless;
      if (this.model.referral_code) {
        this.hasReferral = true;
      }
      this.initialized = true;
      this.isCustomerCheckingApplication = result?.data?.isCustomerCheckingApplication ?? false;
      this.trackApplicationChecked();
    });
  }

  onSubmit() {
    this.api.put('/done', this.model, true).subscribe(result => {
      if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
        this.mixPanelHelperService.trackOnMixpanelCustomEvent('ReferralCodeInput', { referral_code: this.model.referral_code }).subscribe(() => {
          swal.fire('Success!', 'Referral code accepted!', 'success');
          this.hasReferral = true;
        });
      } else {
        swal.fire('Success!', 'Referral code accepted!', 'success');
        this.hasReferral = true;
      }
    }, err => {
      if (err.error && err.error.referral_code_not_found) {
        swal.fire('Code not found!', 'The code you have provided was not found', 'warning');
      }
    });
  }

  continueWithRegular() { }

  openPayrollPluginCallback(event: any) { }

  linkBankAccount() {
    this.openBankingComponent.ConnectPlaid();
  }

  validatePermissions() {
    this.api.get('/entity/open-banking-config', null, true, false).subscribe(result => {
      this.open_banking_mandatory = result.open_banking_mandatory;
    });
  }

  openBankinCallback(e) {
    let swal_config: SweetAlertOptions;
    if (this.open_banking_mandatory) {
      swal_config = {
        title: 'Unable to verify source of income',
        text: `Please make sure to link the bank account where you receive your income`,
        icon: 'info',
        showCancelButton: false,
        reverseButtons: true,
        confirmButtonText: 'Try again',
        cancelButtonText: 'Continue with regular application'
      };
    } else {
      swal_config = {
        title: 'Unable to verify source of income',
        text: `Please make sure to link the bank account where you receive your income`,
        icon: 'info',
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Try again',
        cancelButtonText: 'Continue with regular application'
      };
    }

    if (e.success) {
      swal.fire({
        title: '',
        text: 'Bank account linked!',
        icon: 'success',
        showCancelButton: false,
        confirmButtonClass: 'btn-success',
        confirmButtonText: 'Ok',
        reverseButtons: true,
      } as SweetAlertOptions).then(() => {
        this.getLoanInfo();
      });
    } else {
      swal.fire(swal_config).then((result) => {
        if (result.value) {
          this.openBankingComponent.restartPlaidProcess();
        } else {
          if (result.dismiss.toString() !== 'overlay') {
            this.continueWithRegular();
          }
        }
      });
    }
  }

  private getLoanInfo() {
    this.api.get('/under-loan-info', null, true, false).subscribe(result => {

      this.hasConnectedWithAnyVendor = result.data.hasConnectedWithAnyVendor;

      this.open_payroll_connection = result.data.has_argyle_allotment_to_bmg_money ||
        result.data.has_pinwheel_allotment_to_bmg_money ||
        result.data.has_atomic_allotment_to_bmg_money;
      this.open_bankin_connection = result.data.linked_plaid;
    });
  }

  getPendingDocuments() {
    this.api.get('/face-id-status', null, true, false).subscribe(result => {
      const faceIdStatus = result.data.faceIdStatus;
      this.requestFaceId = faceIdStatus === 'NO_REQUEST' ? false : true;

      console.log(this.requestFaceId);
    });
  }

  faceIdPluginCallback(e) {
    if (e != null && e.success) {
      const response = e.response;
    }
  }

  trackApplicationChecked() {
    if (this.featureToggle.IsEnabled('mixpanel_tracking') && this.isCustomerCheckingApplication) {
      this.mixPanelHelperService.trackOnMixpanelCustomEvent('ApplicationCheck', { 'application_current_step': 'Application Check' });
    }
  }

  onHasArgyleConnected(hasArgyleConnected: boolean) {
    this.hasArgyleConnected.emit(hasArgyleConnected);

    this.isArgyleConnected = hasArgyleConnected;
  }

}

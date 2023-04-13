import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';
import { NgBlockUI, BlockUI } from 'ng-block-ui';
import { OpenBankingComponent } from '../../shared/open-banking/open-banking.component';
import { UTMParamsService } from '../../../services/utmparams.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { RefiStepsService } from '../../../services/refi-steps.service';

@Component({
  selector: 'app-bank-selection',
  templateUrl: './bank-selection.component.html',
  styleUrls: ['./bank-selection.component.css']
})
export class BankSelectionComponent implements OnInit {

  @ViewChild('openBankingComponent') openBankingComponent: OpenBankingComponent;
  public step = 'bank_link';
  public bank_search = '';
  public open_banking_mandatory = true;
  public is_mock = false;
  public typeStartTest: number = 0;
  public retiredData: any;

  public customerId: Number;
  public applicationType: string;
  public applicationStatus: string;

  public ft_shareYourEmployer: boolean = false;
  public ft_skip_vendor_enabled: boolean = false;
  public ft_routerLoanTermsFirst: boolean = this.featureToggle.IsEnabled('router_loan_terms_first');
  public ft_refiLFF: boolean;

  private getRouteDTO: any = { skipOpenBankingStep: false };

  @BlockUI() blockUI: NgBlockUI;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private UTMParams: UTMParamsService,
    private featureToggle: FeatureToggleClientService,
    private refiSteps: RefiStepsService,
  ) {
    this.ft_shareYourEmployer = this.featureToggle.IsEnabled('share_your_employer');
    this.ft_skip_vendor_enabled = this.featureToggle.IsEnabled('skip_vendor_enabled');
    this.ft_refiLFF = this.featureToggle.IsEnabled('refiLFF');
  }

  ngOnInit() {
    this.retiredData = {
      isRetired: '',
      retired: ''
    };

    this.route.queryParams.subscribe(p => {
      if (p.ref) {
        this.step = p.ref;
      }
    });

    this.getCurrentApplicationInfo();
    this.isRouteAllowed();
    this.getRetired();
  }

  getCurrentApplicationInfo() {
    this.api.get(`/refi/current-info`, null, true, true, true).subscribe(result => {
      if (result.success) {
        this.customerId = result.data.customerId;
        this.applicationType = result.data.applicationType;
        this.applicationStatus = result.data.applicationStatus;
      } else {
        swal.fire('', result.message, 'warning');
      }
    });
  }

  getNextRoute() {
    this.api.get(`/refi/get-route`, this.getRouteDTO, true, true, true).subscribe(result => {
      if (result.success) {
        const url = this.refiSteps.getUrlToRedirect(result.next_step);
        this.router.navigate([url]);
        return;
      } else {
        swal.fire('', result.message, 'warning');
      }
    });
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

  async isRouteAllowed() {
    await this.api.get('/is_route_allowed', null, true, true).subscribe(() => {
      if (this.step === 'pending_documents_bank_link')
        this.api.LogEcommercePipe('pending_documents_bank_link', 'pageview');
      else if (this.step === 'refi_bank_link')
        this.api.LogEcommercePipe('refi_bank_link', 'pageview');
      else
        this.api.LogEcommercePipe('bank_link', 'pageview');

      if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
        this.getNextRoute();
        return;

      } else {
        // mock
        this.route.queryParams.subscribe(params => {

          if (params['mock'] === '1' && params['typeStartTest']) {
            this.typeStartTest = parseInt(params['typeStartTest']);
            this.router.navigate(['/application/personal-information'], { queryParams: this.UTMParams.UTMTagsObject(true, this.typeStartTest) });
          }
        });
      }
    });

    this.validatePermissions();
  }

  validatePermissions() {
    this.api.get('/entity/open-banking-config', null, true, false).subscribe(result => {
      this.open_banking_mandatory = result.open_banking_mandatory;
    });
  }

  linkBankAccount() {
    this.openBankingComponent.ConnectPlaid();
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
      } as SweetAlertOptions).then((result) => {
        this.redirect();
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

  async continueWithRegular() {
    if (this.bank_search) {
      this.api.LogEcommercePipe(this.step, 'search_bank', { query: this.bank_search });
    }
    this.api.LogEcommercePipe(this.step, 'skip_bank_link');

    if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
      this.getRouteDTO.skipOpenBankingStep = true;
      this.getNextRoute();
      return;
    } else {
      this.redirect();
    }

  }

  async redirect() {
    if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
      this.getRouteDTO.skipOpenBankingStep = true;
      this.getNextRoute();
      return;
    }

    if (this.step === 'pending_documents_bank_link') {
      this.router.navigate(['application/pending-documents'], { queryParams: this.UTMParams.UTMTagsObject() });
      return;
    }

    if (this.step === 'refi_bank_link') {
      this.router.navigate(['/application/refi'], { queryParams: this.UTMParams.UTMTagsObject() });
      return;
    }

    if (this.ft_routerLoanTermsFirst) {
      this.router.navigate(['/application/personal-information'], { queryParams: this.UTMParams.UTMTagsObject() });
    } else {
      this.router.navigate(['/application/loan-terms'], { queryParams: this.UTMParams.UTMTagsObject() });
    }

    return;
  }
}

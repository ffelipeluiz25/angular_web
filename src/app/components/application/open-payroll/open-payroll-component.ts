import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UTMParamsService } from '../../../services/utmparams.service';
import { ApiService } from '../../../services/api.service';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import Swal from 'sweetalert2';
import { ModalRetiredComponent } from './modal-retired/modal-retired.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { RefiStepsService } from '../../../services/refi-steps.service';
import { AuthenticationService } from '../../../services/authentication.service';

@Component({
  selector: 'app-open-payroll',
  templateUrl: './open-payroll-component.html',
  styleUrls: ['./open-payroll-component.css']
})
export class OpenPayrollComponent implements OnInit {

  public step = 'open_payroll_link';
  @ViewChild('modalRetired') modalRetired: ModalRetiredComponent;
  public isVendorMandatory = true;
  public retiredData: any;
  public nextStep = '/application/bank-selection';
  public ft_shareYourEmployer = false;
  public ft_skip_vendor_enabled: boolean = false;
  public ft_refiLFF: boolean = false;

  public customerId: Number;
  public applicationType: string;
  public applicationStatus: string;

  private getRouteDTO: any = { skipOpenPayrollStep: false };

  constructor(
    private api: ApiService,
    private router: Router,
    private UTMParams: UTMParamsService,
    private lffSteps: LoansForFedsSteps,
    private refiSteps: RefiStepsService,
    private authService: AuthenticationService,
    private featureToggle: FeatureToggleClientService,) {
    this.ft_shareYourEmployer = this.featureToggle.IsEnabled('share_your_employer');
    this.ft_skip_vendor_enabled = this.featureToggle.IsEnabled('skip_vendor_enabled');
    this.ft_refiLFF = this.featureToggle.IsEnabled('refiLFF');
  }

  ngOnInit(): void {
    this.retiredData = {
      isRetired: '',
      retired: ''
    };

    this.customerId = this.authService.getUserInfo()?.id;
    this.applicationType = this.authService.getUserInfo()?.application_type;

    this.getCurrentApplicationInfo();
    this.checkIfAnyVendorIsMandatory();
    this.getRetired();
  }

  getCurrentApplicationInfo() {
    this.api.get(`/refi/current-info`, null, true, true, true).subscribe(result => {
      if (result.success) {
        this.customerId = result.data.customerId;
        this.applicationType = result.data.applicationType;
        this.applicationStatus = result.data.applicationStatus;
      } else {
        Swal.fire('', result.message, 'warning');
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
        Swal.fire('', result.message, 'warning');
      }
    });
  }

  retiredModalOpen() {
    this.modalRetired.open();
    return false;
  }

  getRetired() {
    this.api.get('/retired-decision/get-retired', null, false, false).subscribe(result => {
      if (result.success) {
        this.retiredData = result.data;
      } else {
        Swal.fire('', 'Error on get retiree agency', 'info');
      }
    });
  }

  async continueWithRegular() {
    this.api.LogEcommercePipe(this.step, 'skip_open_payroll_link');
    if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
      this.getRouteDTO.skipOpenPayrollStep = true;
      this.getNextRoute();
      return;
    } else {
      this.router.navigate([this.nextStep], { queryParams: this.UTMParams.UTMTagsObject() });
    }

  }

  checkIfAnyVendorIsMandatory() {
    this.api.get('/vendors-decision/vendor-mandatory').subscribe(result => {
      if (result.success) {
        this.isVendorMandatory = result.is_mandatory;
      }
    }, err => {
      this.isVendorMandatory = false;
    });
  }

  async getStepArgyle() {
    await this.api.get('/argyle-verification-step', null, false, true).subscribe(data => {
      if (data.success) {
        if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
          this.getNextRoute();
          return;
        } else {
          const url = this.lffSteps.getUrlToRedirect(data.step_to_redirect);
          this.router.navigate([url]);
        }
      }
    });
  }

  async openPayrollPluginCallback(e) {
    if (e != null && e.success) {
      switch (e.message) {
        case 'hasCustomerInArgyle':
          {
            this.getStepArgyle();
          }
          break;
        case 'atomic_onSuccess':
        case 'atomic_onFinish':
        case 'atomic_onClose':
        case 'argyle_onAccountConnected':
        case 'argyle_onAccountUpdated':
          {
            if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
              this.getNextRoute();
              return;
            } else {
              this.router.navigate(['/application/bank-selection'], { queryParams: this.UTMParams.UTMTagsObject() });
            }
          }
          break;
        case 'argyle_onCloseConnected':
        case 'argyle_onCloseNotConnected':
        case 'argyle_onAccountError':
        case 'argyle_onUserCreated':
        case 'argyle_onAccountRemoved':
        case 'argyle_onTokenExpired':
          break;
      }
    }
  }

}

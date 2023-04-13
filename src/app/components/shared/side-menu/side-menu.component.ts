import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { AuthenticationService } from '../../../services/authentication.service';
import { environment } from '../../../../environments/environment';
import { MakepaymentModalComponent } from '../makepayment-modal/makepayment-modal.component';
import { Router } from '@angular/router';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { ApiService } from '../../../services/api.service';

declare var AppMenu: any;

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit, AfterViewInit {

  @ViewChild('makePaymentModal') makePaymentModal: MakepaymentModalComponent;

  public retokenizeDebitCard: boolean;
  public customerIsTokenized: boolean;

  private features = {
    dashboardV2Enabled: false,
    loanInformationV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_loan_information'),
    paymentsV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_payments'),
    documentsV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_documents'),
    bankAccountV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_verify_bank_account'),
    reviewV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_review'),
    referCoworkerV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_refer_a_coworker'),
    refinanceV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_refinance'),
    retokenizeV2Enabled: this.featureToggle.IsEnabled('ecommerceV2_retokenize'),
  };


  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private featureToggle: FeatureToggleClientService,
    private api: ApiService) {
    this.retokenizeDebitCard = this.featureToggle.IsEnabled("retokenize_paynearme");
  }

  ngOnInit() {
    this.getDebitCardCurrentInfo();
  }

  ngAfterViewInit() {
    AppMenu.Init();
  }

  getDebitCardCurrentInfo() {
    this.api.get('/debit-card/current-info', null, false, true, true).subscribe(result => {
      this.customerIsTokenized = result.data.isTokenized;
    });
  }

  openMakePaymentModal() {
    this.makePaymentModal.open();
    return false;
  }

  redirectToNewEcommerce(step) {
    const token = this.auth.getToken();
    switch (step) {
      case 'dashboard':
        if (!this.features.dashboardV2Enabled) {
          this.router.navigate(['dashboard']);
        }
        break;
      case 'loan-information':
        if (!this.features.loanInformationV2Enabled) {
          this.router.navigate(['dashboard/loan-information']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;
      case 'transactions':
        if (!this.features.paymentsV2Enabled) {
          this.router.navigate(['dashboard/transactions']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=payments`;
        }
        break;
      case 'payments':
        if (!this.features.paymentsV2Enabled) {
          this.router.navigate(['dashboard/payments']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;
      case 'documents':
        if (!this.features.documentsV2Enabled) {
          this.router.navigate(['dashboard/documents']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;
      case 'verify-bank-account':
        if (!this.features.bankAccountV2Enabled) {
          this.router.navigate(['dashboard/bank-verification']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;
      case 'review':
        if (!this.features.reviewV2Enabled) {
          this.router.navigate(['dashboard/write-your-review']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;
      case 'refer-a-coworker':
        if (!this.features.referCoworkerV2Enabled) {
          this.router.navigate(['dashboard/referrals']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;
      case 'refinance':
        if (!this.features.refinanceV2Enabled) {
          this.router.navigate(['dashboard/refinance']);
        } else {
          window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;
      case 'retokenize':
        if (!this.features.retokenizeV2Enabled) {
          this.router.navigate(['dashboard/retokenize']);
        } else {
          //window.location.href = environment.new_ecommerce_url + `/authentication?t=${token}&s=${step}`;
        }
        break;


      default:
        break;
    }
  }

}

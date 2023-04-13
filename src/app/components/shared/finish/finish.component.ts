import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';
import swal from 'sweetalert2';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { AuthenticationService } from '../../../services/authentication.service';
declare var AppMenu: any;

@Component({
  selector: 'app-finish',
  templateUrl: './finish.component.html'
})
export class FinishComponent implements OnInit {

  public model: any;
  public showReviewButtons: boolean;
  public showNPS: boolean;
  public showSuggestionForm: boolean;
  public showThanks: boolean;
  public npsScore: Array<number>;
  public npsSelectedScore: number;
  public fundingDate: String;
  public fundingAmount: number;
  public bankName: String;
  public fundingMethod: String;
  public lastBankAccountNumber: String;
  public initialized: boolean;
  public isRefiCashless: boolean;
  public hasReferral: boolean;
  public showReferral: boolean;
  public readonly isWriteYourReview = this.router.url.indexOf('/dashboard/') >= 0;
  public customer: any = {};
  constructor(
    private api: ApiService,
    private router: Router,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggle: FeatureToggleClientService,
    private authService: AuthenticationService) { }

  ngOnInit() {
    this.model = {};
    this.showNPS = true;
    this.showReviewButtons = false;
    this.showSuggestionForm = false;
    this.showThanks = false;
    this.npsScore = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.hasReferral = false;
    this.showReferral = false;
    this.initialized = false;
    this.customer = this.authService.getUserInfo();
    this.getFundingDate();
    this.setMenu();
    this.api.LogEcommercePipe('finish', 'pageview');
  }

  private setMenu() {
    if (AppMenu && this.isWriteYourReview) {
      AppMenu.SetMenu('.nav-write-your-review');
    }
  }

  getFundingDate() {
    this.api.get('/survey', null, false, true).subscribe(result => {
      this.fundingDate = result.data.funding_date;
      this.isRefiCashless = result.data.isRefiCashless;
      this.hasReferral = result.data.hasReferral;
      this.fundingAmount = result.data.amount_paid_to_customer;
      this.bankName = result.data.bank_name;
      this.fundingMethod = result.data.funding_method;
      this.lastBankAccountNumber = result.data.last_bank_account;
      this.initialized = true;
    });
  }

  onNpsScoreSelect(score: number) {
    this.npsSelectedScore = score;
    this.showNPS = false;

    if (score > 8) {
      this.showReviewButtons = true;
    } else {
      this.showSuggestionForm = true;
    }

    this.api.post('/survey', { score: this.npsSelectedScore }).subscribe(result => {
      if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
        this.mixPanelHelperService.trackOnMixpanelCustomEvent('NpsClassification', { nps_score: this.npsSelectedScore }).subscribe();
      }
    });
  }

  changeScore() {
    this.showNPS = true;
    this.showReviewButtons = false;
    this.showSuggestionForm = false;
    this.showThanks = false;
    return false;
  }

  onSubmitFeedback() {
    this.api.post('/survey', { score: this.npsSelectedScore, message: this.model.feedback }, true).subscribe(result => {
      this.showNPS = false;
      this.showReviewButtons = false;
      this.showSuggestionForm = false;
      this.showThanks = true;
      this.showReferralForm();
    });
  }

  showReferralForm() {
    this.showNPS = false;
    if (this.hasReferral) {
      this.router.navigate(['/dashboard']);
    } else {
      this.showReferral = true;
    }
  }

  payReferal() {
    this.api.put('/survey', this.model, true).subscribe(result => {
      if (result.success) {
        swal.fire({
          title: 'Success!',
          text: 'Referral code accepted',
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'OK'
        } as any
        ).then(() => {
          if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
            this.mixPanelHelperService.trackOnMixpanelCustomEvent('ReferralCodeInput', { referral_code: this.model.referral_code }).subscribe();
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }

        });
      } else {
        swal.fire('Code not found!', 'The code you have provided was not found', 'warning');
      }
    });
  }
}

import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Router } from '@angular/router';
import { ReferralWidgetComponent } from '../../referrals/referral-widget/referral-widget.component';

@Component({
  selector: 'app-inactive-dashboard',
  templateUrl: './inactive-dashboard.component.html',
  styleUrls: ['./inactive-dashboard.component.css']
})
export class InactiveDashboardComponent implements OnInit {

  @ViewChild('referralWidget') referralWidget: ReferralWidgetComponent;
  // tslint:disable-next-line: no-input-rename
  @Input('blocked-customer') blocked_customer: boolean;
  // tslint:disable-next-line:no-input-rename
  @Input('blocked-until') blocked_until: string;

  public selectedAmount: any;
  public loanTermsList: Array<any>;
  public selectedLoanTerms: any;
  public stateAbbreviation: string;
  public showCashbackFront: boolean;
  public showCashbackBack: boolean;
  public eligibleForCashback: boolean;
  public initialized: boolean;
  public isPIFElegibleForNewLoan: boolean;

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.selectedAmount = {};
    this.loanTermsList = [];
    this.selectedLoanTerms = {};
    this.stateAbbreviation = null;
    this.showCashbackFront = true;
    this.showCashbackBack = false;
    this.eligibleForCashback = false;
  }

  public Update(eligible_for_cashback: any, loan_terms: any, state_abbreviation: string, isPIFElegibleForNewLoan: boolean) {
    this.eligibleForCashback = eligible_for_cashback;
    this.loanTermsList = loan_terms;
    if (this.loanTermsList.length > 0) {
      this.selectedLoanTerms = this.loanTermsList[0];
      this.selectedAmount = this.selectedLoanTerms.loan_amount;
    }
    this.stateAbbreviation = state_abbreviation;
    this.isPIFElegibleForNewLoan = isPIFElegibleForNewLoan;
    this.initialized = true;
  }

  requestNewLoan() {

    if (this.blocked_customer) {
      this.router.navigate(['application/denied']);
    } else {
      this.api.post('/request-new-loan', null, true).subscribe(result => {
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          this.router.navigate(['application/loan-terms']);
        }
      });
    }
  }

  onChangeLoanAmount() {
    this.loanTermsList.forEach(item => {
      if (item.loan_amount == this.selectedAmount) {
        this.selectedLoanTerms = item;
        return;
      }
    });
  }

  toggleCashBack() {
    if (this.showCashbackFront) {
      this.showCashbackFront = false;
      this.showCashbackBack = true;
    } else {
      this.showCashbackFront = true;
      this.showCashbackBack = false;
    }

    return false;
  }

}

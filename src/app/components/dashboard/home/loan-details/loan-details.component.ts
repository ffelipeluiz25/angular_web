import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { UtilityService } from '../../../../services/utility.service';
import { ApiService } from '../../../../services/api.service';
import { CashlessOptionsMenuComponent } from '../cashless-refinance/cashless-options-menu/cashless-options-menu.component';

@Component({
  selector: 'app-loan-details',
  templateUrl: './loan-details.component.html',
  styleUrls: ['./loan-details.component.css']
})

export class LoanDetailsComponent implements OnInit {
  @ViewChild('cashlessOptionsMenuModal', { static: true }) cashlessOptionsMenuModal: CashlessOptionsMenuComponent;

  @Input() daysPastDue: number;
  @Input() cashlessEligibility: boolean;
  @Input() applicationId: number;
  @Input() activePaymentRequest: boolean;

  public dashboardInfo: any;
  public showNewCashless: boolean;

  constructor(
    private api: ApiService,
    private featureToggle: FeatureToggleClientService,
    private router: Router,
    private utils: UtilityService) { }

  async ngOnInit() {
    this.dashboardInfo = {};
    this.showNewCashless = this.featureToggle.IsEnabled('new_cashless_dashboard');
  }

  public Update(loanInfo: any) {
    this.dashboardInfo = loanInfo;
  }

  refinanceClick() {
    this.api.LogReferralPipe('dashboard_home_page', 'refi-button-click', 'dashboard', '');
    this.router.navigate(['/dashboard/refinance']);
  }

  openCashlessOptionsMenuModal() {
    this.cashlessOptionsMenuModal.open();
  }

  isMobile() {
    return this.utils.IsMobile();
  }

}
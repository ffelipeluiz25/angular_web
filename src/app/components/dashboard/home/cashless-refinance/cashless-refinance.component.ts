import { CashlessOptionsMenuComponent } from './cashless-options-menu/cashless-options-menu.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { UtilityService } from '../../../../services/utility.service';
import { Component, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cashless-refinance',
  templateUrl: './cashless-refinance.component.html',
  styleUrls: ['./cashless-refinance.component.css']
})
export class CashlessRefinanceComponent implements OnInit {

  @ViewChild('cashlessOptionsMenuModal', { static: true }) cashlessOptionsMenuModal: CashlessOptionsMenuComponent;

  @Input() applicationId: number;
  @Input() daysPastDue: number;
  @Input() cashlessEligibility: boolean;
  @Input() activePaymentRequest: boolean;
  public showNewCashless: boolean;

  constructor(private utils: UtilityService, private featureToggle: FeatureToggleClientService) { }

  ngOnInit() {
    this.showNewCashless = this.featureToggle.IsEnabled('new_cashless_dashboard');
  }

  isMobile() {
    return this.utils.IsMobile();
  }

  openCashlessOptionsMenuModal() {
    this.cashlessOptionsMenuModal.open();
  }

}
import { Component, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../services/authentication.service';
import { ApiService } from '../../../services/api.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

@Component({
  selector: 'app-steps-section',
  templateUrl: './steps-section.component.html',
  styleUrls: ['./steps-section.component.css']
})
export class StepsSectionComponent implements OnInit {
  @Input() currentStep: any;

  public payNearMeRuleIsParameterized: boolean;
  public user: any;
  public dibursementMethodActive: boolean;

  constructor(
    private api: ApiService,
    private authService: AuthenticationService,
    private featureToggle: FeatureToggleClientService,
  ) {
    this.dibursementMethodActive = this.featureToggle.IsEnabled('debit_card_disbursement');
  }

  ngOnInit() {
    this.payNearMeVerification();
    this.user = this.authService.getUserInfo();
  }

  payNearMeVerification() {
    this.api.get('/debit-card/current-info', null, false, true, true).subscribe(result => {
      this.payNearMeRuleIsParameterized = result.data.ruleIsParameterized
    });
  }

}

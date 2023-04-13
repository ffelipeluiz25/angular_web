import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { RefiStepsService } from '../../../services/refi-steps.service';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
  selector: 'app-debit-card',
  templateUrl: './debit-card.component.html',
  styleUrls: ['./debit-card.component.css']
})

export class DebitCardComponent implements OnInit {
  @BlockUI() blockUI: NgBlockUI;

  public ruleIsMandatory: boolean = true;
  public disbursementMethod: boolean = false;
  public paynearmeRuleActive: boolean = false;
  public callBackSuccessMessage: boolean;
  public dataModel: any;
  public customerIsTokenized: boolean;
  public isTokenizationRequired: boolean;
  public currentStep: any;
  public enableButtonSubmit: boolean = false;
  public initialized: boolean = false;
  public ft_refiLFF: boolean;

  public customerId: Number;
  public applicationType: string;
  public applicationStatus: string;
  private getRouteDTO: any = { skipDebitCardStep: false };

  public dibursementMethodActive: boolean;
  public ft_debitCardMultipleVendors: boolean;

  public debitCardIsFundingMethod: boolean;
  public debitCardIsPaymentType: boolean;
  public optionalDisbursementAsDebitCard: boolean;
  public debitCardIsPaymentsOnly: boolean = false;
  public debitCardIsDisbursementOnly: boolean = false;
  public debitCardIsBothPayments: boolean = false;
  public cardTitleMessage: string;
  public cardTextMessage = '';
  public ft_optionalDisbursementAsDebitCard: boolean;
  public showChangeLoanFundingButtons: boolean = false;

  public debitCardRegistered: any = {};
  public ft_debitCardConfirmation: boolean = false;

  constructor(
    private apiService: ApiService,
    private llfStep: LoansForFedsSteps,
    private router: Router,
    private featureToggle: FeatureToggleClientService,
    private refiSteps: RefiStepsService,
  ) {
    this.dibursementMethodActive = this.featureToggle.IsEnabled('debit_card_disbursement');
    this.ft_debitCardMultipleVendors = this.featureToggle.IsEnabled('debitCardMultipleVendors');
    this.ft_refiLFF = this.featureToggle.IsEnabled('refiLFF');
    this.ft_debitCardConfirmation = this.featureToggle.IsEnabled('debitCardConfirmation');
    this.ft_optionalDisbursementAsDebitCard = this.featureToggle.IsEnabled('disbursement_as_debit_card');

  }

  async ngOnInit(): Promise<void> {
    if (localStorage.getItem('payNearme')) {
      localStorage.removeItem('payNearme');
      (<any>window).location.reload();
    }

    this.currentStep = {
      step: 'debit-card',
      stepNumber: 4,
    };

    this.getCurrentApplicationInfo();
    await this.debitCardVerification();
  }

  getCurrentApplicationInfo() {
    this.apiService.get(`/refi/current-info`, null, true, true, true).subscribe(result => {
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
    this.apiService.get(`/refi/get-route`, this.getRouteDTO, true, true, true).subscribe(result => {
      if (result.success) {
        const url = this.refiSteps.getUrlToRedirect(result.next_step);
        this.router.navigate([url]);
        return;
      } else {
        swal.fire('', result.message, 'warning');
      }
    });
  }

  back() {
    if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
      const url = this.refiSteps.getUrlToRedirect('3'); //redirect to open banking integration
      this.router.navigate([url]);
      return;
    } else {
      const url = this.llfStep.getUrlToRedirect('1'); //redirect to personal information
      this.router.navigate([url]);
      localStorage.setItem('payNearme', 'true');
    }

  }

  redirect() {
    if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
      this.getRouteDTO.skipDebitCardStep = true;
      this.getNextRoute();
      return;

    } else {
      const url = this.llfStep.getUrlToRedirect('04'); //redirect to bank information
      this.router.navigate([url]);
      localStorage.setItem('payNearme', 'true');
    }
  }

  save() {
    if ((this.debitCardIsFundingMethod || this.debitCardIsPaymentType) && !this.customerIsTokenized) {
      swal.fire('Oops', `Please fill in your debit card information.`, 'warning');
      return false;

    } else if (this.disbursementMethod && !this.customerIsTokenized) {
      swal.fire('Oops', `Please fill the disbursement method.`, 'warning');
      return false;

    } else if (!this.disbursementMethod) {
      this.updateFundingMethod('ach');

    } else if (this.disbursementMethod && this.dibursementMethodActive && this.customerIsTokenized) {
      this.updateFundingMethod('debit_card');

    } else {
      swal.fire('Oops', `Please fill the loan funding method.`, 'warning');
      return false;
    }
  }

  async embeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.callBackSuccessMessage = true;
      await this.isTokenized();
      if (this.dibursementMethodActive && this.disbursementMethod) {
        this.updateFundingMethod('debit_card');
      } else {
        this.updateFundingMethod('ach');
      }
    } else {
      if (this.ft_refiLFF && this.applicationType == "2" && this.applicationStatus == "1") {
        return;
      } else {
        (<any>window).location.reload();
      }
    }
  }

  async debitCardVerification() {
    await this.apiService.get('/debit-card?programType=LFF', null, false, false, true).toPromise().then(result => {
      this.dataModel = result.data;
      this.ruleIsMandatory = result.data.ruleIsMandatory;
      this.customerIsTokenized = result.data.isTokenized;

      this.getDebitCardParameterization(result);
      if (this.customerIsTokenized && this.ft_debitCardConfirmation) {
        this.getDebitCardInfo();
      }

      this.initialized = true;
      this.blockUI.stop();
    });
  }

  async isTokenized() {
    this.apiService.get('/debit-card/current-info', null, false, false, true).subscribe(result => {
      this.customerIsTokenized = result.data.isTokenized;
    });
  }

  updateFundingMethod(fundingMethod: string) {
    console.log('fundingMethod', fundingMethod);
    if (this.ft_optionalDisbursementAsDebitCard && (this.optionalDisbursementAsDebitCard && !this.debitCardIsFundingMethod) && this.dibursementMethodActive) {
      this.apiService.post(`/debit-card/funding-method?fundingMethod=${fundingMethod}&optionalDisbursement=true`, null, true, true, true).toPromise().then(result => {
        this.redirect();
      });
    } else {
      this.apiService.post(`/debit-card/funding-method?fundingMethod=${fundingMethod}`, null, true, true, true).toPromise().then(result => {
        this.redirect();
      });
    }
  }

  changeDisbursementMethod(disbursementMethod: boolean) {
    if (disbursementMethod) {
      this.disbursementMethod = true;
      if (localStorage.getItem('payNearme')) {
        localStorage.removeItem('payNearme');

        if (this.debitCardIsDisbursementOnly) {
          (<any>window).location.reload();
        }
      }
    } else {
      this.disbursementMethod = false;
      this.enableSubmitButton(true);
      localStorage.setItem('payNearme', 'true');
    }

    this.getTitleAndMessage();
  }

  enableSubmitButton(enableButtonSubmit: boolean) {
    if (enableButtonSubmit && !this.disbursementMethod && !this.enableButtonSubmit) {
      this.enableButtonSubmit = !this.enableButtonSubmit;
    } else if (enableButtonSubmit && !this.enableButtonSubmit) {
      setTimeout(() => {
        this.enableButtonSubmit = !this.enableButtonSubmit;
      }, 4000);
    }
  }

  getDebitCardParameterization(result: any, changeClick = false) {
    this.debitCardIsFundingMethod = result.data.isFundingMethod;
    this.debitCardIsPaymentType = result.data.isPaymentType;
    this.optionalDisbursementAsDebitCard = result.data.disbursementAsDebitCard;
    this.isTokenizationRequired = result.data.isTokenizationRequired;

    if (!changeClick) {
      this.configRedirectForm();
    }


    if (this.dibursementMethodActive && this.ft_optionalDisbursementAsDebitCard && this.optionalDisbursementAsDebitCard && !this.debitCardIsFundingMethod
      || (this.dibursementMethodActive && !this.ft_optionalDisbursementAsDebitCard && !this.debitCardIsFundingMethod)) {
      this.showChangeLoanFundingButtons = true;
    }

    if (this.debitCardIsFundingMethod && !this.debitCardIsPaymentType) {
      this.disbursementMethod = true;
      this.debitCardIsDisbursementOnly = true;

    } else if (!this.debitCardIsFundingMethod && this.debitCardIsPaymentType) {
      this.debitCardIsPaymentsOnly = true;

      if (this.ft_optionalDisbursementAsDebitCard && this.optionalDisbursementAsDebitCard && this.dibursementMethodActive) {
        this.disbursementMethod = true;
      } else if (!this.ft_optionalDisbursementAsDebitCard && this.dibursementMethodActive) {
        this.disbursementMethod = true;
      }
    } else if (this.debitCardIsFundingMethod && this.debitCardIsPaymentType) {
      this.disbursementMethod = true;
      this.debitCardIsBothPayments = true;
    } else {
      this.disbursementMethod = true;
      this.debitCardIsDisbursementOnly = true;
    }

    this.getTitleAndMessage();
  }

  async getDebitCardInfo() {
    this.apiService.get('/debit-card/accounts', null, false, true, true).subscribe(result => {
      this.debitCardRegistered = result.data.list.filter(list => list.active == true);
    });
  }

  configRedirectForm() {
    this.enableSubmitButton(true);

    this.initialized = true;
    this.blockUI.stop();
  }

  changeDebitCard() {
    const model = { data: this.dataModel };
    model.data.isTokenizationRequired = true;
    model.data.showOnlyDisbursementOptions = false;
    this.getDebitCardParameterization(model, true);
  }

  getTitleAndMessage() {
    let action = 'input';
    if (!this.isTokenizationRequired) {
      action = 'confirm';
    }

    if (this.debitCardIsPaymentsOnly && !this.disbursementMethod) {
      this.cardTitleMessage = 'Payment Method';
      this.cardTextMessage = `<p class="text-center">Please ${action} your <b>debit
                              card information below.</b> We will use this information to collect future payments, after loan
                              approval.</p>`;
    } else if (this.debitCardIsPaymentsOnly && this.disbursementMethod) {
      this.cardTitleMessage = 'Funding & Payment Method';
      this.cardTextMessage = `<p class="text-center">Please ${action} your <b>debit
                                  card information below.</b> We will use this information to <b>fund your loan instantly</b> and to
                                  collect future loan payments after loan approval.</p>`;
    } else if (this.debitCardIsDisbursementOnly && this.disbursementMethod) {
      this.cardTitleMessage = 'Funding Method';
      this.cardTextMessage = ` <p class="text-center">Please ${action} your
                                    <b>debit card information below.</b> We will use this information to <b>fund your loan instantly</b>
                                    and invite you to <b>refinance sooner.</b> This information will be securely stored in case you decide
                                    in the future to use your debit card as a payment method.
                                  </p>`;
    } else if (this.debitCardIsBothPayments) {
      this.cardTitleMessage = 'Funding & payment Method';
      this.cardTextMessage = `  <p class="text-center">Please ${action} your <b>debit card information
                                        below.</b> We will use this information to <b>fund your loan instantly</b> and to collect future
                                      loan payments after loan approval.
                                    </p>`;
    }
  }
}

import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { PaymentTransferFormModalComponent } from '../../shared/payment-transfer-form-modal/payment-transfer-form-modal.component';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';
import { FormValidationService } from '../../../services/form-validation.service';
import { UtilityService } from '../../../services/utility.service';
import { NgForm } from '@angular/forms';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { PlaidPendingDocumentsModalComponent } from '../../shared/plaid-pending-documents-modal/plaid-pending-documents-modal.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { combineLatest, Observable } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { MessageService } from '../../../services/message-service';

@Component({
  selector: 'app-refi',
  templateUrl: './refi.component.html',
  styleUrls: ['./refi.component.css']
})
export class RefiComponent implements OnInit {

  @ViewChild('eConsentPreview') eConsentPreview: ElementRef;
  @ViewChild('plaidPendingDocumentsModal') plaidPendingDocumentsModal: PlaidPendingDocumentsModalComponent;

  // tslint:disable-next-line:no-output-rename
  @Output('call-yodlee') yodleeNotify: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('refiModal') refiModal: ElementRef;
  @ViewChild('paymentTransferFormModal') paymentTransferFormModal: PaymentTransferFormModalComponent;

  public showLoanTerms = false;
  public installments: any;
  public selectedAmount: any;
  public loanAmountList = [];
  public selectedLoanAmount: any;
  public selectedLoanTerms: any;
  public agreed_with_terms: boolean;
  public initialized: boolean;
  private modalRef: NgbModalRef;
  public showError: boolean;
  public model: any;
  public accountTypeList: Array<any>;
  public showBankNotFoundError: boolean;
  public showBtnLinkAccount: boolean;
  public showBtnManualInfo: boolean;
  public showBankInfoForm: boolean;
  public btnEnabled: boolean;
  public customer: any = {};
  public is_employer_credit_policy: boolean = false;
  public eConsentB64Img: string;
  public ruleIsParameterized: boolean;
  public ruleIsMandatory: boolean;
  public disbursementMethod: boolean = true;
  public debitCardInfo: any = {};
  public showDebitCardEmbedded: boolean;
  public customerIsTokenized: boolean;
  
  public ft_step_to_capture_debit_card = false;
  public ft_debitCardMultipleVendors: boolean;
  public ft_mixpanelApplicationSubmitted = false;
  public ft_dibursementMethodActive: boolean;

  constructor(
    private modalService: NgbModal,
    private api: ApiService,
    private router: Router,
    private formValidation: FormValidationService,
    private utils: UtilityService,
    private featureToggle: FeatureToggleClientService,
    private mixPanelHelperService: MixpanelHelperService,
    private authService: AuthenticationService,
    private currencyPipe: CurrencyPipe,
    private messageService: MessageService
  ) {
    this.ft_mixpanelApplicationSubmitted = this.featureToggle.IsEnabled('mixpanel_applicationSubmitted');
    this.ft_step_to_capture_debit_card = this.featureToggle.IsEnabled('bankInfoScreensChanges');
    this.ft_debitCardMultipleVendors = this.featureToggle.IsEnabled('debitCardMultipleVendors');
    this.ft_dibursementMethodActive = this.featureToggle.IsEnabled('debit_card_disbursement');
  }

  ngOnInit() {
    this.selectedLoanAmount = {};
    this.selectedLoanTerms = {};
    this.loanAmountList = [];
    this.installments = [];
    this.selectedAmount = {};
    if (this.ft_step_to_capture_debit_card) {
      this.accountTypeList = [{ value: 1, text: 'Checking' }];
    } else {
      this.accountTypeList = [{ value: 1, text: 'Checking' }, { value: 2, text: 'Savings' }];
    }
    this.agreed_with_terms = false;
    this.initialized = false;
    this.showBankNotFoundError = false;
    this.showError = false;
    this.model = {
      customerInfo: {},
      bank_account: {},
      product_id: null,
      amount_of_payment: null
    };
    this.showBtnLinkAccount = true;
    this.showBtnManualInfo = true;
    this.showBankInfoForm = false;
    this.btnEnabled = true;
    this.customer = this.authService.getUserInfo();
    this.init();
    this.debitCardInfoForRefi();
  }

  init() {
    this.getCustomerInfo();

    this.api.get('/refi', null, true, false).subscribe(result => {
      const linkedWithYodlee = false; // it was always false on modal
      this.loanAmountList = result.data.loanAmounts;
      this.selectedLoanTerms = result.data.loan_terms;
      this.selectedAmount = this.selectedLoanTerms.loan_amount;
      this.model.bank_account = result.data.bank_account;
      this.model.product_id = result.data.product_id;

      if (!this.model.bank_account.bank_account_type) {
        this.model.bank_account.bank_account_type = 1;
      }

      this.getInstallments();

      if (linkedWithYodlee) {
        this.agreed_with_terms = true;
        this.showBtnLinkAccount = false;
        this.showBtnManualInfo = false;
        this.showBankInfoForm = true;
      } else {
        this.showBtnLinkAccount = true;
        this.showBtnManualInfo = true;
        this.showBankInfoForm = false;
      }

      this.initialized = true;
    });
    this.api.LogEcommercePipe('refi', 'pageview');
  }

  getCustomerInfo() {
    this.api.get('/customer-info', null, false).subscribe(result => {
      this.model.customerInfo = result.data;
      this.is_employer_credit_policy = result.is_employer_credit_policy;
      if (this.model.customerInfo.zipcode) {
        this.findCityByZipcode();
      }
    });
  }

  findCityByZipcode() {
    if (!this.model.customerInfo.zipcode) {
      this.model.customerInfo.city = '';
      return;
    }

    this.api.get('/cache/zipcode', { zipcode: this.model.customerInfo.zipcode }, false, false).subscribe(result => {
      this.model.customerInfo.city = null;
      const city_list = result.data;
      if (city_list.length === 1) {
        this.model.customerInfo.city = city_list[0].city_code;
      } else {
        this.model.customerInfo.city = '';
      }
    });
  }

  showLoanTermsClick() {
    this.api.LogEcommercePipe('refi', 'next');
    if (this.model.customerInfo.employer_agency_id == null && !this.is_employer_credit_policy) {
      this.router.navigate(['/dashboard/customer-info'], { queryParams: { refi: 'true' } });
    } else {
      if (this.model.customerInfo.funding_method === 'ach') {
        swal.fire({
          title: 'Is the funding Method Correct?',
          html: '<b>Funding Method: </b>ACH transfer <i class=\'fa fa-credit-card\'> </i> <br><b>Bank: </b>' + this.model.customerInfo.bank_name + '<br><b>Routing Number:</b> ' + this.model.customerInfo.bank_routing_number + '<br><b>Account Number:</b> ' + this.model.customerInfo.bank_account_number + '<br><b>Type:</b> ' + this.model.customerInfo.bank_account_type_name,
          icon: 'question',
          reverseButtons: true,
          showCancelButton: true,
          confirmButtonText: 'Yes',
          cancelButtonText: 'No'
        } as SweetAlertOptions
        ).then((result) => {
          if (result.value) {
            this.api.LogEcommercePipe('refi', 'confirm_funding_method');
            this.showLoanTerms = true;

            (<any>window).dataLayer.push({
              event: 'loanTerms'
            });

          } else {
            this.api.LogEcommercePipe('refi', 'click_change_funding_method');
            this.router.navigate(['/dashboard/customer-info'], { queryParams: { refi: 'true' } });
          }
        });
      } else {
        swal.fire({
          title: 'Is the funding Method Correct?',
          // tslint:disable-next-line:max-line-length
          html: '<b>Funding Method: </b>Check <i class=\'fa fa-envelope-open-o\'> </i> <br><br><b>The check will be sent to the address: <br></b>' + this.model.customerInfo.street_address + '<br>' + this.model.customerInfo.city_name + ' - ' + this.model.customerInfo.state_abbreviation + ', ' + this.model.customerInfo.zipcode,
          icon: 'question',
          reverseButtons: true,
          showCancelButton: true,
          confirmButtonText: 'Yes',
          cancelButtonText: 'No'
        } as SweetAlertOptions
        ).then((result) => {
          if (result.value) {
            this.showLoanTerms = true;
          } else {
            this.router.navigate(['/dashboard/customer-info'], { queryParams: { refi: 'true' } });
          }
        });
      }
    }
  }

  hideLoanTerms() {
    if(this.ruleIsParameterized){
      this.showLoanTerms = false;
      (<any>window).location.reload();
    } else{
      this.showLoanTerms = false;
    }
  }

  public openModal(loanAmounts: any, selectedLoanTerms: any, bank_account: any, linkedWithYodlee: boolean) {
    this.loanAmountList = loanAmounts;
    this.selectedLoanTerms = selectedLoanTerms;
    this.selectedAmount = this.selectedLoanTerms.loan_amount;
    this.model.bank_account = bank_account;
    if (!this.model.bank_account.bank_account_type) {
      this.model.bank_account.bank_account_type = 1;
    }

    if (linkedWithYodlee) {
      this.agreed_with_terms = true;
      this.showBtnLinkAccount = false;
      this.showBtnManualInfo = false;
      this.showBankInfoForm = true;
    } else {
      this.showBtnLinkAccount = true;
      this.showBtnManualInfo = true;
      this.showBankInfoForm = false;
    }

    this.initialized = true;
    this.modalRef = this.modalService.open(this.refiModal, { size: 'lg' });
    return false;
  }

  public closeModal() {
    this.modalRef.close();
  }

  fillInstallments(current_amount_of_payment) {
    this.installments = [];
    this.selectedLoanAmount.loan_terms.forEach(elem => {
      this.installments.push({
        value: elem.amount_of_payment,
        text: this.currencyPipe.transform(elem.amount_of_payment, '$', 'symbol', '2.0'),
        payments: elem.number_of_payments,
        months: elem.terms_in_months
      });
    });

    const previousAmount = this.installments.find(p => p.value == current_amount_of_payment)?.value;
    if (previousAmount) {
      this.model.amount_of_payment = previousAmount;
    } else {
      this.model.amount_of_payment = this.selectedLoanAmount.loan_terms[0].amount_of_payment;
    }

    setTimeout(() => {
      this.messageService.sendMessage('selected-installment-update', this.model.amount_of_payment);
    }, 100);
  }

  onChangeLoanAmount() {
    this.loanAmountList.forEach(item => {
      if (item.amount == this.model.selected_amount) {
        this.selectedLoanAmount = item;
        this.api.LogEcommercePipe('refi', 'change_loan_amount', { selected_amount: this.selectedLoanAmount.loan_amount });
        return;
      }
    });
    this.getInstallments();
  }

  getInstallments() {
    this.api.get(`/refi/installments?loan_amount=${this.selectedAmount}&product_id=${this.model.product_id}`, true, true).subscribe(result => {
      if (result.data) {
        this.selectedLoanAmount = result.data.selected_loan_amount;
        this.model.selected_amount = this.selectedLoanAmount.amount;
        this.selectedLoanTerms = this.selectedLoanAmount.loan_terms[0];

        this.fillInstallments(result.data.current_amount_of_payment);
      }
    });
  }

  onAmountOfPaymentSelect(e: any) {
    this.model.amount_of_payment = e.value;
    this.selectedLoanAmount.loan_terms.forEach(item => {
      if (item.amount_of_payment === this.model.amount_of_payment) {
        this.selectedLoanTerms = item;
        return;
      }
    });
  }

  submitRefi(form: NgForm) {
    if (!this.btnEnabled) {
      return false;
    }

    const isValid = form.valid && this.agreed_with_terms;

    if (isValid) {
      this.btnEnabled = false;
      this.api.put('/refi', { selected_amount: this.selectedAmount, amount_of_payment: this.model.amount_of_payment, bank_account: this.model.bank_account, product_id: this.model.product_id }, true).subscribe(result => {

        if (result.success) {
          sessionStorage.setItem('applicationType', 'Refinance');
        }

        if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
          this.trackOnMixPanel().subscribe();
          this.router.navigate(['/application/processing']);
        } else {
          this.router.navigate(['/application/processing']);
        }
      },
        err => {
          if (err && err.error.bank_not_found) {
            this.showBankNotFoundError = true;
            this.utils.SetFocus('#bank_routing_number');
          }
          if (err && err.error.cannot_refinance) {
            this.router.navigate(['/dashboard/']);
          }
          if (err && err.error.notLicensedState) {
            const msg = err.error.message;
            swal.fire('', msg, 'warning');
          }
          this.btnEnabled = true;
        });
    } else {
      this.formValidation.markFormGroupTouched(form.form);
      if (!this.agreed_with_terms) {
        this.showError = true;
        this.btnEnabled = true;
      }
    }
    return false;
  }

  // processApplication(application_id) {
  //   this.api.ExternalPost(environment.auto_decision_url, { application_id: application_id }, false).subscribe(result => { });
  // }

  hideBankNotFoundError() {
    this.showBankNotFoundError = false;
  }

  onChangeAgreement() {
    this.showError = !this.agreed_with_terms;
  }

  openPaymentTransferForm() {
    this.paymentTransferFormModal.open(this.selectedLoanTerms.amount_of_payment);
    return false;
  }

  onShowBankInfoForm() {
    this.showBankInfoForm = true;
    this.showBtnManualInfo = false;
    return false;
  }

  startFastLink() {
    this.yodleeNotify.emit();
  }

  getBankName() {
    this.api.get('/cache/bank-name', { routing_number: this.model.bank_account.bank_routing_number }, false, true).subscribe(result => {
      this.model.bank_account.bank_name = result.data.bank_name;
    });
  }

  // openPlaidPendingDocumentsModal() {
  //   this.plaidPendingDocumentsModal.open('refi_bank_link').then((success) => {
  //     if (success) { }
  //   });
  // }

  editClick(action: string) {
    this.api.LogEcommercePipe('refi', action);
  }

  trackOnMixPanel(): Observable<any> {
    return combineLatest([this.trackApplicationSubmitted(), this.trackLoanTermsSelected()]);
  }

  trackApplicationSubmitted(): Observable<any> {
    if (this.featureToggle.IsEnabled('mixpanel_applicationSubmitted')) {
      (<any>window).dataLayer.push({ event: 'applicationSubmitted' });
    }

    const eventData = {
      submitted_date: new Date().toISOString(),
      application_type: 'Refinance',
      application_current_step: 'Application Submitted'
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('ApplicationSubmitted', eventData);
  }

  trackLoanTermsSelected(): Observable<any> {
    const eventData = {
      loan_amount: this.selectedAmount,
      loan_payment: this.selectedLoanTerms.amount_of_payment,
      loan_number_of_payments: this.selectedLoanTerms.number_of_payments,
      loan_terms_in_months: this.selectedLoanTerms.terms_in_months,
      loan_apr: this.selectedLoanTerms.effective_apr,
      loan_credit_origination_fee: this.selectedLoanTerms.fee,
      loan_total_amount: this.selectedLoanTerms.amount_funded,
      application_type: 'Refinance',
      application_current_step: 'Loan Terms'
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('LoanTermsSelected', eventData);
  }

  getEconsent() {
    console.log("Clicou");
    if (!this.eConsentB64Img) {
      this.api.get('/signature-documents/econsent', null, true).subscribe(result => {
        this.eConsentB64Img = result.data.b64;
        this.showEConsentModal();
      });
    } else {
      this.showEConsentModal();
    }
  }

  showEConsentModal() {
    this.modalService.open(this.eConsentPreview, { size: 'lg' });
  }

  debitCardInfoForRefi() {
    this.api.get('/debit-card/current-info?ruleType=refi', null, false, false, true).subscribe(result => {
      this.debitCardInfo = result.data;
      this.ruleIsParameterized = result.data.ruleIsParameterized;
      this.ruleIsMandatory = result.data.ruleIsMandatory
    });
  }

  showDebitCard() {
    this.api.LogEcommercePipe('refi', 'next');
    if(this.ruleIsParameterized){
      this.showDebitCardEmbedded = true;
    } else{
      this.showLoanTermsClick();
    }
  }

  hideDebitCard(){
    this.showDebitCardEmbedded = false;
    (<any>window).location.reload();
  }

  async embeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.showDebitCardEmbedded = false;
      this.showLoanTerms = true;
      await this.isTokenized();
      if (this.ft_dibursementMethodActive) {
        this.updateFundingMethod('debit_card');
      } else {
        this.updateFundingMethod('ach');
      }
    } else {
      (<any>window).location.reload();
    }
  }

  updateFundingMethod(fundingMethod: string) {
    this.api.post(`/debit-card/funding-method?fundingMethod=${fundingMethod}`, null, true, true, true).toPromise().then(result => {
      console.log('update funding method');
    });
  }

  async isTokenized() {
    this.api.get('/debit-card/current-info', null, false, false, true).subscribe(result => {
      this.customerIsTokenized = result.data.isTokenized;
    });
  }

  changeDisbursementMethod(disbursementMethod: boolean) {
    if (disbursementMethod) {
      this.disbursementMethod = true;
      this.showDebitCardEmbedded = true;
      this.showLoanTerms = false;
      if (localStorage.getItem('payNearme')) {
        localStorage.removeItem('payNearme');
        (<any>window).location.reload();
      }
    } else {
      this.disbursementMethod = false;
      this.showDebitCardEmbedded = false;
      this.showLoanTerms = true;
      localStorage.setItem('payNearme', 'true');
    }
  }

}

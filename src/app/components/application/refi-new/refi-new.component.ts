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
import { RefiStepsService } from '../../../services/refi-steps.service';

@Component({
  selector: 'app-refi-new',
  templateUrl: './refi-new.component.html',
  styleUrls: ['./refi-new.component.css']
})
export class RefiNewComponent implements OnInit {

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

  public ft_mixpanelApplicationSubmitted = false;
  public ft_debitCardConfirmation: boolean = false;

  public customerId: Number = null;
  public productId: number;
  public newLoanAmountList = [];
  public newSelectedLoanAmount: any;
  public newSelectedLoanTerms: any;
  public ft_ruleRefiJpMorgan: boolean = false;
  public ruleRefiJpMorgan: boolean = false;

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
    private messageService: MessageService,
    private refiSteps: RefiStepsService,

  ) {
    this.ft_mixpanelApplicationSubmitted = this.featureToggle.IsEnabled('mixpanel_applicationSubmitted');
    this.ft_debitCardConfirmation = this.featureToggle.IsEnabled('debitCardConfirmation');
    this.ft_ruleRefiJpMorgan = this.featureToggle.IsEnabled('rule_refi_jp_morgan');
  }

  ngOnInit() {
    this.selectedLoanAmount = {};
    this.selectedLoanTerms = {};
    this.loanAmountList = [];
    this.installments = [];
    this.selectedAmount = {};
    this.accountTypeList = [{ value: 1, text: 'Checking' }];
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
    this.customerId = this.authService.getUserInfo()?.id;

    this.init();
  }

  async getInfoRefi() {
    this.api.get(`/refi/get-info?customerId=${this.customerId}`, null, true, true, true).subscribe(result => {
      this.newLoanAmountList = result.data.loanAmounts;
      this.newSelectedLoanTerms = result.data.loanTerms;
      this.newSelectedLoanAmount = this.newSelectedLoanTerms.loanAmount;
      this.productId = result.data.productId;

      if (result.success) {
        this.getInfoInstallments();
      }
    });
  }

  async getInfoInstallments() {
    this.api.get(`/refi/get-installments?customerId=${this.customerId}&LoanAmount=${this.newSelectedLoanAmount}&ProductId=${this.productId}`, null, true, true, true).subscribe(result => {

      this.model.selected_amount = result.data.selectedAmount;
      this.selectedLoanTerms = result.data.loanTerms[0];
      this.selectedLoanAmount = result.data.loanTerms;

      if (result.success) {
        this.fillInstallments(result.data.currentAmount);
      }
      this.initialized = true;
    });
  }

  async init() {
    this.getCustomerInfo();

    this.api.get('/refi', null, true, false).subscribe(result => {
      const linkedWithYodlee = false; // it was always false on modal

      this.model.bank_account = result.data.bank_account;
      this.model.product_id = result.data.product_id;

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
    });

    await this.getInfoRefi();
    this.api.LogEcommercePipe('refi', 'pageview');
  }

  getCustomerInfo() {
    this.api.get('/customer-info', null, false).subscribe(result => {
      this.model.customerInfo = result.data;
      this.is_employer_credit_policy = result.is_employer_credit_policy;
      if (this.model.customerInfo.zipcode) {
        this.findCityByZipcode();
      }
      this.model.customerInfo.employer_id
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
      if (this.ft_debitCardConfirmation) {
        if (this.model.customerInfo.funding_method === 'ach') {
          this.api.LogEcommercePipe('refi', 'confirm_funding_method');
          this.showLoanTerms = true;
          (<any>window).dataLayer.push({
            event: 'loanTerms'
          });
        } else {
          this.showLoanTerms = true;
        }
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
  }

  hideLoanTerms() {
    this.showLoanTerms = false;
  }

  public openModal(loanAmounts: any, selectedLoanTerms: any, bank_account: any, linkedWithYodlee: boolean) {
    this.newLoanAmountList = loanAmounts;
    this.selectedLoanTerms = selectedLoanTerms;
    this.newSelectedLoanAmount = this.selectedLoanTerms;
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
    this.selectedLoanAmount.forEach(elem => {
      this.installments.push({
        value: elem.amountOfPayment,
        text: this.currencyPipe.transform(elem.amountOfPayment, '$', 'symbol', '2.0'),
        payments: elem.numberOfPayments,
        months: elem.termsInMonths
      });
    });

    const previousAmount = this.installments.find(p => p.value == current_amount_of_payment)?.value;
    if (previousAmount) {
      this.model.amount_of_payment = previousAmount;
    } else {
      this.model.amount_of_payment = this.selectedLoanAmount[0].amountOfPayment;
    }

    setTimeout(() => {
      this.messageService.sendMessage('selected-installment-update', this.model.amount_of_payment);
    }, 100);
  }

  onChangeLoanAmount() {
    this.getInfoInstallments();
    this.api.LogEcommercePipe('refi', 'change_loan_amount', { selected_amount: this.newSelectedLoanAmount });
  }

  onAmountOfPaymentSelect(e: any) {
    this.model.amount_of_payment = e.value;
    this.selectedLoanAmount.forEach(item => {
      if (item.amountOfPayment === this.model.amount_of_payment) {
        this.selectedLoanTerms = item;
        return;
      }
    });
  }

  async getRuleJpmConfig() {
    await this.api.get('/employers/rule-payment-type-by-employer', { employerId: this.model.customerInfo.employer_id }, true, false, true).toPromise().then(result => {
      this.ruleRefiJpMorgan = false;
      if (result.success) {
        this.ruleRefiJpMorgan = result.data;
      }
    });
    return true;
  }

  async submitRefi(form: NgForm) {
    if (!this.btnEnabled) {
      return false;
    }

    let isValid = form.valid && this.agreed_with_terms;

    if (isValid) {
      if (this.ft_ruleRefiJpMorgan) {
        await this.getRuleJpmConfig();
        if (!this.ruleRefiJpMorgan) {
          swal.fire('Error', 'Ops, some configuration is required!', 'error');
        }
        isValid = this.ruleRefiJpMorgan;
      }
    }

    if (isValid) {
      this.btnEnabled = false;

      const loanTermsRefiObj = {
        customerId: this.customerId,
        productId: this.productId,
        selectedAmount: this.model.selected_amount,
        amountOfPayment: this.model.amount_of_payment,
        fundingMethod: this.model.customerInfo.funding_method,
      }

      this.api.post('/refi/create', loanTermsRefiObj, true, true, true).subscribe(result => {

        if (result.success) {
          sessionStorage.setItem('applicationType', 'Refinance');
        }

        if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
          this.trackOnMixPanel().subscribe();
          const url = this.refiSteps.getUrlToRedirect(result.data.route.stepToRedirect);
          this.router.navigate([url]);
        } else {
          const url = this.refiSteps.getUrlToRedirect(result.data.route.stepToRedirect);
          this.router.navigate([url]);
        }
      }, err => {
        if (err && err.error.bank_not_found) {
          this.showBankNotFoundError = true;
          this.utils.SetFocus('#bank_routing_number');
        }
        else if (err && err.error.cannot_refinance) {
          this.router.navigate(['/dashboard/']);
        }
        else if (err && err.error.notLicensedState) {
          const msg = err.error.message;
          swal.fire('', msg, 'warning');
        } else {
          swal.fire({
            title: 'Oops!',
            icon: 'warning',
            html:
              'Please contact our customer service about this error. <br> <i class="fa fa-phone"></i> <strong>800-316-8507</strong> <br><br> ' +
              `${err.error.message}`,
            showCloseButton: true,
          });
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

  hideBankNotFoundError() {
    this.showBankNotFoundError = false;
  }

  onChangeAgreement() {
    this.showError = !this.agreed_with_terms;
  }

  openPaymentTransferForm() {
    this.paymentTransferFormModal.open(this.selectedLoanTerms.amountOfPayment);
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
      loan_amount: this.model.selected_amount,
      loan_payment: this.selectedLoanTerms.amountOfPayment,
      loan_number_of_payments: this.selectedLoanTerms.numberOfPayments,
      loan_terms_in_months: this.selectedLoanTerms.termsInMonths,
      loan_apr: this.selectedLoanTerms.effectiveApr,
      loan_credit_origination_fee: this.selectedLoanTerms.fee,
      loan_total_amount: this.selectedLoanTerms.amountFunded,
      application_type: 'Refinance',
      application_current_step: 'Loan Terms'
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('LoanTermsSelected', eventData);
  }

  getEconsent() {
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

}
